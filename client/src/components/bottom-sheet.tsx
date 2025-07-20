import { Button } from "@/components/ui/button";
import { Clock, Bus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/App";
import RouteCard from "@/components/route-card";
import type { BookingWithDetails, Route } from "@shared/schema";

interface BottomSheetProps {
  onBookRide: () => void;
  onSubscribe: () => void;
}

export default function BottomSheet({ onBookRide, onSubscribe }: BottomSheetProps) {
  const { user } = useAuth();
  
  const { data: userBookings, isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: routes, isLoading: routesLoading } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  const activeBookings = userBookings?.filter(booking => 
    booking.status === "confirmed" || booking.status === "in_transit"
  ) || [];

  const today = new Date().toISOString().split('T')[0];
  const { data: availableSchedules } = useQuery({
    queryKey: ["/api/schedules/available", today],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/available?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    },
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl max-h-96 overflow-hidden z-20">
      {/* Handle */}
      <div className="flex justify-center py-2">
        <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex space-x-3">
          <Button 
            onClick={onBookRide}
            className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary/90"
          >
            <span className="flex items-center justify-center space-x-2">
              <span>+</span>
              <span>Book Ride</span>
            </span>
          </Button>
          <Button 
            onClick={onSubscribe}
            variant="outline"
            className="flex-1 py-3 px-4 rounded-xl font-medium border-green-300 text-green-700 hover:bg-green-50"
          >
            <span className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Subscribe</span>
            </span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 overflow-y-auto max-h-64">
        {/* Active Rides Section */}
        {activeBookings.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">Active Rides</h3>
            {activeBookings.map((booking) => (
              <div key={booking.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Bus className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">
                        {booking.schedule.route.name}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {booking.status === "in_transit" ? "In Transit" : "Departing soon"}
                      </p>
                    </div>
                  </div>
                  <span className="bg-secondary text-white px-3 py-1 rounded-full text-sm font-medium">
                    {booking.status === "in_transit" ? "On Route" : "Confirmed"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">
                    Bus #{booking.schedule.vehicle.vehicleNumber}
                  </span>
                  <span className="font-medium text-neutral-800">
                    ${booking.totalFare}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Next Available Routes */}
        <h4 className="text-md font-medium text-neutral-700 mb-2 mt-4">Next Available</h4>
        
        {routesLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {routes?.slice(0, 2).map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
