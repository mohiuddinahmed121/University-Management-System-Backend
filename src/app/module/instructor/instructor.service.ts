import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";

import { Role, UserStatus } from "../../../../generated/prisma/enums";
import { InstructorWhereInput } from "../../../../generated/prisma/models";

import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";

import config from "../../config";
import { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
   IApproveInstructorPayload,
   IApplyAsInstructorPayload,
   IUpdateInstructorProfilePayload,
} from "./instructor.interface";
import { IQuery } from "../../interface";

const applyAsInstructor = async (
   payload: IApplyAsInstructorPayload,
   resume: Express.Multer.File,
) => {
   const { user, instructor } = payload;

   // Resume is required
   if (!resume) {
      throw new AppError(httpStatus.BAD_REQUEST, "Resume file is required");
   }

   const email = user.email.toLowerCase().trim();

   // Check existing user
   const existingUser = await prisma.user.findUnique({
      where: {
         email,
      },
   });

   if (existingUser) {
      throw new AppError(httpStatus.CONFLICT, "User already exists with this email");
   }

   // Check department
   const department = await prisma.department.findUnique({
      where: {
         id: instructor.departmentId,
      },
   });

   if (!department || department.isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, "Department not found");
   }

   // Generate instructor ID
   const year = new Date().getFullYear();

   const lastInstructor = await prisma.instructor.findFirst({
      where: {
         instructorId: {
            startsWith: `INS-${year}-`,
         },
      },
      orderBy: {
         instructorId: "desc",
      },
   });

   let sequence = 1;

   if (lastInstructor) {
      const lastSequence = Number(lastInstructor.instructorId.split("-")[2]);

      if (!Number.isNaN(lastSequence)) {
         sequence = lastSequence + 1;
      }
   }

   const instructorId = `INS-${year}-${String(sequence).padStart(4, "0")}`;

   // Generate temporary password
   const temporaryPassword = crypto.randomBytes(8).toString("hex");

   const hashedPassword = await bcrypt.hash(temporaryPassword, Number(config.bcrypt_salt_rounds));

   // Upload resume to Cloudinary
   const resumeUpload = await new Promise<{
      secure_url: string;
      public_id: string;
   }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
         {
            folder: "university/instructor-resumes",
            resource_type: "auto",
         },
         (error, result) => {
            if (error || !result) {
               return reject(
                  new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload resume"),
               );
            }

            resolve({
               secure_url: result.secure_url,
               public_id: result.public_id,
            });
         },
      );

      uploadStream.end(resume.buffer);
   });

   // Create instructor application
   const instructorApplication = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
         data: {
            name: user.name,
            email,
            password: hashedPassword,

            role: Role.INSTRUCTOR,
            status: UserStatus.ACTIVE,

            authProvider: "CREDENTIAL",
            emailVerified: false,
            needPasswordChange: true,

            instructor: {
               create: {
                  instructorId,
                  name: user.name,
                  email,

                  address: instructor.address,
                  specialization: instructor.specialization,
                  designation: instructor.designation,
                  contactNumber: instructor.contactNumber,

                  departmentId: instructor.departmentId,

                  resumeUrl: resumeUpload.secure_url,
                  resumePublicId: resumeUpload.public_id,

                  verificationStatus: "PENDING",
               },
            },
         },
         include: {
            instructor: true,
         },
      });

      return createdUser;
   });

   // Generate OTP
   const otp = Math.floor(100000 + Math.random() * 900000).toString();

   const redisKey = `instructor-application-otp:${email}`;

   await redisClient.set(
      redisKey,
      JSON.stringify({
         otp,
         email,
         temporaryPassword,
         userId: instructorApplication.id,
      }),
      {
         EX: 60 * 60,
      },
   );

   // Render email template
   const templatePath = process.cwd() + "/src/app/templates/registration-user-otp.ejs";

   const emailTemplate = await ejs.renderFile(templatePath, {
      name: user.name,
      otp,
   });

   // Send verification email
   await transporter.sendMail({
      from: config.email_sender,
      to: email,
      subject: "Instructor Application Email Verification",
      html: emailTemplate,
   });

   return {
      id: instructorApplication.id,
      instructorId: instructorApplication.instructor?.instructorId,
      name: instructorApplication.name,
      email: instructorApplication.email,
      resumeUrl: instructorApplication.instructor?.resumeUrl,
      verificationStatus: (
         instructorApplication.instructor as { verificationStatus?: string } | null
      )?.verificationStatus,
      message:
         "Application submitted successfully. Please verify your email using the OTP sent to your email address.",
   };
};

