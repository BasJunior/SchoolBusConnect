import { and, asc, eq, gte, ilike, or, sql } from "drizzle-orm";
import {
  rideOffers,
  rideReservations,
  type CreateRideOffer,
  type RideOffer,
  type RideOfferRow,
  type RideReservation,
  type RideReservationRow,
} from "@shared/schema";
import { rideMarketplace } from "./ride-marketplace";

const SERVICE_FEE_RATE = 0.15;

type RideFilters = {
  from?: string;
  to?: string;
  date?: string;
  seats?: number;
};

class RideStore {
  isDatabaseBacked() {
    return Boolean(process.env.DATABASE_URL);
  }

  async list(filters: RideFilters): Promise<RideOffer[]> {
    if (!this.isDatabaseBacked()) return rideMarketplace.list(filters);

    const db = await this.database();
    const activeStatus = or(eq(rideOffers.status, "published"), eq(rideOffers.status, "sold_out"))!;
    const conditions = [activeStatus];

    if (filters.from) conditions.push(ilike(rideOffers.origin, `%${filters.from.trim()}%`));
    if (filters.to) conditions.push(ilike(rideOffers.destination, `%${filters.to.trim()}%`));
    if (filters.seats) conditions.push(gte(rideOffers.seatsAvailable, filters.seats));

    const rows = await db
      .select()
      .from(rideOffers)
      .where(and(...conditions))
      .orderBy(asc(rideOffers.departureAt));

    return rows
      .map(mapOffer)
      .filter((offer) => !filters.date || offer.departureAt.slice(0, 10) === filters.date);
  }

  async get(id: number): Promise<RideOffer | undefined> {
    if (!this.isDatabaseBacked()) return rideMarketplace.get(id);

    const db = await this.database();
    const [row] = await db.select().from(rideOffers).where(eq(rideOffers.id, id)).limit(1);
    return row ? mapOffer(row) : undefined;
  }

  async createOffer(input: CreateRideOffer, driverName: string, driverRating: number): Promise<RideOffer> {
    if (!this.isDatabaseBacked()) return rideMarketplace.createOffer(input, driverName, driverRating);

    const db = await this.database();
    const [row] = await db
      .insert(rideOffers)
      .values({
        driverId: input.driverId,
        driverName,
        driverRating: money(driverRating).toFixed(2),
        origin: input.origin,
        destination: input.destination,
        departureAt: new Date(input.departureAt),
        seatsTotal: input.seatsTotal,
        seatsAvailable: input.seatsTotal,
        pricePerSeat: money(input.pricePerSeat).toFixed(2),
        currency: input.currency,
        vehicleMake: input.vehicle.make,
        vehicleModel: input.vehicle.model,
        vehicleColor: input.vehicle.color ?? null,
        vehiclePlate: input.vehicle.plate ?? null,
        instantBooking: input.preferences.instantBooking,
        luggage: input.preferences.luggage,
        petsAllowed: input.preferences.petsAllowed,
        smokingAllowed: input.preferences.smokingAllowed,
        status: "published",
      })
      .returning();

    return mapOffer(row);
  }

