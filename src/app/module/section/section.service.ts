import httpStatus from "http-status";
import { RegistrationStatus, SectionStatus } from "../../../../generated/prisma/enums";
import type { SectionWhereInput } from "../../../../generated/prisma/models";
import type { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type { ICreateSectionPayload, IUpdateSectionPayload } from "./section.interface";

const createSection = async (payload: ICreateSectionPayload, user: RequestUser) => {
   if (user.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "You Are Not Allowed To Create A Section");
   }

   const course = await prisma.course.findUnique({
      where: {
         id: payload.courseId,
      },
   });

   if (!course || course.isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, "Course Not Found");
   }

   const semester = await prisma.semester.findUnique({
      where: {
         id: payload.semesterId,
      },
   });

   if (!semester) {
      throw new AppError(httpStatus.NOT_FOUND, "Semester Not Found");
   }

   if (semester.status === "COMPLETED") {
      throw new AppError(httpStatus.CONFLICT, "Cannot Create Section For A Completed Semester");
   }

   if (payload.instructorId) {
      const instructor = await prisma.instructor.findUnique({
         where: {
            id: payload.instructorId,
         },
      });

      if (!instructor) {
         throw new AppError(httpStatus.NOT_FOUND, "Instructor Not Found");
      }
   }

   const existingSection = await prisma.section.findFirst({
      where: {
         courseId: payload.courseId,
         semesterId: payload.semesterId,
         sectionName: payload.sectionName,
      },
   });

   if (existingSection) {
      throw new AppError(
         httpStatus.CONFLICT,
         "This Section Already Exists For This Course And Semester",
      );
   }

   const section = await prisma.section.create({
      data: {
         sectionName: payload.sectionName,
         capacity: payload.capacity,
         availableSeats: payload.capacity,
         courseId: payload.courseId,
         semesterId: payload.semesterId,
         instructorId: payload.instructorId,
      },
      include: {
         course: true,
         semester: true,
         instructor: true,
      },
   });

   return section;
};

const getMySections = async (query: IQuery, user: RequestUser) => {
   const limit = query.limit ? Number(query.limit) : 10;
   const page = query.page ? Number(query.page) : 1;
   const skip = (page - 1) * limit;

   const sortBy = query.sortBy ? query.sortBy : "createdAt";
   const sortOrder = query.sortOrder ? query.sortOrder : "desc";

   const instructor = await prisma.instructor.findUnique({
      where: {
         userId: user.userId,
      },
   });

   if (!instructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor Profile Not Found");
   }

   const andConditions: SectionWhereInput[] = [
      {
         instructorId: instructor.id,
      },
   ];

   if (query.status) {
      andConditions.push({
         status: query.status,
      });
   }

   if (query.semesterId) {
      andConditions.push({
         semesterId: query.semesterId,
      });
   }

   const sections = await prisma.section.findMany({
      where: {
         AND: andConditions,
      },
      take: limit,
      skip,
      orderBy: {
         [sortBy]: sortOrder,
      },
      include: {
         course: true,
         semester: true,
         registrations: {
            where: {
               status: RegistrationStatus.REGISTERED,
            },
            include: {
               student: true,
            },
         },
      },
   });

   const total = await prisma.section.count({
      where: {
         AND: andConditions,
      },
   });

   return {
      data: sections,
      meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
   };
};

const getAllSections = async (query: IQuery) => {
   const limit = query.limit ? Number(query.limit) : 10;
   const page = query.page ? Number(query.page) : 1;
   const skip = (page - 1) * limit;

   const sortBy = query.sortBy ? query.sortBy : "createdAt";
   const sortOrder = query.sortOrder ? query.sortOrder : "desc";

   const andConditions: SectionWhereInput[] = [];

   if (query.courseId) {
      andConditions.push({
         courseId: query.courseId,
      });
   }

   if (query.semesterId) {
      andConditions.push({
         semesterId: query.semesterId,
      });
   }

   if (query.instructorId) {
      andConditions.push({
         instructorId: query.instructorId,
      });
   }

   if (query.status) {
      andConditions.push({
         status: query.status,
      });
   }

   if (query.searchTerm) {
      andConditions.push({
         OR: [
            {
               sectionName: {
                  contains: query.searchTerm,
                  mode: "insensitive",
               },
            },
            {
               course: {
                  OR: [
                     {
                        code: {
                           contains: query.searchTerm,
                           mode: "insensitive",
                        },
                     },
                     {
                        title: {
                           contains: query.searchTerm,
                           mode: "insensitive",
                        },
                     },
                  ],
               },
            },
         ],
      });
   }

   const sections = await prisma.section.findMany({
      where: {
         AND: andConditions,
      },
      take: limit,
      skip,
      orderBy: {
         [sortBy]: sortOrder,
      },
      include: {
         course: true,
         semester: true,
         instructor: true,
         _count: {
            select: {
               registrations: {
                  where: {
                     status: RegistrationStatus.REGISTERED,
                  },
               },
            },
         },
      },
   });

   const total = await prisma.section.count({
      where: {
         AND: andConditions,
      },
   });

   return {
      data: sections,
      meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
   };
};

