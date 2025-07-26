import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign, 
  Users, 
  Route,
  Save,
  X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";

interface DriverRouteConfigProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: number;
}

interface DriverRoute {
  id: number;
  name: string;
  origin: string;
  destination: string;
  baseFare: string;
  maxSeats: number;
  departureTime: string;
  routeType: string;
  serviceArea: string;
  isActive: boolean;
  isAvailable: boolean;
  daysOfWeek: string[];
}

const HARARE_LOCATIONS = [
  "Harare CBD",
  "University of Zimbabwe",
  "Chitungwiza",
  "Mbare",
  "Avondale",
  "Borrowdale",
  "Highfield",
  "Warren Park",
  "Industrial Area",
  "Westgate",
  "Glen View",
  "Budiriro"
];

const ROUTE_TYPES = [
  { value: "school", label: "School Routes" },
  { value: "work", label: "Work Commute" },
  { value: "general", label: "General Transport" },
  { value: "custom", label: "Custom Route" }
];

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" }
];

export default function DriverRouteConfig({ isOpen, onClose, driverId }: DriverRouteConfigProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DriverRoute | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  const [newRoute, setNewRoute] = useState({
    name: "",
    origin: "",
    destination: "",
    baseFare: "2.00",
    maxSeats: 14,
    departureTime: "07:00",
    arrivalTime: "08:00", 
    routeType: "general",
    serviceArea: "Harare Central",
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"] as string[]
  });

  // Fetch driver routes
  const { data: routes = [], isLoading } = useQuery({
    queryKey: [`/api/driver-routes/${driverId}`],
    enabled: isOpen && !!driverId,
  });

  // Fetch driver availability
  const { data: availability } = useQuery({
    queryKey: [`/api/driver-availability/${driverId}`],
    enabled: isOpen && !!driverId,
  });

  useEffect(() => {
    if (availability) {
      setIsOnline(availability.status === "online");
    }
  }, [availability]);

  // Create route mutation
  const createRouteMutation = useMutation({
    mutationFn: async (routeData: any) => {
      return await apiRequest(`/api/driver-routes`, {
        method: "POST",
        body: JSON.stringify({
          ...routeData,
          driverId,
          vehicleId: user?.userType === "driver" ? 1 : undefined, // Would get from driver's vehicle
          originCoordinates: "-17.8292,31.0522", // Would get from map selection
          destinationCoordinates: "-17.7840,31.0547", // Would get from map selection
          pickupPoints: [routeData.origin],
          dropoffPoints: [routeData.destination],
          pickupCoordinates: ["-17.8292,31.0522"],
          dropoffCoordinates: ["-17.7840,31.0547"],
          pricePerKm: "0.50",
          estimatedDuration: 45
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Route Created",
        description: "Your new route has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/driver-routes/${driverId}`] });
      setIsCreating(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create route. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update route mutation
  const updateRouteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await apiRequest(`/api/driver-routes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({
        title: "Route Updated",
        description: "Route has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/driver-routes/${driverId}`] });
      setEditingRoute(null);
    },
  });

  // Delete route mutation
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/driver-routes/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Route Deleted",
        description: "Route has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/driver-routes/${driverId}`] });
    },
  });

  // Driver availability toggle
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (online: boolean) => {
      if (online) {
        return await apiRequest(`/api/driver-availability/${driverId}/online`, {
          method: "POST",
          body: JSON.stringify({ lat: -17.8292, lng: 31.0522 }), // Would get user's location
        });
      } else {
        return await apiRequest(`/api/driver-availability/${driverId}/offline`, {
          method: "POST",
        });
      }
    },
    onSuccess: (_, online) => {
      toast({
        title: online ? "You're Online" : "You're Offline",
        description: online 
          ? "You will now receive booking requests in your area."
          : "You will not receive booking requests.",
      });
      setIsOnline(online);
      queryClient.invalidateQueries({ queryKey: [`/api/driver-availability/${driverId}`] });
    },
  });

  const resetForm = () => {
    setNewRoute({
      name: "",
      origin: "",
      destination: "",
      baseFare: "2.00",
      maxSeats: 14,
      departureTime: "07:00",
      arrivalTime: "08:00",
      routeType: "general",
      serviceArea: "Harare Central",
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    });
  };

  const handleCreateRoute = () => {
    if (!newRoute.name || !newRoute.origin || !newRoute.destination) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createRouteMutation.mutate(newRoute);
  };

  const handleUpdateRoute = (id: number, updates: any) => {
    updateRouteMutation.mutate({ id, updates });
  };

  const handleDayToggle = (day: string) => {
    setNewRoute(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Driver Route Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Driver Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Driver Status</CardTitle>
              <CardDescription>
                Control your availability to receive booking requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <Label className="font-medium">
                      {isOnline ? "Online & Available" : "Offline"}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {isOnline 
                        ? "Accepting bookings in your service area"
                        : "Not accepting bookings"
                      }
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={isOnline}
                  onCheckedChange={(checked) => toggleAvailabilityMutation.mutate(checked)}
                  disabled={toggleAvailabilityMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Existing Routes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Routes</CardTitle>
              <CardDescription>
                Manage your configured routes and schedules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">Loading routes...</div>
              ) : routes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Route className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No routes configured yet</p>
                  <p className="text-sm">Create your first route to start receiving bookings</p>
                </div>
              ) : (
                routes.map((route: DriverRoute) => (
                  <div key={route.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{route.name}</h4>
                          <Badge variant={route.isActive ? "default" : "secondary"}>
                            {route.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-600">Route</Label>
                            <p>{route.origin} → {route.destination}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Departure</Label>
                            <p>{route.departureTime}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Fare</Label>
                            <p>${route.baseFare}</p>
                          </div>
                          <div>
                            <Label className="text-gray-600">Capacity</Label>
                            <p>{route.maxSeats} seats</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Label className="text-gray-600">Days</Label>
                          <div className="flex gap-1 mt-1">
                            {route.daysOfWeek.map(day => (
                              <Badge key={day} variant="outline" className="text-xs">
                                {day.slice(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRoute(route)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRouteMutation.mutate(route.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              <Button 
                onClick={() => setIsCreating(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Route
              </Button>
            </CardContent>
          </Card>

          {/* Create New Route Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New Route</CardTitle>
                <CardDescription>
                  Configure a new route for your service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Route Name</Label>
                    <Input
                      placeholder="e.g., Morning CBD Commute"
                      value={newRoute.name}
                      onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Route Type</Label>
                    <Select value={newRoute.routeType} onValueChange={(value) => setNewRoute({...newRoute, routeType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROUTE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origin</Label>
                    <Select value={newRoute.origin} onValueChange={(value) => setNewRoute({...newRoute, origin: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select origin" />
                      </SelectTrigger>
                      <SelectContent>
                        {HARARE_LOCATIONS.map(location => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <Select value={newRoute.destination} onValueChange={(value) => setNewRoute({...newRoute, destination: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {HARARE_LOCATIONS.map(location => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Base Fare ($)</Label>
                    <Input
                      type="number"
                      step="0.50"
                      value={newRoute.baseFare}
                      onChange={(e) => setNewRoute({...newRoute, baseFare: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Seats</Label>
                    <Input
                      type="number"
                      value={newRoute.maxSeats}
                      onChange={(e) => setNewRoute({...newRoute, maxSeats: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Departure Time</Label>
                    <Input
                      type="time"
                      value={newRoute.departureTime}
                      onChange={(e) => setNewRoute({...newRoute, departureTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Operating Days</Label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <Button
                        key={day.value}
                        variant={newRoute.daysOfWeek.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDayToggle(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateRoute}
                    disabled={createRouteMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Create Route
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}