const verifyInstructorEmail = async (email: string, otp: string) => {
   const normalizedEmail = email.toLowerCase().trim();

   const user = await prisma.user.findUnique({
      where: {
         email: normalizedEmail,
      },
      include: {
         instructor: true,
      },
   });

   if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor application not found");
   }

   if (user.role !== Role.INSTRUCTOR) {
      throw new AppError(httpStatus.BAD_REQUEST, "This email is not registered as an instructor");
   }

   if (!user.instructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor profile not found");
   }

   if (user.emailVerified) {
      throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
   }

   const redisKey = `instructor-application-otp:${normalizedEmail}`;

   const storedData = await redisClient.get(redisKey);

   if (!storedData) {
      throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired or does not exist");
   }

   const parsedData = JSON.parse(storedData);

   if (parsedData.otp !== otp) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
   }

   const updatedUser = await prisma.user.update({
      where: {
         id: user.id,
      },
      data: {
         emailVerified: true,
      },
      include: {
         instructor: true,
      },
   });

   await redisClient.del(redisKey);

   return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      instructorId: updatedUser.instructor?.instructorId,
      emailVerified: updatedUser.emailVerified,
      verificationStatus: (updatedUser.instructor as { verificationStatus?: string } | null)
         ?.verificationStatus,
      message:
         "Email verified successfully. Your instructor application is now waiting for admin approval.",
   };
};

const approveInstructor = async (payload: IApproveInstructorPayload, reviewer: RequestUser) => {
   const { instructorId, action, rejectionReason } = payload;

   const instructor = await prisma.instructor.findUnique({
      where: {
         id: instructorId,
      },
      include: {
         user: true,
         department: true,
      },
   });

   if (!instructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor application not found");
   }

   if (instructor.user.isDeleted) {
      throw new AppError(httpStatus.GONE, "This instructor account has been deleted");
   }

   if (!instructor.user.emailVerified) {
      throw new AppError(httpStatus.BAD_REQUEST, "Instructor email is not verified yet");
   }

   if (instructor.verificationStatus !== "PENDING") {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Instructor application has already been reviewed",
      );
   }

   if (action === "REJECT" && !rejectionReason) {
      throw new AppError(httpStatus.BAD_REQUEST, "Rejection reason is required");
   }

   const updatedInstructor = await prisma.$transaction(async (tx) => {
      const updated = await tx.instructor.update({
         where: {
            id: instructorId,
         },
         data: {
            verificationStatus: action === "APPROVE" ? "APPROVED" : "REJECTED",

            rejectionReason: action === "REJECT" ? rejectionReason : null,

            reviewedBy: reviewer.userId,
            reviewedAt: new Date(),
         },
         include: {
            user: true,
            department: true,
         },
      });

      await tx.user.update({
         where: {
            id: instructor.userId,
         },
         data: {
            status: action === "APPROVE" ? UserStatus.ACTIVE : UserStatus.BLOCKED,

            needPasswordChange: action === "APPROVE",
         },
      });

      return updated;
   });

   // Send approval/rejection email
   if (action === "APPROVE") {
      await transporter.sendMail({
         from: config.email_sender,
         to: instructor.email,
         subject: "Instructor Application Approved",
         html: `
				<h2>Congratulations ${instructor.name}</h2>
				<p>
					Your instructor application has been approved.
				</p>
				<p>
					You can now log in using your registered email
					and temporary password.
				</p>
				<p>
					Please change your password after your first login.
				</p>
			`,
      });
   } else {
      await transporter.sendMail({
         from: config.email_sender,
         to: instructor.email,
         subject: "Instructor Application Rejected",
         html: `
				<h2>Hello ${instructor.name}</h2>
				<p>
					Unfortunately, your instructor application has been rejected.
				</p>
				<p>
					<strong>Reason:</strong>
					${rejectionReason}
				</p>
			`,
      });
   }

   // return {
   //    id: updatedInstructor.id,
   //    instructorId: updatedInstructor.instructorId,
   //    name: updatedInstructor.name,
   //    email: updatedInstructor.email,
   //    verificationStatus: action === "APPROVE" ? "APPROVED" : "REJECTED",
   //    rejectionReason: action === "REJECT" ? rejectionReason : null,
   //    reviewedBy: reviewer.userId,
   // };
   return {
      id: updatedInstructor.id,
      instructorId: updatedInstructor.instructorId,
      name: updatedInstructor.name,
      email: updatedInstructor.email,
      verificationStatus: updatedInstructor.verificationStatus,
      rejectionReason: updatedInstructor.rejectionReason,
      reviewedBy: updatedInstructor.reviewedBy,
      reviewedAt: updatedInstructor.reviewedAt,
   };
};

