import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@demo.com" },
      update: {},
      create: { name: "Admin User", email: "admin@demo.com", passwordHash: password, role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "sales@demo.com" },
      update: {},
      create: { name: "Sales User", email: "sales@demo.com", passwordHash: password, role: "SALES" },
    }),
    prisma.user.upsert({
      where: { email: "warehouse@demo.com" },
      update: {},
      create: { name: "Warehouse User", email: "warehouse@demo.com", passwordHash: password, role: "WAREHOUSE" },
    }),
    prisma.user.upsert({
      where: { email: "accounts@demo.com" },
      update: {},
      create: { name: "Accounts User", email: "accounts@demo.com", passwordHash: password, role: "ACCOUNTS" },
    }),
  ]);

  const product1 = await prisma.product.upsert({
    where: { sku: "PRD-001" },
    update: {},
    create: {
      name: "Steel Pipe 2-inch",
      sku: "PRD-001",
      category: "Plumbing",
      unitPrice: 450.0,
      currentStock: 200,
      minStockAlertQty: 20,
      location: "Warehouse A - Rack 3",
    },
  });

  await prisma.product.upsert({
    where: { sku: "PRD-002" },
    update: {},
    create: {
      name: "PVC Connector 2-inch",
      sku: "PRD-002",
      category: "Plumbing",
      unitPrice: 35.0,
      currentStock: 500,
      minStockAlertQty: 50,
      location: "Warehouse A - Rack 5",
    },
  });

  await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      name: "Ramesh Traders",
      mobile: "9876543210",
      email: "ramesh@traders.com",
      businessName: "Ramesh Traders Pvt Ltd",
      gstNumber: "29ABCDE1234F1Z5",
      customerType: "WHOLESALE",
      address: "Market Road, Hyderabad",
      status: "ACTIVE",
      createdById: sales.id,
    },
  });

  console.log("Seed complete.");
  console.log("Login credentials (all use password: Password123!):");
  console.log(`  Admin:     ${admin.email}`);
  console.log(`  Sales:     ${sales.email}`);
  console.log(`  Warehouse: ${warehouse.email}`);
  console.log(`  Accounts:  ${accounts.email}`);
  console.log(`Sample product SKU: ${product1.sku}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
