import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { InstructorController } from "./instructor.controller";
import { UpdateInstructorProfileValidationZodSchema } from "../instructor/instructor.validation";

const router = Router();

router.get("/all-instructors", auth(Role.ADMIN), InstructorController.getAllInstructors);

router.patch(
   "/update-my-profile",
   auth(Role.INSTRUCTOR),
   validateRequest(UpdateInstructorProfileValidationZodSchema),
   InstructorController.updateInstructorProfile,
);

router.get("/public/:instructorId", InstructorController.getSingleInstructorProfile);

export const InstructorRoutes = router;
