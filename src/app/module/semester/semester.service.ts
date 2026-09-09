import httpStatus from "http-status";
import type { SemesterWhereInput } from "../../../../generated/prisma/models";
import { SemesterStatus } from "../../../../generated/prisma/enums";
import type { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type { ICreateSemesterPayload, IUpdateSemesterPayload } from "./semester.interface";

const createSemester = async (payload: ICreateSemesterPayload, _user: RequestUser) => {
   if (payload.endDate <= payload.startDate) {
      throw new AppError(httpStatus.BAD_REQUEST, "End Date Must Be After Start Date");
   }

   const existingSemester = await prisma.semester.findUnique({
      where: {
         name_year: {
            name: payload.name,
            year: payload.year,
         },
      },
   });

   if (existingSemester) {
      throw new AppError(httpStatus.BAD_REQUEST, "This Semester Already Exists");
   }

   const ongoingSemester = await prisma.semester.findFirst({
      where: {
         status: SemesterStatus.ONGOING,
      },
   });

   if (ongoingSemester) {
      throw new AppError(httpStatus.BAD_REQUEST, "An Ongoing Semester Already Exists");
   }

   const result = await prisma.semester.create({
      data: {
         name: payload.name,
         year: payload.year,
         startDate: payload.startDate,
         endDate: payload.endDate,
         feeAmount: payload.feeAmount,
         status: SemesterStatus.UPCOMING,
      },
   });

   return result;
};

const getAllSemesters = async (query: IQuery) => {
   const {
      searchTerm,
      page = "1",
      limit = "10",
      sortBy = "startDate",
      sortOrder = "desc",
      status,
      year,
   } = query;

   const pageNumber = Number(page);
   const limitNumber = Number(limit);
   const skip = (pageNumber - 1) * limitNumber;

   const andConditions: SemesterWhereInput[] = [];

   if (searchTerm) {
      andConditions.push({
         name: {
            contains: searchTerm,
            mode: "insensitive",
         },
      });
   }

   if (status) {
      andConditions.push({
         status,
      });
   }

   if (year) {
      andConditions.push({
         year: Number(year),
      });
   }

   const whereConditions: SemesterWhereInput =
      andConditions.length > 0
         ? {
              AND: andConditions,
           }
         : {};

   const [data, total] = await Promise.all([
      prisma.semester.findMany({
         where: whereConditions,
         skip,
         take: limitNumber,
         orderBy: {
            [sortBy]: sortOrder,
         },
         include: {
            _count: {
               select: {
                  sections: true,
                  payments: true,
               },
            },
         },
      }),

      prisma.semester.count({
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

const getSingleSemester = async (semesterId: string) => {
   const semester = await prisma.semester.findUnique({
      where: {
         id: semesterId,
      },
      include: {
         sections: {
            include: {
               course: true,
               instructor: true,
            },
         },
         _count: {
            select: {
               sections: true,
               payments: true,
            },
         },
      },
   });

   if (!semester) {
      throw new AppError(httpStatus.NOT_FOUND, "Semester Not Found");
   }

   return semester;
};

const updateSemester = async (
   semesterId: string,
   payload: IUpdateSemesterPayload,
   _user: RequestUser,
) => {
   const semester = await prisma.semester.findUnique({
      where: {
         id: semesterId,
      },
   });

   if (!semester) {
      throw new AppError(httpStatus.NOT_FOUND, "Semester Not Found");
   }

   const startDate = payload.startDate ?? semester.startDate;
   const endDate = payload.endDate ?? semester.endDate;

   if (endDate <= startDate) {
      throw new AppError(httpStatus.BAD_REQUEST, "End Date Must Be After Start Date");
   }

   const name = payload.name ?? semester.name;
   const year = payload.year ?? semester.year;

   if (name !== semester.name || year !== semester.year) {
      const existingSemester = await prisma.semester.findUnique({
         where: {
            name_year: {
               name,
               year,
            },
         },
      });

      if (existingSemester && existingSemester.id !== semester.id) {
         throw new AppError(httpStatus.BAD_REQUEST, "This Semester Already Exists");
      }
   }

   const result = await prisma.semester.update({
      where: {
         id: semesterId,
      },
      data: payload,
   });

   return result;
};

const updateSemesterStatus = async (
   semesterId: string,
   payload: { status: SemesterStatus },
   _user: RequestUser,
) => {
   const semester = await prisma.semester.findUnique({
      where: {
         id: semesterId,
      },
   });

   if (!semester) {
      throw new AppError(httpStatus.NOT_FOUND, "Semester Not Found");
   }

   if (payload.status === SemesterStatus.ONGOING && semester.status !== SemesterStatus.ONGOING) {
      const ongoingSemester = await prisma.semester.findFirst({
         where: {
            status: SemesterStatus.ONGOING,
            id: {
               not: semesterId,
            },
         },
      });

      if (ongoingSemester) {
         throw new AppError(httpStatus.BAD_REQUEST, "Another Semester Is Already Ongoing");
      }
   }

   if (
      semester.status === SemesterStatus.COMPLETED &&
      payload.status !== SemesterStatus.COMPLETED
   ) {
      throw new AppError(httpStatus.BAD_REQUEST, "Completed Semester Status Cannot Be Changed");
   }

   const result = await prisma.semester.update({
      where: {
         id: semesterId,
      },
      data: {
         status: payload.status,
      },
   });

   return result;
};

export const SemesterServices = {
   createSemester,
   getAllSemesters,
   getSingleSemester,
   updateSemester,
   updateSemesterStatus,
};
