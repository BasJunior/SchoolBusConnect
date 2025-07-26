import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Location {
  id: string;
  name: string;
  coords: [number, number];
  type: string;
}

// Key locations in Harare
const HARARE_LOCATIONS: Location[] = [
  { id: 'cbd', name: 'Harare CBD', coords: [-17.8292, 31.0522], type: 'city' },
  { id: 'uz', name: 'University of Zimbabwe', coords: [-17.7840, 31.0547], type: 'school' },
  { id: 'chitungwiza', name: 'Chitungwiza', coords: [-18.0135, 31.0776], type: 'residential' },
  { id: 'mbare', name: 'Mbare Musika', coords: [-17.8542, 31.0389], type: 'transport' },
  { id: 'avondale', name: 'Avondale', coords: [-17.8055, 31.0234], type: 'residential' },
  { id: 'borrowdale', name: 'Borrowdale', coords: [-17.7745, 31.0444], type: 'residential' },
  { id: 'industrial', name: 'Industrial Area', coords: [-17.8456, 31.0889], type: 'work' },
  { id: 'eastgate', name: 'Eastgate Mall', coords: [-17.8123, 31.0745], type: 'commercial' }
];

interface FallbackMapProps {
  onPickupSelect: (location: { name: string; coords: [number, number] }) => void;
  onDropoffSelect: (location: { name: string; coords: [number, number] }) => void;
  selectedPickup?: { name: string; coords: [number, number] } | null;
  selectedDropoff?: { name: string; coords: [number, number] } | null;
  mode: 'pickup' | 'dropoff' | 'both';
  className?: string;
}

export default function FallbackMap({
  onPickupSelect,
  onDropoffSelect,
  selectedPickup,
  selectedDropoff,
  mode,
  className = ""
}: FallbackMapProps) {
  
  const handleLocationClick = (location: Location) => {
    if (mode === 'pickup' || mode === 'both') {
      onPickupSelect({ name: location.name, coords: location.coords });
    } else if (mode === 'dropoff') {
      onDropoffSelect({ name: location.name, coords: location.coords });
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'school': return '🏫';
      case 'work': case 'city': return '🏢';
      case 'transport': return '🚌';
      case 'residential': return '🏠';
      case 'commercial': return '🛒';
      default: return '📍';
    }
  };

  return (
    <div className={`${className} bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6`}>
      {/* Header */}
      <div className="text-center mb-6">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Map Not Available</h3>
        <p className="text-sm text-gray-600">
          {mode === 'pickup' ? 'Select your pickup location' :
           mode === 'dropoff' ? 'Select your dropoff location' : 'Select your locations'}
        </p>
      </div>

      {/* Location Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {HARARE_LOCATIONS.map((location) => {
          const isPickupSelected = selectedPickup?.name === location.name;
          const isDropoffSelected = selectedDropoff?.name === location.name;
          const isSelected = isPickupSelected || isDropoffSelected;
          
          return (
            <Button
              key={location.id}
              variant={isSelected ? "default" : "outline"}
              className={`p-4 h-auto text-left justify-start ${
                isSelected ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => handleLocationClick(location)}
            >
              <div className="flex items-center gap-3 w-full">
                <span className="text-xl">{getLocationIcon(location.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{location.name}</div>
                  <div className="text-xs opacity-75 capitalize">{location.type}</div>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1 text-xs">
                    {isPickupSelected && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Pickup</span>}
                    {isDropoffSelected && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Dropoff</span>}
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Selected locations summary */}
      {(selectedPickup || selectedDropoff) && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Selected Locations
            </h4>
            <div className="space-y-2 text-sm">
              {selectedPickup && (
                <div className="flex items-center gap-2">
                  <span className="text-green-600">▲</span>
                  <span className="font-medium">Pickup:</span>
                  <span>{selectedPickup.name}</span>
                </div>
              )}
              {selectedDropoff && (
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">▼</span>
                  <span className="font-medium">Dropoff:</span>
                  <span>{selectedDropoff.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Click on locations above to set your pickup and dropoff points
        </p>
      </div>
    </div>
  );
}