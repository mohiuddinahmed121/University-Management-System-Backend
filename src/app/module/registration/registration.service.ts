import httpStatus from "http-status";
import { RegistrationStatus, SectionStatus } from "../../../../generated/prisma/enums";
import type { RegistrationWhereInput } from "../../../../generated/prisma/models";
import type { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type { ICreateRegistrationPayload } from "../../../app/module/registration/registration.interface";

const createRegistration = async (payload: ICreateRegistrationPayload, user: RequestUser) => {
   const transactionResult = await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
         where: {
            userId: user.userId,
         },
      });

      if (!student) {
         throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
      }

      const section = await tx.section.findUnique({
         where: {
            id: payload.sectionId,
         },
         include: {
            course: true,
            semester: true,
         },
      });

      if (!section) {
         throw new AppError(httpStatus.NOT_FOUND, "Section Not Found");
      }

      if (section.course.isDeleted) {
         throw new AppError(httpStatus.BAD_REQUEST, "This Course Is No Longer Available");
      }

      if (section.status !== SectionStatus.OPEN) {
         throw new AppError(httpStatus.BAD_REQUEST, "This Section Is Not Open For Registration");
      }

      if (section.availableSeats <= 0) {
         throw new AppError(httpStatus.BAD_REQUEST, "This Section Is Fully Enrolled");
      }

      const existingRegistration = await tx.registration.findUnique({
         where: {
            studentId_sectionId: {
               studentId: student.id,
               sectionId: section.id,
            },
         },
      });

      if (existingRegistration?.status === RegistrationStatus.REGISTERED) {
         throw new AppError(httpStatus.BAD_REQUEST, "You Are Already Registered For This Section");
      }

      if (existingRegistration?.status === RegistrationStatus.COMPLETED) {
         throw new AppError(httpStatus.BAD_REQUEST, "You Have Already Completed This Section");
      }

      const registration = existingRegistration
         ? await tx.registration.update({
              where: {
                 id: existingRegistration.id,
              },
              data: {
                 status: RegistrationStatus.REGISTERED,
                 registeredAt: new Date(),
                 droppedAt: null,
              },
              include: {
                 section: {
                    include: {
                       course: true,
                       semester: true,
                       instructor: true,
                    },
                 },
              },
           })
         : await tx.registration.create({
              data: {
                 studentId: student.id,
                 sectionId: section.id,
                 status: RegistrationStatus.REGISTERED,
              },
              include: {
                 section: {
                    include: {
                       course: true,
                       semester: true,
                       instructor: true,
                    },
                 },
              },
           });

      await tx.section.update({
         where: {
            id: section.id,
         },
         data: {
            availableSeats: {
               decrement: 1,
            },
         },
      });

      return registration;
   });

   return transactionResult;
};

const dropRegistration = async (registrationId: string, user: RequestUser) => {
   const transactionResult = await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
         where: {
            userId: user.userId,
         },
      });

      if (!student) {
         throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
      }

      const registration = await tx.registration.findUnique({
         where: {
            id: registrationId,
            studentId: student.id,
         },
         include: {
            section: {
               include: {
                  course: true,
                  semester: true,
                  instructor: true,
               },
            },
         },
      });

      if (!registration) {
         throw new AppError(httpStatus.NOT_FOUND, "Registration Not Found");
      }

      if (registration.status === RegistrationStatus.DROPPED) {
         throw new AppError(httpStatus.BAD_REQUEST, "Registration Is Already Dropped");
      }

      if (registration.status === RegistrationStatus.COMPLETED) {
         throw new AppError(httpStatus.BAD_REQUEST, "Completed Course Cannot Be Dropped");
      }

      const updatedRegistration = await tx.registration.update({
         where: {
            id: registration.id,
         },
         data: {
            status: RegistrationStatus.DROPPED,
            droppedAt: new Date(),
         },
         include: {
            section: {
               include: {
                  course: true,
                  semester: true,
                  instructor: true,
               },
            },
         },
      });

      await tx.section.update({
         where: {
            id: registration.sectionId,
         },
         data: {
            availableSeats: {
               increment: 1,
            },
         },
      });

      return updatedRegistration;
   });

   return transactionResult;
};

