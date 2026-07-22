import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createChallanSchema, updateChallanStatusSchema } from "../validators/challan.validator";
import {
  createChallan,
  listChallans,
  getChallan,
  updateChallanStatus,
} from "../controllers/challan.controller";

const router = Router();

router.use(authenticate);

router.get("/", listChallans);
router.get("/:id", getChallan);
router.post("/", authorize("ADMIN", "SALES"), validateBody(createChallanSchema), createChallan);
router.patch(
  "/:id/status",
  authorize("ADMIN", "SALES", "WAREHOUSE"),
  validateBody(updateChallanStatusSchema),
  updateChallanStatus
);

export default router;
