import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SemesterServices } from "./semester.service";

const createSemester = catchAsync(async (req: Request, res: Response) => {
   const payload = req.body;
   const user = req.user!;

   const result = await SemesterServices.createSemester(payload, user);

   sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Semester Created Successfully",
      data: result,
   });
});

const getAllSemesters = catchAsync(async (req: Request, res: Response) => {
   const { data, meta } = await SemesterServices.getAllSemesters(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Semesters Retrieved Successfully",
      data,
      meta,
   });
});

const getSingleSemester = catchAsync(async (req: Request, res: Response) => {
   const semesterId = req.params.semesterId as string;

   const result = await SemesterServices.getSingleSemester(semesterId);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Semester Retrieved Successfully",
      data: result,
   });
});

const updateSemester = catchAsync(async (req: Request, res: Response) => {
   const semesterId = req.params.semesterId as string;
   const payload = req.body;
   const user = req.user!;

   const result = await SemesterServices.updateSemester(semesterId, payload, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Semester Updated Successfully",
      data: result,
   });
});

const updateSemesterStatus = catchAsync(async (req: Request, res: Response) => {
   const semesterId = req.params.semesterId as string;
   const payload = req.body;
   const user = req.user!;

   const result = await SemesterServices.updateSemesterStatus(semesterId, payload, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Semester Status Updated Successfully",
      data: result,
   });
});

export const SemesterController = {
   createSemester,
   getAllSemesters,
   getSingleSemester,
   updateSemester,
   updateSemesterStatus,
};
