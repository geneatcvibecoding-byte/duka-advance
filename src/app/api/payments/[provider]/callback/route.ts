import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProvider } from "@/lib/payments/providers";

/**
 * PHASE 2 — asynchronous payment result endpoint.
 *
 * M-Pesa (and every aggregator that fronts it) confirms a charge by calling
 * back rather than answering the original request. The plumbing is here and
 * inert: the route refuses everything until the matching provider is enabled,
 * so it cannot be used to mark orders paid while phase 1 is live.
 *
 * To finish it:
 *   1. Replace the shared-secret check with the provider's real scheme —
 *      Vodacom signs with your public key; Selcom uses an HMAC digest header.
 *   2. Map the provider's payload to `orderNumber` and a success flag.
 *   3. Keep the write idempotent: callbacks are retried, and a duplicate must
 *      not double-count revenue.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await context.params;
  const provider = getProvider(providerId.toUpperCase());

  if (!provider || !provider.isOnline) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 404 });
  }

  if (!provider.isEnabled()) {
    return NextResponse.json(
      { error: "This payment provider is not enabled." },
      { status: 501 },
    );
  }

  const secret = process.env.MPESA_CALLBACK_SECRET;
  if (!secret || request.headers.get("x-callback-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const orderNumber = String(payload.orderNumber ?? payload.reference ?? "");
  const succeeded = payload.status === "SUCCESS" || payload.resultCode === 0;
  const externalRef = payload.transactionId ? String(payload.transactionId) : null;

  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order reference." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Idempotency: a repeated callback for an order already settled is accepted
  // and ignored, so the gateway stops retrying without anything changing.
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: succeeded ? "PAID" : "FAILED",
      paidAt: succeeded ? new Date() : null,
      paymentRef: externalRef ?? order.paymentRef,
      status: succeeded && order.status === "PENDING" ? "CONFIRMED" : order.status,
      events: {
        create: {
          status: succeeded ? "PAID" : "FAILED",
          note: `${providerId} callback: ${succeeded ? "payment confirmed" : "payment failed"}`,
          actor: "gateway",
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
