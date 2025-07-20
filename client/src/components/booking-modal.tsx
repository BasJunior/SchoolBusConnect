import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, X, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");
  const [customPickupPoint, setCustomPickupPoint] = useState("");
  const [customDropoffPoint, setCustomDropoffPoint] = useState("");
  const [useCustomPickup, setUseCustomPickup] = useState(false);
  const [useCustomDropoff, setUseCustomDropoff] = useState(false);
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("ecocash");

  const today = new Date().toISOString().split('T')[0];
  
  const { data: availableSchedules, isLoading } = useQuery({
    queryKey: ["/api/schedules/available", today],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/available?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    },
    enabled: isOpen,
  });

  const selectedSchedule = availableSchedules?.find(s => s.id === selectedScheduleId);
  const baseFare = selectedSchedule?.route ? parseFloat(selectedSchedule.route.baseFare) : 0;
  const serviceFee = 0.50;
  const totalFare = (baseFare * numberOfSeats) + serviceFee;

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
      toast({
        title: "Booking Confirmed",
        description: "Your seat has been reserved successfully",
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
    setPickupPoint("");
    setDropoffPoint("");
    setCustomPickupPoint("");
    setCustomDropoffPoint("");
    setUseCustomPickup(false);
    setUseCustomDropoff(false);
    setNumberOfSeats(1);
    setPaymentMethod("ecocash");
  };

  const handleBooking = () => {
    const finalPickupPoint = useCustomPickup ? customPickupPoint : pickupPoint;
    const finalDropoffPoint = useCustomDropoff ? customDropoffPoint : dropoffPoint;
    
    if (!selectedScheduleId || !finalPickupPoint || !finalDropoffPoint || !user) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      userId: user.id,
      scheduleId: selectedScheduleId,
      pickupPoint: useCustomPickup ? "Custom Location" : pickupPoint,
      dropoffPoint: useCustomDropoff ? "Custom Location" : dropoffPoint,
      customPickupPoint: useCustomPickup ? customPickupPoint : null,
      customDropoffPoint: useCustomDropoff ? customDropoffPoint : null,
      numberOfSeats,
      totalFare: totalFare.toFixed(2),
      paymentMethod,
      travelDate: today,
    };

    bookingMutation.mutate(bookingData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Book Your Ride
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Route Selection */}
          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-2 block">Select Route</Label>
            {isLoading ? (
              <div className="p-3 border border-gray-200 rounded-xl animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {availableSchedules?.map((schedule) => (
                  <button
                    key={schedule.id}
                    className={`w-full text-left p-3 border rounded-xl transition-all duration-200 ${
                      selectedScheduleId === schedule.id 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedScheduleId(schedule.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-800 text-sm sm:text-base truncate">
                          {schedule.route?.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs sm:text-sm text-neutral-600 bg-gray-100 px-2 py-1 rounded">
                            {schedule.departureTime}
                          </span>
                          <span className="text-xs sm:text-sm text-neutral-600">
                            {schedule.route?.estimatedDuration} min
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center space-x-2 sm:space-x-0">
                        <p className="font-bold text-green-600 text-lg sm:text-xl">
                          ${schedule.route?.baseFare}
                        </p>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Available
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSchedule && (
            <>
              {/* Pickup Point */}
              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-2 block">Pickup Point</Label>
                {!useCustomPickup ? (
                  <div className="space-y-2">
                    <Select value={pickupPoint} onValueChange={setPickupPoint}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select pickup point" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {selectedSchedule.route?.pickupPoints?.map((point) => (
                          <SelectItem key={point} value={point} className="py-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              <span>{point}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="custom-pickup" 
                        checked={useCustomPickup}
                        onCheckedChange={setUseCustomPickup}
                      />
                      <Label htmlFor="custom-pickup" className="text-sm text-neutral-600">
                        Use custom pickup location
                      </Label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <Label className="text-sm text-blue-600 font-medium">Custom Pickup Location</Label>
                    </div>
                    <Input
                      value={customPickupPoint}
                      onChange={(e) => setCustomPickupPoint(e.target.value)}
                      placeholder="Enter your pickup address or landmark"
                      className="border-blue-200 focus:border-blue-400"
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="custom-pickup" 
                        checked={useCustomPickup}
                        onCheckedChange={setUseCustomPickup}
                      />
                      <Label htmlFor="custom-pickup" className="text-sm text-neutral-600">
                        Use standard pickup points instead
                      </Label>
                    </div>
                    <p className="text-xs text-blue-600">
                      Driver will contact you to confirm this location or suggest nearby alternatives.
                    </p>
                  </div>
                )}
              </div>

              {/* Drop-off Point */}
              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-2 block">Drop-off Point</Label>
                {!useCustomDropoff ? (
                  <div className="space-y-2">
                    <Select value={dropoffPoint} onValueChange={setDropoffPoint}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select drop-off point" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {selectedSchedule.route?.dropoffPoints?.map((point) => (
                          <SelectItem key={point} value={point} className="py-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-green-500" />
                              <span>{point}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="custom-dropoff" 
                        checked={useCustomDropoff}
                        onCheckedChange={setUseCustomDropoff}
                      />
                      <Label htmlFor="custom-dropoff" className="text-sm text-neutral-600">
                        Use custom drop-off location
                      </Label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <Label className="text-sm text-green-600 font-medium">Custom Drop-off Location</Label>
                    </div>
                    <Input
                      value={customDropoffPoint}
                      onChange={(e) => setCustomDropoffPoint(e.target.value)}
                      placeholder="Enter your drop-off address or landmark"
                      className="border-green-200 focus:border-green-400"
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="custom-dropoff" 
                        checked={useCustomDropoff}
                        onCheckedChange={setUseCustomDropoff}
                      />
                      <Label htmlFor="custom-dropoff" className="text-sm text-neutral-600">
                        Use standard drop-off points instead
                      </Label>
                    </div>
                    <p className="text-xs text-green-600">
                      Driver will contact you to confirm this location or suggest nearby alternatives.
                    </p>
                  </div>
                )}
              </div>

              {/* Number of Seats */}
              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-2 block">Number of Seats</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNumberOfSeats(Math.max(1, numberOfSeats - 1))}
                    disabled={numberOfSeats <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-medium text-neutral-800 min-w-[2rem] text-center">
                    {numberOfSeats}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNumberOfSeats(Math.min(8, numberOfSeats + 1))}
                    disabled={numberOfSeats >= 8}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Fare Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-600">Base Fare ({numberOfSeats} seat{numberOfSeats > 1 ? 's' : ''})</span>
                  <span className="text-neutral-800">${(baseFare * numberOfSeats).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-600">Service Fee</span>
                  <span className="text-neutral-800">${serviceFee.toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-neutral-800">Total</span>
                  <span className="text-primary text-lg">${totalFare.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-2 block">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecocash" className="py-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-green-600 text-lg">💚</span>
                        <div>
                          <p className="font-medium">EcoCash</p>
                          <p className="text-xs text-gray-500">Mobile Money</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="cash" className="py-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600 text-lg">💵</span>
                        <div>
                          <p className="font-medium">Cash</p>
                          <p className="text-xs text-gray-500">Pay on Board</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="onemoney" className="py-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-600 text-lg">📱</span>
                        <div>
                          <p className="font-medium">OneMoney</p>
                          <p className="text-xs text-gray-500">Mobile Payment</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="telecash" className="py-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-orange-600 text-lg">📲</span>
                        <div>
                          <p className="font-medium">TeleCash</p>
                          <p className="text-xs text-gray-500">Mobile Banking</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {paymentMethod === "ecocash" && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      You'll receive an EcoCash prompt to complete payment after booking confirmation.
                    </p>
                  </div>
                )}
                {paymentMethod === "cash" && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Pay the driver directly when you board. Please have exact change ready.
                    </p>
                  </div>
                )}
              </div>

              {/* Booking Actions */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleBooking}
                  disabled={bookingMutation.isPending}
                  className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary/90"
                >
                  {bookingMutation.isPending ? "Confirming..." : "Confirm Booking"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-medium"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
