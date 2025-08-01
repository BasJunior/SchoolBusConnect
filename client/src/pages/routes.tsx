import MobileHeader from "@/components/mobile-header";
import BottomNav from "@/components/bottom-nav";
import RouteCard from "@/components/route-card";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock } from "lucide-react";
import type { Route } from "@shared/schema";

export default function Routes() {
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MobileHeader />
        <div className="p-4 pb-20">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold text-neutral-800 mb-6">Available Routes</h1>
        
        <div className="space-y-4">
          {routes?.map((route) => (
            <div key={route.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-neutral-800">{route.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  route.routeType === 'school' 
                    ? 'bg-blue-100 text-blue-800'
                    : route.routeType === 'work'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {route.routeType}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <MapPin className="w-4 h-4" />
                  <span>{route.origin} → {route.destination}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <Clock className="w-4 h-4" />
                  <span>{route.estimatedDuration} minutes</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-1">Pickup Points</h4>
                  <div className="text-xs text-neutral-600 space-y-1">
                    {route.pickupPoints?.slice(0, 2).map((point, index) => (
                      <div key={index}>• {point}</div>
                    ))}
                    {route.pickupPoints && route.pickupPoints.length > 2 && (
                      <div className="text-neutral-500">+{route.pickupPoints.length - 2} more</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-1">Drop-off Points</h4>
                  <div className="text-xs text-neutral-600 space-y-1">
                    {route.dropoffPoints?.slice(0, 2).map((point, index) => (
                      <div key={index}>• {point}</div>
                    ))}
                    {route.dropoffPoints && route.dropoffPoints.length > 2 && (
                      <div className="text-neutral-500">+{route.dropoffPoints.length - 2} more</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-lg font-bold text-neutral-800">${route.baseFare}</span>
                  <span className="text-sm text-neutral-600 ml-1">per seat</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-600">Max {route.maxSeats} seats</div>
                  <div className="text-sm text-secondary">Available daily</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
