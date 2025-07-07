import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/App";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bus, Users, ArrowRight, AlertTriangle, X, Home } from "lucide-react";
import type { BookingWithDetails } from "@shared/schema";

export default function DriverDashboard() {
  const { user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string | null>("City Center → University");
  
  const { data: driverBookings, isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/driver", user?.id],
    enabled: !!user?.id && user?.userType === "driver",
  });

  // Filter bookings for today
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = driverBookings?.filter(booking => 
    booking.travelDate === today && 
    (booking.status === "confirmed" || booking.status === "in_transit")
  ) || [];

  const handleNextStop = () => {
    // In a real app, this would update the route status
    console.log("Moving to next stop");
  };

  const handleEndRoute = () => {
    setCurrentRoute(null);
    // In a real app, this would mark the route as completed
  };

  const handleCloseDriver = () => {
    window.location.href = "/";
  };

  if (user?.userType !== "driver") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-neutral-600 mb-4">This page is only accessible to drivers.</p>
            <Button onClick={() => window.location.href = "/"}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Driver Header */}
      <header className="bg-secondary text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Bus className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold">Driver Dashboard</h1>
            <p className="text-sm opacity-90">
              {currentRoute ? "Online - Route Active" : "Offline"}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-8 h-8 p-0 bg-white bg-opacity-20 rounded-full text-white hover:bg-white hover:bg-opacity-30"
          onClick={handleCloseDriver}
        >
          <Home className="w-4 h-4" />
        </Button>
      </header>

      {/* Current Route Info */}
      {currentRoute && (
        <div className="p-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-800">Current Route</h3>
            <span className="bg-secondary text-white px-3 py-1 rounded-full text-sm">Active</span>
          </div>
          <p className="text-neutral-700 font-medium">{currentRoute}</p>
          <p className="text-sm text-neutral-600">Next Stop: Student Center (5 mins)</p>
        </div>
      )}

      {/* Passenger List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">
            Passengers ({todayBookings.length})
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : todayBookings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No passengers for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-800">
                          Passenger #{booking.id}
                        </p>
                        <p className="text-sm text-neutral-600">
                          Pickup: {booking.pickupPoint}
                        </p>
                        <p className="text-sm text-neutral-600">
                          Drop: {booking.dropoffPoint}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        booking.status === "in_transit" 
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {booking.status === "in_transit" ? "Boarded" : "Waiting"}
                      </span>
                      <p className="text-sm text-neutral-600 mt-1">${booking.totalFare}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Driver Actions */}
      {currentRoute && (
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Button 
              onClick={handleNextStop}
              className="bg-secondary text-white hover:bg-secondary/90"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Next Stop
            </Button>
            <Button variant="outline">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency
            </Button>
          </div>
          <Button 
            onClick={handleEndRoute}
            variant="destructive"
            className="w-full"
          >
            End Route
          </Button>
        </div>
      )}
    </div>
  );
}
