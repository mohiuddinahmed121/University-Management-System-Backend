import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import {
   CreateInstructorValidationZodSchema,
   UpdateUserStatusValidationZodSchema,
} from "./admin.validation";

const router = Router();

// router.post(
//    "/create-instructor",
//    auth(Role.ADMIN),
//    validateRequest(CreateInstructorValidationZodSchema),
//    AdminController.createInstructor,
// );

router.get("/users", auth(Role.ADMIN), AdminController.getAllUsers);

router.get("/users/:userId", auth(Role.ADMIN), AdminController.getSingleUser);

router.patch(
   "/users/:userId/status",
   auth(Role.ADMIN),
   validateRequest(UpdateUserStatusValidationZodSchema),
   AdminController.updateUserStatus,
);

export const AdminRoutes = router;
