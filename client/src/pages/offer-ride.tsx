import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Car, ChevronRight, CreditCard, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/App";
import BVSBusBottomNav from "@/components/bvsbus-bottom-nav";
import type { StripeConnectStatus } from "@shared/schema";

type StripeEnvironmentStatus = {
  configured: boolean;
  mode: "test";
  livePaymentsAllowed: false;
};

export default function OfferRide() {
  const { user } = useAuth();
  const { data: stripeEnvironment } = useQuery<StripeEnvironmentStatus>({
    queryKey: ["/api/stripe/status"],
  });
  const payoutStatusKey = `/api/stripe/connect/status/${user?.id || 0}`;
  const { data: payoutStatus } = useQuery<StripeConnectStatus>({
    queryKey: [payoutStatusKey],
    enabled: !!user,
  });

  const startOnboarding = useMutation<{ onboardingUrl: string }, Error>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/connect/onboard", { driverId: user!.id });
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.onboardingUrl;
    },
  });

  const openPayoutDashboard = useMutation<{ url: string }, Error>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/connect/dashboard", { driverId: user!.id });
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

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

  useEffect(() => {
    const stripeReturn = new URLSearchParams(window.location.search).get("stripe");
    if (stripeReturn !== "return" && stripeReturn !== "refresh") return;

    queryClient.invalidateQueries({ queryKey: [payoutStatusKey] });
    window.history.replaceState({}, "", "/offer");
  }, [payoutStatusKey]);

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
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">Driver payouts</h2>
                {!stripeEnvironment?.configured ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    Stripe sandbox is not configured on this environment yet.
                  </p>
                ) : payoutStatus?.readyForPayouts ? (
                  <>
                    <p className="mt-1 text-sm text-green-700">Stripe test payouts are ready.</p>
                    <button
                      type="button"
                      onClick={() => openPayoutDashboard.mutate()}
                      disabled={openPayoutDashboard.isPending}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Open payout dashboard <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-neutral-500">
                      Complete Stripe test onboarding so BVSBus can release your ride contributions after completed trips.
                    </p>
                    <button
                      type="button"
                      onClick={() => startOnboarding.mutate()}
                      disabled={startOnboarding.isPending}
                      className="mt-3 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {startOnboarding.isPending ? "Opening Stripe…" : payoutStatus?.stripeAccountId ? "Continue payout setup" : "Set up payouts"}
                    </button>
                  </>
                )}
                {(startOnboarding.error || openPayoutDashboard.error) && (
                  <p className="mt-3 text-xs text-red-700">
                    {startOnboarding.error?.message || openPayoutDashboard.error?.message}
                  </p>
                )}
                <p className="mt-3 text-[11px] text-neutral-400">Test mode only · no live money</p>
              </div>
            </div>
          </section>

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
