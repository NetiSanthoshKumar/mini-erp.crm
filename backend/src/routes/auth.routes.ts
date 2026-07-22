import { Router } from "express";
import { login, register, me } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post("/login", validateBody(loginSchema), login);
router.post("/register", authenticate, authorize("ADMIN"), validateBody(registerSchema), register);
router.get("/me", authenticate, me);

export default router;
