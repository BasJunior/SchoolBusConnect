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
