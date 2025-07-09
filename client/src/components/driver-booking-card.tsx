import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Clock, User, Phone, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DriverBookingCardProps {
  booking: any;
}

export default function DriverBookingCard({ booking }: DriverBookingCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState<"accepted" | "alternative_offered" | "declined">("accepted");
  const [alternativePickup, setAlternativePickup] = useState("");
  const [alternativeDropoff, setAlternativeDropoff] = useState("");
  const [driverNotes, setDriverNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const responseMutation = useMutation({
    mutationFn: async (responseData: any) => {
      return apiRequest(`/api/bookings/${booking.id}/driver-response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the passenger.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/driver"] });
      setShowResponseForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResponse = () => {
    const responseData = {
      driverResponse: response,
      alternativePickup: response === "alternative_offered" ? alternativePickup : null,
      alternativeDropoff: response === "alternative_offered" ? alternativeDropoff : null,
      driverNotes: driverNotes || null,
    };

    responseMutation.mutate(responseData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending Response</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="text-green-600 border-green-300">Confirmed</Badge>;
      case "driver_alternative":
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Alternative Offered</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-red-600 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasCustomLocations = booking.customPickupPoint || booking.customDropoffPoint;

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Booking #{booking.bookingNumber}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {booking.schedule.route.name}
            </p>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Passenger Info */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <User className="w-5 h-5 text-gray-600" />
          <div>
            <p className="font-medium text-gray-800">{booking.schedule.vehicle.driver.fullName}</p>
            <p className="text-sm text-gray-600">{booking.schedule.vehicle.driver.phone}</p>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-green-500" />
              <div>
                <Label className="text-sm font-medium text-gray-700">Pickup</Label>
                <p className="text-sm text-gray-600">
                  {booking.customPickupPoint || booking.pickupPoint}
                </p>
                {booking.customPickupPoint && (
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Custom location - needs confirmation
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <div>
                <Label className="text-sm font-medium text-gray-700">Drop-off</Label>
                <p className="text-sm text-gray-600">
                  {booking.customDropoffPoint || booking.dropoffPoint}
                </p>
                {booking.customDropoffPoint && (
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Custom location - needs confirmation
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <Label className="text-sm font-medium text-gray-700">Time</Label>
                <p className="text-sm text-gray-600">{booking.schedule.departureTime}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Seats</Label>
              <p className="text-sm text-gray-600">{booking.numberOfSeats} passenger(s)</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Fare</Label>
              <p className="text-sm text-gray-600">${booking.totalFare}</p>
            </div>
          </div>
        </div>

        {/* Driver Response Section */}
        {booking.status === "pending" && !showResponseForm && (
          <div className="flex space-x-2 pt-3 border-t">
            <Button 
              onClick={() => setShowResponseForm(true)}
              className="flex-1"
              variant="outline"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Respond to Booking
            </Button>
          </div>
        )}

        {/* Response Form */}
        {showResponseForm && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-t">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Your Response</Label>
              <div className="flex space-x-2">
                <Button
                  variant={response === "accepted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResponse("accepted")}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  variant={response === "alternative_offered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResponse("alternative_offered")}
                  className="flex-1"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Suggest Alternative
                </Button>
                <Button
                  variant={response === "declined" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setResponse("declined")}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>

            {response === "alternative_offered" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Alternative Pickup Location</Label>
                  <Input
                    value={alternativePickup}
                    onChange={(e) => setAlternativePickup(e.target.value)}
                    placeholder="Suggest alternative pickup point"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Alternative Drop-off Location</Label>
                  <Input
                    value={alternativeDropoff}
                    onChange={(e) => setAlternativeDropoff(e.target.value)}
                    placeholder="Suggest alternative drop-off point"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-gray-700">Message to Passenger (Optional)</Label>
              <Textarea
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                placeholder="Add any additional notes for the passenger..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleResponse}
                disabled={responseMutation.isPending}
                className="flex-1"
              >
                {responseMutation.isPending ? "Sending..." : "Send Response"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResponseForm(false)}
                disabled={responseMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Show existing driver response */}
        {booking.driverResponse && booking.status !== "pending" && (
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-400">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <Label className="text-sm font-medium text-blue-700">Your Response</Label>
            </div>
            
            {booking.driverResponse === "alternative_offered" && (
              <div className="space-y-2 text-sm">
                {booking.alternativePickup && (
                  <p><strong>Alternative Pickup:</strong> {booking.alternativePickup}</p>
                )}
                {booking.alternativeDropoff && (
                  <p><strong>Alternative Drop-off:</strong> {booking.alternativeDropoff}</p>
                )}
              </div>
            )}
            
            {booking.driverNotes && (
              <p className="text-sm text-gray-600 mt-2">{booking.driverNotes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}