import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  createCustomerSchema,
  updateCustomerSchema,
  addFollowUpSchema,
} from "../validators/customer.validator";
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  addFollowUp,
} from "../controllers/customer.controller";

const router = Router();

router.use(authenticate); // all customer routes require login

router.get("/", listCustomers);
router.get("/:id", getCustomer);
router.post("/", authorize("ADMIN", "SALES"), validateBody(createCustomerSchema), createCustomer);
router.put("/:id", authorize("ADMIN", "SALES"), validateBody(updateCustomerSchema), updateCustomer);
router.post("/:id/follow-ups", authorize("ADMIN", "SALES"), validateBody(addFollowUpSchema), addFollowUp);

export default router;
