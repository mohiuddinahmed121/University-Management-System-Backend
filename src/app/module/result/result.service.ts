import httpStatus from "http-status";
import type { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { IRequestUser } from "../auth/auth.interface";
import type { ISubmitResultPayload, IUpdateResultPayload } from "../result/result.interface";

const getGrade = (marks: number) => {
   if (marks >= 80) return { grade: "A+", gradePoint: 4.0 };
   if (marks >= 75) return { grade: "A", gradePoint: 3.75 };
   if (marks >= 70) return { grade: "A-", gradePoint: 3.5 };
   if (marks >= 65) return { grade: "B+", gradePoint: 3.25 };
   if (marks >= 60) return { grade: "B", gradePoint: 3.0 };
   if (marks >= 55) return { grade: "B-", gradePoint: 2.75 };
   if (marks >= 50) return { grade: "C+", gradePoint: 2.5 };
   if (marks >= 45) return { grade: "C", gradePoint: 2.25 };
   if (marks >= 40) return { grade: "D", gradePoint: 2.0 };

   return { grade: "F", gradePoint: 0.0 };
};

/*
 * Helper: JWT payload-এ থাকা user.userId আসলে User.id।
 * কিন্তু Section.instructorId আসলে Instructor.id।
 * তাই instructor role হলে, প্রথমে User.id দিয়ে
 * সংশ্লিষ্ট Instructor.id বের করে নিতে হবে।
 */
const getInstructorIdFromUser = async (userId: string) => {
   const instructor = await prisma.instructor.findUnique({
      where: {
         userId,
      },
   });

   if (!instructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor Profile Not Found");
   }

   return instructor.id;
};

const submitResult = async (payload: ISubmitResultPayload, user: IRequestUser) => {
   const { registrationId, marks } = payload;

   const registration = await prisma.registration.findUnique({
      where: {
         id: registrationId,
      },
      include: {
         student: true,
         section: {
            include: {
               course: true,
               instructor: true,
               semester: true,
            },
         },
         result: true,
      },
   });

   if (!registration) {
      throw new AppError(httpStatus.NOT_FOUND, "Registration Not Found");
   }

   if (!registration.section.instructorId) {
      throw new AppError(httpStatus.BAD_REQUEST, "No Instructor Is Assigned To This Section");
   }

   if (user.role === "INSTRUCTOR") {
      const instructorId = await getInstructorIdFromUser(user.userId);

      if (registration.section.instructorId !== instructorId) {
         throw new AppError(
            httpStatus.FORBIDDEN,
            "You Can Only Submit Results For Your Assigned Sections",
         );
      }
   }

   if (registration.status === "DROPPED") {
      throw new AppError(httpStatus.BAD_REQUEST, "Cannot Submit Result For A Dropped Registration");
   }

   if (registration.result) {
      throw new AppError(
         httpStatus.CONFLICT,
         "Result Already Exists. Please Update The Existing Result",
      );
   }

   const { grade, gradePoint } = getGrade(marks);

   const result = await prisma.$transaction(async (tx) => {
      const createdResult = await tx.result.create({
         data: {
            registrationId,
            marks,
            grade,
            gradePoint,
            submittedAt: new Date(),
         },
         include: {
            registration: {
               include: {
                  student: true,
                  section: {
                     include: {
                        course: true,
                        semester: true,
                     },
                  },
               },
            },
         },
      });

      await tx.registration.update({
         where: {
            id: registrationId,
         },
         data: {
            status: "COMPLETED",
         },
      });

      return createdResult;
   });

   return result;
};

const updateResult = async (
   resultId: string,
   payload: IUpdateResultPayload,
   user: IRequestUser,
) => {
   const existingResult = await prisma.result.findUnique({
      where: {
         id: resultId,
      },
      include: {
         registration: {
            include: {
               student: true,
               section: {
                  include: {
                     course: true,
                     semester: true,
                  },
               },
            },
         },
      },
   });

   if (!existingResult) {
      throw new AppError(httpStatus.NOT_FOUND, "Result Not Found");
   }

   if (user.role === "INSTRUCTOR") {
      const instructorId = await getInstructorIdFromUser(user.userId);

      if (existingResult.registration.section.instructorId !== instructorId) {
         throw new AppError(
            httpStatus.FORBIDDEN,
            "You Can Only Update Results For Your Assigned Sections",
         );
      }
   }

   const marks = payload.marks;

   if (marks === undefined) {
      throw new AppError(httpStatus.BAD_REQUEST, "Marks Is Required");
   }

   const { grade, gradePoint } = getGrade(marks);

   const result = await prisma.result.update({
      where: {
         id: resultId,
      },
      data: {
         marks,
         grade,
         gradePoint,
         submittedAt: new Date(),
      },
      include: {
         registration: {
            include: {
               student: true,
               section: {
                  include: {
                     course: true,
                     semester: true,
                  },
               },
            },
         },
      },
   });

   return result;
};

const getMyResults = async (user: IRequestUser) => {
   const student = await prisma.student.findUnique({
      where: {
         userId: user.userId,
      },
   });

   if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
   }

   const results = await prisma.result.findMany({
      where: {
         registration: {
            studentId: student.id,
         },
      },
      include: {
         registration: {
            include: {
               section: {
                  include: {
                     course: true,
                     semester: true,
                  },
               },
            },
         },
      },
      orderBy: {
         updatedAt: "desc",
      },
   });

   return results;
};

