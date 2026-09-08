import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { RegistrationController } from "./registration.controller";
import { CreateRegistrationValidationZodSchema } from "../../../app/module/registration/registration.validation";

const router = Router();

router.post(
   "/register",
   auth(Role.STUDENT),
   validateRequest(CreateRegistrationValidationZodSchema),
   RegistrationController.createRegistration,
);

router.patch("/drop/:registrationId", auth(Role.STUDENT), RegistrationController.dropRegistration);

router.get("/my-registrations", auth(Role.STUDENT), RegistrationController.getMyRegistrations);

router.get("/all-registrations", auth(Role.ADMIN), RegistrationController.getAllRegistrations);

router.get(
   "/:registrationId",
   auth(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN),
   RegistrationController.getSingleRegistration,
);

export const RegistrationRoutes = router;
