import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import type { RideMessage, RideOffer, RideReservation } from "@shared/schema";
import { useAuth } from "@/App";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BVSBusBottomNav from "@/components/bvsbus-bottom-nav";

type ConversationPayload = {
  reservation: RideReservation;
  offer: RideOffer;
  messages: RideMessage[];
};

export default function RideChat() {
  const { user } = useAuth();
  const reservationId = Number(window.location.pathname.split("/").pop());
  const [message, setMessage] = useState("");
  const key = `/api/ride-messages/reservation/${reservationId}?userId=${user?.id || 0}`;

  const { data, isLoading } = useQuery<ConversationPayload>({
    queryKey: [key],
    enabled: !!user,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!user || !data) return;
    apiRequest("POST", `/api/ride-messages/reservation/${reservationId}/read`, { userId: user.id })
      .then(() => queryClient.invalidateQueries({ queryKey: [`/api/ride-inbox/${user.id}`] }))
      .catch(() => undefined);
  }, [data?.messages.length, reservationId, user?.id]);

  const send = useMutation<RideMessage, Error>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ride-messages", {
        reservationId,
        senderId: user!.id,
        content: message.trim(),
      });
      return response.json();
    },
    onSuccess: async () => {
      setMessage("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [key] }),
        queryClient.invalidateQueries({ queryKey: [`/api/ride-inbox/${user!.id}`] }),
      ]);
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim() || send.isPending) return;
    send.mutate();
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 p-5">
        <div className="mx-auto h-80 max-w-xl animate-pulse rounded-3xl bg-neutral-200" />
      </div>
    );
  }

  const otherName =
    user?.id === data.reservation.passengerId
      ? data.offer.driverName
      : data.reservation.passengerName;

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <a href="/inbox" className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <div className="min-w-0">
            <h1 className="truncate font-black">{otherName}</h1>
            <p className="truncate text-xs text-neutral-500">
              {data.offer.origin} → {data.offer.destination}
            </p>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-xl px-5 py-5">
        <div className="space-y-3">
          {data.messages.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <p className="font-semibold">Start the conversation</p>
              <p className="mt-1 text-sm text-neutral-500">
                Use chat for pickup details and trip coordination.
              </p>
            </div>
          ) : (
            data.messages.map((item) => {
              const mine = item.senderId === user?.id;
              return (
                <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm ${
                    mine ? "bg-black text-white" : "bg-white text-neutral-900 shadow-sm"
                  }`}>
                    <p>{item.content}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-neutral-400"}`}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {send.error && (
          <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{send.error.message}</p>
        )}
      </main>

      <form
        onSubmit={submit}
        className="fixed inset-x-0 bottom-[72px] z-30 border-t border-neutral-200 bg-white p-3"
      >
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message about this ride"
            maxLength={1000}
            className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!message.trim() || send.isPending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-white disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>

      <BVSBusBottomNav />
    </div>
  );
}