const getMyRegistrations = async (query: IQuery, user: RequestUser) => {
   const limit = query.limit ? Number(query.limit) : 10;
   const page = query.page ? Number(query.page) : 1;
   const skip = (page - 1) * limit;
   const sortBy = query.sortBy ? query.sortBy : "registeredAt";
   const sortOrder = query.sortOrder ? query.sortOrder : "desc";

   const student = await prisma.student.findUnique({
      where: {
         userId: user.userId,
      },
   });

   if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
   }

   const andConditions: RegistrationWhereInput[] = [
      {
         studentId: student.id,
      },
   ];

   if (query.status) {
      andConditions.push({
         status: query.status,
      });
   }

   const registrations = await prisma.registration.findMany({
      where: {
         AND: andConditions,
      },
      take: limit,
      skip,
      orderBy: {
         [sortBy]: sortOrder,
      },
      include: {
         section: {
            include: {
               course: true,
               semester: true,
               instructor: true,
            },
         },
         result: true,
      },
   });

   const total = await prisma.registration.count({
      where: {
         AND: andConditions,
      },
   });

   return {
      data: registrations,
      meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
   };
};

const getAllRegistrations = async (query: IQuery) => {
   const limit = query.limit ? Number(query.limit) : 10;
   const page = query.page ? Number(query.page) : 1;
   const skip = (page - 1) * limit;
   const sortBy = query.sortBy ? query.sortBy : "registeredAt";
   const sortOrder = query.sortOrder ? query.sortOrder : "desc";

   const andConditions: RegistrationWhereInput[] = [];

   if (query.status) {
      andConditions.push({
         status: query.status,
      });
   }

   if (query.studentId) {
      andConditions.push({
         studentId: query.studentId,
      });
   }

   if (query.sectionId) {
      andConditions.push({
         sectionId: query.sectionId,
      });
   }

   const registrations = await prisma.registration.findMany({
      where: {
         AND: andConditions,
      },
      take: limit,
      skip,
      orderBy: {
         [sortBy]: sortOrder,
      },
      include: {
         student: {
            select: {
               id: true,
               studentId: true,
               name: true,
               email: true,
            },
         },
         section: {
            include: {
               course: true,
               semester: true,
               instructor: true,
            },
         },
         result: true,
      },
   });

   const total = await prisma.registration.count({
      where: {
         AND: andConditions,
      },
   });

   return {
      data: registrations,
      meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
   };
};

const getSingleRegistration = async (registrationId: string, user: RequestUser) => {
   const registration = await prisma.registration.findUnique({
      where: {
         id: registrationId,
      },
      include: {
         student: {
            select: {
               id: true,
               studentId: true,
               name: true,
               email: true,
               userId: true,
            },
         },
         section: {
            include: {
               course: true,
               semester: true,
               instructor: true,
            },
         },
         result: true,
      },
   });

   if (!registration) {
      throw new AppError(httpStatus.NOT_FOUND, "Registration Not Found");
   }

   if (user.role === "STUDENT") {
      if (registration.student.userId !== user.userId) {
         throw new AppError(httpStatus.FORBIDDEN, "You Are Not Allowed To View This Registration");
      }
   }

   if (user.role === "INSTRUCTOR") {
      if (registration.section.instructor?.userId !== user.userId) {
         throw new AppError(httpStatus.FORBIDDEN, "You Are Not Allowed To View This Registration");
      }
   }

   return registration;
};

export const RegistrationServices = {
   createRegistration,
   dropRegistration,
   getMyRegistrations,
   getAllRegistrations,
   getSingleRegistration,
};
