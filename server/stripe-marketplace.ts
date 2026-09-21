import type { RideOffer, RideReservation, User } from "@shared/schema";
import { rideStore } from "./ride-store";
import { stripeConnectStore } from "./stripe-connect-store";
import { bvsbusStripe } from "./stripe-client";

export async function createReservationCheckout(input: {
  reservation: RideReservation;
  offer: RideOffer;
  passengerEmail?: string;
  baseUrl: string;
}) {
  const session = await bvsbusStripe.createCheckoutSession(input);
  const paymentIntentId = paymentIntentIdFromSession(session);
  const reservation = await rideStore.attachCheckoutSession(
    input.reservation.id,
    session.id,
    paymentIntentId,
  );

  return {
    reservation,
    checkoutSessionId: session.id,
    checkoutUrl: session.url!,
  };
}

export async function reconcileCheckoutSession(sessionId: string) {
  const session = await bvsbusStripe.retrieveCheckoutSession(sessionId);
  const reservationId = Number(session.metadata?.reservation_id);
  const reservation =
    (await rideStore.getReservationByCheckoutSession(session.id)) ||
    (Number.isFinite(reservationId) ? await rideStore.getReservation(reservationId) : undefined);

  if (!reservation) throw new Error("Reservation for Stripe Checkout Session was not found");

  if (session.payment_status === "paid") {
    return rideStore.markCheckoutPaid(
      reservation.id,
      paymentIntentIdFromSession(session),
      chargeIdFromSession(session),
    );
  }

  if (session.status === "expired" && reservation.paymentStatus !== "paid" && reservation.status !== "cancelled") {
    return rideStore.cancelReservation(reservation.id, reservation.passengerId);
  }

  return reservation;
}

export async function ensureDriverConnectAccount(driver: User) {
  let stored = await stripeConnectStore.get(driver.id);

  if (!stored) {
    const account = await bvsbusStripe.createExpressAccount({
      driverId: driver.id,
      driverName: driver.fullName,
      email: driver.email,
      country: "DE",
    });

    stored = await stripeConnectStore.save({
      driverId: driver.id,
      driverName: driver.fullName,
      stripeAccountId: account.id,
      country: account.country || "DE",
      detailsSubmitted: Boolean(account.details_submitted),
      payoutsEnabled: Boolean(account.payouts_enabled),
      chargesEnabled: Boolean(account.charges_enabled),
    });
  }

  return refreshDriverConnectAccount(driver.id);
}

export async function refreshDriverConnectAccount(driverId: number) {
  const stored = await stripeConnectStore.get(driverId);
  if (!stored) return stripeConnectStore.status(driverId);

  const account = await bvsbusStripe.retrieveAccount(stored.stripeAccountId);
  await stripeConnectStore.updateStripeState(driverId, {
    detailsSubmitted: Boolean(account.details_submitted),
    payoutsEnabled: Boolean(account.payouts_enabled),
    chargesEnabled: Boolean(account.charges_enabled),
    country: account.country || stored.country,
  });

  return stripeConnectStore.status(driverId);
}

export async function createDriverOnboardingLink(driver: User, baseUrl: string) {
  const status = await ensureDriverConnectAccount(driver);
  if (!status.stripeAccountId) throw new Error("Stripe connected account was not created");

  const link = await bvsbusStripe.createAccountLink({
    accountId: status.stripeAccountId,
    refreshUrl: `${baseUrl}/offer?stripe=refresh`,
    returnUrl: `${baseUrl}/offer?stripe=return`,
  });

  return { ...status, onboardingUrl: link.url };
}

export async function createDriverDashboardLink(driverId: number) {
  const status = await refreshDriverConnectAccount(driverId);
  if (!status.stripeAccountId) throw new Error("Driver has no Stripe connected account");
  if (!status.detailsSubmitted) throw new Error("Complete Stripe onboarding before opening the payout dashboard");

  return bvsbusStripe.createExpressLoginLink(status.stripeAccountId);
}

export async function refundReservationIfNeeded(reservation: RideReservation) {
  if (reservation.paymentStatus === "refunded" || reservation.refundStatus === "succeeded") {
    return reservation;
  }

  if (reservation.paymentStatus !== "paid") {
    return reservation;
  }

  try {
    await bvsbusStripe.createRefund(reservation);
    return await rideStore.markRefunded(reservation.id);
  } catch (error) {
    await rideStore.markRefundFailed(reservation.id);
    throw error;
  }
}

