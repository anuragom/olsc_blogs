import { Router } from "express";
import { signup, login, refreshToken, logout, getCurrentUser } from "../controllers/authController";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/me", getCurrentUser);

export default router;
