// import type { Request, Response } from "express";
// import httpStatus from "http-status";
// import { catchAsync } from "../../utils/catchAsync";
// import { sendResponse } from "../../utils/sendResponse";
// import { DepartmentServices } from "../department/department.service";

// const createDepartment = catchAsync(async (req: Request, res: Response) => {
//    const payload = req.body;
//    const user = req.user!;

//    const result = await DepartmentServices.createDepartment(payload, user);

//    sendResponse(res, {
//       statusCode: httpStatus.CREATED,
//       success: true,
//       message: "Department Created Successfully",
//       data: result,
//    });
// });

// const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
//    const { data, meta } = await DepartmentServices.getAllDepartments(req.query);

//    sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Departments Retrieved Successfully",
//       data,
//       meta,
//    });
// });

// const getSingleDepartment = catchAsync(async (req: Request, res: Response) => {
//    const departmentId = req.params.departmentId as string;

//    const result = await DepartmentServices.getSingleDepartment(departmentId);

//    sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Department Retrieved Successfully",
//       data: result,
//    });
// });

// const updateDepartment = catchAsync(async (req: Request, res: Response) => {
//    const departmentId = req.params.departmentId as string;
//    const payload = req.body;
//    const user = req.user!;

//    const result = await DepartmentServices.updateDepartment(departmentId, payload, user);

//    sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Department Updated Successfully",
//       data: result,
//    });
// });

// const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
//    const departmentId = req.params.departmentId as string;
//    const user = req.user!;

//    const result = await DepartmentServices.deleteDepartment(departmentId, user);

//    sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Department Deleted Successfully",
//       data: result,
//    });
// });

// export const DepartmentController = {
//    createDepartment,
//    getAllDepartments,
//    getSingleDepartment,
//    updateDepartment,
//    deleteDepartment,
// };
