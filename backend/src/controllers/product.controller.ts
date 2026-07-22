import { Request, Response } from "express";
import prisma from "../config/db";
import { ApiError } from "../utils/ApiError";

export async function createProduct(req: Request, res: Response) {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json(product);
}

export async function listProducts(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const search = String(req.query.search ?? "").trim();
  const lowStockOnly = req.query.lowStock === "true";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  const [allMatching, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: lowStockOnly ? undefined : (page - 1) * limit,
      take: lowStockOnly ? undefined : limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Low-stock filtering happens in-app since it compares two columns
  // (currentStock vs minStockAlertQty), which Prisma can't express directly.
  const items = lowStockOnly
    ? allMatching.filter((p) => p.currentStock <= p.minStockAlertQty)
    : allMatching;

  res.json({
    items,
    pagination: { page, limit, total: lowStockOnly ? items.length : total },
  });
}

export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const exists = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new ApiError(404, "Product not found");

  const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
  res.json(product);
}

// Manual stock adjustment (separate from the automatic deduction that
// happens when a sales challan is confirmed).
export async function recordStockMovement(req: Request, res: Response) {
  const { quantity, movementType, reason } = req.body;

  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new ApiError(404, "Product not found");

  const delta = movementType === "IN" ? quantity : -quantity;
  const newStock = product.currentStock + delta;
  if (newStock < 0) {
    throw new ApiError(400, `Insufficient stock. Current: ${product.currentStock}, requested OUT: ${quantity}`);
  }

  const [movement, updatedProduct] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity,
        movementType,
        reason,
        createdById: req.user!.id,
      },
    }),
    prisma.product.update({
      where: { id: product.id },
      data: { currentStock: newStock },
    }),
  ]);

  res.status(201).json({ movement, product: updatedProduct });
}
