import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SectionServices } from "../../module/section/section.service";

const createSection = catchAsync(async (req: Request, res: Response) => {
   const payload = req.body;
   const user = req.user!;

   const result = await SectionServices.createSection(payload, user);

   sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Section Created Successfully",
      data: result,
   });
});

const getMySections = catchAsync(async (req: Request, res: Response) => {
   const user = req.user!;

   const { data, meta } = await SectionServices.getMySections(req.query, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sections Retrieved Successfully",
      data,
      meta,
   });
});

const getAllSections = catchAsync(async (req: Request, res: Response) => {
   const { data, meta } = await SectionServices.getAllSections(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sections Retrieved Successfully",
      data,
      meta,
   });
});

const getSectionById = catchAsync(async (req: Request, res: Response) => {
   const sectionId = req.params.sectionId as string;

   const result = await SectionServices.getSectionById(sectionId);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Section Retrieved Successfully",
      data: result,
   });
});

const updateSection = catchAsync(async (req: Request, res: Response) => {
   const sectionId = req.params.sectionId as string;
   const payload = req.body;
   const user = req.user!;

   const result = await SectionServices.updateSection(sectionId, payload, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Section Updated Successfully",
      data: result,
   });
});

const closeSection = catchAsync(async (req: Request, res: Response) => {
   const sectionId = req.params.sectionId as string;
   const user = req.user!;

   const result = await SectionServices.closeSection(sectionId, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Section Closed Successfully",
      data: result,
   });
});

const deleteSection = catchAsync(async (req: Request, res: Response) => {
   const sectionId = req.params.sectionId as string;
   const user = req.user!;

   const result = await SectionServices.deleteSection(sectionId, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Section Deleted Successfully",
      data: result,
   });
});

export const SectionController = {
   createSection,
   getMySections,
   getAllSections,
   getSectionById,
   updateSection,
   closeSection,
   deleteSection,
};
