import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post("/create-payment", auth(Role.STUDENT), PaymentController.createPayment);

router.get("/callback", PaymentController.paymentCallback);

router.get("/my-payments", auth(Role.STUDENT), PaymentController.getMyPayments);

router.get("/all-payments", auth(Role.ADMIN), PaymentController.getAllPayments);

router.get("/:paymentId", auth(Role.STUDENT, Role.ADMIN), PaymentController.getSinglePayment);

export const PaymentRoutes = router;
