import { Router } from "express";
import { signup, login, refreshToken, logout, getCurrentUser, createRole, getAllRoles, getUserByEmployeeId, updateUserRole, updateRole} from "../controllers/authController";
import { checkWriteKey } from "@middlewares/checkWriteKey";
import { authMiddleware, authorize } from "@middlewares/auth";

const router = Router();

router.post("/signup",checkWriteKey ,signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/me", getCurrentUser);

router.post("/roles", authMiddleware, authorize("roles:manage"), createRole);
router.put("/roles",authMiddleware,authorize("roles:manage"),updateRole);
router.get("/roles", authMiddleware, authorize("roles:manage"), getAllRoles);

// --- NEW: User Management for SuperAdmin ---
router.get("/users/:employeeId", authMiddleware, authorize("users:manage"), getUserByEmployeeId);
router.patch("/users/:id/role", authMiddleware, authorize("users:manage"), updateUserRole);

export default router;
