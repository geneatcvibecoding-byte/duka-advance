"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getTranslator, resolveLocale } from "@/lib/i18n";
import { normalizePhone } from "@/lib/tz";

export type AccountState = { ok?: boolean; error?: string } | null;

export async function updateProfileAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (name.length < 2) return { error: t("error.required") };
  if (!phone) return { error: t("auth.invalidPhone") };

  // Moving to a number that already belongs to someone else would lock both
  // accounts out, since the phone number is the login identifier.
  if (phone !== user.phone) {
    const taken = await prisma.user.findUnique({ where: { phone } });
    if (taken) return { error: t("auth.phoneTaken") };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email, phone },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addAddressAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const region = String(formData.get("region") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();
  const landmark = String(formData.get("landmark") ?? "").trim() || null;

  if (!fullName || !phone || !region || !district || !street) return;

  const count = await prisma.address.count({ where: { userId: user.id } });

  await prisma.address.create({
    data: {
      userId: user.id,
      fullName,
      phone,
      region,
      district,
      street,
      landmark,
      // The first address a customer saves becomes their default.
      isDefault: count === 0,
    },
  });

  revalidatePath("/", "layout");
}

export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("addressId") ?? "");
  const address = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!address) return;

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);

  revalidatePath("/", "layout");
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("addressId") ?? "");
  // Scoped to the signed-in user so a guessed id cannot delete someone else's.
  await prisma.address.deleteMany({ where: { id, userId: user.id } });

  revalidatePath("/", "layout");
}
