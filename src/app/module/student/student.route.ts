import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { StudentController } from "./student.controller";
import { UpdateStudentProfileValidationZodSchema } from "./student.validation";

const router = Router();

router.get("/all-students", auth(Role.ADMIN), StudentController.getAllStudents);

router.get("/my-profile", auth(Role.STUDENT), StudentController.getMyProfile);

router.patch(
   "/update-my-profile",
   auth(Role.STUDENT),
   validateRequest(UpdateStudentProfileValidationZodSchema),
   StudentController.updateStudentProfile,
);

router.get("/public/:studentId", auth(Role.ADMIN), StudentController.getSingleStudentProfile);

export const StudentRoutes = router;
