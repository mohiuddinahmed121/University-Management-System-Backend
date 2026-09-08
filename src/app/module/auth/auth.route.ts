import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import { Role } from "../../../../generated/prisma/client";

const router = Router();

router.post(
   "/register",
   validateRequest(UserValidation.StudentRegistrationZodSchema),
   AuthController.registerStudent,
);

router.post(
   "/verify-email",
   validateRequest(UserValidation.StudentEmailVerifyZodSchema),
   AuthController.verifyStudentEmail,
);

router.post("/login", validateRequest(UserValidation.LoginZodSchema), AuthController.loginUser);

router.get("/me", auth(Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT), AuthController.getMe);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/google", AuthController.googleLogin);

router.post(
   "/forgot-password",
   validateRequest(UserValidation.ForgotPasswordZodSchema),
   AuthController.forgotPassword,
);

router.post(
   "/reset-password",
   validateRequest(UserValidation.ResetPasswordZodSchema),
   AuthController.resetPassword,
);

export const AuthRoutes = router;
