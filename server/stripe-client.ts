import crypto from "crypto";
import type { RideOffer, RideReservation } from "@shared/schema";

const STRIPE_API = "https://api.stripe.com/v1";

type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_status?: string;
  status?: string;
  metadata?: Record<string, string>;
  payment_intent?: string | {
    id: string;
    latest_charge?: string | { id: string };
    status?: string;
  } | null;
};

type StripeAccount = {
  id: string;
  details_submitted?: boolean;
  payouts_enabled?: boolean;
  charges_enabled?: boolean;
  country?: string;
};

type StripeTransfer = {
  id: string;
  amount: number;
  currency: string;
  destination: string;
};

type StripeRefund = {
  id: string;
  status?: string;
  payment_intent?: string | null;
  charge?: string | null;
};

class BVSBusStripeClient {
  isConfigured() {
    const key = process.env.STRIPE_SECRET_KEY || "";
    return key.startsWith("sk_test_") || key.startsWith("rk_test_");
  }

  assertSandboxConfigured() {
    const key = process.env.STRIPE_SECRET_KEY || "";
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) {
      throw new Error("BVSBus Stripe integration is sandbox-only and refuses live Stripe keys");
    }
    if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
      throw new Error("STRIPE_SECRET_KEY must be a Stripe test-mode key");
    }
    return key;
  }

  async createCheckoutSession(input: {
    reservation: RideReservation;
    offer: RideOffer;
    passengerEmail?: string;
    baseUrl: string;
  }) {
    const { reservation, offer, passengerEmail, baseUrl } = input;
    const totalCents = toMinorUnits(reservation.total);
    const transferGroup = transferGroupFor(reservation.id);

    const session = await this.request<StripeCheckoutSession>("/checkout/sessions", "POST", {
      mode: "payment",
      success_url: `${baseUrl}/trips?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/trips?payment=cancelled&reservation=${reservation.id}`,
      client_reference_id: String(reservation.id),
      customer_email: passengerEmail || undefined,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: {
        reservation_id: String(reservation.id),
        offer_id: String(offer.id),
        passenger_id: String(reservation.passengerId),
        driver_id: String(offer.driverId),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: reservation.currency.toLowerCase(),
            unit_amount: totalCents,
            product_data: {
              name: `BVSBus: ${offer.origin} → ${offer.destination}`,
              description: `${reservation.seats} seat${reservation.seats === 1 ? "" : "s"} · ride contribution ${reservation.rideSubtotal.toFixed(2)} ${reservation.currency} + BVSBus fee ${reservation.serviceFee.toFixed(2)} ${reservation.currency}`,
            },
          },
        },
      ],
      payment_intent_data: {
        transfer_group: transferGroup,
        metadata: {
          reservation_id: String(reservation.id),
          offer_id: String(offer.id),
          passenger_id: String(reservation.passengerId),
          driver_id: String(offer.driverId),
          bvsbus_service_fee_minor: String(toMinorUnits(reservation.serviceFee)),
          driver_share_minor: String(toMinorUnits(reservation.rideSubtotal)),
        },
      },
    });

    if (!session.url) throw new Error("Stripe Checkout did not return a redirect URL");
    return session;
  }

  async retrieveCheckoutSession(sessionId: string) {
    return this.request<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}`, "GET", {
      expand: ["payment_intent.latest_charge"],
    });
  }

  async createExpressAccount(input: {
    driverId: number;
    driverName: string;
    email?: string;
    country?: string;
  }) {
    return this.request<StripeAccount>("/accounts", "POST", {
      type: "express",
      country: input.country || "DE",
      email: input.email || undefined,
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        bvsbus_driver_id: String(input.driverId),
        bvsbus_driver_name: input.driverName,
      },
    });
  }

  async retrieveAccount(accountId: string) {
    return this.request<StripeAccount>(`/accounts/${encodeURIComponent(accountId)}`, "GET");
  }

  async createAccountLink(input: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }) {
    return this.request<{ object: string; created: number; expires_at: number; url: string }>("/account_links", "POST", {
      account: input.accountId,
      refresh_url: input.refreshUrl,
      return_url: input.returnUrl,
      type: "account_onboarding",
    });
  }

  async createExpressLoginLink(accountId: string) {
    return this.request<{ object: string; created: number; url: string }>(
      `/accounts/${encodeURIComponent(accountId)}/login_links`,
      "POST",
    );
  }

  async createTransfer(input: {
    reservation: RideReservation;
    destination: string;
  }) {
    if (!input.reservation.chargeId) {
      throw new Error("Cannot transfer driver funds before the Stripe charge is known");
    }

    return this.request<StripeTransfer>("/transfers", "POST", {
      amount: toMinorUnits(input.reservation.rideSubtotal),
      currency: input.reservation.currency.toLowerCase(),
      destination: input.destination,
      source_transaction: input.reservation.chargeId,
      transfer_group: transferGroupFor(input.reservation.id),
      metadata: {
        reservation_id: String(input.reservation.id),
        offer_id: String(input.reservation.offerId),
        passenger_id: String(input.reservation.passengerId),
      },
    });
  }

  async createRefund(reservation: RideReservation) {
    if (!reservation.paymentIntentId && !reservation.chargeId) {
      throw new Error("Reservation has no Stripe payment reference to refund");
    }

    return this.request<StripeRefund>("/refunds", "POST", {
      payment_intent: reservation.paymentIntentId || undefined,
      charge: reservation.paymentIntentId ? undefined : reservation.chargeId || undefined,
      metadata: {
        reservation_id: String(reservation.id),
        offer_id: String(reservation.offerId),
        reason_context: "bvsbus_ride_cancelled",
      },
    });
  }

  verifyWebhook(rawBody: Buffer, signatureHeader: string, toleranceSeconds = 300) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");

    const parts = signatureHeader.split(",").map((part) => part.trim());
    const timestampPart = parts.find((part) => part.startsWith("t="));
    const signatures = parts
      .filter((part) => part.startsWith("v1="))
      .map((part) => part.slice(3));

    const timestamp = Number(timestampPart?.slice(2));
    if (!Number.isFinite(timestamp) || signatures.length === 0) {
      throw new Error("Invalid Stripe webhook signature header");
    }

    const age = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
    if (age > toleranceSeconds) throw new Error("Stripe webhook timestamp is outside tolerance");

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody.toString("utf8")}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected, "hex");
    const valid = signatures.some((signature) => {
      try {
        const signatureBuffer = Buffer.from(signature, "hex");
        return signatureBuffer.length === expectedBuffer.length &&
          crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
      } catch {
        return false;
      }
    });

    if (!valid) throw new Error("Invalid Stripe webhook signature");
    return JSON.parse(rawBody.toString("utf8")) as {
      id: string;
      type: string;
      data: { object: any };
    };
  }

  private async request<T>(
    path: string,
    method: "GET" | "POST",
    params: Record<string, any> = {},
  ): Promise<T> {
    const key = this.assertSandboxConfigured();
    const encoded = new URLSearchParams();
    appendForm(encoded, params);

    const url = method === "GET" && encoded.size > 0
      ? `${STRIPE_API}${path}?${encoded.toString()}`
      : `${STRIPE_API}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: method === "POST" ? encoded.toString() : undefined,
    });

    const payload = await response.json() as any;
    if (!response.ok) {
      throw new Error(payload?.error?.message || `Stripe request failed with status ${response.status}`);
    }

    return payload as T;
  }
}

function appendForm(target: URLSearchParams, value: any, prefix?: string) {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendForm(target, item, prefix ? `${prefix}[${index}]` : String(index)));
    return;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      const nextPrefix = prefix ? `${prefix}[${key}]` : key;
      appendForm(target, nested, nextPrefix);
    });
    return;
  }

  if (!prefix) return;
  target.append(prefix, String(value));
}

export function toMinorUnits(value: number) {
  return Math.round(value * 100);
}

export function transferGroupFor(reservationId: number) {
  return `bvsbus_reservation_${reservationId}`;
}

export const bvsbusStripe = new BVSBusStripeClient();