const getSectionById = async (sectionId: string) => {
   const section = await prisma.section.findUnique({
      where: {
         id: sectionId,
      },
      include: {
         course: {
            include: {
               department: true,
               prerequisites: {
                  include: {
                     prerequisiteCourse: true,
                  },
               },
            },
         },
         semester: true,
         instructor: true,
         registrations: {
            where: {
               status: RegistrationStatus.REGISTERED,
            },
            include: {
               student: true,
            },
         },
      },
   });

   if (!section) {
      throw new AppError(httpStatus.NOT_FOUND, "Section Not Found");
   }

   return section;
};

const updateSection = async (
   sectionId: string,
   payload: IUpdateSectionPayload,
   user: RequestUser,
) => {
   if (user.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "You Are Not Allowed To Update This Section");
   }

   const section = await prisma.section.findUnique({
      where: {
         id: sectionId,
      },
   });

   if (!section) {
      throw new AppError(httpStatus.NOT_FOUND, "Section Not Found");
   }

   if (section.status === SectionStatus.COMPLETED) {
      throw new AppError(httpStatus.CONFLICT, "Completed Section Cannot Be Updated");
   }

   if (payload.instructorId) {
      const instructor = await prisma.instructor.findUnique({
         where: {
            id: payload.instructorId,
         },
      });

      if (!instructor) {
         throw new AppError(httpStatus.NOT_FOUND, "Instructor Not Found");
      }
   }

   const registeredStudentCount = await prisma.registration.count({
      where: {
         sectionId: section.id,
         status: RegistrationStatus.REGISTERED,
      },
   });

   if (payload.capacity !== undefined && payload.capacity < registeredStudentCount) {
      throw new AppError(
         httpStatus.CONFLICT,
         "Capacity Cannot Be Less Than The Number Of Registered Students",
      );
   }

   const newCapacity = payload.capacity !== undefined ? payload.capacity : section.capacity;

   const newAvailableSeats = newCapacity - registeredStudentCount;

   const updatedSection = await prisma.section.update({
      where: {
         id: section.id,
      },
      data: {
         sectionName: payload.sectionName,
         capacity: newCapacity,
         availableSeats: newAvailableSeats,
         instructorId: payload.instructorId,
      },
      include: {
         course: true,
         semester: true,
         instructor: true,
      },
   });

   return updatedSection;
};

const closeSection = async (sectionId: string, user: RequestUser) => {
   if (user.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "You Are Not Allowed To Close This Section");
   }

   const section = await prisma.section.findUnique({
      where: {
         id: sectionId,
      },
   });

   if (!section) {
      throw new AppError(httpStatus.NOT_FOUND, "Section Not Found");
   }

   if (section.status === SectionStatus.CLOSED) {
      throw new AppError(httpStatus.CONFLICT, "Section Is Already Closed");
   }

   const closedSection = await prisma.section.update({
      where: {
         id: section.id,
      },
      data: {
         status: SectionStatus.CLOSED,
      },
      include: {
         course: true,
         semester: true,
         instructor: true,
      },
   });

   return closedSection;
};

const deleteSection = async (sectionId: string, user: RequestUser) => {
   if (user.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "You Are Not Allowed To Delete This Section");
   }

   const section = await prisma.section.findUnique({
      where: {
         id: sectionId,
      },
   });

   if (!section) {
      throw new AppError(httpStatus.NOT_FOUND, "Section Not Found");
   }

   const registeredStudentCount = await prisma.registration.count({
      where: {
         sectionId: section.id,
         status: RegistrationStatus.REGISTERED,
      },
   });

   if (registeredStudentCount > 0) {
      throw new AppError(httpStatus.CONFLICT, "Section With Registered Students Cannot Be Deleted");
   }

   const deletedSection = await prisma.section.update({
      where: {
         id: section.id,
      },
      data: {
         status: SectionStatus.COMPLETED,
      },
   });

   return deletedSection;
};

export const SectionServices = {
   createSection,
   getMySections,
   getAllSections,
   getSectionById,
   updateSection,
   closeSection,
   deleteSection,
};
