import type {
  InitiateResult,
  PayableOrder,
  PaymentMethodId,
  PaymentProvider,
} from "./types";

/**
 * Phase 1 ships four providers that settle without any payment API. Each one
 * only decides what payment status the new order starts in:
 *
 *   COD      — rider collects cash, so nothing is owed to us yet.
 *   TRANSFER — customer sends mobile money and types the reference; an admin
 *              confirms it, which is what actually marks the order paid.
 *   WHATSAPP — payment is arranged in the chat, off-system.
 *   PICKUP   — customer pays at the counter.
 *
 * Phase 2 adds MPESA_ONLINE below. Because checkout only ever talks to this
 * interface, enabling it is a configuration change plus one class — the
 * checkout page, the order model and the admin panel do not change.
 */

class CashOnDelivery implements PaymentProvider {
  readonly id = "COD" as const;
  readonly nameKey = "pay.cod.name" as const;
  readonly descriptionKey = "pay.cod.desc" as const;
  readonly isOnline = false;

  isEnabled() {
    return true;
  }

  async initiate(): Promise<InitiateResult> {
    return { paymentStatus: "UNPAID" };
  }
}

class ManualTransfer implements PaymentProvider {
  readonly id = "TRANSFER" as const;
  readonly nameKey = "pay.transfer.name" as const;
  readonly descriptionKey = "pay.transfer.desc" as const;
  readonly isOnline = false;

  isEnabled() {
    return true;
  }

  async initiate(): Promise<InitiateResult> {
    // The customer has not sent anything yet; they are shown the till numbers
    // on the confirmation screen and submit a reference from there.
    return { paymentStatus: "UNPAID" };
  }
}

class WhatsAppHandoff implements PaymentProvider {
  readonly id = "WHATSAPP" as const;
  readonly nameKey = "pay.whatsapp.name" as const;
  readonly descriptionKey = "pay.whatsapp.desc" as const;
  readonly isOnline = false;

  isEnabled() {
    return true;
  }

  async initiate(): Promise<InitiateResult> {
    return { paymentStatus: "UNPAID" };
  }
}

class PayOnPickup implements PaymentProvider {
  readonly id = "PICKUP" as const;
  readonly nameKey = "pay.pickup.name" as const;
  readonly descriptionKey = "pay.pickup.desc" as const;
  readonly isOnline = false;

  isEnabled() {
    return true;
  }

  async initiate(): Promise<InitiateResult> {
    return { paymentStatus: "UNPAID" };
  }
}

/**
 * PHASE 2 — Vodacom M-Pesa Tanzania (Daraja / OpenAPI), or an aggregator such
 * as Selcom or ClickPesa that fronts all four networks with one contract.
 *
 * Stays disabled until MPESA_ENABLED=true and the credentials in .env are
 * filled in, so it never appears at checkout by accident.
 *
 * To finish it:
 *   1. `initiate()` — obtain a session token, encrypt the API key with the
 *      provider public key, then POST a Customer-to-Business single-stage
 *      payment. The customer gets a PIN prompt on their handset. Return
 *      { paymentStatus: "AWAITING_CONFIRMATION", externalRef: <conversationId> }.
 *   2. Handle the asynchronous result in
 *      src/app/api/payments/[provider]/callback/route.ts, which already
 *      verifies a shared secret and is wired to mark the order paid.
 *   3. Reconcile: poll transaction status for orders left awaiting confirmation
 *      longer than a few minutes, because callbacks do get lost.
 */
class MpesaOnline implements PaymentProvider {
  readonly id = "MPESA_ONLINE" as const;
  readonly nameKey = "pay.online.name" as const;
  readonly descriptionKey = "pay.online.desc" as const;
  readonly isOnline = true;

  isEnabled() {
    return (
      process.env.MPESA_ENABLED === "true" &&
      Boolean(process.env.MPESA_API_KEY) &&
      Boolean(process.env.MPESA_PUBLIC_KEY) &&
      Boolean(process.env.MPESA_SERVICE_PROVIDER_CODE)
    );
  }

  async initiate(order: PayableOrder): Promise<InitiateResult> {
    throw new Error(
      `M-Pesa online payment is not enabled (order ${order.orderNumber}). ` +
        "This is a phase 2 feature — see src/lib/payments/providers.ts.",
    );
  }
}

const ALL_PROVIDERS: PaymentProvider[] = [
  new CashOnDelivery(),
  new ManualTransfer(),
  new WhatsAppHandoff(),
  new PayOnPickup(),
  new MpesaOnline(),
];

export function getProvider(id: string): PaymentProvider | undefined {
  return ALL_PROVIDERS.find((p) => p.id === id);
}

/** Providers the customer may actually pick, in display order. */
export function enabledProviders(): PaymentProvider[] {
  return ALL_PROVIDERS.filter((p) => p.isEnabled());
}

/**
 * Disabled online providers, so checkout can show a greyed-out "coming soon"
 * row. Seeing that M-Pesa is on the way reassures customers far more than
 * hiding it does.
 */
export function comingSoonProviders(): PaymentProvider[] {
  return ALL_PROVIDERS.filter((p) => p.isOnline && !p.isEnabled());
}

export function isValidPaymentMethod(id: string): id is PaymentMethodId {
  return ALL_PROVIDERS.some((p) => p.id === id);
}
