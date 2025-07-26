import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBookingSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment verification
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "omnibus-transport-api" 
    });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Login failed", error });
    }
  });

  // Routes
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getActiveRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch routes", error });
    }
  });

  app.get("/api/routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const route = await storage.getRouteWithSchedules(id);
      
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json(route);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch route", error });
    }
  });

  // Schedules
  app.get("/api/schedules/available", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      
      const schedules = await storage.getAvailableSchedules(date);
      
      // Enrich schedules with route and vehicle information
      const enrichedSchedules = await Promise.all(
        schedules.map(async (schedule) => {
          const route = await storage.getRoute(schedule.routeId);
          const vehicle = await storage.getVehicle(schedule.vehicleId!);
          const driver = vehicle?.driverId ? await storage.getUser(vehicle.driverId) : undefined;
          
          return {
            ...schedule,
            route,
            vehicle: vehicle ? {
              ...vehicle,
              driver
            } : undefined
          };
        })
      );
      
      res.json(enrichedSchedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available schedules", error });
    }
  });

  // Bookings
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Handle custom bookings (without scheduleId)
      if (!bookingData.scheduleId && bookingData.bookingType === 'custom') {
        // Custom booking - store coordinates if provided
        if (bookingData.pickupCoords && bookingData.dropoffCoords) {
          bookingData.pickupCoordinates = `${bookingData.pickupCoords[0]},${bookingData.pickupCoords[1]}`;
          bookingData.dropoffCoordinates = `${bookingData.dropoffCoords[0]},${bookingData.dropoffCoords[1]}`;
        }
        
        // Set status for driver approval
        bookingData.status = 'pending_driver_confirmation';
        
        const booking = await storage.createBooking(bookingData);
        const bookingWithDetails = await storage.getBookingWithDetails(booking.id);
        
        return res.json(bookingWithDetails);
      }
      
      // Standard booking with schedule validation
      if (!bookingData.scheduleId) {
        return res.status(400).json({ message: "Schedule ID is required for standard bookings" });
      }
      
      const schedule = await storage.getSchedule(bookingData.scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Check seat availability for standard bookings
      const existingBookings = await storage.getBookings();
      const existingSeatsForSchedule = existingBookings
        .filter(b => b.scheduleId === bookingData.scheduleId && 
                    b.travelDate === bookingData.travelDate &&
                    b.status !== 'cancelled')
        .reduce((total, b) => total + b.numberOfSeats, 0);

      const vehicle = await storage.getVehicle(schedule.vehicleId!);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      if (existingSeatsForSchedule + (bookingData.numberOfSeats || 1) > vehicle.capacity) {
        return res.status(400).json({ message: "Not enough seats available" });
      }

      const booking = await storage.createBooking(bookingData);
      const bookingWithDetails = await storage.getBookingWithDetails(booking.id);
      
      res.json(bookingWithDetails);
    } catch (error) {
      res.status(400).json({ message: "Failed to create booking", error });
    }
  });

  app.get("/api/bookings/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user bookings", error });
    }
  });

  app.get("/api/bookings/driver/:driverId", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const bookings = await storage.getDriverBookings(driverId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver bookings", error });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const booking = await storage.updateBooking(id, updates);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const bookingWithDetails = await storage.getBookingWithDetails(booking.id);
      res.json(bookingWithDetails);
    } catch (error) {
      res.status(400).json({ message: "Failed to update booking", error });
    }
  });

  // Messages
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Failed to send message", error });
    }
  });

  app.get("/api/messages/conversation", async (req, res) => {
    try {
      const { userId1, userId2 } = req.query;
      
      if (!userId1 || !userId2) {
        return res.status(400).json({ message: "Both user IDs are required" });
      }
      
      const messages = await storage.getConversation(
        parseInt(userId1 as string), 
        parseInt(userId2 as string)
      );
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation", error });
    }
  });

  // Vehicles (for driver interface)
  app.get("/api/vehicles/driver/:driverId", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const vehicles = await storage.getVehiclesByDriver(driverId);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver vehicles", error });
    }
  });

  // User profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user", error });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user", error });
    }
  });

  // Subscription routes
  app.get("/api/subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/subscriptions/user", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const subscriptions = await storage.getUserSubscriptions(userId);
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const subscriptionData = req.body;
      const subscription = await storage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Booking response routes for drivers
  app.patch("/api/bookings/:id/driver-response", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { driverResponse, alternativePickup, alternativeDropoff, driverNotes } = req.body;
      
      const updatedBooking = await storage.updateBooking(bookingId, {
        driverResponse,
        alternativePickup,
        alternativeDropoff,
        driverNotes,
        status: driverResponse === "accepted" ? "confirmed" : 
                driverResponse === "alternative_offered" ? "driver_alternative" : "cancelled"
      });
      
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(updatedBooking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User response to driver alternatives
  app.patch("/api/bookings/:id/user-response", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { userResponse } = req.body;
      
      const updatedBooking = await storage.updateBooking(bookingId, {
        status: userResponse === "accepted" ? "confirmed" : "cancelled"
      });
      
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(updatedBooking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Live tracking endpoints
  app.get("/api/tracking/:bookingId", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Simulate live tracking data (in production, this would come from GPS devices)
      const mockTrackingData = {
        bookingId,
        vehicleId: booking.schedule?.vehicleId || 1,
        driverName: booking.schedule?.vehicle?.driver?.fullName || "Driver",
        driverPhone: booking.schedule?.vehicle?.driver?.phone || "+263 77 123 4567",
        vehicleNumber: booking.schedule?.vehicle?.vehicleNumber || "ABC-123",
        currentLocation: {
          lat: -17.8200 + (Math.random() - 0.5) * 0.01,
          lng: 31.0400 + (Math.random() - 0.5) * 0.01,
          timestamp: new Date().toISOString()
        },
        pickupLocation: {
          name: booking.customPickupPoint || booking.pickupPoint,
          coords: booking.pickupCoordinates 
            ? booking.pickupCoordinates.split(',').map(Number) as [number, number]
            : [-17.7840, 31.0547] as [number, number]
        },
        dropoffLocation: {
          name: booking.customDropoffPoint || booking.dropoffPoint,
          coords: booking.dropoffCoordinates 
            ? booking.dropoffCoordinates.split(',').map(Number) as [number, number]
            : [-17.8292, 31.0522] as [number, number]
        },
        status: booking.status,
        estimatedArrival: "5-10 minutes",
        routeProgress: Math.min(90, Math.random() * 100),
        totalDistance: 12.5,
        remainingDistance: Math.random() * 8
      };

      res.json(mockTrackingData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tracking data", error });
    }
  });

  // Update vehicle location (for drivers)
  app.post("/api/tracking/update-location", async (req, res) => {
    try {
      const { vehicleId, bookingId, latitude, longitude, speed, heading } = req.body;
      
      // In production, this would update the vehicle_tracking table
      // For now, we'll just acknowledge the update
      
      res.json({ 
        success: true, 
        message: "Location updated successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update location", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
