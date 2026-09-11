import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ProgramController } from "./program.controller";
import {
   CreateProgramValidationZodSchema,
   UpdateProgramValidationZodSchema,
} from "./program.validation";

const router = Router();

router.post(
   "/create-program",
   auth(Role.ADMIN),
   validateRequest(CreateProgramValidationZodSchema),
   ProgramController.createProgram,
);

router.get("/all-programs", ProgramController.getAllPrograms);

router.get("/:programId", ProgramController.getSingleProgram);

router.patch(
   "/update-program/:programId",
   auth(Role.ADMIN),
   validateRequest(UpdateProgramValidationZodSchema),
   ProgramController.updateProgram,
);

router.delete("/:programId", auth(Role.ADMIN), ProgramController.deleteProgram);

export const ProgramRoutes = router;
