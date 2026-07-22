import { Request, Response } from "express";
import prisma from "../config/db";
import { ApiError } from "../utils/ApiError";

export async function createCustomer(req: Request, res: Response) {
  const customer = await prisma.customer.create({
    data: { ...req.body, createdById: req.user!.id },
  });
  res.status(201).json(customer);
}

export async function listCustomers(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const search = String(req.query.search ?? "").trim();
  const status = req.query.status as string | undefined;
  const customerType = req.query.customerType as string | undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (customerType) where.customerType = customerType;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getCustomer(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      followUps: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
      challans: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!customer) throw new ApiError(404, "Customer not found");
  res.json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const exists = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new ApiError(404, "Customer not found");

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(customer);
}

export async function addFollowUp(req: Request, res: Response) {
  const exists = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new ApiError(404, "Customer not found");

  const followUp = await prisma.followUp.create({
    data: {
      customerId: req.params.id,
      note: req.body.note,
      createdById: req.user!.id,
    },
  });
  res.status(201).json(followUp);
}
