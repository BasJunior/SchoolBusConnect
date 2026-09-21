import type { CreateRideOffer, RideOffer, RideReservation } from "@shared/schema";

const SERVICE_FEE_RATE = 0.15;

class RideMarketplace {
  private offers = new Map<number, RideOffer>();
  private reservations = new Map<number, RideReservation>();
  private nextOfferId = 1;
  private nextReservationId = 1;

  constructor() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 30, 0, 0);

    this.createOffer(
      {
        driverId: 2,
        origin: "Aachen",
        destination: "Cologne",
        departureAt: tomorrow.toISOString(),
        seatsTotal: 3,
        pricePerSeat: 10,
        currency: "EUR",
        vehicle: { make: "Volkswagen", model: "Golf", color: "Black" },
        preferences: {
          instantBooking: true,
          luggage: "medium",
          petsAllowed: false,
          smokingAllowed: false,
        },
      },
      "Mike Johnson",
      4.9,
    );

    const later = new Date(tomorrow);
    later.setHours(20, 0, 0, 0);
    this.createOffer(
      {
        driverId: 2,
        origin: "Aachen",
        destination: "Düsseldorf",
        departureAt: later.toISOString(),
        seatsTotal: 4,
        pricePerSeat: 12,
        currency: "EUR",
        vehicle: { make: "Toyota", model: "Corolla", color: "Silver" },
        preferences: {
          instantBooking: true,
          luggage: "large",
          petsAllowed: true,
          smokingAllowed: false,
        },
      },
      "Mike Johnson",
      4.9,
    );
  }

  list(filters: { from?: string; to?: string; date?: string; seats?: number }) {
    const normalize = (value: string) => value.trim().toLowerCase();
    return Array.from(this.offers.values())
      .filter((offer) => offer.status === "published" || offer.status === "sold_out")
      .filter((offer) => !filters.from || normalize(offer.origin).includes(normalize(filters.from)))
      .filter((offer) => !filters.to || normalize(offer.destination).includes(normalize(filters.to)))
      .filter((offer) => !filters.date || offer.departureAt.slice(0, 10) === filters.date)
      .filter((offer) => !filters.seats || offer.seatsAvailable >= filters.seats)
      .sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
  }

  get(id: number) {
    return this.offers.get(id);
  }

  createOffer(input: CreateRideOffer, driverName: string, driverRating: number): RideOffer {
    const offer: RideOffer = {
      ...input,
      id: this.nextOfferId++,
      driverName,
      driverRating,
      seatsAvailable: input.seatsTotal,
      status: "published",
      createdAt: new Date().toISOString(),
    };
    this.offers.set(offer.id, offer);
    return offer;
  }

  reserve(offerId: number, passengerId: number, passengerName: string, seats: number): RideReservation {
    const offer = this.offers.get(offerId);
    if (!offer) throw new Error("Ride offer not found");
    if (offer.status !== "published") throw new Error("Ride is not available");
    if (offer.seatsAvailable < seats) throw new Error("Not enough seats available");

    const rideSubtotal = this.money(offer.pricePerSeat * seats);
    const serviceFee = this.money(Math.max(1, rideSubtotal * SERVICE_FEE_RATE));
    const reservation: RideReservation = {
      id: this.nextReservationId++,
      offerId,
      passengerId,
      passengerName,
      seats,
      rideSubtotal,
      serviceFee,
      total: this.money(rideSubtotal + serviceFee),
      currency: offer.currency,
      status: "confirmed",
      paymentStatus: "unpaid",
      paymentProvider: null,
      paymentIntentId: null,
      refundStatus: "not_required",
      createdAt: new Date().toISOString(),
    };

    offer.seatsAvailable -= seats;
    if (offer.seatsAvailable === 0) offer.status = "sold_out";
    this.offers.set(offerId, offer);
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  startRide(offerId: number, driverId: number): RideOffer {
    const offer = this.offers.get(offerId);
    if (!offer) throw new Error("Ride offer not found");
    if (offer.driverId !== driverId) throw new Error("Ride does not belong to driver");
    if (!["published", "sold_out"].includes(offer.status)) throw new Error("Ride cannot be started");

    offer.status = "in_progress";
    this.offers.set(offer.id, offer);
    return offer;
  }

  completeRide(offerId: number, driverId: number): RideOffer {
    const offer = this.offers.get(offerId);
    if (!offer) throw new Error("Ride offer not found");
    if (offer.driverId !== driverId) throw new Error("Ride does not belong to driver");
    if (offer.status !== "in_progress") throw new Error("Only an in-progress ride can be completed");

    offer.status = "completed";
    this.offers.set(offer.id, offer);

    for (const reservation of this.reservations.values()) {
      if (reservation.offerId === offerId && reservation.status === "confirmed") {
        reservation.status = "completed";
        this.reservations.set(reservation.id, reservation);
      }
    }
    return offer;
  }

  cancelRide(offerId: number, driverId: number): RideOffer {
    const offer = this.offers.get(offerId);
    if (!offer) throw new Error("Ride offer not found");
    if (offer.driverId !== driverId) throw new Error("Ride does not belong to driver");
    if (offer.status === "cancelled") return offer;
    if (offer.status === "completed") throw new Error("Completed rides cannot be cancelled");

    offer.status = "cancelled";
    offer.seatsAvailable = offer.seatsTotal;
    this.offers.set(offer.id, offer);

    for (const reservation of this.reservations.values()) {
      if (reservation.offerId === offerId && reservation.status === "confirmed") {
        reservation.status = "cancelled";
        if (reservation.paymentStatus === "paid") reservation.refundStatus = "pending";
        this.reservations.set(reservation.id, reservation);
      }
    }

    return offer;
  }

  cancelReservation(reservationId: number, passengerId: number): RideReservation {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    if (reservation.passengerId !== passengerId) throw new Error("Reservation does not belong to passenger");
    if (reservation.status === "cancelled") return reservation;
    if (reservation.status !== "confirmed") throw new Error("Reservation cannot be cancelled");

    reservation.status = "cancelled";
    if (reservation.paymentStatus === "paid") reservation.refundStatus = "pending";
    this.reservations.set(reservation.id, reservation);

    const offer = this.offers.get(reservation.offerId);
    if (offer) {
      offer.seatsAvailable = Math.min(offer.seatsTotal, offer.seatsAvailable + reservation.seats);
      if (offer.status === "sold_out") offer.status = "published";
      this.offers.set(offer.id, offer);
    }

    return reservation;
  }

  getReservation(reservationId: number) {
    return this.reservations.get(reservationId);
  }

  attachPaymentIntent(reservationId: number, paymentIntentId: string): RideReservation {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    reservation.paymentProvider = "stripe";
    reservation.paymentIntentId = paymentIntentId;
    reservation.paymentStatus = "pending";
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  markPaymentPaid(reservationId: number): RideReservation {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    reservation.paymentStatus = "paid";
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  markPaymentFailed(reservationId: number): RideReservation {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    reservation.paymentStatus = "failed";
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  markRefunded(reservationId: number): RideReservation {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    reservation.paymentStatus = "refunded";
    reservation.refundStatus = "succeeded";
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  reservationsForPassenger(passengerId: number) {
    return Array.from(this.reservations.values())
      .filter((reservation) => reservation.passengerId === passengerId)
      .map((reservation) => ({ reservation, offer: this.offers.get(reservation.offerId) }))
      .filter((entry) => entry.offer);
  }

  reservationsForDriver(driverId: number) {
    const driverOfferIds = new Set(
      Array.from(this.offers.values()).filter((offer) => offer.driverId === driverId).map((offer) => offer.id),
    );
    return Array.from(this.reservations.values())
      .filter((reservation) => driverOfferIds.has(reservation.offerId))
      .map((reservation) => ({ reservation, offer: this.offers.get(reservation.offerId) }))
      .filter((entry) => entry.offer);
  }

  offersForDriver(driverId: number) {
    return Array.from(this.offers.values())
      .filter((offer) => offer.driverId === driverId)
      .sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
  }

  private money(value: number) {
    return Math.round(value * 100) / 100;
  }
}

export const rideMarketplace = new RideMarketplace();
