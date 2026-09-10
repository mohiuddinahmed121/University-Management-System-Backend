import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ProgramServices } from "./program.service";

const createProgram = catchAsync(async (req: Request, res: Response) => {
   const payload = req.body;
   const user = req.user!;

   const result = await ProgramServices.createProgram(payload, user);

   sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Program Created Successfully",
      data: result,
   });
});

const getAllPrograms = catchAsync(async (req: Request, res: Response) => {
   const { data, meta } = await ProgramServices.getAllPrograms(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Programs Retrieved Successfully",
      data,
      meta,
   });
});

const getSingleProgram = catchAsync(async (req: Request, res: Response) => {
   const programId = req.params.programId as string;

   const result = await ProgramServices.getSingleProgram(programId);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Program Retrieved Successfully",
      data: result,
   });
});

const updateProgram = catchAsync(async (req: Request, res: Response) => {
   const programId = req.params.programId as string;
   const payload = req.body;
   const user = req.user!;

   const result = await ProgramServices.updateProgram(programId, payload, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Program Updated Successfully",
      data: result,
   });
});

const deleteProgram = catchAsync(async (req: Request, res: Response) => {
   const programId = req.params.programId as string;
   const user = req.user!;

   const result = await ProgramServices.deleteProgram(programId, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Program Deleted Successfully",
      data: result,
   });
});

export const ProgramController = {
   createProgram,
   getAllPrograms,
   getSingleProgram,
   updateProgram,
   deleteProgram,
};
