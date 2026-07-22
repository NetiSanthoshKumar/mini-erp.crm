import prisma from "../config/db";

// Generates challan numbers like CH-2026-0001, sequential per calendar year.
export async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const last = await prisma.challan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: "desc" },
  });

  let nextSeq = 1;
  if (last) {
    const lastSeq = parseInt(last.challanNumber.replace(prefix, ""), 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}
