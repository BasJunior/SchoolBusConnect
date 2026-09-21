-- Payment lifecycle fields for BVSBus reservations.
-- No payment processor is invoked by this migration; these fields are integration hooks.
ALTER TABLE "ride_reservations"
  ADD COLUMN IF NOT EXISTS "payment_status" text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS "payment_provider" text,
  ADD COLUMN IF NOT EXISTS "payment_intent_id" text,
  ADD COLUMN IF NOT EXISTS "refund_status" text NOT NULL DEFAULT 'not_required';

CREATE INDEX IF NOT EXISTS "ride_reservations_payment_intent_idx"
  ON "ride_reservations" ("payment_intent_id")
  WHERE "payment_intent_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "ride_reservations_payment_status_idx"
  ON "ride_reservations" ("payment_status", "created_at");
