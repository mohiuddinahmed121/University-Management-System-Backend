import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { InstructorServices } from "./instructor.service";

const getAllInstructors = catchAsync(async (req: Request, res: Response) => {
   const { data, meta } = await InstructorServices.getAllInstructors(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instructors Retrieved Successfully",
      data,
      meta,
   });
});

const updateInstructorProfile = catchAsync(async (req: Request, res: Response) => {
   const payload = req.body;
   const user = req.user!;

   const result = await InstructorServices.updateInstructorProfile(payload, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instructor Profile Updated Successfully",
      data: result,
   });
});

const getSingleInstructorProfile = catchAsync(async (req: Request, res: Response) => {
   const instructorId = req.params.instructorId as string;

   const result = await InstructorServices.getSingleInstructorProfile(instructorId);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instructor Profile Retrieved Successfully",
      data: result,
   });
});

export const InstructorController = {
   getAllInstructors,
   updateInstructorProfile,
   getSingleInstructorProfile,
};
