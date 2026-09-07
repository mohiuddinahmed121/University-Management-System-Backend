import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type NextFunction, type Request, type Response } from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { UserRoutes } from "./app/module/user/user.route";
import { StudentRoutes } from "./app/module/student/student.route";
import { InstructorRoutes } from "./app/module/instructor/instructor.route";
import { DepartmentRoutes } from "./app/module/department/department.route";
import { ProgramRoutes } from "./app/module/program/program.route";
import { CourseRoutes } from "./app/module/course/course.route";
import { SemesterRoutes } from "./app/module/semester/semester.route";
import { SectionRoutes } from "./app/module/section/section.route";
import { RegistrationRoutes } from "./app/module/registration/registration.route";
import { ResultRoutes } from "./app/module/result/result.route";
import { PaymentRoutes } from "./app/module/payment/payment.route";

const app: Application = express();

app.use(
   cors({
      origin: config.frontend_url,
      credentials: true,
   }),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/student", StudentRoutes);
app.use("/api/v1/instructor", InstructorRoutes);
app.use("/api/v1/department", DepartmentRoutes);
app.use("/api/v1/program", ProgramRoutes);
app.use("/api/v1/course", CourseRoutes);
app.use("/api/v1/semester", SemesterRoutes);
app.use("/api/v1/section", SectionRoutes);
app.use("/api/v1/registration", RegistrationRoutes);
app.use("/api/v1/result", ResultRoutes);
app.use("/api/v1/payment", PaymentRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
   res.status(httpStatus.OK).json({
      success: true,
      message: "Welcome to University Management System Backend",
   });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
