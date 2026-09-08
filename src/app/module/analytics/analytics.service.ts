import httpStatus from "http-status";
import { PaymentStatus, RegistrationStatus } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";

/* Admin Analytics */

const getAdminAnalytics = async () => {
   const totalStudents = await prisma.student.count();

   const totalInstructors = await prisma.instructor.count();

   const totalDepartments = await prisma.department.count({
      where: {
         isDeleted: false,
      },
   });

   const totalPrograms = await prisma.program.count();

   const totalCourses = await prisma.course.count({
      where: {
         isDeleted: false,
      },
   });

   const totalSemesters = await prisma.semester.count();

   const totalSections = await prisma.section.count();

   const totalRegistrations = await prisma.registration.count();

   const totalCompletedRegistrations = await prisma.registration.count({
      where: {
         status: RegistrationStatus.COMPLETED,
      },
   });

   const totalDroppedRegistrations = await prisma.registration.count({
      where: {
         status: RegistrationStatus.DROPPED,
      },
   });

   const totalPaidPayments = await prisma.payment.count({
      where: {
         status: PaymentStatus.PAID,
      },
   });

   const totalPendingPayments = await prisma.payment.count({
      where: {
         status: PaymentStatus.PENDING,
      },
   });

   const totalRevenueResult = await prisma.payment.aggregate({
      where: {
         status: PaymentStatus.PAID,
      },
      _sum: {
         amount: true,
      },
   });

   const totalRevenue = totalRevenueResult._sum.amount?.toNumber() || 0;

   return {
      totalStudents,
      totalInstructors,
      totalDepartments,
      totalPrograms,
      totalCourses,
      totalSemesters,
      totalSections,
      totalRegistrations,
      totalCompletedRegistrations,
      totalDroppedRegistrations,
      totalPaidPayments,
      totalPendingPayments,
      totalRevenue,
   };
};

/* Student Analytics */

const getStudentAnalytics = async (user: RequestUser) => {
   const student = await prisma.student.findUnique({
      where: {
         userId: user.userId,
      },
   });

   if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, "Student Profile Not Found");
   }

   const totalRegisteredCourses = await prisma.registration.count({
      where: {
         studentId: student.id,
      },
   });

   const currentlyRegisteredCourses = await prisma.registration.count({
      where: {
         studentId: student.id,
         status: RegistrationStatus.REGISTERED,
      },
   });

   const completedCourses = await prisma.registration.count({
      where: {
         studentId: student.id,
         status: RegistrationStatus.COMPLETED,
      },
   });

   const droppedCourses = await prisma.registration.count({
      where: {
         studentId: student.id,
         status: RegistrationStatus.DROPPED,
      },
   });

   const registrations = await prisma.registration.findMany({
      where: {
         studentId: student.id,
         status: RegistrationStatus.COMPLETED,
      },
      include: {
         result: true,
         section: {
            include: {
               course: true,
            },
         },
      },
   });

   let totalCredits = 0;
   let earnedCredits = 0;
   let totalGradePoints = 0;

   for (const registration of registrations) {
      const credit = registration.section.course.credit.toNumber();

      totalCredits += credit;

      if (registration.result?.gradePoint !== null) {
         const gradePoint = registration.result?.gradePoint?.toNumber() || 0;

         totalGradePoints += credit * gradePoint;

         if (gradePoint > 0) {
            earnedCredits += credit;
         }
      }
   }

   const currentGPA = totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0;

   const totalPaidAmountResult = await prisma.payment.aggregate({
      where: {
         studentId: student.id,
         status: PaymentStatus.PAID,
      },
      _sum: {
         amount: true,
      },
   });

   const totalPaidAmount = totalPaidAmountResult._sum.amount?.toNumber() || 0;

   const pendingSemesterFeeResult = await prisma.payment.aggregate({
      where: {
         studentId: student.id,
         status: PaymentStatus.PENDING,
      },
      _sum: {
         amount: true,
      },
   });

   const pendingSemesterFee = pendingSemesterFeeResult._sum.amount?.toNumber() || 0;

   return {
      totalRegisteredCourses,
      currentlyRegisteredCourses,
      completedCourses,
      droppedCourses,
      totalCredits,
      earnedCredits,
      currentGPA,
      totalPaidAmount,
      pendingSemesterFee,
   };
};

/* Instructor Analytics */

const getInstructorAnalytics = async (user: RequestUser) => {
   const instructor = await prisma.instructor.findUnique({
      where: {
         userId: user.userId,
      },
   });

   if (!instructor) {
      throw new AppError(httpStatus.NOT_FOUND, "Instructor Profile Not Found");
   }

   const totalAssignedSections = await prisma.section.count({
      where: {
         instructorId: instructor.id,
      },
   });

   const totalAssignedCourses = await prisma.section.count({
      where: {
         instructorId: instructor.id,
      },
   });

   const totalEnrolledStudents = await prisma.registration.count({
      where: {
         section: {
            instructorId: instructor.id,
         },
         status: RegistrationStatus.REGISTERED,
      },
   });

   const totalResultsSubmitted = await prisma.result.count({
      where: {
         registration: {
            section: {
               instructorId: instructor.id,
            },
         },
         submittedAt: {
            not: null,
         },
      },
   });

   const totalPendingResults = await prisma.registration.count({
      where: {
         section: {
            instructorId: instructor.id,
         },
         result: {
            is: null,
         },
         status: RegistrationStatus.REGISTERED,
      },
   });

   const assignedSections = await prisma.section.findMany({
      where: {
         instructorId: instructor.id,
      },
      select: {
         courseId: true,
      },
      distinct: ["courseId"],
   });

   return {
      totalAssignedSections,
      totalAssignedCourses: assignedSections.length,
      totalEnrolledStudents,
      totalResultsSubmitted,
      totalPendingResults,
   };
};

export const AnalyticsServices = {
   getAdminAnalytics,
   getStudentAnalytics,
   getInstructorAnalytics,
};
