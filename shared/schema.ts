import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  profilePicture: text("profile_picture"), // URL or base64 encoded image
  dateOfBirth: text("date_of_birth"), // YYYY-MM-DD format
  gender: text("gender"), // "male" | "female" | "other" | "prefer_not_to_say"
  address: text("address"),
  city: text("city").default("Harare"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  userType: text("user_type").notNull().default("passenger"), // "passenger" | "driver" | "admin"
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  // Driver-specific fields
  licenseNumber: text("license_number"), // Required for drivers
  licenseExpiryDate: text("license_expiry_date"), // YYYY-MM-DD format
  experienceYears: integer("experience_years"), // Years of driving experience
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"), // Average rating from passengers
  totalTrips: integer("total_trips").default(0), // Total completed trips
  profileCompleteness: integer("profile_completeness").default(0), // 0-100 percentage
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  pickupPoints: text("pickup_points").array().notNull(),
  dropoffPoints: text("dropoff_points").array().notNull(),
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }).notNull(),
  estimatedDuration: integer("estimated_duration").notNull(), // in minutes
  maxSeats: integer("max_seats").notNull(),
  isActive: boolean("is_active").default(true),
  routeType: text("route_type").notNull(), // "school" | "work" | "general"
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vehicleNumber: text("vehicle_number").notNull().unique(),
  driverId: integer("driver_id").references(() => users.id),
  capacity: integer("capacity").notNull(),
  vehicleType: text("vehicle_type").notNull().default("omnibus"),
  make: text("make"), // Toyota, Nissan, etc.
  model: text("model"), // Hiace, Quantum, etc.
  year: integer("year"), // Manufacturing year
  color: text("color"),
  fuelType: text("fuel_type").default("petrol"), // "petrol" | "diesel" | "electric" | "hybrid"
  insuranceNumber: text("insurance_number"),
  insuranceExpiryDate: text("insurance_expiry_date"), // YYYY-MM-DD format
  lastServiceDate: text("last_service_date"), // YYYY-MM-DD format
  roadworthyExpiryDate: text("roadworthy_expiry_date"), // YYYY-MM-DD format
  features: text("features").array(), // ["air_conditioning", "wifi", "usb_charging", "music_system"]
  vehiclePhotos: text("vehicle_photos").array(), // URLs to vehicle photos
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").references(() => routes.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  departureTime: text("departure_time").notNull(), // HH:MM format
  arrivalTime: text("arrival_time").notNull(),
  daysOfWeek: text("days_of_week").array().notNull(), // ["monday", "tuesday", etc.]
  isActive: boolean("is_active").default(true),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingNumber: text("booking_number").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  scheduleId: integer("schedule_id").references(() => schedules.id),
  pickupPoint: text("pickup_point").notNull(),
  dropoffPoint: text("dropoff_point").notNull(),
  customPickupPoint: text("custom_pickup_point"), // User's custom pickup location
  customDropoffPoint: text("custom_dropoff_point"), // User's custom dropoff location
  pickupCoordinates: text("pickup_coordinates"), // "lat,lng" format
  dropoffCoordinates: text("dropoff_coordinates"), // "lat,lng" format
  bookingType: text("booking_type").notNull().default("standard"), // "standard" | "custom"
  numberOfSeats: integer("number_of_seats").notNull().default(1),
  totalFare: decimal("total_fare", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "confirmed" | "driver_alternative" | "in_transit" | "completed" | "cancelled"
  driverResponse: text("driver_response"), // "accepted" | "alternative_offered" | "declined"
  alternativePickup: text("alternative_pickup"), // Driver's alternative pickup suggestion
  alternativeDropoff: text("alternative_dropoff"), // Driver's alternative dropoff suggestion
  driverNotes: text("driver_notes"), // Driver's message to passenger
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending" | "paid" | "refunded"
  paymentMethod: text("payment_method"),
  bookingDate: timestamp("booking_date").defaultNow(),
  travelDate: text("travel_date").notNull(), // YYYY-MM-DD format
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  routeId: integer("route_id").references(() => routes.id).notNull(),
  packageType: text("package_type").notNull(), // "1month" | "3months" | "6months" | "12months"
  startDate: text("start_date").notNull(), // YYYY-MM-DD format
  endDate: text("end_date").notNull(), // YYYY-MM-DD format
  totalFare: decimal("total_fare", { precision: 10, scale: 2 }).notNull(),
  discountApplied: decimal("discount_applied", { precision: 5, scale: 2 }).notNull().default("0.00"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending" | "paid" | "expired"
  status: text("status").notNull().default("active"), // "active" | "paused" | "cancelled" | "expired"
  ridesUsed: integer("rides_used").notNull().default(0),
  maxRides: integer("max_rides").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const vehicleTracking = pgTable("vehicle_tracking", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  speed: decimal("speed", { precision: 5, scale: 2 }), // km/h
  heading: integer("heading"), // degrees 0-360  
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }), // meters
  timestamp: timestamp("timestamp").defaultNow(),
  status: text("status").notNull().default("active"), // "active" | "idle" | "offline"
});

