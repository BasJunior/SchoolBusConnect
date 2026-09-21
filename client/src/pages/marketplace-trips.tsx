import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Car, TicketCheck } from "lucide-react";
import type { RideOffer, RideReservation } from "@shared/schema";
import { useAuth } from "@/App";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BVSBusBottomNav from "@/components/bvsbus-bottom-nav";

type ReservationEntry = { reservation: RideReservation; offer: RideOffer };

function tripLabel(reservation: RideReservation, offer: RideOffer) {
  if (reservation.status === "cancelled") return "Cancelled";
  if (reservation.status === "completed" || offer.status === "completed") return "Completed";
  if (offer.status === "in_progress") return "In progress";
  return "Confirmed";
}

function paymentLabel(reservation: RideReservation) {
  if (reservation.refundStatus === "pending") return "Refund pending";
  if (reservation.paymentStatus === "refunded") return "Refunded";
  if (reservation.paymentStatus === "paid") return "Paid";
  if (reservation.paymentStatus === "pending") return "Payment pending";
  if (reservation.paymentStatus === "failed") return "Payment failed";
  return "Payment not collected";
}

export default function MarketplaceTrips() {
  const { user } = useAuth();
  const bookingsKey = `/api/ride-reservations/user/${user?.id || 0}`;
  const offersKey = `/api/ride-offers/driver/${user?.id || 0}`;

  const { data: bookings = [] } = useQuery<ReservationEntry[]>({
    queryKey: [bookingsKey],
    enabled: !!user,
  });
  const { data: offers = [] } = useQuery<RideOffer[]>({
    queryKey: [offersKey],
    enabled: !!user,
  });

  const cancelReservation = useMutation<RideReservation, Error, number>({
    mutationFn: async (reservationId) => {
      const response = await apiRequest("POST", `/api/ride-reservations/${reservationId}/cancel`, {
        passengerId: user!.id,
      });
      return response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [bookingsKey] }),
        queryClient.invalidateQueries({ queryKey: [offersKey] }),
        queryClient.invalidateQueries({
          predicate: (query) =>
            typeof query.queryKey[0] === "string" &&
            String(query.queryKey[0]).startsWith("/api/ride-offers"),
        }),
      ]);
    },
  });

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      <header className="bg-white px-5 py-6">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">BVSBus</p>
          <h1 className="text-3xl font-black">Trips</h1>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-xl space-y-6 px-5 py-5">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <TicketCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold">Your bookings</h2>
          </div>

          {cancelReservation.error && (
            <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {cancelReservation.error.message}
            </p>
          )}

          {bookings.length === 0 ? (
            <Empty text="No booked rides yet." action="/" label="Find a ride" />
          ) : (
            <div className="space-y-3">
              {bookings.map(({ reservation, offer }) => (
                <article key={reservation.id} className="rounded-3xl bg-white p-4 shadow-sm">
                  <a href={`/rides/${offer.id}`} className="block">
                    <p className="text-xs text-neutral-500">
                      {new Date(offer.departureAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-bold">
                      <span>{offer.origin}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{offer.destination}</span>
                    </div>
                  </a>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3 text-sm">
                    <div>
                      <span className={reservation.status === "cancelled" ? "text-neutral-400" : "font-medium"}>
                        {reservation.seats} seat{reservation.seats > 1 ? "s" : ""} · {tripLabel(reservation, offer)}
                      </span>
                      <p className="mt-1 text-xs text-neutral-500">
                        {reservation.total.toFixed(2)} {reservation.currency} · {paymentLabel(reservation)}
                      </p>
                    </div>

                    {reservation.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => cancelReservation.mutate(reservation.id)}
                        disabled={cancelReservation.isPending}
                        className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Car className="h-5 w-5" />
            <h2 className="text-lg font-bold">Rides you offer</h2>
          </div>
          {offers.length === 0 ? (
            <Empty text="You haven't published a ride." action="/offer" label="Offer a ride" />
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <a key={offer.id} href={`/rides/${offer.id}`} className="block rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-xs text-neutral-500">
                        {new Date(offer.departureAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      <p className="mt-1 font-bold">{offer.origin} → {offer.destination}</p>
                    </div>
                    <span className="h-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
                      {offer.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-neutral-500">
                    {offer.seatsAvailable} of {offer.seatsTotal} seats available
                  </p>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>

      <BVSBusBottomNav />
    </div>
  );
}

function Empty({ text, action, label }: { text: string; action: string; label: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-6 text-center">
      <p className="text-sm text-neutral-500">{text}</p>
      <a href={action} className="mt-3 inline-block rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
        {label}
      </a>
    </div>
  );
}