const getAllResults = async (query: IQuery) => {
   const page = Number(query.page) || 1;
   const limit = Number(query.limit) || 10;
   const skip = (page - 1) * limit;

   const searchTerm = query.searchTerm || "";

   const where = {
      OR: [
         {
            grade: {
               contains: searchTerm,
               mode: "insensitive" as const,
            },
         },
         {
            registration: {
               student: {
                  OR: [
                     {
                        name: {
                           contains: searchTerm,
                           mode: "insensitive" as const,
                        },
                     },
                     {
                        studentId: {
                           contains: searchTerm,
                           mode: "insensitive" as const,
                        },
                     },
                  ],
               },
            },
         },
         {
            registration: {
               section: {
                  course: {
                     OR: [
                        {
                           code: {
                              contains: searchTerm,
                              mode: "insensitive" as const,
                           },
                        },
                        {
                           title: {
                              contains: searchTerm,
                              mode: "insensitive" as const,
                           },
                        },
                     ],
                  },
               },
            },
         },
      ],
   };

   const [results, total] = await prisma.$transaction([
      prisma.result.findMany({
         where,
         skip,
         take: limit,
         include: {
            registration: {
               include: {
                  student: true,
                  section: {
                     include: {
                        course: true,
                        semester: true,
                        instructor: true,
                     },
                  },
               },
            },
         },
         orderBy: {
            updatedAt: "desc",
         },
      }),
      prisma.result.count({
         where,
      }),
   ]);

   return {
      data: results,
      meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
   };
};

const getSingleResult = async (resultId: string, user: IRequestUser) => {
   const result = await prisma.result.findUnique({
      where: {
         id: resultId,
      },
      include: {
         registration: {
            include: {
               student: true,
               section: {
                  include: {
                     course: true,
                     semester: true,
                     instructor: true,
                  },
               },
            },
         },
      },
   });

   if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Result Not Found");
   }

   if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
         where: {
            userId: user.userId,
         },
      });

      if (!student || result.registration.studentId !== student.id) {
         throw new AppError(httpStatus.FORBIDDEN, "You Can Only View Your Own Result");
      }
   }

   if (user.role === "INSTRUCTOR") {
      const instructorId = await getInstructorIdFromUser(user.userId);

      if (result.registration.section.instructorId !== instructorId) {
         throw new AppError(
            httpStatus.FORBIDDEN,
            "You Can Only View Results For Your Assigned Sections",
         );
      }
   }

   return result;
};

export const ResultService = {
   submitResult,
   updateResult,
   getMyResults,
   getAllResults,
   getSingleResult,
};
