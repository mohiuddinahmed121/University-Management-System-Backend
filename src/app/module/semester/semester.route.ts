import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SemesterController } from "./semester.controller";
import {
   CreateSemesterValidationZodSchema,
   UpdateSemesterStatusValidationZodSchema,
   UpdateSemesterValidationZodSchema,
} from "./semester.validation";

const router = Router();

router.post(
   "/create-semester",
   auth(Role.ADMIN),
   validateRequest(CreateSemesterValidationZodSchema),
   SemesterController.createSemester,
);

router.get("/all-semesters", SemesterController.getAllSemesters);

router.get("/:semesterId", SemesterController.getSingleSemester);

router.patch(
   "/update-semester/:semesterId",
   auth(Role.ADMIN),
   validateRequest(UpdateSemesterValidationZodSchema),
   SemesterController.updateSemester,
);

router.patch(
   "/update-status/:semesterId",
   auth(Role.ADMIN),
   validateRequest(UpdateSemesterStatusValidationZodSchema),
   SemesterController.updateSemesterStatus,
);

export const SemesterRoutes = router;
