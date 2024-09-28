import express from "express";
import {
  checkoutSuccess,
  createCheckoutSession,
} from "../controllers/payment.controller";
import { protectRoute } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);

router.post("/checkout-success", protectRoute, checkoutSuccess);

export default router;