// Driver-configured routes table
export const driverRoutes = pgTable("driver_routes", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  name: text("name").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  originCoordinates: text("origin_coordinates").notNull(), // "lat,lng" format
  destinationCoordinates: text("destination_coordinates").notNull(), // "lat,lng" format
  pickupPoints: text("pickup_points").array().notNull(),
  dropoffPoints: text("dropoff_points").array().notNull(),
  pickupCoordinates: text("pickup_coordinates").array().notNull(), // Array of "lat,lng" strings
  dropoffCoordinates: text("dropoff_coordinates").array().notNull(), // Array of "lat,lng" strings
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }).notNull(),
  pricePerKm: decimal("price_per_km", { precision: 10, scale: 2 }).notNull().default("0.50"),
  estimatedDuration: integer("estimated_duration").notNull(), // in minutes
  maxSeats: integer("max_seats").notNull(),
  daysOfWeek: text("days_of_week").array().notNull(), // ["monday", "tuesday", etc.]
  departureTime: text("departure_time").notNull(), // HH:MM format
  arrivalTime: text("arrival_time").notNull(), // HH:MM format
  routeType: text("route_type").notNull(), // "school" | "work" | "general" | "custom"
  serviceArea: text("service_area").notNull(), // Area name/description driver operates in
  isActive: boolean("is_active").default(true),
  isAvailable: boolean("is_available").default(true), // Driver availability status
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver availability tracking
export const driverAvailability = pgTable("driver_availability", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }).notNull(),
  currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }).notNull(),
  serviceRadius: decimal("service_radius", { precision: 8, scale: 2 }).notNull().default("5.0"), // km radius
  status: text("status").notNull().default("offline"), // "online" | "busy" | "offline"
  isAcceptingBookings: boolean("is_accepting_bookings").default(true),
  lastLocationUpdate: timestamp("last_location_update").defaultNow(),
  onlineAt: timestamp("online_at"),
  offlineAt: timestamp("offline_at"),
});

