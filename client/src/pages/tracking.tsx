import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { useQuery } from "@tanstack/react-query";
import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import LiveTracking from "@/components/live-tracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, User } from "lucide-react";
import { useLocation } from "wouter";

export default function TrackingPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  // Get bookingId from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('booking');
    if (bookingId) {
      setSelectedBookingId(parseInt(bookingId));
    }
  }, []);

  const { data: userBookings, isLoading } = useQuery({
    queryKey: ["/api/bookings/user", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/bookings/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Filter active bookings that can be tracked
  const trackableBookings = userBookings?.filter((booking: any) => 
    ['confirmed', 'in_transit', 'driver_en_route', 'arrived_pickup', 'passenger_onboard', 'en_route_destination'].includes(booking.status)
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'driver_en_route': return 'bg-yellow-100 text-yellow-800';
      case 'arrived_pickup': return 'bg-purple-100 text-purple-800';
      case 'passenger_onboard': return 'bg-indigo-100 text-indigo-800';
      case 'en_route_destination': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'in_transit': return 'In Transit';
      case 'driver_en_route': return 'Driver En Route';
      case 'arrived_pickup': return 'Driver Arrived';
      case 'passenger_onboard': return 'On Board';
      case 'en_route_destination': return 'En Route';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MobileHeader />
        <div className="pt-16 pb-20 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading bookings...</p>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (selectedBookingId) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MobileHeader />
        <div className="pt-16 pb-20 px-4">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedBookingId(null)}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold">Live Tracking</h1>
          </div>
          
          <LiveTracking
            bookingId={selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
          />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      <div className="pt-16 pb-20 px-4">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Live Tracking</h1>
        </div>

        {trackableBookings.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Trips</h3>
            <p className="text-gray-500 mb-6">
              You don't have any active bookings to track right now.
            </p>
            <Button onClick={() => setLocation("/")}>
              Book a Ride
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Select a booking to view live tracking information
            </p>
            
            {trackableBookings.map((booking: any) => (
              <Card 
                key={booking.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedBookingId(booking.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        Booking #{booking.bookingNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {booking.schedule?.route?.name || 'Custom Route'}
                      </p>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Route Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span>From: {booking.customPickupPoint || booking.pickupPoint}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span>To: {booking.customDropoffPoint || booking.dropoffPoint}</span>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{booking.travelDate}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{booking.numberOfSeats} seat{booking.numberOfSeats > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">${booking.totalFare}</div>
                      <div className="text-xs text-blue-600">Tap to track</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}