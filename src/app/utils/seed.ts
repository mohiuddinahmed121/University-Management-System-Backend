import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";
// import { generateInstructorId } from "../../generateInstructorId";
// import { generateStudentId } from "../generateStudentId";

export const seedAdmin = async () => {
   try {
      const isAdminExist = await prisma.user.findUnique({
         where: {
            email: config.admin_email,
         },
      });

      if (isAdminExist) {
         console.log("Admin Already Exists!");
         return;
      }

      const name = config.admin_name;
      const email = config.admin_email;
      const password = config.admin_password;

      if (!name || !email || !password) {
         throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Admin Name, Email, Password Missing In Env File!!!",
         );
      }

      const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

      const admin = await prisma.user.create({
         data: {
            name,
            email,
            password: hashedPassword,
            role: Role.ADMIN,
            needPasswordChange: false,
            emailVerified: true,
         },
      });

      console.log("Admin Created : ", admin);
   } catch (error) {
      console.log("Error Seeding Admin : ", error);

      await prisma.user.delete({
         where: {
            email: config.admin_email,
         },
      });
   }
};
