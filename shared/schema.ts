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
  userType: text("user_type").notNull().default("passenger"), // "passenger" | "driver" | "admin"
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
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
  isActive: boolean("is_active").default(true),
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
  scheduleId: integer("schedule_id").references(() => schedules.id).notNull(),
  pickupPoint: text("pickup_point").notNull(),
  dropoffPoint: text("dropoff_point").notNull(),
  customPickupPoint: text("custom_pickup_point"), // User's custom pickup location
  customDropoffPoint: text("custom_dropoff_point"), // User's custom dropoff location
  pickupCoordinates: text("pickup_coordinates"), // "lat,lng" format
  dropoffCoordinates: text("dropoff_coordinates"), // "lat,lng" format
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingNumber: true,
  bookingDate: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
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
