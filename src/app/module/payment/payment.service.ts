import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { PaymentWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";

const getMyPayments = async (query: IQuery, user: RequestUser) => {
   const limit = query.limit ? Number(query.limit) : 10;
   const page = query.page ? Number(query.page) : 1;
   const skip = (page - 1) * limit;
   const sortBy = query.sortBy ? query.sortBy : "createdAt";
   const sortOrder = query.sortOrder ? query.sortOrder : "desc";

   const student = await prisma.student.findUnique({
      where: {
         userId: user.userId,
      },
   });

   if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
   }

   const andConditions: PaymentWhereInput[] = [
      {
         studentId: student.id,
      },
   ];

   const payments = await prisma.payment.findMany({
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
         semester: true,
      },
   });

   const total = await prisma.payment.count({
      where: {
         AND: andConditions,
      },
   });

   return {
      data: payments,
      meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
   };
};

const getAllPayments = async (query: IQuery) => {
   const limit = query.limit ? Number(query.limit) : 10;
   const page = query.page ? Number(query.page) : 1;
   const skip = (page - 1) * limit;
   const sortBy = query.sortBy ? query.sortBy : "createdAt";
   const sortOrder = query.sortOrder ? query.sortOrder : "desc";

   const andConditions: PaymentWhereInput[] = [];

   if (query.studentEmail) {
      andConditions.push({
         student: {
            email: query.studentEmail,
         },
      });
   }

   if (query.studentId) {
      andConditions.push({
         student: {
            studentId: query.studentId,
         },
      });
   }

   if (query.status) {
      andConditions.push({
         status: query.status,
      });
   }

   const payments = await prisma.payment.findMany({
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
         semester: true,
      },
   });

   const total = await prisma.payment.count({
      where: {
         AND: andConditions,
      },
   });

   return {
      data: payments,
      meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
   };
};

const getSinglePayment = async (paymentId: string, user: RequestUser) => {
   const payment = await prisma.payment.findUnique({
      where: {
         id: paymentId,
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
         semester: true,
      },
   });

   if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found");
   }

   if (user.role === Role.STUDENT) {
      if (payment.student.userId !== user.userId) {
         throw new AppError(httpStatus.FORBIDDEN, "You Are Not Allowed To View This Payment");
      }
   }

   return payment;
};

export const PaymentServices = {
   getAllPayments,
   getMyPayments,
   getSinglePayment,
};
