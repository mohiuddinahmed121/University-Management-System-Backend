import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StudentServices } from "./student.service";

const getAllStudents = catchAsync(async (req: Request, res: Response) => {
   const { data, meta } = await StudentServices.getAllStudents(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Students Retrieved Successfully",
      data,
      meta,
   });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
   const user = req.user!;

   const result = await StudentServices.getMyProfile(user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Student Profile Retrieved Successfully",
      data: result,
   });
});

const updateStudentProfile = catchAsync(async (req: Request, res: Response) => {
   const payload = req.body;
   const user = req.user!;

   const result = await StudentServices.updateStudentProfile(payload, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Student Profile Updated Successfully",
      data: result,
   });
});

const getSingleStudentProfile = catchAsync(async (req: Request, res: Response) => {
   const studentId = req.params.studentId as string;

   const result = await StudentServices.getSingleStudentProfile(studentId);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Student Profile Retrieved Successfully",
      data: result,
   });
});

export const StudentController = {
   getAllStudents,
   getMyProfile,
   updateStudentProfile,
   getSingleStudentProfile,
};
