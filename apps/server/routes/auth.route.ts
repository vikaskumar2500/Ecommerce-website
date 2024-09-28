import express from "express";

import { logout, signin, signup, refreshToken, getProfile } from "../controllers/auth.controller";
import { protectRoute } from "../middleware/auth.middleware";
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);

export default router;
