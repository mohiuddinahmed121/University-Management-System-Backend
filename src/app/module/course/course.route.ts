import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CourseController } from "./course.controller";
import {
   CreateCoursePrerequisiteValidationZodSchema,
   CreateCourseValidationZodSchema,
   UpdateCourseValidationZodSchema,
} from "./course.validation";

const router = Router();

router.post(
   "/create-course",
   auth(Role.ADMIN),
   validateRequest(CreateCourseValidationZodSchema),
   CourseController.createCourse,
);

router.get("/all-courses", CourseController.getAllCourses);

router.get("/:courseId", CourseController.getSingleCourse);

router.patch(
   "/update-course/:courseId",
   auth(Role.ADMIN),
   validateRequest(UpdateCourseValidationZodSchema),
   CourseController.updateCourse,
);

router.delete("/:courseId", auth(Role.ADMIN), CourseController.deleteCourse);

router.post(
   "/:courseId/prerequisite",
   auth(Role.ADMIN),
   validateRequest(CreateCoursePrerequisiteValidationZodSchema),
   CourseController.addPrerequisite,
);

router.delete(
   "/:courseId/prerequisite/:prerequisiteCourseId",
   auth(Role.ADMIN),
   CourseController.removePrerequisite,
);

export const CourseRoutes = router;
