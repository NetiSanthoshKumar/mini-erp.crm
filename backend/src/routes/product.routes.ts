import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  createProductSchema,
  updateProductSchema,
  stockMovementSchema,
} from "../validators/product.validator";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  recordStockMovement,
} from "../controllers/product.controller";

const router = Router();

router.use(authenticate);

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", authorize("ADMIN", "WAREHOUSE"), validateBody(createProductSchema), createProduct);
router.put("/:id", authorize("ADMIN", "WAREHOUSE"), validateBody(updateProductSchema), updateProduct);
router.post(
  "/:id/stock-movements",
  authorize("ADMIN", "WAREHOUSE"),
  validateBody(stockMovementSchema),
  recordStockMovement
);

export default router;
