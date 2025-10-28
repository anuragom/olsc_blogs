import { Router } from "express";
import { signup, login, refreshToken, logout, getCurrentUser } from "../controllers/authController";
import { checkWriteKey } from "@middlewares/checkWriteKey";

const router = Router();

router.post("/signup",checkWriteKey ,signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/me", getCurrentUser);

export default router;
