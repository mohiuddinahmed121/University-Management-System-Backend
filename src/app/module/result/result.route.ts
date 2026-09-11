import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ResultController } from "./result.controller";
import {
   SubmitResultValidationZodSchema,
   UpdateResultValidationZodSchema,
} from "./result.validation";

const router = Router();

router.post(
   "/submit",
   auth("INSTRUCTOR", "ADMIN"),
   validateRequest(SubmitResultValidationZodSchema),
   ResultController.submitResult,
);

router.patch(
   "/update/:resultId",
   auth("INSTRUCTOR", "ADMIN"),
   validateRequest(UpdateResultValidationZodSchema),
   ResultController.updateResult,
);

router.get("/my-results", auth("STUDENT"), ResultController.getMyResults);

router.get("/all-results", auth("ADMIN"), ResultController.getAllResults);

router.get("/:resultId", auth("STUDENT", "INSTRUCTOR", "ADMIN"), ResultController.getSingleResult);

export const ResultRoutes = router;
