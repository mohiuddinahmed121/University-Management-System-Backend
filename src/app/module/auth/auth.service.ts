/** biome-ignore-all lint/style/useConst: <explanation> */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import type { TokenPayload } from "google-auth-library";
import httpStatus from "http-status";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import path from "path";
import { AuthProvider, Role, UserStatus } from "../../../../generated/prisma/enums";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import type {
   IForgotPasswordPayload,
   IGoogleLoginPayload,
   ILoginUserPayload,
   IRegisterStudentPayload,
   IRequestUser,
   IResetPasswordPayload,
   IVerifyEmailPayload,
} from "./auth.interface";

/* =========================
   Register Student
========================= */

const registerStudent = async (payload: IRegisterStudentPayload) => {
   const { name, password, student: studentData } = payload;

   const email = payload.email.trim().toLowerCase();

   const isUserExists = await prisma.user.findUnique({
      where: {
         email,
      },
   });

   if (isUserExists) {
      throw new AppError(httpStatus.CONFLICT, "User with this email already exists");
   }

   const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

   const expirationSeconds = 5 * 60;

   const otpKey = `student-registration-otp:${email}`;

   const otpValue = crypto.randomInt(100000, 1000000).toString();

   await redisClient.set(otpKey, otpValue, {
      expiration: {
         type: "EX",
         value: expirationSeconds,
      },
   });

   const studentRegistrationKey = `student-registration-data:${email}`;

   const redisUserDataPayload = {
      name,
      email,
      password: hashedPassword,
      student: studentData,
   };

   await redisClient.set(studentRegistrationKey, JSON.stringify(redisUserDataPayload), {
      expiration: {
         type: "EX",
         value: expirationSeconds,
      },
   });

   const templatePath = path.join(process.cwd(), "src/app/templates/verifyEmail.ejs");

   const templateData = {
      name,
      email,
      otp: otpValue,
      expirationMinutes: expirationSeconds / 60,
   };

   const html = await ejs.renderFile(templatePath, templateData);

   await transporter.sendMail({
      from: config.email_sender,
      to: email,
      subject: "Email Verification",
      html,
   });
};

/* =========================
   Verify Student Email
========================= */

const verifyStudentEmail = async (payload: IVerifyEmailPayload) => {
   const otp = payload.otp;
   const email = payload.email.trim().toLowerCase();

   const isUserExist = await prisma.user.findUnique({
      where: {
         email,
      },
   });

   if (isUserExist?.status === UserStatus.BLOCKED) {
      throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
   }

   if (isUserExist?.emailVerified) {
      throw new AppError(httpStatus.CONFLICT, "Email Already Verified");
   }

   if (isUserExist?.isDeleted || isUserExist?.status === UserStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, "User is Deleted");
   }

   const otpKey = `student-registration-otp:${email}`;

   const redisOtp = await redisClient.get(otpKey);

   if (!redisOtp) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
   }

   if (redisOtp !== otp) {
      throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
   }

   await redisClient.del(otpKey);

   const studentRegistrationKey = `student-registration-data:${email}`;

   const redisStudentData = await redisClient.get(studentRegistrationKey);

   if (!redisStudentData) {
      throw new AppError(httpStatus.NOT_FOUND, "Student Registration Data Does Not Exist");
   }

   const studentPayload: IRegisterStudentPayload = JSON.parse(redisStudentData);

   /*
    * Generate student ID automatically.
    * Example: STU-1724567890-123
    */
   const studentId = `STU-${Date.now()}-${crypto.randomInt(100, 1000).toString()}`;

   const createdUser = await prisma.user.create({
      data: {
         name: studentPayload.name,
         email: studentPayload.email,
         password: studentPayload.password,
         role: Role.STUDENT,
         status: UserStatus.ACTIVE,
         emailVerified: true,

         student: {
            create: {
               studentId,
               name: studentPayload.name,
               email: studentPayload.email,
               contactNumber: studentPayload.student?.contactNumber || null,
               programId: studentPayload.student.programId,
            },
         },
      },
      omit: {
         password: true,
      },
      include: {
         student: true,
      },
   });

   await redisClient.del(studentRegistrationKey);

   const templatePath = path.join(process.cwd(), "src/app/templates/welcome.ejs");

   const templateData = {
      name: createdUser.name,
   };

   const html = await ejs.renderFile(templatePath, templateData);

   await transporter.sendMail({
      from: config.email_sender,
      to: email,
      subject: "Welcome To University Management System",
      html,
   });

   const { student, ...user } = createdUser;

   const jwtPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
   };

   const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
   );

   const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
   );

   return {
      user,
      student,
      accessToken,
      refreshToken,
   };
};

