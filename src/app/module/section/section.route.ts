import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SectionController } from "./section.controller";
import {
   CreateSectionValidationZodSchema,
   UpdateSectionValidationZodSchema,
} from "./section.validation";

const router = Router();

router.post(
   "/create-section",
   auth(Role.ADMIN),
   validateRequest(CreateSectionValidationZodSchema),
   SectionController.createSection,
);

router.get("/my-sections", auth(Role.INSTRUCTOR), SectionController.getMySections);

router.get("/all-sections", auth(Role.ADMIN), SectionController.getAllSections);

router.get(
   "/:sectionId",
   auth(Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT),
   SectionController.getSectionById,
);

router.patch(
   "/update-section/:sectionId",
   auth(Role.ADMIN),
   validateRequest(UpdateSectionValidationZodSchema),
   SectionController.updateSection,
);

router.patch("/close-section/:sectionId", auth(Role.ADMIN), SectionController.closeSection);

router.delete("/:sectionId", auth(Role.ADMIN), SectionController.deleteSection);

export const SectionRoutes = router;
