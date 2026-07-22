import "express-async-errors"; // must be imported before routes so thrown errors in async handlers are caught
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import productRoutes from "./routes/product.routes";
import challanRoutes from "./routes/challan.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

dotenv.config();

const requiredEnv = ["DATABASE_URL", "JWT_SECRET"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`Warning: Missing environment variable ${key}`);
  }
}

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/api/products", productRoutes);
app.use("/challans", challanRoutes);
app.use("/api/challans", challanRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

export default app;

