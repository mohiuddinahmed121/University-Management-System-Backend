import httpStatus from "http-status";
import type { DepartmentWhereInput } from "../../../../generated/prisma/models";
import type { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type { ICreateDepartmentPayload, IUpdateDepartmentPayload } from "./department.interface";

const createDepartment = async (payload: ICreateDepartmentPayload, _user: RequestUser) => {
   const existingDepartment = await prisma.department.findFirst({
      where: {
         OR: [
            {
               name: payload.name,
               isDeleted: false,
            },
            {
               code: payload.code,
               isDeleted: false,
            },
         ],
      },
   });

   if (existingDepartment) {
      throw new AppError(httpStatus.BAD_REQUEST, "Department Name Or Code Already Exists");
   }

   const result = await prisma.department.create({
      data: {
         name: payload.name,
         code: payload.code,
         description: payload.description,
      },
   });

   return result;
};

const getAllDepartments = async (query: IQuery) => {
   const { searchTerm, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc" } = query;

   const pageNumber = Number(page);
   const limitNumber = Number(limit);
   const skip = (pageNumber - 1) * limitNumber;

   const andConditions: DepartmentWhereInput[] = [
      {
         isDeleted: false,
      },
   ];

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

   const whereConditions: DepartmentWhereInput = {
      AND: andConditions,
   };

   const [data, total] = await Promise.all([
      prisma.department.findMany({
         where: whereConditions,
         skip,
         take: limitNumber,
         orderBy: {
            [sortBy]: sortOrder,
         },
         include: {
            _count: {
               select: {
                  programs: true,
                  courses: true,
                  instructors: true,
               },
            },
         },
      }),

      prisma.department.count({
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

const getSingleDepartment = async (departmentId: string) => {
   const department = await prisma.department.findUnique({
      where: {
         id: departmentId,
         isDeleted: false,
      },
      include: {
         programs: true,
         courses: true,
         instructors: true,
         _count: {
            select: {
               programs: true,
               courses: true,
               instructors: true,
            },
         },
      },
   });

   if (!department) {
      throw new AppError(httpStatus.NOT_FOUND, "Department Not Found");
   }

   return department;
};

const updateDepartment = async (
   departmentId: string,
   payload: IUpdateDepartmentPayload,
   _user: RequestUser,
) => {
   const department = await prisma.department.findUnique({
      where: {
         id: departmentId,
         isDeleted: false,
      },
   });

   if (!department) {
      throw new AppError(httpStatus.NOT_FOUND, "Department Not Found");
   }

   if (payload.name || payload.code) {
      const existingDepartment = await prisma.department.findFirst({
         where: {
            id: {
               not: departmentId,
            },
            isDeleted: false,
            OR: [
               ...(payload.name ? [{ name: payload.name }] : []),
               ...(payload.code ? [{ code: payload.code }] : []),
            ],
         },
      });

      if (existingDepartment) {
         throw new AppError(httpStatus.BAD_REQUEST, "Department Name Or Code Already Exists");
      }
   }

   const result = await prisma.department.update({
      where: {
         id: departmentId,
      },
      data: payload,
   });

   return result;
};

const deleteDepartment = async (departmentId: string, _user: RequestUser) => {
   const department = await prisma.department.findUnique({
      where: {
         id: departmentId,
         isDeleted: false,
      },
   });

   if (!department) {
      throw new AppError(httpStatus.NOT_FOUND, "Department Not Found");
   }

   const [programCount, courseCount, instructorCount] = await Promise.all([
      prisma.program.count({
         where: {
            departmentId,
         },
      }),
      prisma.course.count({
         where: {
            departmentId,
            isDeleted: false,
         },
      }),
      prisma.instructor.count({
         where: {
            departmentId,
         },
      }),
   ]);

   if (programCount > 0 || courseCount > 0 || instructorCount > 0) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Department Cannot Be Deleted While It Has Related Programs, Courses, Or Instructors",
      );
   }

   const result = await prisma.department.update({
      where: {
         id: departmentId,
      },
      data: {
         isDeleted: true,
         deletedAt: new Date(),
      },
   });

   return result;
};

export const DepartmentServices = {
   createDepartment,
   getAllDepartments,
   getSingleDepartment,
   updateDepartment,
   deleteDepartment,
};