export async function releaseReservationPayout(
  reservation: RideReservation,
  driverId: number,
) {
  if (reservation.paymentStatus !== "paid" || reservation.status !== "completed") {
    return reservation;
  }
  if (reservation.transferStatus === "transferred") return reservation;

  const connect = await refreshDriverConnectAccount(driverId);
  if (!connect.stripeAccountId || !connect.readyForPayouts) {
    return rideStore.markTransferStatus(reservation.id, "awaiting_onboarding");
  }

  try {
    await rideStore.markTransferStatus(reservation.id, "pending");
    const transfer = await bvsbusStripe.createTransfer({
      reservation,
      destination: connect.stripeAccountId,
    });
    return await rideStore.markTransferStatus(reservation.id, "transferred", transfer.id);
  } catch (error) {
    await rideStore.markTransferStatus(reservation.id, "failed");
    throw error;
  }
}

export async function releaseRidePayouts(offerId: number, driverId: number) {
  const entries = await rideStore.reservationsForDriver(driverId);
  const eligible = entries
    .filter((entry) => entry.offer.id === offerId)
    .map((entry) => entry.reservation)
    .filter((reservation) => reservation.status === "completed" && reservation.paymentStatus === "paid");

  const results = [];
  for (const reservation of eligible) {
    try {
      results.push({
        reservationId: reservation.id,
        result: await releaseReservationPayout(reservation, driverId),
        error: null,
      });
    } catch (error: any) {
      results.push({
        reservationId: reservation.id,
        result: null,
        error: error?.message || "Payout transfer failed",
      });
    }
  }
  return results;
}

export async function handleStripeWebhookEvent(event: {
  id: string;
  type: string;
  data: { object: any };
}) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await reconcileCheckoutSession(event.data.object.id);
      return;

    case "checkout.session.expired": {
      const session = event.data.object;
      const reservation = await rideStore.getReservationByCheckoutSession(session.id);
      if (reservation && reservation.paymentStatus !== "paid" && reservation.status !== "cancelled") {
        await rideStore.cancelReservation(reservation.id, reservation.passengerId);
      }
      return;
    }

    case "payment_intent.payment_failed": {
      const reservationId = Number(event.data.object.metadata?.reservation_id);
      if (Number.isFinite(reservationId)) {
        await rideStore.markPaymentFailed(reservationId);
      }
      return;
    }

    case "refund.created":
    case "refund.updated": {
      const refund = event.data.object;
      const reservationId = Number(refund.metadata?.reservation_id);
      if (!Number.isFinite(reservationId)) return;
      if (refund.status === "succeeded") {
        await rideStore.markRefunded(reservationId);
      } else if (refund.status === "failed" || refund.status === "canceled") {
        await rideStore.markRefundFailed(reservationId);
      }
      return;
    }

    case "account.updated": {
      const account = event.data.object;
      const stored = await stripeConnectStore.getByStripeAccountId(account.id);
      if (!stored) return;
      await stripeConnectStore.updateStripeState(stored.driverId, {
        detailsSubmitted: Boolean(account.details_submitted),
        payoutsEnabled: Boolean(account.payouts_enabled),
        chargesEnabled: Boolean(account.charges_enabled),
        country: account.country || stored.country,
      });

      if (account.details_submitted && account.payouts_enabled) {
        const entries = await rideStore.reservationsForDriver(stored.driverId);
        for (const entry of entries) {
          const reservation = entry.reservation;
          if (
            reservation.status === "completed" &&
            reservation.paymentStatus === "paid" &&
            reservation.transferStatus !== "transferred"
          ) {
            try {
              await releaseReservationPayout(reservation, stored.driverId);
            } catch {
              // Transfer status is persisted as failed for later operational retry.
            }
          }
        }
      }
      return;
    }

    default:
      return;
  }
}

function paymentIntentIdFromSession(session: any): string | null {
  if (!session.payment_intent) return null;
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent.id || null;
}

function chargeIdFromSession(session: any): string | null {
  if (!session.payment_intent || typeof session.payment_intent === "string") return null;
  const charge = session.payment_intent.latest_charge;
  if (!charge) return null;
  return typeof charge === "string" ? charge : charge.id || null;
}
