import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { createMockPrisma } from "./mock-db";

function isRealDatabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url.includes("PROJECT") || url.includes("aws-0-REGION") || url.includes("mock")) {
    return false;
  }
  return true;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!isRealDatabaseUrl(connectionString)) {
    console.warn("[AI Studio] Database not connected — using seeded in-memory mock");
    return createMockPrisma();
  }

  try {
    const adapter = new PrismaPg({
      connectionString: connectionString!,
      max: 5,
      idleTimeoutMillis: 10_000,
      maxLifetimeSeconds: 60 * 15,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    });

    return new PrismaClient({ adapter });
  } catch (err) {
    console.warn("[AI Studio] Database initialization error — using mock", err);
    return createMockPrisma();
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (createClient() as unknown as PrismaClient);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

