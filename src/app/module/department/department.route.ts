import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { DepartmentController } from "./department.controller";
import {
   CreateDepartmentValidationZodSchema,
   UpdateDepartmentValidationZodSchema,
} from "./department.validation";

const router = Router();

router.post(
   "/create-department",
   auth(Role.ADMIN),
   validateRequest(CreateDepartmentValidationZodSchema),
   DepartmentController.createDepartment,
);

router.get("/all-departments", DepartmentController.getAllDepartments);

router.get("/:departmentId", DepartmentController.getSingleDepartment);

router.patch(
   "/update-department/:departmentId",
   auth(Role.ADMIN),
   validateRequest(UpdateDepartmentValidationZodSchema),
   DepartmentController.updateDepartment,
);

router.delete("/:departmentId", auth(Role.ADMIN), DepartmentController.deleteDepartment);

export const DepartmentRoutes = router;
