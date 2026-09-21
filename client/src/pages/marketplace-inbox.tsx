import { MessageCircle } from "lucide-react";
import BVSBusBottomNav from "@/components/bvsbus-bottom-nav";

export default function MarketplaceInbox() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      <header className="bg-white px-5 py-6"><div className="mx-auto max-w-xl"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">BVSBus</p><h1 className="text-3xl font-black">Inbox</h1></div></header>
      <main id="main-content" className="mx-auto max-w-xl px-5 py-5">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neutral-100"><MessageCircle className="h-6 w-6" /></div>
          <h2 className="mt-4 text-lg font-bold">Trip conversations live here</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">Once a ride is reserved, passengers and drivers can use the existing BAS-BUS messaging system for pickup details and trip coordination.</p>
          <a href="/trips" className="mt-5 inline-block rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">View trips</a>
        </div>
      </main>
      <BVSBusBottomNav />
    </div>
  );
}
