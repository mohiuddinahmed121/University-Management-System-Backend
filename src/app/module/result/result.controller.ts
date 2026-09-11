import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ResultService } from "./result.service";

const submitResult = catchAsync(async (req: Request, res: Response) => {
   const result = await ResultService.submitResult(req.body, req.user!);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Result Submitted Successfully",
      data: result,
   });
});

const updateResult = catchAsync(async (req: Request, res: Response) => {
   const result = await ResultService.updateResult(
      req.params.resultId as string,
      req.body,
      req.user!,
   );

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Result Updated Successfully",
      data: result,
   });
});

const getMyResults = catchAsync(async (req: Request, res: Response) => {
   const result = await ResultService.getMyResults(req.user!);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "My Results Retrieved Successfully",
      data: result,
   });
});

const getAllResults = catchAsync(async (req: Request, res: Response) => {
   const result = await ResultService.getAllResults(req.query);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All Results Retrieved Successfully",
      data: result.data,
      meta: result.meta,
   });
});

const getSingleResult = catchAsync(async (req: Request, res: Response) => {
   const result = await ResultService.getSingleResult(req.params.resultId as string, req.user!);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Result Retrieved Successfully",
      data: result,
   });
});

export const ResultController = {
   submitResult,
   updateResult,
   getMyResults,
   getAllResults,
   getSingleResult,
};
