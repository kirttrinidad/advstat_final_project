import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import { getSafeDatabaseDiagnostic } from "@/lib/database-diagnostics";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaNeon(
      { connectionString },
      {
        onPoolError: (error) => {
          console.error("[prisma/neon] Pool error.", getSafeDatabaseDiagnostic(error));
        },
        onConnectionError: (error) => {
          console.error("[prisma/neon] Connection error.", getSafeDatabaseDiagnostic(error));
        },
      },
    );
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}