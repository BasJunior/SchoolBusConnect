import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Bus, Calculator, Clock, AlertCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Harare coordinate bounds and key locations
const HARARE_CENTER: [number, number] = [-17.8292, 31.0522];
const HARARE_BOUNDS: [[number, number], [number, number]] = [
  [-17.9500, 30.9000], // Southwest
  [-17.7000, 31.2000]  // Northeast
];

// Key locations in Harare with authentic coordinates
const HARARE_LOCATIONS = [
  { id: 'cbd', name: 'Harare CBD', coords: [-17.8292, 31.0522], type: 'city', icon: 'building' },
  { id: 'uz', name: 'University of Zimbabwe', coords: [-17.7840, 31.0547], type: 'school', icon: 'school' },
  { id: 'chitungwiza', name: 'Chitungwiza', coords: [-18.0135, 31.0776], type: 'residential', icon: 'home' },
  { id: 'mbare', name: 'Mbare Musika', coords: [-17.8542, 31.0389], type: 'transport', icon: 'bus' },
  { id: 'avondale', name: 'Avondale', coords: [-17.8055, 31.0234], type: 'residential', icon: 'home' },
  { id: 'borrowdale', name: 'Borrowdale', coords: [-17.7745, 31.0444], type: 'residential', icon: 'home' },
  { id: 'industrial', name: 'Industrial Area', coords: [-17.8456, 31.0889], type: 'work', icon: 'building' },
  { id: 'eastgate', name: 'Eastgate Mall', coords: [-17.8123, 31.0745], type: 'commercial', icon: 'shopping' }
];

