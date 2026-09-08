import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AnalyticsController } from "./analytics.controller";

const router = Router();

router.get("/student-analytics", auth(Role.STUDENT), AnalyticsController.getStudentAnalytics);

router.get(
   "/instructor-analytics",
   auth(Role.INSTRUCTOR),
   AnalyticsController.getInstructorAnalytics,
);

router.get("/admin-analytics", auth(Role.ADMIN), AnalyticsController.getAdminAnalytics);

export const AnalyticsRoutes = router;
