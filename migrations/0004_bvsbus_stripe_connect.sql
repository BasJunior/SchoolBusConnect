-- Stripe Connect payout mappings and payment references for BVSBus.
ALTER TABLE "ride_reservations"
  ADD COLUMN IF NOT EXISTS "checkout_session_id" text,
  ADD COLUMN IF NOT EXISTS "charge_id" text,
  ADD COLUMN IF NOT EXISTS "transfer_id" text,
  ADD COLUMN IF NOT EXISTS "transfer_status" text NOT NULL DEFAULT 'not_ready';

CREATE UNIQUE INDEX IF NOT EXISTS "ride_reservations_checkout_session_idx"
  ON "ride_reservations" ("checkout_session_id")
  WHERE "checkout_session_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "ride_reservations_charge_idx"
  ON "ride_reservations" ("charge_id")
  WHERE "charge_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "ride_driver_accounts" (
  "id" serial PRIMARY KEY,
  "driver_id" integer NOT NULL,
  "driver_name" text NOT NULL,
  "stripe_account_id" text NOT NULL,
  "country" text NOT NULL DEFAULT 'DE',
  "details_submitted" boolean NOT NULL DEFAULT false,
  "payouts_enabled" boolean NOT NULL DEFAULT false,
  "charges_enabled" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "ride_driver_accounts_driver_idx"
  ON "ride_driver_accounts" ("driver_id");

CREATE UNIQUE INDEX IF NOT EXISTS "ride_driver_accounts_stripe_idx"
  ON "ride_driver_accounts" ("stripe_account_id");
