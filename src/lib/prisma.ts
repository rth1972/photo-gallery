import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// In production suppress all Prisma query/info logs; in dev keep warnings + errors only
const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? []
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };
