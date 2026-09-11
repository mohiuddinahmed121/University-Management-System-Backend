import httpStatus from "http-status";
import { PaymentStatus, Role } from "../../../../generated/prisma/enums";
import config from "../../config";
import { PaymentWhereInput } from "../../../../generated/prisma/models";
import { IQuery } from "../../interface";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import { getBkashIdToken } from "../../lib/bkash";

const createPayment = async (
   payload: { semesterId: string; amount: number },
   user: RequestUser,
) => {
   const student = await prisma.student.findUnique({
      where: { userId: user.userId },
   });

   if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
   }

   const merchantInvoiceNumber = `INV-${Date.now()}`;

   const bkashIdToken = await getBkashIdToken();

   const response = await fetch(`${config.bkash_base_url}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         Accept: "application/json",
         Authorization: bkashIdToken as string,
         "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
         mode: "0011",
         payerReference: student.studentId,
         callbackURL: config.bkash_callback_url,
         amount: payload.amount.toString(),
         currency: "BDT",
         intent: "sale",
         merchantInvoiceNumber,
      }),
   });

   const result = await response.json();

   if (!response.ok || result.statusCode !== "0000") {
      throw new AppError(
         httpStatus.BAD_GATEWAY,
         result.statusMessage || "Bkash Payment Creation Failed",
      );
   }

   await prisma.payment.create({
      data: {
         studentId: student.id,
         semesterId: payload.semesterId,
         amount: payload.amount,
         status: PaymentStatus.PENDING,
         merchantInvoiceNumber,
         bkashPaymentId: result.paymentID,
         payerReference: student.studentId,
         gatewayResponse: result,
      },
   });

   return {
      bkashURL: result.bkashURL,
      paymentID: result.paymentID,
   };
};

const paymentCallback = async (query: { paymentID?: string; status?: string }) => {
   const { paymentID, status } = query;

   if (!paymentID) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment ID Missing In Callback");
   }

   const existingPayment = await prisma.payment.findUnique({
      where: { bkashPaymentId: paymentID },
   });

   if (!existingPayment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment Record Not Found");
   }

   // User bKash পেজ থেকে cancel বা failure করলে
   if (status === "cancel" || status === "failure") {
      await prisma.payment.update({
         where: { bkashPaymentId: paymentID },
         data: { status: PaymentStatus.FAILED },
      });

      return { status: PaymentStatus.FAILED, paymentID };
   }

   const bkashIdToken = await getBkashIdToken();

   const response = await fetch(`${config.bkash_base_url}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         Accept: "application/json",
         Authorization: bkashIdToken as string,
         "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({ paymentID }),
   });

   const result = await response.json();

   if (!response.ok || result.statusCode !== "0000") {
      await prisma.payment.update({
         where: { bkashPaymentId: paymentID },
         data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: result,
         },
      });

      throw new AppError(
         httpStatus.BAD_REQUEST,
         result.statusMessage || "Payment Execution Failed",
      );
   }

   const updatedPayment = await prisma.payment.update({
      where: { bkashPaymentId: paymentID },
      data: {
         status: PaymentStatus.PAID,
         bkashTrxId: result.trxID,
         paidAt: new Date(),
         gatewayResponse: result,
      },
   });

   return updatedPayment;
};

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
   createPayment,
   paymentCallback,
   getAllPayments,
   getMyPayments,
   getSinglePayment,
};
