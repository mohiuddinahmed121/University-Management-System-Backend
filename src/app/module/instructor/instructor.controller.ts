import type { Request, Response } from "express";
import httpStatus from "http-status";

import { InstructorServices } from "./instructor.service";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

const applyAsInstructor = catchAsync(async (req: Request, res: Response) => {
   const files = req.files as {
      [key: string]: Express.Multer.File[];
   };

   const resume = files?.resume?.[0];

   if (!resume) {
      return sendResponse(res, {
         success: false,
         statusCode: httpStatus.BAD_REQUEST,
         message: "Resume file is required",
         data: null,
      });
   }

   let payload;

   try {
      payload = JSON.parse(req.body.data);
   } catch {
      return sendResponse(res, {
         success: false,
         statusCode: httpStatus.BAD_REQUEST,
         message: "Invalid JSON data",
         data: null,
      });
   }

   const result = await InstructorServices.applyAsInstructor(payload, resume);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Instructor application submitted successfully",
      data: result,
   });
});

const verifyInstructorEmail = catchAsync(async (req: Request, res: Response) => {
   const { email, otp } = req.body;

   const result = await InstructorServices.verifyInstructorEmail(email, otp);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Email verified successfully",
      data: result,
   });
});

const approveInstructor = catchAsync(async (req: Request, res: Response) => {
   const result = await InstructorServices.approveInstructor(req.body, req.user!);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message:
         req.body.action === "APPROVE"
            ? "Instructor approved successfully"
            : "Instructor application rejected successfully",
      data: result,
   });
});

const getAllInstructors = catchAsync(async (req: Request, res: Response) => {
   const result = await InstructorServices.getAllInstructors(req.query);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Instructors retrieved successfully",
      data: result.data,
      meta: result.meta,
   });
});

const updateInstructorProfile = catchAsync(async (req: Request, res: Response) => {
   const result = await InstructorServices.updateInstructorProfile(req.user!, req.body);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Instructor profile updated successfully",
      data: result,
   });
});

const getSingleInstructorProfile = catchAsync(async (req: Request, res: Response) => {
   const { instructorId } = req.params;

   const result = await InstructorServices.getSingleInstructorProfile(instructorId as string);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Instructor profile retrieved successfully",
      data: result,
   });
});

export const InstructorController = {
   applyAsInstructor,
   verifyInstructorEmail,
   approveInstructor,
   getAllInstructors,
   updateInstructorProfile,
   getSingleInstructorProfile,
};
