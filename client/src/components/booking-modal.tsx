import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, X } from "lucide-react";
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
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const today = new Date().toISOString().split('T')[0];
  
  const { data: availableSchedules, isLoading } = useQuery({
    queryKey: ["/api/schedules/available", today],
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
    setNumberOfSeats(1);
    setPaymentMethod("card");
  };

  const handleBooking = () => {
    if (!selectedScheduleId || !pickupPoint || !dropoffPoint || !user) {
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
      pickupPoint,
      dropoffPoint,
      numberOfSeats,
      totalFare: totalFare.toFixed(2),
      paymentMethod,
      travelDate: today,
    };

    bookingMutation.mutate(bookingData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                    className={`w-full text-left p-3 border rounded-xl transition-colors ${
                      selectedScheduleId === schedule.id 
                        ? 'border-primary bg-blue-50' 
                        : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => setSelectedScheduleId(schedule.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-800">{schedule.route?.name}</p>
                        <p className="text-sm text-neutral-600">
                          {schedule.departureTime} departure • {schedule.route?.estimatedDuration} min journey
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-neutral-800">${schedule.route?.baseFare}</p>
                        <p className="text-sm text-secondary">Available</p>
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
                <Select value={pickupPoint} onValueChange={setPickupPoint}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pickup point" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSchedule.route?.pickupPoints?.map((point) => (
                      <SelectItem key={point} value={point}>{point}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drop-off Point */}
              <div>
                <Label className="text-sm font-medium text-neutral-700 mb-2 block">Drop-off Point</Label>
                <Select value={dropoffPoint} onValueChange={setDropoffPoint}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select drop-off point" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSchedule.route?.dropoffPoints?.map((point) => (
                      <SelectItem key={point} value={point}>{point}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit Card ****1234</SelectItem>
                    <SelectItem value="wallet">Digital Wallet</SelectItem>
                  </SelectContent>
                </Select>
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
