import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { RideConversationSummary } from "@shared/schema";
import { useAuth } from "@/App";
import BVSBusBottomNav from "@/components/bvsbus-bottom-nav";

export default function MarketplaceInbox() {
  const { user } = useAuth();
  const { data: conversations = [], isLoading } = useQuery<RideConversationSummary[]>({
    queryKey: [`/api/ride-inbox/${user?.id || 0}`],
    enabled: !!user,
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      <header className="bg-white px-5 py-6">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">BVSBus</p>
          <h1 className="text-3xl font-black">Inbox</h1>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-xl px-5 py-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-3xl bg-neutral-200" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neutral-100">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold">No conversations yet</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Open a booked ride or passenger entry to start a ride-specific conversation.
            </p>
            <a href="/trips" className="mt-5 inline-block rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              View trips
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <a
                key={conversation.reservationId}
                href={`/messages/${conversation.reservationId}`}
                className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-100 font-bold">
                  {conversation.counterpartName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{conversation.counterpartName}</p>
                    <p className="shrink-0 text-[10px] text-neutral-400">
                      {new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className="truncate text-xs text-neutral-500">
                    {conversation.origin} → {conversation.destination}
                  </p>
                  <p className="mt-1 truncate text-sm text-neutral-600">{conversation.lastMessage}</p>
                </div>
                {conversation.unreadCount > 0 ? (
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                    {conversation.unreadCount}
                  </span>
                ) : (
                  <ArrowRight className="h-4 w-4 text-neutral-400" />
                )}
              </a>
            ))}
          </div>
        )}
      </main>

      <BVSBusBottomNav />
    </div>
  );
}
