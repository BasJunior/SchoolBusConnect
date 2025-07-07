import { 
  users, routes, vehicles, schedules, bookings, messages,
  type User, type InsertUser,
  type Route, type InsertRoute,
  type Vehicle, type InsertVehicle,
  type Schedule, type InsertSchedule,
  type Booking, type InsertBooking,
  type Message, type InsertMessage,
  type RouteWithSchedules,
  type BookingWithDetails
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Route operations
  getRoutes(): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  getRouteWithSchedules(id: number): Promise<RouteWithSchedules | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, updates: Partial<Route>): Promise<Route | undefined>;
  getActiveRoutes(): Promise<Route[]>;

  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle | undefined>;
  getVehiclesByDriver(driverId: number): Promise<Vehicle[]>;

  // Schedule operations
  getSchedules(): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, updates: Partial<Schedule>): Promise<Schedule | undefined>;
  getSchedulesByRoute(routeId: number): Promise<Schedule[]>;
  getAvailableSchedules(date: string): Promise<Schedule[]>;

  // Booking operations
  getBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingWithDetails(id: number): Promise<BookingWithDetails | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<BookingWithDetails[]>;
  getDriverBookings(driverId: number): Promise<BookingWithDetails[]>;

  // Message operations
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: number, userId2: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private routes: Map<number, Route>;
  private vehicles: Map<number, Vehicle>;
  private schedules: Map<number, Schedule>;
  private bookings: Map<number, Booking>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentRouteId: number;
  private currentVehicleId: number;
  private currentScheduleId: number;
  private currentBookingId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.routes = new Map();
    this.vehicles = new Map();
    this.schedules = new Map();
    this.bookings = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentRouteId = 1;
    this.currentVehicleId = 1;
    this.currentScheduleId = 1;
    this.currentBookingId = 1;
    this.currentMessageId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Create demo users
    const demoUsers = [
      {
        username: "john_doe",
        email: "john@example.com",
        password: "password123",
        fullName: "John Doe",
        phone: "+1234567890",
        userType: "passenger" as const,
        isVerified: true,
      },
      {
        username: "driver_mike",
        email: "mike@example.com",
        password: "password123",
        fullName: "Mike Johnson",
        phone: "+1234567891",
        userType: "driver" as const,
        isVerified: true,
      }
    ];

    demoUsers.forEach(user => this.createUser(user));

    // Create demo routes
    const demoRoutes = [
      {
        name: "City Center → University",
        origin: "City Center",
        destination: "University",
        pickupPoints: ["Central Station", "City Hall", "Shopping Mall"],
        dropoffPoints: ["University Main Gate", "Student Center", "Engineering Building", "Library Complex"],
        baseFare: "3.50",
        estimatedDuration: 25,
        maxSeats: 35,
        routeType: "school" as const,
        isActive: true,
      },
      {
        name: "Downtown → Tech Park",
        origin: "Downtown",
        destination: "Tech Park",
        pickupPoints: ["Downtown Central", "Business District", "Metro Station"],
        dropoffPoints: ["Tech Park Main", "Innovation Center", "Corporate Plaza"],
        baseFare: "4.25",
        estimatedDuration: 30,
        maxSeats: 40,
        routeType: "work" as const,
        isActive: true,
      }
    ];

    demoRoutes.forEach(route => this.createRoute(route));

    // Create demo vehicles
    const demoVehicles = [
      {
        vehicleNumber: "BUS-247",
        driverId: 2,
        capacity: 35,
        vehicleType: "omnibus",
        isActive: true,
      },
      {
        vehicleNumber: "BUS-358",
        driverId: 2,
        capacity: 40,
        vehicleType: "omnibus",
        isActive: true,
      }
    ];

    demoVehicles.forEach(vehicle => this.createVehicle(vehicle));

    // Create demo schedules
    const demoSchedules = [
      {
        routeId: 1,
        vehicleId: 1,
        departureTime: "15:30",
        arrivalTime: "15:55",
        daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        isActive: true,
      },
      {
        routeId: 2,
        vehicleId: 2,
        departureTime: "15:45",
        arrivalTime: "16:15",
        daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        isActive: true,
      }
    ];

    demoSchedules.forEach(schedule => this.createSchedule(schedule));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      phone: insertUser.phone || null,
      userType: insertUser.userType || "passenger",
      isVerified: insertUser.isVerified || false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Route operations
  async getRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async getRouteWithSchedules(id: number): Promise<RouteWithSchedules | undefined> {
    const route = this.routes.get(id);
    if (!route) return undefined;

    const schedules = Array.from(this.schedules.values())
      .filter(schedule => schedule.routeId === id)
      .map(schedule => {
        const vehicle = this.vehicles.get(schedule.vehicleId!);
        const driver = vehicle?.driverId ? this.users.get(vehicle.driverId) : undefined;
        return {
          ...schedule,
          vehicle: vehicle ? {
            ...vehicle,
            driver: driver!
          } : {} as any
        };
      });

    return { ...route, schedules };
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = this.currentRouteId++;
    const route: Route = { 
      ...insertRoute, 
      id,
      isActive: insertRoute.isActive ?? true
    };
    this.routes.set(id, route);
    return route;
  }

  async updateRoute(id: number, updates: Partial<Route>): Promise<Route | undefined> {
    const route = this.routes.get(id);
    if (!route) return undefined;
    
    const updatedRoute = { ...route, ...updates };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }

  async getActiveRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values()).filter(route => route.isActive);
  }

  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentVehicleId++;
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id,
      driverId: insertVehicle.driverId || null,
      isActive: insertVehicle.isActive ?? true,
      vehicleType: insertVehicle.vehicleType || "omnibus"
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    
    const updatedVehicle = { ...vehicle, ...updates };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async getVehiclesByDriver(driverId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(vehicle => vehicle.driverId === driverId);
  }

  // Schedule operations
  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentScheduleId++;
    const schedule: Schedule = { 
      ...insertSchedule, 
      id,
      isActive: insertSchedule.isActive ?? true
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...updates };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async getSchedulesByRoute(routeId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(schedule => schedule.routeId === routeId);
  }

  async getAvailableSchedules(date: string): Promise<Schedule[]> {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return Array.from(this.schedules.values()).filter(schedule => 
      schedule.isActive && schedule.daysOfWeek?.includes(dayOfWeek)
    );
  }

  // Booking operations
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingWithDetails(id: number): Promise<BookingWithDetails | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const schedule = this.schedules.get(booking.scheduleId);
    if (!schedule) return undefined;

    const route = this.routes.get(schedule.routeId);
    const vehicle = this.vehicles.get(schedule.vehicleId!);
    const driver = vehicle?.driverId ? this.users.get(vehicle.driverId) : undefined;

    return {
      ...booking,
      schedule: {
        ...schedule,
        route: route!,
        vehicle: {
          ...vehicle!,
          driver: driver!
        }
      }
    };
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const bookingNumber = `BK${Date.now()}${id}`;
    const booking: Booking = {
      ...insertBooking,
      id,
      bookingNumber,
      bookingDate: new Date(),
      status: insertBooking.status || "confirmed",
      numberOfSeats: insertBooking.numberOfSeats || 1,
      paymentStatus: insertBooking.paymentStatus || "pending",
      paymentMethod: insertBooking.paymentMethod || null
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async getUserBookings(userId: number): Promise<BookingWithDetails[]> {
    const userBookings = Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
    const bookingsWithDetails = await Promise.all(
      userBookings.map(booking => this.getBookingWithDetails(booking.id))
    );
    return bookingsWithDetails.filter(Boolean) as BookingWithDetails[];
  }

  async getDriverBookings(driverId: number): Promise<BookingWithDetails[]> {
    const driverVehicles = await this.getVehiclesByDriver(driverId);
    const vehicleIds = driverVehicles.map(v => v.id);
    
    const driverSchedules = Array.from(this.schedules.values()).filter(schedule => 
      vehicleIds.includes(schedule.vehicleId!)
    );
    const scheduleIds = driverSchedules.map(s => s.id);
    
    const driverBookings = Array.from(this.bookings.values()).filter(booking => 
      scheduleIds.includes(booking.scheduleId)
    );
    
    const bookingsWithDetails = await Promise.all(
      driverBookings.map(booking => this.getBookingWithDetails(booking.id))
    );
    return bookingsWithDetails.filter(Boolean) as BookingWithDetails[];
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      bookingId: insertMessage.bookingId || null,
      isRead: insertMessage.isRead ?? false
    };
    this.messages.set(id, message);
    return message;
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(message => 
      (message.senderId === userId1 && message.receiverId === userId2) ||
      (message.senderId === userId2 && message.receiverId === userId1)
    ).sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
}

export const storage = new MemStorage();
