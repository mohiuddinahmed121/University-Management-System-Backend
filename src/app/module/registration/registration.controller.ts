import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RegistrationServices } from "./registration.service";

const createRegistration = catchAsync(async (req: Request, res: Response) => {
   const payload = req.body;
   const user = req.user!;

   const result = await RegistrationServices.createRegistration(payload, user);

   sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Course Registration Successful",
      data: result,
   });
});

const dropRegistration = catchAsync(async (req: Request, res: Response) => {
   const registrationId = req.params.registrationId as string;
   const user = req.user!;

   const result = await RegistrationServices.dropRegistration(registrationId, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course Registration Dropped Successfully",
      data: result,
   });
});

const getMyRegistrations = catchAsync(async (req: Request, res: Response) => {
   const user = req.user!;

   const { data, meta } = await RegistrationServices.getMyRegistrations(req.query, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Registrations Retrieved Successfully",
      data,
      meta,
   });
});

const getAllRegistrations = catchAsync(async (req: Request, res: Response) => {
   const { data, meta } = await RegistrationServices.getAllRegistrations(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Registrations Retrieved Successfully",
      data,
      meta,
   });
});

const getSingleRegistration = catchAsync(async (req: Request, res: Response) => {
   const registrationId = req.params.registrationId as string;

   const user = req.user!;

   const result = await RegistrationServices.getSingleRegistration(registrationId, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Registration Retrieved Successfully",
      data: result,
   });
});

export const RegistrationController = {
   createRegistration,
   dropRegistration,
   getMyRegistrations,
   getAllRegistrations,
   getSingleRegistration,
};
