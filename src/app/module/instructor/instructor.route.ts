import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { InstructorController } from "./instructor.controller";
import { UpdateInstructorProfileValidationZodSchema } from "./instructor.validation";

const router = Router();

router.post(
   "/apply-as-instructor",
   upload.fields([
      {
         name: "resume",
         maxCount: 1,
      },
   ]),
   InstructorController.applyAsInstructor,
);

router.post("/apply-as-instructor/verify-email", InstructorController.verifyInstructorEmail);

router.post("/approve-instructor", auth(Role.ADMIN), InstructorController.approveInstructor);

router.get("/all-instructors", auth(Role.ADMIN), InstructorController.getAllInstructors);

router.patch(
   "/update-my-profile",
   auth(Role.INSTRUCTOR),
   validateRequest(UpdateInstructorProfileValidationZodSchema),
   InstructorController.updateInstructorProfile,
);

router.get("/public/all-instructors", InstructorController.getAllInstructors);

router.get("/public/:instructorId", InstructorController.getSingleInstructorProfile);

export const InstructorRoutes = router;
