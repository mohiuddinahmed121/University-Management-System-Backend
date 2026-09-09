import httpStatus from "http-status";
import type { CourseWhereInput } from "../../../../generated/prisma/models";
import type { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
   ICreateCoursePayload,
   ICreateCoursePrerequisitePayload,
   IUpdateCoursePayload,
} from "./course.interface";

const createCourse = async (payload: ICreateCoursePayload, _user: RequestUser) => {
   const department = await prisma.department.findUnique({
      where: {
         id: payload.departmentId,
         isDeleted: false,
      },
   });

   if (!department) {
      throw new AppError(httpStatus.NOT_FOUND, "Department Not Found");
   }

   const existingCourse = await prisma.course.findUnique({
      where: {
         code: payload.code,
      },
   });

   if (existingCourse) {
      throw new AppError(httpStatus.BAD_REQUEST, "Course Code Already Exists");
   }

   const result = await prisma.course.create({
      data: {
         code: payload.code,
         title: payload.title,
         description: payload.description,
         credit: payload.credit,
         departmentId: payload.departmentId,
      },
      include: {
         department: true,
      },
   });

   return result;
};

const getAllCourses = async (query: IQuery) => {
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

   const andConditions: CourseWhereInput[] = [
      {
         isDeleted: false,
      },
   ];

   if (searchTerm) {
      andConditions.push({
         OR: [
            {
               code: {
                  contains: searchTerm,
                  mode: "insensitive",
               },
            },
            {
               title: {
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

   const whereConditions: CourseWhereInput = {
      AND: andConditions,
   };

   const [data, total] = await Promise.all([
      prisma.course.findMany({
         where: whereConditions,
         skip,
         take: limitNumber,
         orderBy: {
            [sortBy]: sortOrder,
         },
         include: {
            department: true,
            prerequisites: {
               include: {
                  prerequisiteCourse: true,
               },
            },
         },
      }),

      prisma.course.count({
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

const getSingleCourse = async (courseId: string) => {
   const course = await prisma.course.findUnique({
      where: {
         id: courseId,
         isDeleted: false,
      },
      include: {
         department: true,
         prerequisites: {
            include: {
               prerequisiteCourse: true,
            },
         },
         prerequisiteFor: {
            include: {
               course: true,
            },
         },
         sections: {
            include: {
               semester: true,
               instructor: true,
            },
         },
      },
   });

   if (!course) {
      throw new AppError(httpStatus.NOT_FOUND, "Course Not Found");
   }

   return course;
};

const updateCourse = async (
   courseId: string,
   payload: IUpdateCoursePayload,
   _user: RequestUser,
) => {
   const course = await prisma.course.findUnique({
      where: {
         id: courseId,
         isDeleted: false,
      },
   });

   if (!course) {
      throw new AppError(httpStatus.NOT_FOUND, "Course Not Found");
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

   if (payload.code && payload.code !== course.code) {
      const existingCourse = await prisma.course.findUnique({
         where: {
            code: payload.code,
         },
      });

      if (existingCourse) {
         throw new AppError(httpStatus.BAD_REQUEST, "Course Code Already Exists");
      }
   }

   const result = await prisma.course.update({
      where: {
         id: courseId,
      },
      data: payload,
      include: {
         department: true,
      },
   });

   return result;
};

const deleteCourse = async (courseId: string, _user: RequestUser) => {
   const course = await prisma.course.findUnique({
      where: {
         id: courseId,
         isDeleted: false,
      },
   });

   if (!course) {
      throw new AppError(httpStatus.NOT_FOUND, "Course Not Found");
   }

   const activeSections = await prisma.section.count({
      where: {
         courseId,
         status: "OPEN",
      },
   });

   if (activeSections > 0) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Course Cannot Be Deleted While It Has An Open Section",
      );
   }

   const result = await prisma.course.update({
      where: {
         id: courseId,
      },
      data: {
         isDeleted: true,
         deletedAt: new Date(),
      },
   });

   return result;
};

const addPrerequisite = async (
   courseId: string,
   payload: ICreateCoursePrerequisitePayload,
   _user: RequestUser,
) => {
   if (courseId === payload.prerequisiteCourseId) {
      throw new AppError(httpStatus.BAD_REQUEST, "A Course Cannot Be Its Own Prerequisite");
   }

   const course = await prisma.course.findUnique({
      where: {
         id: courseId,
         isDeleted: false,
      },
   });

   if (!course) {
      throw new AppError(httpStatus.NOT_FOUND, "Course Not Found");
   }

   const prerequisiteCourse = await prisma.course.findUnique({
      where: {
         id: payload.prerequisiteCourseId,
         isDeleted: false,
      },
   });

   if (!prerequisiteCourse) {
      throw new AppError(httpStatus.NOT_FOUND, "Prerequisite Course Not Found");
   }

   const existingPrerequisite = await prisma.coursePrerequisite.findUnique({
      where: {
         courseId_prerequisiteCourseId: {
            courseId,
            prerequisiteCourseId: payload.prerequisiteCourseId,
         },
      },
   });

   if (existingPrerequisite) {
      throw new AppError(httpStatus.BAD_REQUEST, "This Prerequisite Already Exists");
   }

   const result = await prisma.coursePrerequisite.create({
      data: {
         courseId,
         prerequisiteCourseId: payload.prerequisiteCourseId,
      },
      include: {
         course: true,
         prerequisiteCourse: true,
      },
   });

   return result;
};

const removePrerequisite = async (
   courseId: string,
   prerequisiteCourseId: string,
   _user: RequestUser,
) => {
   const prerequisite = await prisma.coursePrerequisite.findUnique({
      where: {
         courseId_prerequisiteCourseId: {
            courseId,
            prerequisiteCourseId,
         },
      },
   });

   if (!prerequisite) {
      throw new AppError(httpStatus.NOT_FOUND, "Prerequisite Not Found");
   }

   await prisma.coursePrerequisite.delete({
      where: {
         id: prerequisite.id,
      },
   });

   return null;
};

export const CourseServices = {
   createCourse,
   getAllCourses,
   getSingleCourse,
   updateCourse,
   deleteCourse,
   addPrerequisite,
   removePrerequisite,
};
