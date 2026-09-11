import httpStatus from "http-status";
import type { ProgramWhereInput } from "../../../../generated/prisma/models";
import type { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type { ICreateProgramPayload, IUpdateProgramPayload } from "./program.interface";

const createProgram = async (payload: ICreateProgramPayload, _user: RequestUser) => {
   const department = await prisma.department.findUnique({
      where: {
         id: payload.departmentId,
         isDeleted: false,
      },
   });

   if (!department) {
      throw new AppError(httpStatus.NOT_FOUND, "Department Not Found");
   }

   const existingProgram = await prisma.program.findUnique({
      where: {
         code: payload.code,
      },
   });

   if (existingProgram) {
      throw new AppError(httpStatus.BAD_REQUEST, "Program Code Already Exists");
   }

   const result = await prisma.program.create({
      data: {
         name: payload.name,
         code: payload.code,
         description: payload.description,
         durationYears: payload.durationYears,
         departmentId: payload.departmentId,
      },
      include: {
         department: true,
      },
   });

   return result;
};

const getAllPrograms = async (query: IQuery) => {
   const {
      searchTerm,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
      departmentId,
   } = query;

   const pageNumber = Number(page);
   const limitNumber = Number(limit);
   const skip = (pageNumber - 1) * limitNumber;

   const andConditions: ProgramWhereInput[] = [];

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
               code: {
                  contains: searchTerm,
                  mode: "insensitive",
               },
            },
            {
               description: {
                  contains: searchTerm,
                  mode: "insensitive",
               },
            },
         ],
      });
   }

   if (departmentId) {
      andConditions.push({
         departmentId,
      });
   }

   const whereConditions: ProgramWhereInput =
      andConditions.length > 0
         ? {
              AND: andConditions,
           }
         : {};

   const [data, total] = await Promise.all([
      prisma.program.findMany({
         where: whereConditions,
         skip,
         take: limitNumber,
         orderBy: {
            [sortBy]: sortOrder,
         },
         include: {
            department: true,
            _count: {
               select: {
                  students: true,
               },
            },
         },
      }),

      prisma.program.count({
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

const getSingleProgram = async (programId: string) => {
   const program = await prisma.program.findUnique({
      where: {
         id: programId,
      },
      include: {
         department: true,
         students: {
            select: {
               id: true,
               studentId: true,
               name: true,
               email: true,
            },
         },
         _count: {
            select: {
               students: true,
            },
         },
      },
   });

   if (!program) {
      throw new AppError(httpStatus.NOT_FOUND, "Program Not Found");
   }

   return program;
};

const updateProgram = async (
   programId: string,
   payload: IUpdateProgramPayload,
   _user: RequestUser,
) => {
   const program = await prisma.program.findUnique({
      where: {
         id: programId,
      },
   });

   if (!program) {
      throw new AppError(httpStatus.NOT_FOUND, "Program Not Found");
   }

   if (payload.departmentId) {
      const department = await prisma.department.findUnique({
         where: {
            id: payload.departmentId,
            isDeleted: false,
         },
      });

      if (!department) {
         throw new AppError(httpStatus.NOT_FOUND, "Department Not Found");
      }
   }

   if (payload.code && payload.code !== program.code) {
      const existingProgram = await prisma.program.findUnique({
         where: {
            code: payload.code,
         },
      });

      if (existingProgram) {
         throw new AppError(httpStatus.BAD_REQUEST, "Program Code Already Exists");
      }
   }

   const result = await prisma.program.update({
      where: {
         id: programId,
      },
      data: payload,
      include: {
         department: true,
      },
   });

   return result;
};

const deleteProgram = async (programId: string, _user: RequestUser) => {
   const program = await prisma.program.findUnique({
      where: {
         id: programId,
      },
   });

   if (!program) {
      throw new AppError(httpStatus.NOT_FOUND, "Program Not Found");
   }

   const studentCount = await prisma.student.count({
      where: {
         programId,
      },
   });

   if (studentCount > 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Program Cannot Be Deleted While It Has Students");
   }

   const result = await prisma.program.delete({
      where: {
         id: programId,
      },
   });

   return result;
};

export const ProgramServices = {
   createProgram,
   getAllPrograms,
   getSingleProgram,
   updateProgram,
   deleteProgram,
};
