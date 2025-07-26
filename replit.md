# OmniRide - Public Transport Booking System

## Overview

OmniRide is a full-stack web application for public transport booking, designed as a mobile-first ride-sharing platform. The system allows passengers to book seats on scheduled routes, drivers to manage their vehicles and routes, and provides real-time tracking capabilities. Built with React, Node.js/Express, and PostgreSQL with a modern, responsive UI using shadcn/ui components.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and local React state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Mobile-First Design**: Responsive layout optimized for mobile devices

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with user roles (passenger, driver, admin)
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: Express middleware for logging, error handling, and request parsing

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema**: Type-safe schema definitions with Zod validation
- **Migrations**: Managed through drizzle-kit for schema versioning

## Key Components

### User Management
- **Authentication**: Register/login system with role-based access (passenger, driver, admin)
- **User Types**: Differentiated workflows for passengers and drivers
- **Profile Management**: User profile updates and verification status

### Route Management
- **Route Definition**: Authentic Harare locations (CBD, Chitungwiza, Mbare, Avondale, etc.)
- **Route Types**: School (UZ, MSU), work (Industrial Area, CBD), and general transport
- **Fare Structure**: USD pricing ($1.50-$3.00) appropriate for Zimbabwe market
- **Schedule Management**: Morning/afternoon focus with specialized night services for workers

### Booking System
- **Seat Reservation**: Real-time seat availability checking
- **Booking Workflow**: Multi-step booking process with payment integration
- **Status Tracking**: Booking states (confirmed, in_transit, completed, cancelled)
- **User History**: Complete booking history with details

### Vehicle Management
- **Vehicle Registration**: Driver vehicle assignment and capacity management
- **Active Status**: Vehicle availability tracking
- **Route Assignment**: Vehicle-to-route scheduling coordination

## Data Flow

### User Registration/Authentication
1. User submits registration form with role selection
2. Server validates data and creates user record
3. Login process authenticates user and establishes session
4. Frontend stores user data locally and redirects based on role

### Booking Process
1. User views available routes and schedules
2. User selects route, pickup/dropoff points, and seat count
3. System calculates fare and confirms availability
4. Booking is created and user receives confirmation
5. Real-time updates provided for booking status

### Driver Workflow
1. Driver accesses specialized dashboard
2. Views assigned routes and passenger bookings
3. Updates route status and passenger pickup/dropoff
4. Manages vehicle information and availability

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Development server and build tooling with HMR

### UI and Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible, unstyled UI components
- **Lucide React**: Icon library for consistent iconography

### Backend and Database
- **Express.js**: Web application framework
- **Drizzle ORM**: Type-safe database operations
- **Neon Database**: Serverless PostgreSQL hosting
- **connect-pg-simple**: PostgreSQL session storage

### Development and Build
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **Replit Integration**: Development environment optimizations

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Module Replacement**: Real-time code updates without page refresh
- **Environment Variables**: Database URL and configuration management

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Static Serving**: Express serves built frontend assets in production

### Database Management
- **Schema Deployment**: `drizzle-kit push` for schema updates
- **Migration Strategy**: Version-controlled schema changes
- **Environment Configuration**: Separate development and production databases

### Hosting Considerations
- **Single Server Deployment**: Express serves both API and static files
- **Session Management**: PostgreSQL-backed sessions for scalability
- **File Organization**: Clear separation of client, server, and shared code

## Changelog

```
Changelog:
- July 07, 2025. Initial setup
- July 09, 2025. Added authentic Harare routes and locations
  - 6 routes covering major Harare areas: CBD, Chitungwiza, Mbare, Avondale, Borrowdale, Highfield, Warren Park, Industrial Area
  - Realistic pickup/dropoff points based on actual Harare locations
  - Schedule optimization: Morning/afternoon focus with night services for workers
  - Proper fare structure in USD for Zimbabwe market  
- July 21, 2025. Fixed deployment configuration issues
  - Removed reusePort option from server configuration to resolve containerized environment compatibility
  - Added /health endpoint for deployment health checks and monitoring
  - Verified SESSION_SECRET environment variable is properly configured
- July 26, 2025. Enhanced booking capabilities with interactive maps and live tracking
  - Integrated Leaflet maps for interactive pin-based location selection
  - Created enhanced booking modal supporting both standard routes and custom pickup/dropoff locations
  - Added live tracking functionality with real-time vehicle location updates
  - Implemented tracking page with map visualization and driver communication features
  - Enhanced database schema with vehicle tracking table and coordinate storage
  - Added custom booking support with dynamic pricing based on selected locations
  - Updated navigation to include tracking page for active trip monitoring
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```