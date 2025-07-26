import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  Phone, 
  MessageCircle,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Route
} from "lucide-react";
import { useAuth } from "@/App";
import { format } from "date-fns";
import MobileHeader from "@/components/mobile-header";
import BottomNav from "@/components/bottom-nav";

interface BookingWithDetails {
  id: number;
  travelDate: string;
  numberOfSeats: number;
  totalFare: string;
  status: string;
  paymentMethod: string;
  pickupPoint: string;
  dropoffPoint: string;
  customPickupPoint?: string;
  customDropoffPoint?: string;
  pickupCoordinates?: string;
  dropoffCoordinates?: string;
  bookingType: string;
  driverResponse?: string;
  alternativePickup?: string;
  alternativeDropoff?: string;
  driverNotes?: string;
  createdAt: string;
  schedule?: {
    id: number;
    departureTime: string;
    route: {
      id: number;
      name: string;
      origin: string;
      destination: string;
      estimatedDuration: number;
    };
    vehicle: {
      id: number;
      vehicleNumber: string;
      vehicleType: string;
      driver: {
        id: number;
        fullName: string;
        phone: string;
      };
    };
  };
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'pending':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'in_transit':
      return <Truck className="w-5 h-5 text-blue-500" />;
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'cancelled':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'driver_alternative':
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_transit':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'driver_alternative':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'pending':
      return 'Pending';
    case 'in_transit':
      return 'In Transit';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'driver_alternative':
      return 'Alternative Offered';
    default:
      return status;
  }
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("all");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [`/api/bookings/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const filterBookings = (bookings: BookingWithDetails[], filter: string) => {
    switch (filter) {
      case 'active':
        return bookings.filter(b => ['confirmed', 'pending', 'in_transit', 'driver_alternative'].includes(b.status));
      case 'completed':
        return bookings.filter(b => b.status === 'completed');
      case 'cancelled':
        return bookings.filter(b => b.status === 'cancelled');
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings(bookings as BookingWithDetails[], selectedTab);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      <main id="main-content" role="main" aria-label="Booking history and trip management" tabIndex={-1}>
        <div className="container mx-auto p-4 pb-20 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-blue-500" aria-hidden="true" />
            <h1 className="text-2xl font-bold">My Bookings</h1>
          </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4" role="tablist" aria-label="Filter bookings by status">
          <TabsTrigger value="all" role="tab" aria-controls="bookings-all">All</TabsTrigger>
          <TabsTrigger value="active" role="tab" aria-controls="bookings-active">Active</TabsTrigger>
          <TabsTrigger value="completed" role="tab" aria-controls="bookings-completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" role="tab" aria-controls="bookings-cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent 
          value={selectedTab} 
          className="mt-6"
          role="tabpanel"
          id={`bookings-${selectedTab}`}
          aria-labelledby={`tab-${selectedTab}`}
        >
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No {selectedTab === 'all' ? '' : selectedTab} bookings found
                </h3>
                <p className="text-gray-500 text-center">
                  {selectedTab === 'all' 
                    ? "You haven't made any bookings yet. Start by booking your first ride!"
                    : `You don't have any ${selectedTab} bookings at the moment.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(booking.status)}
                        <div>
                          <CardTitle className="text-lg">
                            {booking.schedule?.route?.name || 
                             `${booking.customPickupPoint || booking.pickupPoint} → ${booking.customDropoffPoint || booking.dropoffPoint}`}
                          </CardTitle>
                          <CardDescription>
                            Booking #{booking.id} • {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Trip Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Travel Date:</span>
                          <span>{format(new Date(booking.travelDate), 'MMM dd, yyyy')}</span>
                        </div>
                        
                        {booking.schedule?.departureTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">Departure:</span>
                            <span>{booking.schedule.departureTime}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Seats:</span>
                          <span>{booking.numberOfSeats}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Total Fare:</span>
                          <span className="font-semibold">${booking.totalFare}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <div className="font-medium">Pickup:</div>
                            <div className="text-gray-600">
                              {booking.customPickupPoint || booking.pickupPoint}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                          <Navigation className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <div className="font-medium">Dropoff:</div>
                            <div className="text-gray-600">
                              {booking.customDropoffPoint || booking.dropoffPoint}
                            </div>
                          </div>
                        </div>

                        {booking.bookingType && (
                          <div className="flex items-center gap-2 text-sm">
                            <Route className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">Type:</span>
                            <Badge variant="outline" className="text-xs">
                              {booking.bookingType === 'custom' ? 'Custom Route' : 'Scheduled Route'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Driver Information */}
                    {booking.schedule?.vehicle?.driver && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Driver Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Driver:</span> {booking.schedule.vehicle.driver.fullName}
                          </div>
                          <div>
                            <span className="font-medium">Vehicle:</span> {booking.schedule.vehicle.vehicleNumber} ({booking.schedule.vehicle.vehicleType})
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{booking.schedule.vehicle.driver.phone}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Driver Alternative Offer */}
                    {booking.status === 'driver_alternative' && booking.alternativePickup && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2 text-orange-600">Driver Alternative Offer</h4>
                        <div className="bg-orange-50 p-3 rounded-lg space-y-2 text-sm">
                          {booking.alternativePickup && (
                            <div>
                              <span className="font-medium">Alternative Pickup:</span> {booking.alternativePickup}
                            </div>
                          )}
                          {booking.alternativeDropoff && (
                            <div>
                              <span className="font-medium">Alternative Dropoff:</span> {booking.alternativeDropoff}
                            </div>
                          )}
                          {booking.driverNotes && (
                            <div>
                              <span className="font-medium">Driver Notes:</span> {booking.driverNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      {booking.status === 'confirmed' && (
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <Navigation className="w-4 h-4" />
                          Track Trip
                        </Button>
                      )}
                      
                      {booking.status === 'driver_alternative' && (
                        <>
                          <Button size="sm" className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Accept Alternative
                          </Button>
                          <Button size="sm" variant="outline">
                            Decline
                          </Button>
                        </>
                      )}

                      {booking.schedule?.vehicle?.driver && (
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Message Driver
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        </Tabs>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}