import { Request, Response } from "express";
import prisma from "../config/db";
import { ApiError } from "../utils/ApiError";
import { generateChallanNumber } from "../utils/challanNumber";

// Shared helper: given a Prisma transaction client, deducts stock for each
// challan item and writes a stock movement audit row. Throws if any product
// would go negative — the whole transaction rolls back automatically.
async function deductStockForChallan(tx: any, challanId: string, userId: string) {
  const items = await tx.challanItem.findMany({ where: { challanId } });

  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product) throw new ApiError(400, `Product ${item.productName} no longer exists`);
    if (product.currentStock < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for "${product.name}". Available: ${product.currentStock}, requested: ${item.quantity}`
      );
    }

    await tx.product.update({
      where: { id: product.id },
      data: { currentStock: product.currentStock - item.quantity },
    });

    await tx.stockMovement.create({
      data: {
        productId: product.id,
        quantity: item.quantity,
        movementType: "OUT",
        reason: `Sales challan ${challanId}`,
        createdById: userId,
      },
    });
  }
}

// Reverses deductStockForChallan — used when a CONFIRMED challan is cancelled.
async function restockForChallan(tx: any, challanId: string, userId: string) {
  const items = await tx.challanItem.findMany({ where: { challanId } });

  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product) continue; // product deleted since — nothing to restock against

    await tx.product.update({
      where: { id: product.id },
      data: { currentStock: product.currentStock + item.quantity },
    });

    await tx.stockMovement.create({
      data: {
        productId: product.id,
        quantity: item.quantity,
        movementType: "IN",
        reason: `Cancelled challan ${challanId}`,
        createdById: userId,
      },
    });
  }
}

export async function createChallan(req: Request, res: Response) {
  const { customerId, status, items } = req.body as {
    customerId: string;
    status: "DRAFT" | "CONFIRMED";
    items: { productId: string; quantity: number }[];
  };

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new ApiError(404, "Customer not found");

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    throw new ApiError(400, "One or more products could not be found");
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  const challanNumber = await generateChallanNumber();
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  const challan = await prisma.$transaction(async (tx) => {
    const created = await tx.challan.create({
      data: {
        challanNumber,
        customerId,
        totalQuantity,
        status: "DRAFT", // always created as DRAFT first, then optionally confirmed below
        createdById: req.user!.id,
        items: {
          create: items.map((i) => {
            const p = productMap.get(i.productId)!;
            return {
              productId: p.id,
              productName: p.name,
              productSku: p.sku,
              unitPrice: p.unitPrice,
              quantity: i.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    if (status === "CONFIRMED") {
      await deductStockForChallan(tx, created.id, req.user!.id);
      return tx.challan.update({
        where: { id: created.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
        include: { items: true, customer: true },
      });
    }

    return created;
  });

  res.status(201).json(challan);
}

export async function listChallans(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const status = req.query.status as string | undefined;
  const customerId = req.query.customerId as string | undefined;

  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [items, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { customer: { select: { name: true, businessName: true } }, items: true },
    }),
    prisma.challan.count({ where }),
  ]);

  res.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function getChallan(req: Request, res: Response) {
  const challan = await prisma.challan.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: true, createdBy: { select: { name: true } } },
  });
  if (!challan) throw new ApiError(404, "Challan not found");
  res.json(challan);
}

// Handles DRAFT -> CONFIRMED (deducts stock) and DRAFT/CONFIRMED -> CANCELLED
// (restocks only if it had actually been confirmed).
export async function updateChallanStatus(req: Request, res: Response) {
  const { status } = req.body as { status: "CONFIRMED" | "CANCELLED" };

  const challan = await prisma.challan.findUnique({ where: { id: req.params.id } });
  if (!challan) throw new ApiError(404, "Challan not found");
  if (challan.status === "CANCELLED") throw new ApiError(400, "Challan is already cancelled");
  if (challan.status === "CONFIRMED" && status === "CONFIRMED") {
    throw new ApiError(400, "Challan is already confirmed");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (status === "CONFIRMED") {
      await deductStockForChallan(tx, challan.id, req.user!.id);
      return tx.challan.update({
        where: { id: challan.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
        include: { items: true, customer: true },
      });
    }

    // status === CANCELLED
    if (challan.status === "CONFIRMED") {
      await restockForChallan(tx, challan.id, req.user!.id);
    }
    return tx.challan.update({
      where: { id: challan.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: { items: true, customer: true },
    });
  });

  res.json(updated);
}
