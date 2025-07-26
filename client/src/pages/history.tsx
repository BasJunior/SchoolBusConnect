import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Calendar, MapPin, Bus } from "lucide-react";
import type { BookingWithDetails } from "@shared/schema";

export default function History() {
  const { user } = useAuth();
  
  const { data: bookings, isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/user", user?.id],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MobileHeader />
        <div className="p-4 pb-20">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const sortedBookings = bookings?.sort((a, b) => 
    new Date(b.bookingDate!).getTime() - new Date(a.bookingDate!).getTime()
  ) || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold text-neutral-800 mb-6">Ride History</h1>
        
        {sortedBookings.length === 0 ? (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-600 mb-2">No rides yet</h3>
            <p className="text-neutral-500">Your ride history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Bus className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800">
                        {booking.schedule.route.name}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        Booking #{booking.bookingNumber}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'in_transit'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'confirmed'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-neutral-600">
                    <Calendar className="w-4 h-4" />
                    <span>{booking.travelDate} at {booking.schedule.departureTime}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-600">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.pickupPoint} → {booking.dropoffPoint}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-sm text-neutral-600">
                    {booking.numberOfSeats} seat{booking.numberOfSeats > 1 ? 's' : ''} • 
                    Bus #{booking.schedule.vehicle.vehicleNumber}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-neutral-800">${booking.totalFare}</div>
                    <div className={`text-sm ${
                      booking.paymentStatus === 'paid' 
                        ? 'text-green-600' 
                        : booking.paymentStatus === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {booking.paymentStatus}
                    </div>
                    {['confirmed', 'in_transit', 'driver_en_route', 'arrived_pickup', 'passenger_onboard', 'en_route_destination'].includes(booking.status) && (
                      <button
                        onClick={() => window.location.href = `/tracking?booking=${booking.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 block"
                      >
                        Track Live →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
}