// BVSBus marketplace persistence
export const rideOffers = pgTable("ride_offers", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  driverName: text("driver_name").notNull(),
  driverRating: decimal("driver_rating", { precision: 3, scale: 2 }).notNull().default("0.00"),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureAt: timestamp("departure_at", { withTimezone: true }).notNull(),
  seatsTotal: integer("seats_total").notNull(),
  seatsAvailable: integer("seats_available").notNull(),
  pricePerSeat: decimal("price_per_seat", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleColor: text("vehicle_color"),
  vehiclePlate: text("vehicle_plate"),
  instantBooking: boolean("instant_booking").notNull().default(true),
  luggage: text("luggage").notNull().default("medium"),
  petsAllowed: boolean("pets_allowed").notNull().default(false),
  smokingAllowed: boolean("smoking_allowed").notNull().default(false),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rideReservations = pgTable("ride_reservations", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").references(() => rideOffers.id, { onDelete: "cascade" }).notNull(),
  passengerId: integer("passenger_id").notNull(),
  passengerName: text("passenger_name").notNull(),
  seats: integer("seats").notNull(),
  rideSubtotal: decimal("ride_subtotal", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  status: text("status").notNull().default("confirmed"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentProvider: text("payment_provider"),
  paymentIntentId: text("payment_intent_id"),
  refundStatus: text("refund_status").notNull().default("not_required"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rideMessages = pgTable("ride_messages", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").references(() => rideReservations.id, { onDelete: "cascade" }).notNull(),
  offerId: integer("offer_id").references(() => rideOffers.id, { onDelete: "cascade" }).notNull(),
  senderId: integer("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  receiverId: integer("receiver_id").notNull(),
  receiverName: text("receiver_name").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActiveAt: true,
});

export const updateUserSchema = insertUserSchema.partial();

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingNumber: true,
  bookingDate: true,
}).extend({
  pickupPoint: z.string().optional(),
  dropoffPoint: z.string().optional(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertVehicleTrackingSchema = createInsertSchema(vehicleTracking).omit({
  id: true,
  timestamp: true,
});

export const insertDriverRouteSchema = createInsertSchema(driverRoutes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActiveAt: true,
});

export const insertDriverAvailabilitySchema = createInsertSchema(driverAvailability).omit({
  id: true,
  lastLocationUpdate: true,
  onlineAt: true,
  offlineAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type VehicleTracking = typeof vehicleTracking.$inferSelect;
export type InsertVehicleTracking = z.infer<typeof insertVehicleTrackingSchema>;
export type DriverRoute = typeof driverRoutes.$inferSelect;
export type InsertDriverRoute = z.infer<typeof insertDriverRouteSchema>;
export type DriverAvailability = typeof driverAvailability.$inferSelect;
export type InsertDriverAvailability = z.infer<typeof insertDriverAvailabilitySchema>;

export type RideOfferRow = typeof rideOffers.$inferSelect;
export type InsertRideOfferRow = typeof rideOffers.$inferInsert;
export type RideReservationRow = typeof rideReservations.$inferSelect;
export type InsertRideReservationRow = typeof rideReservations.$inferInsert;
export type RideMessageRow = typeof rideMessages.$inferSelect;
export type InsertRideMessageRow = typeof rideMessages.$inferInsert;

// Additional types for API responses
export type RouteWithSchedules = Route & {
  schedules: (Schedule & {
    vehicle: Vehicle & {
      driver: User;
    };
  })[];
};

export type BookingWithDetails = Booking & {
  schedule: Schedule & {
    route: Route;
    vehicle: Vehicle & {
      driver: User;
    };
  };
};

export type DriverRouteWithDetails = DriverRoute & {
  driver: User;
  vehicle: Vehicle;
  availability?: DriverAvailability;
};

export type AvailableDriver = {
  driver: User;
  vehicle: Vehicle;
  availability: DriverAvailability;
  routes: DriverRoute[];
  distance: number; // Distance from booking location in km
  estimatedArrival: number; // Minutes
};


// BVSBus peer-to-peer ride marketplace contracts shared by the API and client.
export const createRideOfferSchema = z.object({
  driverId: z.number().int().positive(),
  origin: z.string().min(2),
  destination: z.string().min(2),
  departureAt: z.string().min(10),
  seatsTotal: z.number().int().min(1).max(8),
  pricePerSeat: z.number().positive(),
  currency: z.string().length(3).default("EUR"),
  vehicle: z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    color: z.string().optional(),
    plate: z.string().optional(),
  }),
  preferences: z.object({
    instantBooking: z.boolean().default(true),
    luggage: z.enum(["small", "medium", "large"]).default("medium"),
    petsAllowed: z.boolean().default(false),
    smokingAllowed: z.boolean().default(false),
  }).default({
    instantBooking: true,
    luggage: "medium",
    petsAllowed: false,
    smokingAllowed: false,
  }),
});

export const reserveRideSchema = z.object({
  passengerId: z.number().int().positive(),
  seats: z.number().int().min(1).max(8).default(1),
});

export type CreateRideOffer = z.infer<typeof createRideOfferSchema>;
export type ReserveRide = z.infer<typeof reserveRideSchema>;

export type RideOffer = CreateRideOffer & {
  id: number;
  driverName: string;
  driverRating: number;
  seatsAvailable: number;
  status: "published" | "sold_out" | "in_progress" | "cancelled" | "completed";
  createdAt: string;
};

export type RideReservation = {
  id: number;
  offerId: number;
  passengerId: number;
  passengerName: string;
  seats: number;
  rideSubtotal: number;
  serviceFee: number;
  total: number;
  currency: string;
  status: "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  paymentProvider: "stripe" | null;
  paymentIntentId: string | null;
  refundStatus: "not_required" | "pending" | "succeeded" | "failed";
  createdAt: string;
};


export type RideMessage = {
  id: number;
  reservationId: number;
  offerId: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export type RideConversationSummary = {
  reservationId: number;
  offerId: number;
  origin: string;
  destination: string;
  counterpartId: number;
  counterpartName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};
