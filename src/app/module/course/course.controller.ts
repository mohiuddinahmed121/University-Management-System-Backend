import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CourseServices } from "../course/course.service";

const createCourse = catchAsync(async (req: Request, res: Response) => {
   const payload = req.body;
   const user = req.user!;

   const result = await CourseServices.createCourse(payload, user);

   sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Course Created Successfully",
      data: result,
   });
});

const getAllCourses = catchAsync(async (req: Request, res: Response) => {
   const { data, meta } = await CourseServices.getAllCourses(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courses Retrieved Successfully",
      data,
      meta,
   });
});

const getSingleCourse = catchAsync(async (req: Request, res: Response) => {
   const courseId = req.params.courseId as string;

   const result = await CourseServices.getSingleCourse(courseId);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course Retrieved Successfully",
      data: result,
   });
});

const updateCourse = catchAsync(async (req: Request, res: Response) => {
   const courseId = req.params.courseId as string;
   const payload = req.body;
   const user = req.user!;

   const result = await CourseServices.updateCourse(courseId, payload, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course Updated Successfully",
      data: result,
   });
});

const deleteCourse = catchAsync(async (req: Request, res: Response) => {
   const courseId = req.params.courseId as string;
   const user = req.user!;

   const result = await CourseServices.deleteCourse(courseId, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course Deleted Successfully",
      data: result,
   });
});

const addPrerequisite = catchAsync(async (req: Request, res: Response) => {
   const courseId = req.params.courseId as string;
   const payload = req.body;
   const user = req.user!;

   const result = await CourseServices.addPrerequisite(courseId, payload, user);

   sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Course Prerequisite Added Successfully",
      data: result,
   });
});

const removePrerequisite = catchAsync(async (req: Request, res: Response) => {
   const courseId = req.params.courseId as string;
   const prerequisiteCourseId = req.params.prerequisiteCourseId as string;
   const user = req.user!;

   const result = await CourseServices.removePrerequisite(courseId, prerequisiteCourseId, user);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course Prerequisite Removed Successfully",
      data: result,
   });
});

export const CourseController = {
   createCourse,
   getAllCourses,
   getSingleCourse,
   updateCourse,
   deleteCourse,
   addPrerequisite,
   removePrerequisite,
};