  async reserve(
    offerId: number,
    passengerId: number,
    passengerName: string,
    seats: number,
  ): Promise<RideReservation> {
    if (!this.isDatabaseBacked()) {
      return rideMarketplace.reserve(offerId, passengerId, passengerName, seats);
    }

    const db = await this.database();

    return db.transaction(async (tx) => {
      const [updatedOffer] = await tx
        .update(rideOffers)
        .set({
          seatsAvailable: sql`${rideOffers.seatsAvailable} - ${seats}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(rideOffers.id, offerId),
            eq(rideOffers.status, "published"),
            gte(rideOffers.seatsAvailable, seats),
          ),
        )
        .returning();

      if (!updatedOffer) {
        const [existing] = await tx.select().from(rideOffers).where(eq(rideOffers.id, offerId)).limit(1);
        if (!existing) throw new Error("Ride offer not found");
        if (existing.status !== "published") throw new Error("Ride is not available");
        throw new Error("Not enough seats available");
      }

      if (updatedOffer.seatsAvailable === 0) {
        await tx
          .update(rideOffers)
          .set({ status: "sold_out", updatedAt: new Date() })
          .where(eq(rideOffers.id, offerId));
      }

      const subtotal = money(Number(updatedOffer.pricePerSeat) * seats);
      const serviceFee = money(Math.max(1, subtotal * SERVICE_FEE_RATE));
      const total = money(subtotal + serviceFee);

      const [reservation] = await tx
        .insert(rideReservations)
        .values({
          offerId,
          passengerId,
          passengerName,
          seats,
          rideSubtotal: subtotal.toFixed(2),
          serviceFee: serviceFee.toFixed(2),
          total: total.toFixed(2),
          currency: updatedOffer.currency,
          status: "confirmed",
          paymentStatus: "unpaid",
          refundStatus: "not_required",
        })
        .returning();

      return mapReservation(reservation);
    });
  }

  async cancelRide(offerId: number, driverId: number): Promise<RideOffer> {
    if (!this.isDatabaseBacked()) {
      return rideMarketplace.cancelRide(offerId, driverId);
    }

    const db = await this.database();

    return db.transaction(async (tx) => {
      const [offer] = await tx
        .select()
        .from(rideOffers)
        .where(eq(rideOffers.id, offerId))
        .limit(1);

      if (!offer) throw new Error("Ride offer not found");
      if (offer.driverId !== driverId) throw new Error("Ride does not belong to driver");
      if (offer.status === "cancelled") return mapOffer(offer);
      if (offer.status === "completed") throw new Error("Completed rides cannot be cancelled");

      const [cancelledOffer] = await tx
        .update(rideOffers)
        .set({
          status: "cancelled",
          seatsAvailable: offer.seatsTotal,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(rideOffers.id, offerId),
            eq(rideOffers.driverId, driverId),
          ),
        )
        .returning();

      await tx
        .update(rideReservations)
        .set({
          status: "cancelled",
          refundStatus: sql`CASE WHEN ${rideReservations.paymentStatus} = 'paid' THEN 'pending' ELSE ${rideReservations.refundStatus} END`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(rideReservations.offerId, offerId),
            eq(rideReservations.status, "confirmed"),
          ),
        );

      return mapOffer(cancelledOffer);
    });
  }

  async cancelReservation(reservationId: number, passengerId: number): Promise<RideReservation> {
    if (!this.isDatabaseBacked()) {
      return rideMarketplace.cancelReservation(reservationId, passengerId);
    }

    const db = await this.database();

    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(rideReservations)
        .where(eq(rideReservations.id, reservationId))
        .limit(1);

      if (!existing) throw new Error("Reservation not found");
      if (existing.passengerId !== passengerId) throw new Error("Reservation does not belong to passenger");
      if (existing.status === "cancelled") return mapReservation(existing);
      if (existing.status !== "confirmed") throw new Error("Reservation cannot be cancelled");

      const [cancelled] = await tx
        .update(rideReservations)
        .set({
          status: "cancelled",
          refundStatus: sql`CASE WHEN ${rideReservations.paymentStatus} = 'paid' THEN 'pending' ELSE ${rideReservations.refundStatus} END`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(rideReservations.id, reservationId),
            eq(rideReservations.passengerId, passengerId),
            eq(rideReservations.status, "confirmed"),
          ),
        )
        .returning();

      if (!cancelled) {
        const [latest] = await tx
          .select()
          .from(rideReservations)
          .where(eq(rideReservations.id, reservationId))
          .limit(1);
        if (latest?.status === "cancelled") return mapReservation(latest);
        throw new Error("Reservation could not be cancelled");
      }

      await tx
        .update(rideOffers)
        .set({
          seatsAvailable: sql`LEAST(${rideOffers.seatsTotal}, ${rideOffers.seatsAvailable} + ${cancelled.seats})`,
          status: sql`CASE WHEN ${rideOffers.status} = 'sold_out' THEN 'published' ELSE ${rideOffers.status} END`,
          updatedAt: new Date(),
        })
        .where(eq(rideOffers.id, cancelled.offerId));

      return mapReservation(cancelled);
    });
  }

  async getReservation(reservationId: number): Promise<RideReservation | undefined> {
    if (!this.isDatabaseBacked()) return rideMarketplace.getReservation(reservationId);

    const db = await this.database();
    const [row] = await db
      .select()
      .from(rideReservations)
      .where(eq(rideReservations.id, reservationId))
      .limit(1);

    return row ? mapReservation(row) : undefined;
  }

  async attachPaymentIntent(reservationId: number, paymentIntentId: string): Promise<RideReservation> {
    if (!this.isDatabaseBacked()) {
      return rideMarketplace.attachPaymentIntent(reservationId, paymentIntentId);
    }

    const db = await this.database();
    const [row] = await db
      .update(rideReservations)
      .set({
        paymentProvider: "stripe",
        paymentIntentId,
        paymentStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(rideReservations.id, reservationId))
      .returning();

    if (!row) throw new Error("Reservation not found");
    return mapReservation(row);
  }

  async markPaymentPaid(reservationId: number): Promise<RideReservation> {
    if (!this.isDatabaseBacked()) return rideMarketplace.markPaymentPaid(reservationId);

    const db = await this.database();
    const [row] = await db
      .update(rideReservations)
      .set({ paymentStatus: "paid", updatedAt: new Date() })
      .where(eq(rideReservations.id, reservationId))
      .returning();

    if (!row) throw new Error("Reservation not found");
    return mapReservation(row);
  }

  async markPaymentFailed(reservationId: number): Promise<RideReservation> {
    if (!this.isDatabaseBacked()) return rideMarketplace.markPaymentFailed(reservationId);

    const db = await this.database();
    const [row] = await db
      .update(rideReservations)
      .set({ paymentStatus: "failed", updatedAt: new Date() })
      .where(eq(rideReservations.id, reservationId))
      .returning();

    if (!row) throw new Error("Reservation not found");
    return mapReservation(row);
  }

  async markRefunded(reservationId: number): Promise<RideReservation> {
    if (!this.isDatabaseBacked()) return rideMarketplace.markRefunded(reservationId);

    const db = await this.database();
    const [row] = await db
      .update(rideReservations)
      .set({
        paymentStatus: "refunded",
        refundStatus: "succeeded",
        updatedAt: new Date(),
      })
      .where(eq(rideReservations.id, reservationId))
      .returning();

    if (!row) throw new Error("Reservation not found");
    return mapReservation(row);
  }

  async reservationsForPassenger(passengerId: number) {
    if (!this.isDatabaseBacked()) return rideMarketplace.reservationsForPassenger(passengerId);

    const db = await this.database();
    const rows = await db
      .select({ reservation: rideReservations, offer: rideOffers })
      .from(rideReservations)
      .innerJoin(rideOffers, eq(rideReservations.offerId, rideOffers.id))
      .where(eq(rideReservations.passengerId, passengerId))
      .orderBy(asc(rideOffers.departureAt));

    return rows.map(({ reservation, offer }) => ({
      reservation: mapReservation(reservation),
      offer: mapOffer(offer),
    }));
  }

  async reservationsForDriver(driverId: number) {
    if (!this.isDatabaseBacked()) return rideMarketplace.reservationsForDriver(driverId);

    const db = await this.database();
    const rows = await db
      .select({ reservation: rideReservations, offer: rideOffers })
      .from(rideReservations)
      .innerJoin(rideOffers, eq(rideReservations.offerId, rideOffers.id))
      .where(eq(rideOffers.driverId, driverId))
      .orderBy(asc(rideOffers.departureAt));

    return rows.map(({ reservation, offer }) => ({
      reservation: mapReservation(reservation),
      offer: mapOffer(offer),
    }));
  }

  async offersForDriver(driverId: number): Promise<RideOffer[]> {
    if (!this.isDatabaseBacked()) return rideMarketplace.offersForDriver(driverId);

    const db = await this.database();
    const rows = await db
      .select()
      .from(rideOffers)
      .where(eq(rideOffers.driverId, driverId))
      .orderBy(asc(rideOffers.departureAt));

    return rows.map(mapOffer);
  }

  private async database() {
    const { db } = await import("./db");
    return db;
  }
}

function mapOffer(row: RideOfferRow): RideOffer {
  return {
    id: row.id,
    driverId: row.driverId,
    driverName: row.driverName,
    driverRating: Number(row.driverRating),
    origin: row.origin,
    destination: row.destination,
    departureAt: row.departureAt.toISOString(),
    seatsTotal: row.seatsTotal,
    seatsAvailable: row.seatsAvailable,
    pricePerSeat: Number(row.pricePerSeat),
    currency: row.currency,
    vehicle: {
      make: row.vehicleMake,
      model: row.vehicleModel,
      color: row.vehicleColor ?? undefined,
      plate: row.vehiclePlate ?? undefined,
    },
    preferences: {
      instantBooking: row.instantBooking,
      luggage: row.luggage as "small" | "medium" | "large",
      petsAllowed: row.petsAllowed,
      smokingAllowed: row.smokingAllowed,
    },
    status: row.status as RideOffer["status"],
    createdAt: row.createdAt.toISOString(),
  };
}

function mapReservation(row: RideReservationRow): RideReservation {
  return {
    id: row.id,
    offerId: row.offerId,
    passengerId: row.passengerId,
    passengerName: row.passengerName,
    seats: row.seats,
    rideSubtotal: Number(row.rideSubtotal),
    serviceFee: Number(row.serviceFee),
    total: Number(row.total),
    currency: row.currency,
    status: row.status as RideReservation["status"],
    paymentStatus: row.paymentStatus as RideReservation["paymentStatus"],
    paymentProvider: row.paymentProvider === "stripe" ? "stripe" : null,
    paymentIntentId: row.paymentIntentId,
    refundStatus: row.refundStatus as RideReservation["refundStatus"],
    createdAt: row.createdAt.toISOString(),
  };
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

export const rideStore = new RideStore();
