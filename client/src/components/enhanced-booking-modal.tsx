import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Minus, X, MapPin, Navigation, Clock, Calculator, 
  Users, CreditCard, Smartphone, DollarSign, Route, Bus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import InteractiveMap from "./interactive-map";
import FallbackMap from "./fallback-map";

interface LocationData {
  name: string;
  coords: [number, number];
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

interface AvailableDriver {
  driver: {
    id: number;
    fullName: string;
    phone: string;
    userType: string;
  };
  vehicle: {
    id: number;
    vehicleNumber: string;
    capacity: number;
    vehicleType: string;
  };
  availability: {
    status: string;
    isAcceptingBookings: boolean;
    currentLatitude: string;
    currentLongitude: string;
  };
  routes: any[];
  distance: number;
  estimatedArrival: number;
}

export default function EnhancedBookingModal({ isOpen, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Booking states
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("ecocash");
  const [bookingMode, setBookingMode] = useState<'standard' | 'custom'>('standard');
  
  // Location states
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff' | 'both'>('pickup');
  
  // Standard location states
  const [standardPickup, setStandardPickup] = useState("");
  const [standardDropoff, setStandardDropoff] = useState("");
  
  // Pricing states
  const [customFare, setCustomFare] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [routeDistance, setRouteDistance] = useState<number>(0);

  // Map error handling
  const [mapError, setMapError] = useState<boolean>(false);
  
  // Driver finding states
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<AvailableDriver | null>(null);
  const [findingDrivers, setFindingDrivers] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  
  const { data: availableSchedules, isLoading } = useQuery({
    queryKey: ["/api/schedules/available", today],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/available?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json() as Schedule[];
    },
    enabled: isOpen,
  });

  const selectedSchedule = availableSchedules?.find((s: Schedule) => s.id === selectedScheduleId);
  const baseFare = selectedSchedule?.route ? parseFloat(selectedSchedule.route.baseFare) : 0;
  const serviceFee = 0.50;
  
  // Calculate total fare based on mode
  const totalFare = bookingMode === 'custom' && customFare > 0 
    ? (customFare * numberOfSeats) + serviceFee
    : (baseFare * numberOfSeats) + serviceFee;

  // Calculate distance-based fare for custom locations
  useEffect(() => {
    if (pickupLocation && dropoffLocation && bookingMode === 'custom') {
      const distance = calculateDistance(
        pickupLocation.coords[0], pickupLocation.coords[1],
        dropoffLocation.coords[0], dropoffLocation.coords[1]
      );
      const fare = calculateCustomFare(distance);
      setCustomFare(fare);
      setRouteDistance(distance);
      setEstimatedTime(Math.ceil(distance * 2.5)); // 2.5 minutes per km estimate
    }
  }, [pickupLocation, dropoffLocation, bookingMode]);

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

  const calculateCustomFare = (distance: number): number => {
    const baseFare = 1.50;
    const perKmRate = 0.30;
    return Math.max(baseFare, baseFare + (distance * perKmRate));
  };

  // Find available drivers for custom bookings
  const findAvailableDrivers = async () => {
    if (!pickupLocation?.coords) {
      toast({
        title: "Location Required",
        description: "Please select a pickup location to find available drivers.",
        variant: "destructive",
      });
      return;
    }

    setFindingDrivers(true);
    try {
      const response = await apiRequest("/api/bookings/find-drivers", {
        method: "POST",
        body: JSON.stringify({
          lat: pickupLocation.coords[0],
          lng: pickupLocation.coords[1],
          radiusKm: 10
        }),
      });
      
      setAvailableDrivers(response as AvailableDriver[]);
      
      if (response.length === 0) {
        toast({
          title: "No Drivers Available",
          description: "No active drivers found in your area. Try expanding your search or booking a scheduled route.",
        });
      }
    } catch (error) {
      toast({
        title: "Search Failed", 
        description: "Failed to find available drivers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFindingDrivers(false);
    }
  };

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
      toast({
        title: "Booking Confirmed",
        description: bookingMode === 'custom' 
          ? "Your custom route booking has been submitted for driver confirmation"
          : "Your seat has been reserved successfully",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedScheduleId(null);
    setNumberOfSeats(1);
    setPaymentMethod("ecocash");
    setBookingMode('standard');
    setPickupLocation(null);
    setDropoffLocation(null);
    setStandardPickup("");
    setStandardDropoff("");
    setMapMode('pickup');
    setCustomFare(0);
    setEstimatedTime(0);
    setRouteDistance(0);
  };

  const handleBooking = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a booking",
        variant: "destructive",
      });
      return;
    }

    let bookingData: any = {
      userId: user.id,
      numberOfSeats,
      totalFare: totalFare.toFixed(2),
      paymentMethod,
      travelDate: today,
    };

    if (bookingMode === 'standard') {
      if (!selectedScheduleId || !standardPickup || !standardDropoff) {
        toast({
          title: "Missing Information",
          description: "Please select route, pickup and dropoff points",
          variant: "destructive",
        });
        return;
      }
      
      bookingData = {
        ...bookingData,
        scheduleId: selectedScheduleId,
        pickupPoint: standardPickup,
        dropoffPoint: standardDropoff,
        bookingType: 'standard'
      };
    } else {
      if (!pickupLocation || !dropoffLocation) {
        toast({
          title: "Missing Locations",
          description: "Please select both pickup and dropoff locations on the map",
          variant: "destructive",
        });
        return;
      }

      bookingData = {
        ...bookingData,
        pickupPoint: "Custom Location",
        dropoffPoint: "Custom Location",
        customPickupPoint: pickupLocation.name,
        customDropoffPoint: dropoffLocation.name,
        pickupCoords: pickupLocation.coords,
        dropoffCoords: dropoffLocation.coords,
        estimatedDistance: routeDistance,
        estimatedTime: estimatedTime,
        bookingType: 'custom',
        status: 'pending_driver_confirmation'
      };
    }

    bookingMutation.mutate(bookingData);
  };

