import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance (avoids exhausting DB connections
// during dev hot-reload).
const prisma = new PrismaClient();

export default prisma;
