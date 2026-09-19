import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminServices } from "./admin.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
   const { data, meta } = await AdminServices.getAllUsers(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Users Retrieved Successfully",
      data,
      meta,
   });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
   const userId = req.params.userId as string;
   const user = req.user!;

   const result = await AdminServices.updateUserStatus(userId, req.body.status, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User Status Updated Successfully",
      data: result,
   });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
   const userId = req.params.userId as string;

   const result = await AdminServices.getSingleUser(userId);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User Retrieved Successfully",
      data: result,
   });
});

export const AdminController = {
   getAllUsers,
   updateUserStatus,
   getSingleUser,
};
