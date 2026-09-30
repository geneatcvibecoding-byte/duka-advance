/**
 * Production seed. Run ONCE against the live database:
 *
 *   npm run db:seed:prod
 *
 * Unlike prisma/seed.ts this creates no demo catalogue and no known password.
 * It writes only what the shop cannot start without:
 *   - the 31 Tanzanian delivery zones
 *   - a shop settings row
 *   - one admin account, taken from environment variables
 *
 * It is idempotent: running it again updates the delivery zones and leaves an
 * existing admin's password alone.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DELIVERY_ZONES } from "./delivery-zones";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Set ADMIN_NAME, ADMIN_PHONE and ADMIN_PASSWORD before running the production seed.`,
    );
  }
  return value;
}

/** Same normalisation the app uses, duplicated so the seed has no app imports. */
function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  let local: string;
  if (digits.startsWith("255")) local = digits.slice(3);
  else if (digits.startsWith("0")) local = digits.slice(1);
  else local = digits;

  if (!/^[67]\d{8}$/.test(local)) {
    throw new Error(
      `ADMIN_PHONE "${input}" is not a valid Tanzanian mobile number (e.g. 0712345678).`,
    );
  }
  return `+255${local}`;
}

async function main() {
  const adminName = requireEnv("ADMIN_NAME");
  const adminPhone = normalizePhone(requireEnv("ADMIN_PHONE"));
  const adminPassword = requireEnv("ADMIN_PASSWORD");

  if (adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  console.log("Delivery zones…");
  for (const [region, fee, etaMinDays, etaMaxDays] of DELIVERY_ZONES) {
    const position = DELIVERY_ZONES.findIndex(([r]) => r === region);
    await prisma.deliveryZone.upsert({
      where: { region },
      create: { region, fee, etaMinDays, etaMaxDays, position },
      update: { fee, etaMinDays, etaMaxDays, position },
    });
  }

  console.log("Shop settings…");
  const existingSettings = await prisma.shopSettings.findUnique({
    where: { id: "shop" },
  });

  if (existingSettings) {
    console.log("  already configured — left untouched");
  } else {
    // Deliberately blank contact details: the shop owner fills these in from
    // Admin → Settings. Shipping placeholder till numbers would be worse than
    // shipping none, because a customer might actually send money to them.
    await prisma.shopSettings.create({
      data: {
        id: "shop",
        nameEn: process.env.SHOP_NAME ?? "Duka",
        nameSw: process.env.SHOP_NAME ?? "Duka",
        taglineEn: "Genuine products, delivered across Tanzania",
        taglineSw: "Bidhaa halisi, zinafikishwa Tanzania nzima",
        phone: adminPhone,
        whatsapp: adminPhone,
        email: process.env.SHOP_EMAIL ?? "",
        addressLine: "",
        freeDeliveryOver: null,
      },
    });
  }

  console.log("Admin account…");
  const existingAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });

  if (existingAdmin) {
    // Never silently reset a password that is already in use.
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { role: "ADMIN", isActive: true },
    });
    console.log(`  ${adminPhone} already exists — promoted to admin, password unchanged`);
  } else {
    await prisma.user.create({
      data: {
        name: adminName,
        phone: adminPhone,
        email: process.env.ADMIN_EMAIL ?? null,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "ADMIN",
      },
    });
    console.log(`  created admin ${adminPhone}`);
  }

  const productCount = await prisma.product.count();
  console.log("\nProduction seed complete.");
  console.log(`  Delivery zones: ${DELIVERY_ZONES.length}`);
  console.log(`  Products: ${productCount} (add them from the admin panel)`);
  console.log("\nNext: sign in at /en/admin and fill in Settings → payment details.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
