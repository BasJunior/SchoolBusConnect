#!/bin/bash

# SchoolBusConnect Comprehensive Testing Script
echo "🚌 Starting SchoolBusConnect Comprehensive Test Suite"
echo "================================================="

API_BASE="http://localhost:3001"

# Test 1: Health Check
echo "1. Testing Health Check..."
health_response=$(curl -s "$API_BASE/api/health")
echo "Health Response: $health_response"

# Test 2: User Registration
echo -e "\n2. Testing User Registration..."
passenger_reg=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com", "password": "password", "userType": "passenger", "fullName": "Test User", "phoneNumber": "+1234567892", "username": "test_user"}')
echo "Passenger Registration: $passenger_reg"

driver_reg=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "testdriver@example.com", "password": "password", "userType": "driver", "fullName": "Test Driver", "phoneNumber": "+1234567893", "username": "test_driver"}')
echo "Driver Registration: $driver_reg"

# Test 3: User Login
echo -e "\n3. Testing User Login..."
passenger_login=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com", "password": "password"}')
echo "Passenger Login: $passenger_login"

driver_login=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "testdriver@example.com", "password": "password"}')
echo "Driver Login: $driver_login"

# Test 4: Routes
echo -e "\n4. Testing Routes..."
routes=$(curl -s "$API_BASE/api/routes")
echo "Available Routes: ${routes:0:200}..."

# Test 5: Schedules
echo -e "\n5. Testing Schedules..."
schedules=$(curl -s "$API_BASE/api/schedules/available?date=2025-09-20")
echo "Available Schedules: ${schedules:0:200}..."

# Test 6: Booking Creation
echo -e "\n6. Testing Booking Creation..."
booking=$(curl -s -X POST "$API_BASE/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{"userId": 5, "routeId": 1, "pickupPoint": "Kopje", "dropoffPoint": "UZ Main Gate", "travelDate": "2025-09-20", "scheduledTime": "2025-09-20T14:00:00Z", "seats": 1, "totalFare": "2.00", "status": "pending", "bookingType": "custom"}')
echo "Booking Creation: $booking"

# Test 7: Booking Retrieval
echo -e "\n7. Testing Booking Retrieval..."
user_bookings=$(curl -s "$API_BASE/api/bookings/user/1")
echo "User Bookings: ${user_bookings:0:200}..."

# Test 8: Driver Bookings
echo -e "\n8. Testing Driver Bookings..."
driver_bookings=$(curl -s "$API_BASE/api/bookings/driver/2")
echo "Driver Bookings: ${driver_bookings:0:200}..."

echo -e "\n✅ All tests completed!"
echo "================================================="
