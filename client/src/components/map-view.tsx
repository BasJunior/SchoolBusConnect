import { MapPin, Plus, Minus, Navigation, Bus, Building, GraduationCap, Route, Clock, X, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Schedule {
  id: number;
  departureTime: string;
  availableSeats: number;
  route: {
    id: number;
    name: string;
    baseFare: string;
    estimatedDuration: number;
    pickupPoints: string[];
    dropoffPoints: string[];
  };
  vehicle: {
    id: number;
    vehicleNumber: string;
    capacity: number;
  };
}

interface LocationPopupProps {
  location: {
    name: string;
    type: string;
    x: string;
    y: string;
    color: string;
  };
  onClose: () => void;
  onBookRide: (fromLocation: string, toLocation?: string) => void;
}

function LocationPopup({ location, onClose, onBookRide }: LocationPopupProps) {
  // Fetch schedules for routes that include this location
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['/api/schedules/available'],
    enabled: true,
  });

  const { data: routes } = useQuery({
    queryKey: ['/api/routes'],
    enabled: true,
  });

  // Filter schedules for routes that include this location
  const relevantSchedules = (schedules as any[])?.filter((schedule: any) => {
    const route = (routes as any[])?.find((r: any) => r.id === schedule.route?.id || r.id === schedule.routeId);
    if (!route) return false;
    
    const locationInPickup = route.pickupPoints?.some((point: string) => 
      point.toLowerCase().includes(location.name.toLowerCase()) || 
      location.name.toLowerCase().includes(point.toLowerCase())
    );
    const locationInDropoff = route.dropoffPoints?.some((point: string) => 
      point.toLowerCase().includes(location.name.toLowerCase()) || 
      location.name.toLowerCase().includes(point.toLowerCase())
    );
    
    return locationInPickup || locationInDropoff || route.name?.toLowerCase().includes(location.name.toLowerCase());
  }) || [];

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  const getRouteForSchedule = (schedule: any) => {
    return (routes as any[])?.find((r: any) => r.id === schedule.route?.id || r.id === schedule.routeId);
  };

  return (
    <div className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[320px] max-w-[400px] backdrop-blur-sm max-h-[80vh] overflow-y-auto" 
         style={{ 
           left: location.x, 
           top: location.y,
           transform: 'translate(-50%, -100%)',
           marginTop: '-15px'
         }}>
      {/* Arrow pointing down */}
      <div className="absolute bottom-[-9px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-white drop-shadow-sm"></div>
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${location.color} rounded-full border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0`}>
            {location.type === 'school' && <GraduationCap className="text-white w-4 h-4" />}
            {location.type === 'work' && <Building className="text-white w-4 h-4" />}
            {location.type === 'transport' && <Bus className="text-white w-4 h-4" />}
            {['city', 'residential', 'commercial'].includes(location.type) && <MapPin className="text-white w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{location.name}</h3>
            <p className="text-xs text-gray-600 capitalize">{location.type} area</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-6 w-6 hover:bg-gray-100">
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Upcoming Schedules */}
      <div className="mb-4">
        <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Upcoming Rides
        </h4>
        
        {isLoading ? (
          <div className="text-center py-3">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-1"></div>
            <p className="text-xs text-gray-500">Loading schedules...</p>
          </div>
        ) : relevantSchedules.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {relevantSchedules.slice(0, 3).map((schedule: any) => {
              const route = getRouteForSchedule(schedule);
              return (
                <div key={schedule.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">
                      {formatTime(schedule.departureTime)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Users className="w-3 h-3" />
                        {schedule.availableSeats}
                      </span>
                      <span className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-3 h-3" />
                        {route?.baseFare || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 truncate">
                    {route?.name || 'Route info loading...'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Vehicle: {schedule.vehicle?.vehicleNumber || 'TBA'}
                  </p>
                </div>
              );
            })}
            {relevantSchedules.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{relevantSchedules.length - 3} more rides available
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500">No upcoming rides from this location</p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Button 
          onClick={() => onBookRide(location.name)}
          className="w-full bg-primary text-white hover:bg-primary/90 flex items-center gap-2 h-9"
          size="sm"
        >
          <Route className="w-4 h-4" />
          Book Ride From Here
        </Button>
        
        <Button 
          onClick={() => onBookRide('', location.name)}
          variant="outline"
          className="w-full flex items-center gap-2 h-9 hover:bg-gray-50"
          size="sm"
        >
          <MapPin className="w-4 h-4" />
          Book Ride To Here
        </Button>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Schedules updated every 5 minutes</span>
        </div>
      </div>
    </div>
  );
}

interface MapViewProps {
  onBookRide?: (fromLocation?: string, toLocation?: string) => void;
}

export default function MapView({ onBookRide }: MapViewProps = {}) {
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  
  // Fetch schedules and routes for schedule indicators
  const { data: schedules } = useQuery({
    queryKey: ['/api/schedules/available'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: routes } = useQuery({
    queryKey: ['/api/routes'],
    refetchInterval: 60000, // Refresh every minute
  });
  
  const harareLocations = [
    { name: "Harare CBD", type: "city", x: "45%", y: "40%", color: "bg-blue-600" },
    { name: "University of Zimbabwe", type: "school", x: "55%", y: "25%", color: "bg-green-600" },
    { name: "Chitungwiza", type: "residential", x: "70%", y: "65%", color: "bg-purple-600" },
    { name: "Mbare Musika", type: "transport", x: "35%", y: "55%", color: "bg-orange-600" },
    { name: "Avondale", type: "residential", x: "25%", y: "30%", color: "bg-indigo-600" },
    { name: "Borrowdale", type: "residential", x: "30%", y: "20%", color: "bg-pink-600" },
    { name: "Industrial Area", type: "work", x: "65%", y: "45%", color: "bg-gray-600" },
    { name: "Eastgate Mall", type: "commercial", x: "60%", y: "35%", color: "bg-teal-600" }
  ];

  // Function to check if location has upcoming schedules
  const hasUpcomingSchedules = (locationName: string) => {
    if (!schedules || !routes) return false;
    
    return (schedules as any[])?.some((schedule: any) => {
      const route = (routes as any[])?.find((r: any) => r.id === schedule.route?.id || r.id === schedule.routeId);
      if (!route) return false;
      
      const locationInPickup = route.pickupPoints?.some((point: string) => 
        point.toLowerCase().includes(locationName.toLowerCase()) || 
        locationName.toLowerCase().includes(point.toLowerCase())
      );
      const locationInDropoff = route.dropoffPoints?.some((point: string) => 
        point.toLowerCase().includes(locationName.toLowerCase()) || 
        locationName.toLowerCase().includes(point.toLowerCase())
      );
      
      return locationInPickup || locationInDropoff || route.name?.toLowerCase().includes(locationName.toLowerCase());
    });
  };

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
  };

  const handleBookRide = (fromLocation?: string, toLocation?: string) => {
    if (onBookRide) {
      onBookRide(fromLocation, toLocation);
    }
    setSelectedLocation(null);
  };

  const handleClosePopup = () => {
    setSelectedLocation(null);
  };

  // Close popup when clicking outside
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedLocation(null);
    }
  };

  const routeLines = [
    { from: "45%,40%", to: "55%,25%", color: "stroke-blue-500" }, // CBD to UZ
    { from: "35%,55%", to: "60%,35%", color: "stroke-green-500" }, // Mbare to Eastgate
    { from: "25%,30%", to: "30%,20%", color: "stroke-purple-500" }, // Avondale to Borrowdale
    { from: "70%,65%", to: "45%,40%", color: "stroke-orange-500" }, // Chitungwiza to CBD
  ];

  return (
    <main className="relative h-screen bg-slate-100">
      {/* Map Container */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50"
        onClick={handleBackgroundClick}
      >
        {/* Harare Map Background */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            {/* Background grid representing streets */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            
            {/* Major roads */}
            <path d="M0 40 L100 45" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M45 0 L50 100" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M0 60 L100 55" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M25 0 L30 100" stroke="#cbd5e1" strokeWidth="1" />
            
            {/* Route lines */}
            {routeLines.map((route, index) => {
              const [fromX, fromY] = route.from.split(',');
              const [toX, toY] = route.to.split(',');
              return (
                <line
                  key={index}
                  x1={fromX.replace('%', '')}
                  y1={fromY.replace('%', '')}
                  x2={toX.replace('%', '')}
                  y2={toY.replace('%', '')}
                  stroke={route.color.replace('stroke-', '#')}
                  strokeWidth="0.8"
                  strokeDasharray="2,1"
                  opacity="0.7"
                />
              );
            })}
          </svg>
        </div>

        {/* Location Markers */}
        {harareLocations.map((location, index) => {
          const hasSchedules = hasUpcomingSchedules(location.name);
          return (
            <div 
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
              style={{ left: location.x, top: location.y }}
              onClick={() => handleLocationClick(location)}
            >
              <div className="relative">
                <div className={`w-8 h-8 ${location.color} rounded-full border-3 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-200 ${selectedLocation?.name === location.name ? 'ring-4 ring-blue-400 ring-opacity-50 scale-110' : ''}`}>
                  {location.type === 'school' && <GraduationCap className="text-white w-4 h-4" />}
                  {location.type === 'work' && <Building className="text-white w-4 h-4" />}
                  {location.type === 'transport' && <Bus className="text-white w-4 h-4" />}
                  {['city', 'residential', 'commercial'].includes(location.type) && <MapPin className="text-white w-4 h-4" />}
                </div>
                
                {/* Schedule indicator */}
                {hasSchedules && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse">
                    <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
              
              <div className="mt-1 text-center">
                <Badge variant="secondary" className={`text-xs px-1 py-0 text-gray-800 hover:bg-white cursor-pointer ${hasSchedules ? 'bg-green-100' : 'bg-white/90'}`}>
                  {location.name}
                  {hasSchedules && <span className="ml-1 text-green-600">●</span>}
                </Badge>
              </div>
            </div>
          );
        })}

        {/* Current Location (You are here) */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: '45%', top: '40%' }}
        >
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div className="mt-1 text-center">
            <Badge variant="destructive" className="text-xs px-1 py-0">
              You are here
            </Badge>
          </div>
        </div>

        {/* Location Popup */}
        {selectedLocation && (
          <LocationPopup
            location={selectedLocation}
            onClose={handleClosePopup}
            onBookRide={handleBookRide}
          />
        )}
      </div>

      {/* Map Info Panel */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20 max-w-sm">
        <h3 className="font-semibold text-sm mb-2 text-gray-800">Harare Transit Map</h3>
        <div className="text-xs text-gray-600 space-y-1 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>City Center & CBD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span>Universities & Schools</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
            <span>Transport Hubs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            <span>Industrial Areas</span>
          </div>
        </div>
        
        <div className="border-t pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Active schedules available</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Click locations to see upcoming rides</p>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-32 right-4 flex flex-col space-y-2 z-20">
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 bg-white/95 shadow-md hover:bg-gray-50">
          <Plus className="w-4 h-4 text-gray-600" />
        </Button>
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 bg-white/95 shadow-md hover:bg-gray-50">
          <Minus className="w-4 h-4 text-gray-600" />
        </Button>
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 bg-white/95 shadow-md hover:bg-gray-50">
          <Navigation className="w-4 h-4 text-gray-600" />
        </Button>
      </div>
    </main>
  );
}
