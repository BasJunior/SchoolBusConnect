import { Home, CalendarDays, MessageCircle, User, Plus } from "lucide-react";

export default function BVSBusBottomNav() {
  const currentPath = window.location.pathname;
  const itemClass = (active: boolean) =>
    `flex min-w-14 flex-col items-center gap-1 text-[11px] font-medium transition-colors ${active ? "text-black" : "text-neutral-500"}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[9999] border-t border-neutral-200 bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-end justify-between">
        <a href="/" className={itemClass(currentPath === "/")}>
          <Home className="h-5 w-5" />
          <span>Home</span>
        </a>
        <a href="/trips" className={itemClass(currentPath === "/trips")}>
          <CalendarDays className="h-5 w-5" />
          <span>Trips</span>
        </a>
        <a href="/offer" className="group -mt-7 flex min-w-16 flex-col items-center gap-1 text-[11px] font-semibold text-black">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-lg transition-transform group-active:scale-95">
            <Plus className="h-7 w-7" />
          </span>
          <span>Offer</span>
        </a>
        <a href="/inbox" className={itemClass(currentPath === "/inbox")}>
          <MessageCircle className="h-5 w-5" />
          <span>Inbox</span>
        </a>
        <a href="/profile" className={itemClass(currentPath === "/profile")}>
          <User className="h-5 w-5" />
          <span>Account</span>
        </a>
      </div>
    </nav>
  );
}
