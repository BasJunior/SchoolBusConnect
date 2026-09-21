import { eq } from "drizzle-orm";
import {
  rideDriverAccounts,
  type RideDriverAccountRow,
  type StripeConnectStatus,
} from "@shared/schema";

type DriverAccountSnapshot = {
  id: number;
  driverId: number;
  driverName: string;
  stripeAccountId: string;
  country: string;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

class StripeConnectStore {
  private accounts = new Map<number, DriverAccountSnapshot>();
  private nextId = 1;

  isDatabaseBacked() {
    return Boolean(process.env.DATABASE_URL);
  }

  async get(driverId: number): Promise<DriverAccountSnapshot | undefined> {
    if (!this.isDatabaseBacked()) return this.accounts.get(driverId);

    const db = await this.database();
    const [row] = await db
      .select()
      .from(rideDriverAccounts)
      .where(eq(rideDriverAccounts.driverId, driverId))
      .limit(1);

    return row ? mapRow(row) : undefined;
  }

  async save(input: {
    driverId: number;
    driverName: string;
    stripeAccountId: string;
    country?: string;
    detailsSubmitted?: boolean;
    payoutsEnabled?: boolean;
    chargesEnabled?: boolean;
  }): Promise<DriverAccountSnapshot> {
    if (!this.isDatabaseBacked()) {
      const existing = this.accounts.get(input.driverId);
      const now = new Date().toISOString();
      const snapshot: DriverAccountSnapshot = {
        id: existing?.id ?? this.nextId++,
        driverId: input.driverId,
        driverName: input.driverName,
        stripeAccountId: input.stripeAccountId,
        country: input.country || existing?.country || "DE",
        detailsSubmitted: input.detailsSubmitted ?? existing?.detailsSubmitted ?? false,
        payoutsEnabled: input.payoutsEnabled ?? existing?.payoutsEnabled ?? false,
        chargesEnabled: input.chargesEnabled ?? existing?.chargesEnabled ?? false,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      this.accounts.set(input.driverId, snapshot);
      return snapshot;
    }

    const db = await this.database();
    const existing = await this.get(input.driverId);

    if (existing) {
      const [row] = await db
        .update(rideDriverAccounts)
        .set({
          driverName: input.driverName,
          stripeAccountId: input.stripeAccountId,
          country: input.country || existing.country,
          detailsSubmitted: input.detailsSubmitted ?? existing.detailsSubmitted,
          payoutsEnabled: input.payoutsEnabled ?? existing.payoutsEnabled,
          chargesEnabled: input.chargesEnabled ?? existing.chargesEnabled,
          updatedAt: new Date(),
        })
        .where(eq(rideDriverAccounts.driverId, input.driverId))
        .returning();

      return mapRow(row);
    }

    const [row] = await db
      .insert(rideDriverAccounts)
      .values({
        driverId: input.driverId,
        driverName: input.driverName,
        stripeAccountId: input.stripeAccountId,
        country: input.country || "DE",
        detailsSubmitted: input.detailsSubmitted ?? false,
        payoutsEnabled: input.payoutsEnabled ?? false,
        chargesEnabled: input.chargesEnabled ?? false,
      })
      .returning();

    return mapRow(row);
  }

  async updateStripeState(
    driverId: number,
    state: {
      detailsSubmitted: boolean;
      payoutsEnabled: boolean;
      chargesEnabled: boolean;
      country?: string;
    },
  ): Promise<DriverAccountSnapshot | undefined> {
    const existing = await this.get(driverId);
    if (!existing) return undefined;

    return this.save({
      driverId,
      driverName: existing.driverName,
      stripeAccountId: existing.stripeAccountId,
      country: state.country || existing.country,
      detailsSubmitted: state.detailsSubmitted,
      payoutsEnabled: state.payoutsEnabled,
      chargesEnabled: state.chargesEnabled,
    });
  }

  async status(driverId: number): Promise<StripeConnectStatus> {
    const account = await this.get(driverId);
    return {
      driverId,
      stripeAccountId: account?.stripeAccountId || null,
      detailsSubmitted: account?.detailsSubmitted || false,
      payoutsEnabled: account?.payoutsEnabled || false,
      chargesEnabled: account?.chargesEnabled || false,
      readyForPayouts: Boolean(account?.detailsSubmitted && account?.payoutsEnabled),
    };
  }

  private async database() {
    const { db } = await import("./db");
    return db;
  }
}

function mapRow(row: RideDriverAccountRow): DriverAccountSnapshot {
  return {
    id: row.id,
    driverId: row.driverId,
    driverName: row.driverName,
    stripeAccountId: row.stripeAccountId,
    country: row.country,
    detailsSubmitted: row.detailsSubmitted,
    payoutsEnabled: row.payoutsEnabled,
    chargesEnabled: row.chargesEnabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const stripeConnectStore = new StripeConnectStore();
