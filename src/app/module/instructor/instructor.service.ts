import httpStatus from "http-status";
import { InstructorWhereInput } from "../../../../generated/prisma/models";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
   IApproveInstructorPayload,
   IApplyAsInstructorPayload,
   IUpdateInstructorProfilePayload,
} from "./instructor.interface";
import { IQuery } from "../../interface";

const applyAsInstructor = async (payload: IApplyAsInstructorPayload) => {
   const isUserExists = await prisma.user.findUnique({
      where: {
         email: payload.user.email,
      },
   });

   if (isUserExists) {
      throw new AppError(httpStatus.CONFLICT, "User Already Exists With This Email");
   }

   const instructorApplication = await prisma.user.create({
      data: {
         name: payload.user.name,
         email: payload.user.email,
         role: "INSTRUCTOR",
         needPasswordChange: true,
         instructor: {
            create: {
               name: payload.user.name,
               email: payload.user.email,
               address: payload.instructor.address,
               specialization: payload.instructor.specialization,
               designation: payload.instructor.designation,
               contactNumber: payload.instructor.contactNumber,
               departmentId: config.default_department_id,
            },
         },
      },
      include: {
         instructor: true,
      },
   });

   return instructorApplication;
};

const approveInstructor = async (payload: IApproveInstructorPayload, reviewer: RequestUser) => {
   const { instructorId } = payload;

   const existingInstructor = await prisma.instructor.findUnique({
      where: {
         id: instructorId,
      },
      include: {
         user: true,
      },
   });

   if (!existingInstructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor Application Not Found");
   }

   if (existingInstructor.user.isDeleted) {
      throw new AppError(httpStatus.GONE, "Instructor Application Has Been Deleted");
   }

   const updatedInstructor = await prisma.instructor.update({
      where: {
         id: instructorId,
      },
      data: {
         // Instructor does not have a verification status.
         // Approval means the account is active.
      },
   });

   await prisma.user.update({
      where: {
         id: existingInstructor.userId,
      },
      data: {
         status: "ACTIVE",
         needPasswordChange: false,
      },
   });

   return updatedInstructor;
};

const getAllInstructors = async (query: IQuery) => {
   const limit = query.limit ? Number(query.limit) : 10;
   const page = query.page ? Number(query.page) : 1;
   const skip = (page - 1) * limit;

   const sortBy = query.sortBy ? query.sortBy : "createdAt";
   const sortOrder = query.sortOrder ? query.sortOrder : "desc";

   const andConditions: InstructorWhereInput[] = [
      {
         user: {
            isDeleted: false,
         },
      },
   ];

   if (query.searchTerm) {
      andConditions.push({
         OR: [
            {
               name: {
                  contains: query.searchTerm,
                  mode: "insensitive",
               },
            },
            {
               email: {
                  contains: query.searchTerm,
                  mode: "insensitive",
               },
            },
            {
               specialization: {
                  contains: query.searchTerm,
                  mode: "insensitive",
               },
            },
            {
               designation: {
                  contains: query.searchTerm,
                  mode: "insensitive",
               },
            },
         ],
      });
   }

   if (query.email) {
      andConditions.push({
         email: {
            contains: query.email,
            mode: "insensitive",
         },
      });
   }

   if (query.specialization) {
      andConditions.push({
         specialization: {
            equals: query.specialization,
            mode: "insensitive",
         },
      });
   }

   if (query.departmentId) {
      andConditions.push({
         departmentId: query.departmentId,
      });
   }

   const allInstructors = await prisma.instructor.findMany({
      where: {
         AND: andConditions,
      },

      take: limit,
      skip,

      orderBy: {
         [sortBy]: sortOrder,
      },

      include: {
         user: {
            omit: {
               password: true,
            },
         },
         department: true,
      },
   });

   const totalInstructorCount = await prisma.instructor.count({
      where: {
         AND: andConditions,
      },
   });

   return {
      data: allInstructors,
      meta: {
         page,
         limit,
         total: totalInstructorCount,
         totalPages: Math.ceil(totalInstructorCount / limit),
      },
   };
};

const updateInstructorProfile = async (
   payload: IUpdateInstructorProfilePayload,
   user: RequestUser,
) => {
   const existingInstructor = await prisma.instructor.findUnique({
      where: {
         userId: user.userId,
      },
   });

   if (!existingInstructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor Profile Not Found");
   }

   const updatedInstructor = await prisma.instructor.update({
      where: {
         id: existingInstructor.id,
      },
      data: payload,
   });

   return updatedInstructor;
};

const getSingleInstructorProfile = async (instructorId: string) => {
   const instructor = await prisma.instructor.findUnique({
      where: {
         id: instructorId,
      },
      include: {
         department: true,
         user: {
            omit: {
               password: true,
            },
         },
      },
   });

   if (!instructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor Not Found");
   }

   return instructor;
};

export const InstructorServices = {
   applyAsInstructor,
   approveInstructor,
   getAllInstructors,
   updateInstructorProfile,
   getSingleInstructorProfile,
};
