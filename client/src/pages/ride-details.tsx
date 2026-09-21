import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Car, Check, PawPrint, ShieldCheck, Star, Users } from "lucide-react";
import type { RideOffer, RideReservation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/App";
import BVSBusBottomNav from "@/components/bvsbus-bottom-nav";

type ReservationEntry = { reservation: RideReservation; offer: RideOffer };

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(value);
}

export default function RideDetails() {
  const { user } = useAuth();
  const rideId = Number(window.location.pathname.split("/").pop());
  const [seats, setSeats] = useState(1);
  const { data: ride, isLoading } = useQuery<RideOffer>({ queryKey: [`/api/ride-offers/${rideId}`] });
  const isOwner = Boolean(user && ride && user.id === ride.driverId);

  const { data: driverReservations = [] } = useQuery<ReservationEntry[]>({
    queryKey: [`/api/ride-reservations/driver/${user?.id || 0}`],
    enabled: isOwner,
  });

  const rideReservations = useMemo(
    () => driverReservations.filter((entry) => entry.offer.id === rideId),
    [driverReservations, rideId],
  );

  const confirmedReservations = rideReservations.filter((entry) => entry.reservation.status === "confirmed");
  const bookedSeats = confirmedReservations.reduce((total, entry) => total + entry.reservation.seats, 0);

  const totals = useMemo(() => {
    if (!ride) return { subtotal: 0, fee: 0, total: 0 };
    const subtotal = ride.pricePerSeat * seats;
    const fee = Math.round(Math.max(1, subtotal * 0.15) * 100) / 100;
    return { subtotal, fee, total: subtotal + fee };
  }, [ride, seats]);

  const reservation = useMutation<RideReservation, Error>({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/ride-offers/${rideId}/reserve`, {
        passengerId: user!.id,
        seats,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ride-offers/${rideId}`] });
      window.location.href = "/trips";
    },
  });

  if (isLoading || !ride) {
    return <div className="min-h-screen bg-neutral-50 p-6"><div className="mx-auto h-72 max-w-xl animate-pulse rounded-3xl bg-neutral-200" /></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-28 text-neutral-950">
      <main id="main-content" className="mx-auto max-w-xl">
        <div className="relative h-48 bg-neutral-900 p-5 text-white">
          <a href={isOwner ? "/trips" : "/"} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-sm text-neutral-300">
              {new Date(ride.departureAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <h1 className="mt-1 text-2xl font-black">{ride.origin} → {ride.destination}</h1>
          </div>
        </div>

        <div className="-mt-1 space-y-3 px-5 py-5">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-lg font-black">
                  {ride.driverName.slice(0, 1)}
                </div>
                <div>
                  <h2 className="font-bold">{isOwner ? "Your ride" : ride.driverName}</h2>
                  <p className="flex items-center gap-1 text-sm text-neutral-500">
                    <Star className="h-4 w-4 fill-current" /> {ride.driverRating || "New driver"}
                  </p>
                </div>
              </div>
              <ShieldCheck className="h-6 w-6" />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-bold">Ride details</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-neutral-100 p-3">
                <Car className="mb-2 h-5 w-5" />
                <b>{ride.vehicle.make} {ride.vehicle.model}</b>
                <p className="text-neutral-500">{ride.vehicle.color || "Vehicle"}</p>
              </div>
              <div className="rounded-2xl bg-neutral-100 p-3">
                <Users className="mb-2 h-5 w-5" />
                <b>{ride.seatsAvailable} available</b>
                <p className="text-neutral-500">of {ride.seatsTotal} seats</p>
              </div>
              <div className="rounded-2xl bg-neutral-100 p-3">
                <Briefcase className="mb-2 h-5 w-5" />
                <b>{ride.preferences.luggage} luggage</b>
                <p className="text-neutral-500">per passenger</p>
              </div>
              <div className="rounded-2xl bg-neutral-100 p-3">
                <PawPrint className="mb-2 h-5 w-5" />
                <b>{ride.preferences.petsAllowed ? "Pets welcome" : "No pets"}</b>
                <p className="text-neutral-500">Driver preference</p>
              </div>
            </div>
          </section>

          {isOwner ? (
            <>
              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="font-bold">Booking summary</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-neutral-100 p-4">
                    <p className="text-2xl font-black">{bookedSeats}</p>
                    <p className="text-xs text-neutral-500">seats booked</p>
                  </div>
                  <div className="rounded-2xl bg-neutral-100 p-4">
                    <p className="text-2xl font-black">{money(bookedSeats * ride.pricePerSeat, ride.currency)}</p>
                    <p className="text-xs text-neutral-500">ride contributions</p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="font-bold">Passengers</h2>
                {rideReservations.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">No passengers have booked this ride yet.</p>
                ) : (
                  <div className="mt-3 divide-y divide-neutral-100">
                    {rideReservations.map(({ reservation: booking }) => (
                      <div key={booking.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 font-bold">
                            {booking.passengerName.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{booking.passengerName}</p>
                            <p className="text-xs text-neutral-500">
                              {booking.seats} seat{booking.seats > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          booking.status === "cancelled"
                            ? "bg-neutral-100 text-neutral-500"
                            : "bg-green-50 text-green-700"
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">Seats</h2>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="rounded-xl bg-neutral-100 px-3 py-2 font-semibold"
                  >
                    {Array.from({ length: Math.min(ride.seatsAvailable, 4) }, (_, i) => i + 1).map((count) => (
                      <option key={count}>{count}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Ride contribution</span><span>{money(totals.subtotal, ride.currency)}</span></div>
                  <div className="flex justify-between"><span>BVSBus service fee</span><span>{money(totals.fee, ride.currency)}</span></div>
                  <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-black">
                    <span>Total</span><span>{money(totals.total, ride.currency)}</span>
                  </div>
                </div>
              </section>

              {reservation.error && (
                <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{reservation.error.message}</p>
              )}

              {!user ? (
                <a href="/login" className="block rounded-2xl bg-black px-4 py-4 text-center font-bold text-white">
                  Log in to reserve
                </a>
              ) : ride.seatsAvailable > 0 ? (
                <button
                  onClick={() => reservation.mutate()}
                  disabled={reservation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-4 font-bold text-white disabled:opacity-50"
                >
                  <Check className="h-5 w-5" /> {reservation.isPending ? "Reserving…" : "Reserve seat"}
                </button>
              ) : (
                <button disabled className="w-full rounded-2xl bg-neutral-300 px-4 py-4 font-bold text-neutral-600">
                  Sold out
                </button>
              )}
            </>
          )}
        </div>
      </main>
      <BVSBusBottomNav />
    </div>
  );
}