// Custom icons for different location types
const createCustomIcon = (type: string, isSelected = false) => {
  const color = isSelected ? '#ef4444' : type === 'school' ? '#22c55e' : 
                type === 'work' ? '#6b7280' : type === 'transport' ? '#f97316' : '#3b82f6';
  const size = isSelected ? 30 : 25;
  
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

// Function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Function to calculate fare based on distance
const calculateFare = (distance: number): number => {
  const baseFare = 1.50;
  const perKmRate = 0.25;
  const serviceFee = 0.50;
  return baseFare + (distance * perKmRate) + serviceFee;
};

interface InteractiveMapProps {
  onPickupSelect: (location: { name: string; coords: [number, number] }) => void;
  onDropoffSelect: (location: { name: string; coords: [number, number] }) => void;
  selectedPickup?: { name: string; coords: [number, number] } | null;
  selectedDropoff?: { name: string; coords: [number, number] } | null;
  mode: 'pickup' | 'dropoff' | 'both';
  className?: string;
}

// Component for handling map clicks
function MapClickHandler({ 
  onLocationSelect, 
  mode 
}: { 
  onLocationSelect: (coords: [number, number], address: string) => void;
  mode: 'pickup' | 'dropoff' | 'both';
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      // Simple reverse geocoding simulation for demo
      const address = `Custom location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      onLocationSelect([lat, lng], address);
    }
  });
  return null;
}

export default function InteractiveMap({
  onPickupSelect,
  onDropoffSelect,
  selectedPickup,
  selectedDropoff,
  mode,
  className = ""
}: InteractiveMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(HARARE_CENTER);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [estimatedFare, setEstimatedFare] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const mapRef = useRef<any>(null);

  // Handle map loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate route when both pickup and dropoff are selected
  useEffect(() => {
    if (selectedPickup && selectedDropoff) {
      const distance = calculateDistance(
        selectedPickup.coords[0], selectedPickup.coords[1],
        selectedDropoff.coords[0], selectedDropoff.coords[1]
      );
      setRouteDistance(distance);
      setEstimatedFare(calculateFare(distance));
      setEstimatedTime(Math.ceil(distance * 2.5)); // Rough estimate: 2.5 minutes per km in city traffic
    } else {
      setRouteDistance(0);
      setEstimatedFare(0);
      setEstimatedTime(0);
    }
  }, [selectedPickup, selectedDropoff]);

  const handleLocationClick = (location: typeof HARARE_LOCATIONS[0]) => {
    if (mode === 'pickup' || mode === 'both') {
      onPickupSelect({ name: location.name, coords: location.coords as [number, number] });
    } else if (mode === 'dropoff') {
      onDropoffSelect({ name: location.name, coords: location.coords as [number, number] });
    }
  };

  const handleCustomLocationSelect = (coords: [number, number], address: string) => {
    if (mode === 'pickup' || mode === 'both') {
      onPickupSelect({ name: address, coords });
    } else if (mode === 'dropoff') {
      onDropoffSelect({ name: address, coords });
    }
  };

  // Error fallback for map loading issues
  if (mapError) {
    return (
      <div className={`relative ${className} bg-gray-100 rounded-lg flex items-center justify-center min-h-[400px]`}>
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Map Loading Error</h3>
          <p className="text-gray-500 mb-4">Unable to load the Harare map. Please try refreshing the page.</p>
          <Button onClick={() => { setMapError(null); setIsLoading(true); }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading Harare map...</p>
          </div>
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={12}
        className="h-full w-full rounded-lg z-0"
        maxBounds={HARARE_BOUNDS}
        ref={mapRef}
        whenReady={() => setIsLoading(false)}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
          onLoad={() => setIsLoading(false)}
          onError={() => setMapError("Failed to load map tiles")}
        />
        
        {/* Location markers */}
        {HARARE_LOCATIONS.map((location) => (
          <Marker
            key={location.id}
            position={location.coords as [number, number]}
            icon={createCustomIcon(
              location.type,
              (selectedPickup?.name === location.name) || (selectedDropoff?.name === location.name)
            )}
            eventHandlers={{
              click: () => handleLocationClick(location)
            }}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold">{location.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{location.type}</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleLocationClick(location)}
                >
                  {mode === 'pickup' ? 'Set as Pickup' : 
                   mode === 'dropoff' ? 'Set as Dropoff' : 'Select'}
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Custom pickup marker */}
        {selectedPickup && !HARARE_LOCATIONS.find(l => l.name === selectedPickup.name) && (
          <Marker
            position={selectedPickup.coords}
            icon={createCustomIcon('custom', true)}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold">Pickup Location</h3>
                <p className="text-sm text-gray-600">{selectedPickup.name}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Custom dropoff marker */}
        {selectedDropoff && !HARARE_LOCATIONS.find(l => l.name === selectedDropoff.name) && (
          <Marker
            position={selectedDropoff.coords}
            icon={createCustomIcon('custom', true)}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold">Dropoff Location</h3>
                <p className="text-sm text-gray-600">{selectedDropoff.name}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route polyline */}
        {selectedPickup && selectedDropoff && (
          <Polyline
            positions={[selectedPickup.coords, selectedDropoff.coords]}
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7 }}
          />
        )}

        {/* Click handler for custom locations */}
        <MapClickHandler
          onLocationSelect={handleCustomLocationSelect}
          mode={mode}
        />
      </MapContainer>

      {/* Map info overlay */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000] max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-sm text-gray-800">
            {mode === 'pickup' ? 'Select Pickup Location' :
             mode === 'dropoff' ? 'Select Dropoff Location' : 'Select Locations'}
          </h3>
        </div>
        <p className="text-xs text-gray-600 mb-2">
          Click on markers or anywhere on the map to set locations
        </p>

        {/* Route information */}
        {routeDistance > 0 && (
          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Distance:
              </span>
              <span className="font-medium">{routeDistance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Est. Time:
              </span>
              <span className="font-medium">{estimatedTime} min</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Calculator className="w-3 h-3" />
                Est. Fare:
              </span>
              <span className="font-medium text-green-600">${estimatedFare.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Location legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <h4 className="font-semibold text-xs mb-2">Location Types</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>CBD & Commercial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Schools & Universities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Transport Hubs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Industrial Areas</span>
          </div>
        </div>
      </div>

    </div>
  );
}