  const handlePickupSelect = (location: LocationData) => {
    setPickupLocation(location);
    if (!dropoffLocation) {
      setMapMode('dropoff');
    }
  };

  const handleDropoffSelect = (location: LocationData) => {
    setDropoffLocation(location);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading available routes...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-blue-600" />
              Book Your Ride
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(90vh-120px)]">
          {/* Left Panel - Booking Form */}
          <div className="lg:w-1/2 overflow-y-auto">
            <Tabs value={bookingMode} onValueChange={(value) => setBookingMode(value as 'standard' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="standard" className="flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Standard Routes
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Custom Route
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standard" className="space-y-4">
                {/* Route Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Select Route</Label>
                  <Select value={selectedScheduleId?.toString() || ""} onValueChange={(value) => setSelectedScheduleId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your route" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {availableSchedules?.map((schedule: Schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id.toString()}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-sm">{schedule.route.name}</span>
                            <span className="text-xs text-gray-500">
                              {schedule.departureTime} • ${schedule.route.baseFare} • {schedule.availableSeats} seats left
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pickup Points */}
                {selectedSchedule && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Pickup Point</Label>
                    <Select value={standardPickup} onValueChange={setStandardPickup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pickup point" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedSchedule.route.pickupPoints.map((point: string) => (
                          <SelectItem key={point} value={point}>{point}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Dropoff Points */}
                {selectedSchedule && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Dropoff Point</Label>
                    <Select value={standardDropoff} onValueChange={setStandardDropoff}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dropoff point" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedSchedule.route.dropoffPoints.map((point: string) => (
                          <SelectItem key={point} value={point}>{point}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                {/* Map Mode Selection */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={mapMode === 'pickup' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMapMode('pickup')}
                    className="flex-1"
                  >
                    <MapPin className="w-4 h-4 mr-2 text-green-600" />
                    Set Pickup
                  </Button>
                  <Button
                    type="button"
                    variant={mapMode === 'dropoff' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMapMode('dropoff')}
                    className="flex-1"
                  >
                    <MapPin className="w-4 h-4 mr-2 text-red-600" />
                    Set Dropoff
                  </Button>
                </div>

                {/* Selected Locations Display */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pickup Location</p>
                      <p className="text-xs text-gray-600">
                        {pickupLocation ? pickupLocation.name : 'Not selected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Dropoff Location</p>
                      <p className="text-xs text-gray-600">
                        {dropoffLocation ? dropoffLocation.name : 'Not selected'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route Info for Custom Booking */}
                {pickupLocation && dropoffLocation && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Route Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Distance:</span>
                        <span className="text-sm font-medium">{routeDistance.toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Est. Time:</span>
                        <span className="text-sm font-medium">{estimatedTime} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base Fare:</span>
                        <span className="text-sm font-medium">${customFare.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Common booking options */}
            <div className="space-y-4 mt-6">
              {/* Number of Seats */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Number of Passengers</Label>
                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNumberOfSeats(Math.max(1, numberOfSeats - 1))}
                    disabled={numberOfSeats <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="flex items-center gap-2 px-4 py-2 border rounded-lg min-w-[80px] justify-center">
                    <Users className="w-4 h-4" />
                    {numberOfSeats}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNumberOfSeats(Math.min(4, numberOfSeats + 1))}
                    disabled={numberOfSeats >= 4}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecocash">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        EcoCash
                      </div>
                    </SelectItem>
                    <SelectItem value="onemoney">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        OneMoney
                      </div>
                    </SelectItem>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Cash
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fare Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Fare Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Base Fare ({numberOfSeats} seat{numberOfSeats > 1 ? 's' : ''}):</span>
                    <span className="text-sm">${(bookingMode === 'custom' ? customFare * numberOfSeats : baseFare * numberOfSeats).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Service Fee:</span>
                    <span className="text-sm">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-lg text-green-600">${totalFare.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Actions */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleBooking}
                  disabled={bookingMutation.isPending}
                  className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary/90"
                >
                  {bookingMutation.isPending ? "Processing..." : 
                   bookingMode === 'custom' ? "Request Custom Route" : "Confirm Booking"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Interactive Map (only for custom mode) */}
          {bookingMode === 'custom' && (
            <div className="lg:w-1/2 h-full">
              {!mapError ? (
                <div className="h-full">
                  <InteractiveMap
                    onPickupSelect={handlePickupSelect}
                    onDropoffSelect={handleDropoffSelect}
                    selectedPickup={pickupLocation}
                    selectedDropoff={dropoffLocation}
                    mode={mapMode}
                    className="h-full"
                  />
                  <div className="mt-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapError(true)}
                      className="text-xs"
                    >
                      Use Location List
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <FallbackMap
                    onPickupSelect={handlePickupSelect}
                    onDropoffSelect={handleDropoffSelect}
                    selectedPickup={pickupLocation}
                    selectedDropoff={dropoffLocation}
                    mode={mapMode}
                    className="h-full"
                  />
                  <div className="mt-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapError(false)}
                      className="text-xs"
                    >
                      Try Map View
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}