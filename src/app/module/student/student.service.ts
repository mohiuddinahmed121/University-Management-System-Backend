import httpStatus from "http-status";
import type { StudentWhereInput } from "../../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import type { IQuery } from "../../interface";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type { IUpdateStudentProfilePayload } from "./student.interface";

const getAllStudents = async (query: IQuery) => {
   const { searchTerm, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc" } = query;

   const pageNumber = Number(page);
   const limitNumber = Number(limit);
   const skip = (pageNumber - 1) * limitNumber;

   const andConditions: StudentWhereInput[] = [];

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
               studentId: {
                  contains: searchTerm,
                  mode: "insensitive",
               },
            },
         ],
      });
   }

   const whereConditions: StudentWhereInput =
      andConditions.length > 0
         ? {
              AND: andConditions,
           }
         : {};

   const [data, total] = await Promise.all([
      prisma.student.findMany({
         where: whereConditions,
         skip,
         take: limitNumber,
         orderBy: {
            [sortBy]: sortOrder,
         },
         include: {
            program: {
               include: {
                  department: true,
               },
            },
            user: {
               omit: {
                  password: true,
               },
            },
         },
      }),
      prisma.student.count({
         where: whereConditions,
      }),
   ]);

   return {
      data,
      meta: {
         page: pageNumber,
         limit: limitNumber,
         total,
         totalPages: Math.ceil(total / limitNumber),
      },
   };
};

const getMyProfile = async (user: RequestUser) => {
   const student = await prisma.student.findUnique({
      where: {
         userId: user.userId,
      },
      include: {
         program: {
            include: {
               department: true,
            },
         },
         user: {
            omit: {
               password: true,
            },
         },
      },
   });

   if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
   }

   return student;
};

const updateStudentProfile = async (payload: IUpdateStudentProfilePayload, user: RequestUser) => {
   const student = await prisma.student.findUnique({
      where: {
         userId: user.userId,
      },
   });

   if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
   }

   const result = await prisma.student.update({
      where: {
         userId: user.userId,
      },
      data: payload,
      include: {
         program: {
            include: {
               department: true,
            },
         },
         user: {
            omit: {
               password: true,
            },
         },
      },
   });

   return result;
};

const getSingleStudentProfile = async (studentId: string) => {
   const student = await prisma.student.findUnique({
      where: {
         id: studentId,
      },
      include: {
         program: {
            include: {
               department: true,
            },
         },
         user: {
            omit: {
               password: true,
            },
         },
      },
   });

   if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
   }

   return student;
};

export const StudentServices = {
   getAllStudents,
   getMyProfile,
   updateStudentProfile,
   getSingleStudentProfile,
};
