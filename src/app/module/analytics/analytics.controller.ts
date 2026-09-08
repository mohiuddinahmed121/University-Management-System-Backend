import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AnalyticsServices } from "./analytics.service";

const getStudentAnalytics = catchAsync(async (req: Request, res: Response) => {
   const user = req.user!;

   const result = await AnalyticsServices.getStudentAnalytics(user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Student Analytics Retrieved Successfully",
      data: result,
   });
});

const getInstructorAnalytics = catchAsync(async (req: Request, res: Response) => {
   const user = req.user!;

   const result = await AnalyticsServices.getInstructorAnalytics(user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instructor Analytics Retrieved Successfully",
      data: result,
   });
});

const getAdminAnalytics = catchAsync(async (req: Request, res: Response) => {
   const result = await AnalyticsServices.getAdminAnalytics();

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Admin Analytics Retrieved Successfully",
      data: result,
   });
});

export const AnalyticsController = {
   getStudentAnalytics,
   getInstructorAnalytics,
   getAdminAnalytics,
};