/* =========================
   Login
========================= */

const loginUser = async (payload: ILoginUserPayload) => {
   const { password } = payload;

   const email = payload.email.trim().toLowerCase();

   const user = await prisma.user.findUnique({
      where: {
         email,
      },
      include: {
         instructor: true,
      },
   });

   if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
   }

   if (user.status === UserStatus.BLOCKED) {
      throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
   }

   if (user.isDeleted || user.status === UserStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, "User is deleted");
   }

   if (!user.emailVerified) {
      throw new AppError(httpStatus.FORBIDDEN, "Email Not Verified");
   }

   // Instructor-specific check: শুধু APPROVED instructor-ই login করতে পারবে
   if (user.role === Role.INSTRUCTOR) {
      if (!user.instructor) {
         throw new AppError(httpStatus.NOT_FOUND, "Instructor Profile Not Found");
      }

      if (user.instructor.verificationStatus === "PENDING") {
         throw new AppError(
            httpStatus.FORBIDDEN,
            "Your Instructor Application Is Still Under Review",
         );
      }

      if (user.instructor.verificationStatus === "REJECTED") {
         throw new AppError(httpStatus.FORBIDDEN, "Your Instructor Application Has Been Rejected");
      }
   }

   if (user.password === null && user.googleId !== null) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "User Already Has Account Registered With Google. Try To Login With Google.",
      );
   }

   const isPasswordMatched = await bcrypt.compare(password, user.password as string);

   if (!isPasswordMatched) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
   }

   const jwtPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
   };

   const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
   );

   const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
   );

   return {
      accessToken,
      refreshToken,
   };
};

/* =========================
   Get Me
========================= */

const getMe = async (user: IRequestUser) => {
   const isUserExists = await prisma.user.findUnique({
      where: {
         id: user.userId,
      },
      include: {
         student: true,
         instructor: true,
      },
      omit: {
         password: true,
      },
   });

   if (!isUserExists) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
   }

   return isUserExists;
};

/* =========================
   Refresh Token
========================= */

const refreshToken = async (token: string) => {
   const verifiedRefreshToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret);

   if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
      throw new AppError(
         httpStatus.UNAUTHORIZED,
         config.node_env === "development" ? verifiedRefreshToken.error : "Invalid refresh token",
      );
   }

   const data = verifiedRefreshToken.data as JwtPayload;

   const user = await prisma.user.findUnique({
      where: {
         id: data.userId,
      },
   });

   if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User is inactive or not found");
   }

   const jwtPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
   };

   const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
   );

   const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
   );

   return {
      accessToken,
      refreshToken,
   };
};

/* =========================
   Google Login
========================= */

const googleLogin = async (payload: IGoogleLoginPayload) => {
   let googleIdTokenPayload: TokenPayload | null | undefined = null;

   try {
      const ticket = await googleClient.verifyIdToken({
         idToken: payload.idToken,
         audience: config.google_client_id,
      });

      googleIdTokenPayload = ticket.getPayload();
   } catch (error) {
      console.log("Google ID Token Verification Failed", error);

      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid Or Expired Google Id Token");
   }

   if (!googleIdTokenPayload) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid Or Expired Google Id Token");
   }

   if (!googleIdTokenPayload.email) {
      throw new AppError(httpStatus.BAD_REQUEST, "Google Email Not Found");
   }

   if (!googleIdTokenPayload.name) {
      throw new AppError(httpStatus.BAD_REQUEST, "Google User Name Not Found");
   }

   const existingGoogleUser = await prisma.user.findUnique({
      where: {
         googleId: googleIdTokenPayload.sub,
      },
   });

   let user = existingGoogleUser;

   /*
    * Google account already exists
    */
   if (!user) {
      const existingCredentialUser = await prisma.user.findUnique({
         where: {
            email: googleIdTokenPayload.email,
         },
      });

      if (existingCredentialUser) {
         if (!existingCredentialUser.emailVerified) {
            throw new AppError(httpStatus.FORBIDDEN, "Email Not Verified");
         }

         if (existingCredentialUser.status === UserStatus.BLOCKED) {
            throw new AppError(httpStatus.FORBIDDEN, "User Is Blocked");
         }

         if (
            existingCredentialUser.isDeleted ||
            existingCredentialUser.status === UserStatus.DELETED
         ) {
            throw new AppError(httpStatus.FORBIDDEN, "User Is Deleted");
         }

         user = await prisma.user.update({
            where: {
               id: existingCredentialUser.id,
            },
            data: {
               googleId: googleIdTokenPayload.sub,
               authProvider: AuthProvider.GOOGLE,
            },
         });
      } else {
         /*
          * New Google user.
          *
          * We create a STUDENT user account here.
          * Student academic profile can be completed
          * later through the Student module because
          * programId is required by the Student model.
          */
         user = await prisma.user.create({
            data: {
               name: googleIdTokenPayload.name,
               email: googleIdTokenPayload.email,
               role: Role.STUDENT,
               googleId: googleIdTokenPayload.sub,
               authProvider: AuthProvider.GOOGLE,
               emailVerified: true,
            },
         });

         const templatePath = path.join(process.cwd(), "src/app/templates/welcome.ejs");

         const templateData = {
            name: user.name,
         };

         const html = await ejs.renderFile(templatePath, templateData);

         await transporter.sendMail({
            from: config.email_sender,
            to: user.email,
            subject: "Welcome To University Management System",
            html,
         });
      }
   }

   if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
   }

   if (user.status === UserStatus.BLOCKED) {
      throw new AppError(httpStatus.FORBIDDEN, "User Is Blocked");
   }

   if (user.isDeleted || user.status === UserStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, "User Is Deleted");
   }

   const jwtPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
   };

   const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
   );

   const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
   );

   return {
      accessToken,
      refreshToken,
   };
};

