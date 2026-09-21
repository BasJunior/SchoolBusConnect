import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Car, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import BVSBusBottomNav from "@/components/bvsbus-bottom-nav";

export default function OfferRide() {
  const { user } = useAuth();
  const tomorrow = new Date(Date.now() + 86400000);
  const localDefault = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    departureAt: localDefault,
    seatsTotal: 3,
    pricePerSeat: 10,
    make: "",
    model: "",
    color: "",
    luggage: "medium",
    petsAllowed: false,
  });

  const publish = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ride-offers", {
        driverId: user!.id,
        origin: form.origin,
        destination: form.destination,
        departureAt: new Date(form.departureAt).toISOString(),
        seatsTotal: Number(form.seatsTotal),
        pricePerSeat: Number(form.pricePerSeat),
        currency: "EUR",
        vehicle: { make: form.make, model: form.model, color: form.color || undefined },
        preferences: {
          instantBooking: true,
          luggage: form.luggage,
          petsAllowed: form.petsAllowed,
          smokingAllowed: false,
        },
      });
      return response.json();
    },
    onSuccess: () => { window.location.href = "/trips"; },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    publish.mutate();
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-28 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white px-5 py-5">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <a href="/" className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100"><ArrowLeft className="h-5 w-5" /></a>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Driver</p><h1 className="text-xl font-black">Offer a ride</h1></div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-xl px-5 py-5">
        <form onSubmit={submit} className="space-y-4">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Where are you driving?</h2>
            <div className="space-y-3">
              <input required value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Leaving from" className="w-full rounded-2xl bg-neutral-100 px-4 py-4 outline-none" />
              <input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Going to" className="w-full rounded-2xl bg-neutral-100 px-4 py-4 outline-none" />
              <input required type="datetime-local" value={form.departureAt} onChange={(e) => setForm({ ...form, departureAt: e.target.value })} className="w-full rounded-2xl bg-neutral-100 px-4 py-4 outline-none" />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Seats & contribution</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="rounded-2xl bg-neutral-100 p-3 text-sm"><span className="text-neutral-500">Seats</span><input min="1" max="8" type="number" value={form.seatsTotal} onChange={(e) => setForm({ ...form, seatsTotal: Number(e.target.value) })} className="mt-1 w-full bg-transparent text-lg font-bold outline-none" /></label>
              <label className="rounded-2xl bg-neutral-100 p-3 text-sm"><span className="text-neutral-500">Price / seat (€)</span><input min="1" step="0.5" type="number" value={form.pricePerSeat} onChange={(e) => setForm({ ...form, pricePerSeat: Number(e.target.value) })} className="mt-1 w-full bg-transparent text-lg font-bold outline-none" /></label>
            </div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">Set a contribution that helps share trip costs. BVSBus adds its service fee to the passenger total.</p>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Car className="h-5 w-5" /><h2 className="text-lg font-bold">Your car</h2></div>
            <div className="grid grid-cols-2 gap-3">
              <input required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Make" className="rounded-2xl bg-neutral-100 px-4 py-3 outline-none" />
              <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model" className="rounded-2xl bg-neutral-100 px-4 py-3 outline-none" />
            </div>
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Color (optional)" className="mt-3 w-full rounded-2xl bg-neutral-100 px-4 py-3 outline-none" />
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Preferences</h2>
            <label className="flex items-center justify-between border-b border-neutral-100 py-3">
              <span><b className="block text-sm">Luggage</b><span className="text-xs text-neutral-500">Per passenger</span></span>
              <select value={form.luggage} onChange={(e) => setForm({ ...form, luggage: e.target.value })} className="rounded-xl bg-neutral-100 px-3 py-2"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>
            </label>
            <label className="flex items-center justify-between py-3">
              <span><b className="block text-sm">Pets allowed</b><span className="text-xs text-neutral-500">Let passengers bring pets</span></span>
              <input type="checkbox" checked={form.petsAllowed} onChange={(e) => setForm({ ...form, petsAllowed: e.target.checked })} className="h-5 w-5" />
            </label>
          </section>

          {publish.error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{(publish.error as Error).message}</p>}
          <button disabled={publish.isPending} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-4 font-bold text-white disabled:opacity-50">
            {publish.isPending ? "Publishing…" : "Publish ride"} <ChevronRight className="h-5 w-5" />
          </button>
        </form>
      </main>
      <BVSBusBottomNav />
    </div>
  );
}
