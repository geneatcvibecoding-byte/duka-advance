import type { TranslationKey } from "@/lib/i18n";

export type PaymentMethodId =
  | "COD"
  | "TRANSFER"
  | "WHATSAPP"
  | "PICKUP"
  | "MPESA_ONLINE";

export type PaymentStatus =
  | "UNPAID"
  | "AWAITING_CONFIRMATION"
  | "PAID"
  | "REFUNDED"
  | "FAILED";

/** The minimum an order must expose for a provider to act on it. */
export type PayableOrder = {
  id: string;
  orderNumber: string;
  total: number;
  customerPhone: string;
  customerName: string;
};

export type InitiateResult = {
  /** Status the order should carry immediately after checkout. */
  paymentStatus: PaymentStatus;
  /**
   * Set by online providers that need the customer to complete a step
   * elsewhere. Phase 1 providers all leave this undefined.
   */
  redirectUrl?: string;
  /** Provider-side identifier, stored for reconciliation. */
  externalRef?: string;
};

export interface PaymentProvider {
  readonly id: PaymentMethodId;
  readonly nameKey: TranslationKey;
  readonly descriptionKey: TranslationKey;

  /**
   * True when the provider moves money through an API. Offline providers are
   * settled by a human — cash to a rider, a till number, a shop counter.
   */
  readonly isOnline: boolean;

  /** Whether the provider can be offered right now. */
  isEnabled(): boolean;

  /**
   * Called once, immediately after the order row is written. Offline providers
   * only decide a starting status; online providers will additionally open a
   * charge with the gateway and return a redirect.
   */
  initiate(order: PayableOrder): Promise<InitiateResult>;
}