/* =========================
   Forgot Password
========================= */

const forgotPassword = async (payload: IForgotPasswordPayload) => {
   const email = payload.email.trim().toLowerCase();

   const isUserExist = await prisma.user.findUnique({
      where: {
         email,
      },
   });

   if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
   }

   if (isUserExist.status === UserStatus.BLOCKED) {
      throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
   }

   if (!isUserExist.emailVerified) {
      throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
   }

   if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, "User is Deleted");
   }

   if (isUserExist.googleId && isUserExist.authProvider === AuthProvider.GOOGLE) {
      throw new AppError(httpStatus.BAD_REQUEST, "User Has Account With Google");
   }

   const otp = crypto.randomInt(100000, 1000000).toString();

   const key = `forgot-password-otp:${isUserExist.email}`;

   const expirationSeconds = 5 * 60;

   await redisClient.set(key, otp, {
      expiration: {
         type: "EX",
         value: expirationSeconds,
      },
   });

   const templatePath = path.join(process.cwd(), "src/app/templates/resetPassword.ejs");

   const templateData = {
      name: isUserExist.name,
      otp,
      expirationMinutes: expirationSeconds / 60,
   };

   const html = await ejs.renderFile(templatePath, templateData);

   await transporter.sendMail({
      from: config.email_sender,
      to: isUserExist.email,
      subject: "Forgot Password",
      html,
   });
};

/* =========================
   Reset Password
========================= */

const resetPassword = async (payload: IResetPasswordPayload) => {
   const email = payload.email.trim().toLowerCase();
   const { otp, newPassword } = payload;

   const isUserExist = await prisma.user.findUnique({
      where: {
         email,
      },
   });

   if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
   }

   if (isUserExist.status === UserStatus.BLOCKED) {
      throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
   }

   if (!isUserExist.emailVerified) {
      throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
   }

   if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, "User is Deleted");
   }

   if (isUserExist.googleId && isUserExist.authProvider === AuthProvider.GOOGLE) {
      throw new AppError(httpStatus.BAD_REQUEST, "User Has Account With Google");
   }

   const key = `forgot-password-otp:${isUserExist.email}`;

   const redisOtp = await redisClient.get(key);

   if (!redisOtp) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
   }

   if (redisOtp !== otp) {
      throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
   }

   const hashedNewPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

   await prisma.user.update({
      where: {
         email: isUserExist.email,
      },
      data: {
         password: hashedNewPassword,
         authProvider: AuthProvider.CREDENTIAL,
         googleId: null,
      },
   });

   await redisClient.del([key]);

   const templatePath = path.join(process.cwd(), "src/app/templates/passwordResetSuccessful.ejs");

   const templateData = {
      name: isUserExist.name,
   };

   const html = await ejs.renderFile(templatePath, templateData);

   await transporter.sendMail({
      from: config.email_sender,
      to: isUserExist.email,
      subject: "Password Changed",
      html,
   });
};

export const AuthService = {
   registerStudent,
   verifyStudentEmail,
   loginUser,
   getMe,
   refreshToken,
   googleLogin,
   forgotPassword,
   resetPassword,
};
