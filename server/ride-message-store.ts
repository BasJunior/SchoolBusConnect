import { asc, eq, or, and } from "drizzle-orm";
import {
  rideMessages,
  rideOffers,
  type RideConversationSummary,
  type RideMessage,
  type RideMessageRow,
} from "@shared/schema";
import { rideMarketplace } from "./ride-marketplace";

type CreateRideMessage = {
  reservationId: number;
  offerId: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
};

class RideMessageStore {
  private messages = new Map<number, RideMessage>();
  private nextId = 1;

  private databaseBacked() {
    return Boolean(process.env.DATABASE_URL);
  }

  async send(input: CreateRideMessage): Promise<RideMessage> {
    if (!this.databaseBacked()) {
      const message: RideMessage = {
        id: this.nextId++,
        ...input,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      this.messages.set(message.id, message);
      return message;
    }

    const db = await this.database();
    const [row] = await db
      .insert(rideMessages)
      .values({
        reservationId: input.reservationId,
        offerId: input.offerId,
        senderId: input.senderId,
        senderName: input.senderName,
        receiverId: input.receiverId,
        receiverName: input.receiverName,
        content: input.content,
        isRead: false,
      })
      .returning();

    return mapMessage(row);
  }

  async conversation(reservationId: number): Promise<RideMessage[]> {
    if (!this.databaseBacked()) {
      return Array.from(this.messages.values())
        .filter((message) => message.reservationId === reservationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    const db = await this.database();
    const rows = await db
      .select()
      .from(rideMessages)
      .where(eq(rideMessages.reservationId, reservationId))
      .orderBy(asc(rideMessages.createdAt));

    return rows.map(mapMessage);
  }

  async inbox(userId: number): Promise<RideConversationSummary[]> {
    if (!this.databaseBacked()) {
      const rows = Array.from(this.messages.values())
        .filter((message) => message.senderId === userId || message.receiverId === userId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      const groups = new Map<number, RideMessage[]>();
      for (const message of rows) {
        const current = groups.get(message.reservationId) || [];
        current.push(message);
        groups.set(message.reservationId, current);
      }

      return Array.from(groups.values())
        .map((messages) => {
          const last = messages[messages.length - 1];
          const offer = rideMarketplace.get(last.offerId);
          if (!offer) return undefined;
          return summaryFromMessages(messages, offer.origin, offer.destination, userId);
        })
        .filter((summary): summary is RideConversationSummary => Boolean(summary))
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    }

    const db = await this.database();
    const rows = await db
      .select({ message: rideMessages, offer: rideOffers })
      .from(rideMessages)
      .innerJoin(rideOffers, eq(rideMessages.offerId, rideOffers.id))
      .where(or(eq(rideMessages.senderId, userId), eq(rideMessages.receiverId, userId)))
      .orderBy(asc(rideMessages.createdAt));

    const groups = new Map<number, typeof rows>();
    for (const row of rows) {
      const current = groups.get(row.message.reservationId) || [];
      current.push(row);
      groups.set(row.message.reservationId, current);
    }

    return Array.from(groups.values())
      .map((group) => {
        const messages = group.map((row) => mapMessage(row.message));
        const offer = group[group.length - 1].offer;
        return summaryFromMessages(messages, offer.origin, offer.destination, userId);
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }

  async markConversationRead(reservationId: number, userId: number): Promise<void> {
    if (!this.databaseBacked()) {
      for (const message of this.messages.values()) {
        if (message.reservationId === reservationId && message.receiverId === userId && !message.isRead) {
          message.isRead = true;
          this.messages.set(message.id, message);
        }
      }
      return;
    }

    const db = await this.database();
    await db
      .update(rideMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(rideMessages.reservationId, reservationId),
          eq(rideMessages.receiverId, userId),
          eq(rideMessages.isRead, false),
        ),
      );
  }

  private async database() {
    const { db } = await import("./db");
    return db;
  }
}

function mapMessage(row: RideMessageRow): RideMessage {
  return {
    id: row.id,
    reservationId: row.reservationId,
    offerId: row.offerId,
    senderId: row.senderId,
    senderName: row.senderName,
    receiverId: row.receiverId,
    receiverName: row.receiverName,
    content: row.content,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

function summaryFromMessages(
  messages: RideMessage[],
  origin: string,
  destination: string,
  userId: number,
): RideConversationSummary {
  const last = messages[messages.length - 1];
  const counterpartId = last.senderId === userId ? last.receiverId : last.senderId;
  const counterpartName = last.senderId === userId ? last.receiverName : last.senderName;

  return {
    reservationId: last.reservationId,
    offerId: last.offerId,
    origin,
    destination,
    counterpartId,
    counterpartName,
    lastMessage: last.content,
    lastMessageAt: last.createdAt,
    unreadCount: messages.filter((message) => message.receiverId === userId && !message.isRead).length,
  };
}

export const rideMessageStore = new RideMessageStore();
