-- BVSBus marketplace persistence
CREATE TABLE IF NOT EXISTS "ride_offers" (
  "id" serial PRIMARY KEY,
  "driver_id" integer NOT NULL,
  "driver_name" text NOT NULL,
  "driver_rating" numeric(3,2) NOT NULL DEFAULT '0.00',
  "origin" text NOT NULL,
  "destination" text NOT NULL,
  "departure_at" timestamptz NOT NULL,
  "seats_total" integer NOT NULL CHECK ("seats_total" BETWEEN 1 AND 8),
  "seats_available" integer NOT NULL CHECK ("seats_available" >= 0),
  "price_per_seat" numeric(10,2) NOT NULL CHECK ("price_per_seat" > 0),
  "currency" text NOT NULL DEFAULT 'EUR',
  "vehicle_make" text NOT NULL,
  "vehicle_model" text NOT NULL,
  "vehicle_color" text,
  "vehicle_plate" text,
  "instant_booking" boolean NOT NULL DEFAULT true,
  "luggage" text NOT NULL DEFAULT 'medium',
  "pets_allowed" boolean NOT NULL DEFAULT false,
  "smoking_allowed" boolean NOT NULL DEFAULT false,
  "status" text NOT NULL DEFAULT 'published',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ride_offers_seat_inventory" CHECK ("seats_available" <= "seats_total")
);

CREATE INDEX IF NOT EXISTS "ride_offers_search_idx"
  ON "ride_offers" ("status", "departure_at");

CREATE INDEX IF NOT EXISTS "ride_offers_driver_idx"
  ON "ride_offers" ("driver_id", "departure_at");

CREATE TABLE IF NOT EXISTS "ride_reservations" (
  "id" serial PRIMARY KEY,
  "offer_id" integer NOT NULL REFERENCES "ride_offers"("id") ON DELETE CASCADE,
  "passenger_id" integer NOT NULL,
  "passenger_name" text NOT NULL,
  "seats" integer NOT NULL CHECK ("seats" BETWEEN 1 AND 8),
  "ride_subtotal" numeric(10,2) NOT NULL,
  "service_fee" numeric(10,2) NOT NULL,
  "total" numeric(10,2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'EUR',
  "status" text NOT NULL DEFAULT 'confirmed',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ride_reservations_passenger_idx"
  ON "ride_reservations" ("passenger_id", "created_at");

CREATE INDEX IF NOT EXISTS "ride_reservations_offer_idx"
  ON "ride_reservations" ("offer_id", "created_at");
