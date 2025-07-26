import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { Icon } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Phone, 
  Car, 
  Clock, 
  Navigation, 
  User,
  MessageCircle,
  RefreshCw
} from "lucide-react";
import "leaflet/dist/leaflet.css";

interface LiveTrackingProps {
  bookingId: number;
  onClose?: () => void;
}

// Harare center coordinates
const HARARE_CENTER: [number, number] = [-17.8292, 31.0522];

// Create custom icons for different markers
const createIcon = (color: string, size: number = 25) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

const vehicleIcon = createIcon('#2563eb', 30);
const pickupIcon = createIcon('#22c55e', 25);
const dropoffIcon = createIcon('#ef4444', 25);

export default function LiveTracking({ bookingId, onClose }: LiveTrackingProps) {
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const mapRef = useRef<any>(null);

  const { data: trackingData, isLoading, refetch } = useQuery({
    queryKey: ["/api/tracking", bookingId],
    queryFn: async () => {
      const response = await fetch(`/api/tracking/${bookingId}`);
      if (!response.ok) throw new Error('Failed to fetch tracking data');
      return response.json();
    },
    refetchInterval: refreshInterval,
    enabled: !!bookingId,
  });

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refetch, refreshInterval]);

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
      case 'en_route_destination': return 'En Route to Destination';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg animate-pulse">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading tracking data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Tracking Unavailable</h3>
        <p className="text-gray-500 mb-6">
          Unable to load tracking information for this booking.
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const { 
    currentLocation, 
    pickupLocation, 
    dropoffLocation, 
    driverName, 
    driverPhone, 
    vehicleNumber,
    status,
    estimatedArrival,
    routeProgress,
    totalDistance,
    remainingDistance
  } = trackingData;

  // Create route line between pickup and dropoff
  const routeCoords: [number, number][] = [
    pickupLocation.coords,
    [currentLocation.lat, currentLocation.lng],
    dropoffLocation.coords
  ];

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Live Tracking
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Booking #{bookingId}
              </p>
            </div>
            <Badge className={getStatusColor(status)}>
              {getStatusLabel(status)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Driver Info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{driverName}</p>
                <p className="text-sm text-gray-600">{vehicleNumber}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Phone className="w-4 h-4 mr-1" />
                Call
              </Button>
              <Button size="sm" variant="outline">
                <MessageCircle className="w-4 h-4 mr-1" />
                Chat
              </Button>
            </div>
          </div>

          {/* Trip Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trip Progress</span>
              <span className="font-medium">{Math.round(routeProgress)}%</span>
            </div>
            <Progress value={routeProgress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{remainingDistance?.toFixed(1)} km remaining</span>
              <span>ETA: {estimatedArrival}</span>
            </div>
          </div>

          <Separator />

          {/* Location Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">Pickup</p>
                <p className="text-xs text-gray-600">{pickupLocation.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">Destination</p>
                <p className="text-xs text-gray-600">{dropoffLocation.name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-80 rounded-lg overflow-hidden">
            <MapContainer
              center={[currentLocation.lat, currentLocation.lng]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Vehicle marker */}
              <Marker 
                position={[currentLocation.lat, currentLocation.lng]} 
                icon={vehicleIcon}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">{driverName}</p>
                    <p className="text-sm text-gray-600">{vehicleNumber}</p>
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Pickup marker */}
              <Marker position={pickupLocation.coords} icon={pickupIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">Pickup Location</p>
                    <p className="text-sm text-gray-600">{pickupLocation.name}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Dropoff marker */}
              <Marker position={dropoffLocation.coords} icon={dropoffIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">Destination</p>
                    <p className="text-sm text-gray-600">{dropoffLocation.name}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Route line */}
              <Polyline 
                positions={routeCoords} 
                color="#3b82f6" 
                weight={4}
                opacity={0.7}
                dashArray="10, 10"
              />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => window.open(`tel:${driverPhone}`, '_self')}
        >
          <Phone className="w-4 h-4 mr-2" />
          Call Driver
        </Button>
      </div>
    </div>
  );
}