const getAllInstructors = async (query: IQuery) => {
   const { searchTerm, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc" } = query;

   const pageNumber = Number(page);
   const limitNumber = Number(limit);
   const skip = (pageNumber - 1) * limitNumber;

   const andConditions: InstructorWhereInput[] = [];

   andConditions.push({
      user: {
         isDeleted: false,
      },
   });

   if (searchTerm) {
      andConditions.push({
         OR: [
            {
               name: {
                  contains: searchTerm,
                  mode: "insensitive",
               },
            },
            {
               email: {
                  contains: searchTerm,
                  mode: "insensitive",
               },
            },
            {
               instructorId: {
                  contains: searchTerm,
                  mode: "insensitive",
               },
            },
         ],
      });
   }

   const whereConditions: InstructorWhereInput = {
      AND: andConditions,
   };

   const [instructors, total] = await Promise.all([
      prisma.instructor.findMany({
         where: whereConditions,
         skip,
         take: limitNumber,

         orderBy: {
            [sortBy]: sortOrder,
         },

         include: {
            user: {
               select: {
                  id: true,
                  name: true,
                  email: true,
                  imageUrl: true,
                  emailVerified: true,
                  status: true,
               },
            },
            department: {
               select: {
                  id: true,
                  name: true,
                  code: true,
               },
            },
         },
      }),

      prisma.instructor.count({
         where: whereConditions,
      }),
   ]);

   return {
      data: instructors,
      meta: {
         page: pageNumber,
         limit: limitNumber,
         total,
         totalPages: Math.ceil(total / limitNumber),
      },
   };
};

const updateInstructorProfile = async (
   user: RequestUser,
   payload: IUpdateInstructorProfilePayload,
) => {
   const instructor = await prisma.instructor.findUnique({
      where: {
         userId: user.userId,
      },
   });

   if (!instructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor profile not found");
   }

   const updatedInstructor = await prisma.instructor.update({
      where: {
         id: instructor.id,
      },
      data: {
         ...payload,
      },
      include: {
         department: true,
      },
   });

   return updatedInstructor;
};

const getSingleInstructorProfile = async (instructorId: string) => {
   const instructor = await prisma.instructor.findFirst({
      where: {
         instructorId,
         verificationStatus: "APPROVED",
         user: {
            isDeleted: false,
            status: UserStatus.ACTIVE,
         },
      },
      include: {
         department: {
            select: {
               id: true,
               name: true,
               code: true,
            },
         },
         user: {
            select: {
               id: true,
               name: true,
               email: true,
               imageUrl: true,
            },
         },
      },
   });

   if (!instructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor not found");
   }

   return instructor;
};

export const InstructorServices = {
   applyAsInstructor,
   verifyInstructorEmail,
   approveInstructor,
   getAllInstructors,
   updateInstructorProfile,
   getSingleInstructorProfile,
};
