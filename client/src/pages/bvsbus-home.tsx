import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, MapPin, Search, Star, Users } from "lucide-react";
import type { RideOffer } from "@shared/schema";
import BVSBusBottomNav from "@/components/bvsbus-bottom-nav";
import BVSBusMap from "@/components/bvsbus-map";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(value);
}

export default function BVSBusHome() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [search, setSearch] = useState({ from: "", to: "", date: "", passengers: 1 });

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (search.from) params.set("from", search.from);
    if (search.to) params.set("to", search.to);
    if (search.date) params.set("date", search.date);
    params.set("seats", String(search.passengers));
    return `/api/ride-offers?${params.toString()}`;
  }, [search]);

  const { data: rides = [], isLoading } = useQuery<RideOffer[]>({ queryKey: [url] });

  function submit(event: FormEvent) {
    event.preventDefault();
    setSearch({ from, to, date, passengers });
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-28 text-neutral-950">
      <section className="relative">
        <BVSBusMap />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] px-5 pt-5">
          <div className="pointer-events-auto mx-auto flex max-w-xl items-center justify-between text-white">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">Ride together</p>
              <h1 className="text-2xl font-black tracking-tight">BVSBus</h1>
            </div>
            <a href="/profile" className="grid h-10 w-10 place-items-center rounded-full bg-white font-bold text-black shadow-lg">B</a>
          </div>
        </div>

        <div className="relative z-[650] -mt-16 px-5">
          <form onSubmit={submit} className="mx-auto max-w-xl rounded-[28px] border border-neutral-200 bg-white p-4 shadow-xl">
            <p className="mb-2 text-sm font-bold">Where are you going?</p>
            <div className="relative">
              <span className="absolute left-[11px] top-[22px] h-[58px] w-px bg-neutral-300" />
              <label className="flex items-center gap-3 border-b border-neutral-100 py-3">
                <span className="relative z-10 h-3 w-3 rounded-full border-[3px] border-black bg-white" />
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full bg-transparent text-base outline-none placeholder:text-neutral-400"
                  placeholder="Leaving from"
                  aria-label="Leaving from"
                />
              </label>
              <label className="flex items-center gap-3 py-3">
                <span className="relative z-10 h-3 w-3 bg-black" />
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-transparent text-base outline-none placeholder:text-neutral-400"
                  placeholder="Going to"
                  aria-label="Going to"
                />
              </label>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-3 py-3 text-sm">
                <CalendarDays className="h-4 w-4" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  aria-label="Travel date"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-3 py-3 text-sm">
                <Users className="h-4 w-4" />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full bg-transparent outline-none"
                  aria-label="Passengers"
                >
                  {[1, 2, 3, 4].map((count) => (
                    <option key={count} value={count}>
                      {count} passenger{count > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3.5 font-semibold text-white">
              <Search className="h-5 w-5" />
              Find a ride
            </button>
          </form>
        </div>
      </section>

      <main id="main-content" className="mx-auto max-w-xl px-5 py-5">
        <div className="mb-4 overflow-hidden rounded-3xl bg-neutral-900 p-5 text-white">
          <div className="mb-10 flex items-center gap-2 text-sm text-neutral-300">
            <MapPin className="h-4 w-4" /> Drivers publish spare seats on trips they are already taking.
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-neutral-300">Driving somewhere?</p>
              <p className="text-xl font-bold">Share the ride. Split the cost.</p>
            </div>
            <a href="/offer" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-black">
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">{search.from || search.to ? "Matching rides" : "Upcoming rides"}</h2>
          <span className="text-sm text-neutral-500">{rides.length} found</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-neutral-200" />)}
          </div>
        ) : rides.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="font-semibold">No rides match yet</p>
            <p className="mt-1 text-sm text-neutral-500">Try a nearby city or another date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rides.map((ride) => (
              <a
                key={ride.id}
                href={`/rides/${ride.id}`}
                className="block rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm transition-transform active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-neutral-500">
                      {new Date(ride.departureAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {new Date(ride.departureAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-bold">
                      <span>{ride.origin}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{ride.destination}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{money(ride.pricePerSeat, ride.currency)}</p>
                    <p className="text-xs text-neutral-500">per seat</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 font-bold">
                      {ride.driverName.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{ride.driverName}</p>
                      <p className="flex items-center gap-1 text-xs text-neutral-500">
                        <Star className="h-3 w-3 fill-current" /> {ride.driverRating || "New"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    {ride.seatsAvailable} seat{ride.seatsAvailable === 1 ? "" : "s"} left
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <BVSBusBottomNav />
    </div>
  );
}
