-- Ride-linked passenger/driver messages for BVSBus.
CREATE TABLE IF NOT EXISTS "ride_messages" (
  "id" serial PRIMARY KEY,
  "reservation_id" integer NOT NULL REFERENCES "ride_reservations"("id") ON DELETE CASCADE,
  "offer_id" integer NOT NULL REFERENCES "ride_offers"("id") ON DELETE CASCADE,
  "sender_id" integer NOT NULL,
  "sender_name" text NOT NULL,
  "receiver_id" integer NOT NULL,
  "receiver_name" text NOT NULL,
  "content" text NOT NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ride_messages_reservation_idx"
  ON "ride_messages" ("reservation_id", "created_at");

CREATE INDEX IF NOT EXISTS "ride_messages_sender_idx"
  ON "ride_messages" ("sender_id", "created_at");

CREATE INDEX IF NOT EXISTS "ride_messages_receiver_idx"
  ON "ride_messages" ("receiver_id", "created_at");
