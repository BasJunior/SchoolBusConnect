import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { X, Calendar, DollarSign, Star, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const subscriptionPackages = [
  {
    type: "1month",
    name: "Monthly",
    duration: "1 Month",
    discount: 0,
    popular: false,
    description: "Perfect for short-term commitments"
  },
  {
    type: "3months",
    name: "Quarterly", 
    duration: "3 Months",
    discount: 10,
    popular: true,
    description: "Great value for regular commuters"
  },
  {
    type: "6months",
    name: "Semester",
    duration: "6 Months", 
    discount: 15,
    popular: false,
    description: "Ideal for students and professionals"
  },
  {
    type: "12months",
    name: "Annual",
    duration: "12 Months",
    discount: 25,
    popular: false,
    description: "Maximum savings for long-term users"
  }
];

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>("3months");
  const [paymentMethod, setPaymentMethod] = useState("ecocash");

  const { data: routes } = useQuery({
    queryKey: ["/api/routes"],
  });

  const { data: userSubscriptions } = useQuery({
    queryKey: ["/api/subscriptions/user"],
    queryParams: { userId: user?.id },
    enabled: !!user?.id,
  });

  const subscriptionMutation = useMutation({
    mutationFn: async (subscriptionData: any) => {
      return apiRequest("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Subscription Created!",
        description: "Your monthly subscription has been activated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/user"] });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Subscription Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedRoute(null);
    setSelectedPackage("3months");
    setPaymentMethod("ecocash");
  };

  const handleSubscription = () => {
    if (!selectedRoute || !user) {
      toast({
        title: "Missing Information",
        description: "Please select a route and ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    const route = routes?.find((r: any) => r.id === selectedRoute);
    if (!route) return;

    const packageInfo = subscriptionPackages.find(pkg => pkg.type === selectedPackage);
    if (!packageInfo) return;

    const baseFare = parseFloat(route.baseFare);
    const discountAmount = baseFare * (packageInfo.discount / 100);
    const monthlyFare = baseFare - discountAmount;
    
    let totalAmount;
    switch (selectedPackage) {
      case "1month":
        totalAmount = monthlyFare * 30; // 30 days
        break;
      case "3months":
        totalAmount = monthlyFare * 90; // 90 days
        break;
      case "6months":
        totalAmount = monthlyFare * 180; // 180 days
        break;
      case "12months":
        totalAmount = monthlyFare * 365; // 365 days
        break;
      default:
        totalAmount = monthlyFare * 30;
    }

    const subscriptionData = {
      userId: user.id,
      routeId: selectedRoute,
      packageType: selectedPackage,
      totalAmount: totalAmount.toFixed(2),
      startDate: new Date().toISOString().split('T')[0],
      status: "active",
      paymentMethod,
    };

    subscriptionMutation.mutate(subscriptionData);
  };

  const getPackagePrice = (packageType: string, routeBaseFare: number) => {
    const packageInfo = subscriptionPackages.find(pkg => pkg.type === packageType);
    if (!packageInfo) return 0;

    const discountAmount = routeBaseFare * (packageInfo.discount / 100);
    const dailyFare = routeBaseFare - discountAmount;
    
    switch (packageType) {
      case "1month": return dailyFare * 30;
      case "3months": return dailyFare * 90;
      case "6months": return dailyFare * 180;
      case "12months": return dailyFare * 365;
      default: return dailyFare * 30;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Monthly Subscription Plans
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Route Selection */}
          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-2 block">Select Route</Label>
            <Select value={selectedRoute?.toString() || ""} onValueChange={(value) => setSelectedRoute(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose your regular route" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {routes?.map((route: any) => (
                  <SelectItem key={route.id} value={route.id.toString()}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium text-sm">{route.name}</span>
                      <span className="text-xs text-gray-500">${route.baseFare} per trip</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Package Selection */}
          {selectedRoute && (
            <div>
              <Label className="text-sm font-medium text-neutral-700 mb-3 block">Choose Package</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subscriptionPackages.map((pkg) => {
                  const route = routes?.find((r: any) => r.id === selectedRoute);
                  const packagePrice = route ? getPackagePrice(pkg.type, parseFloat(route.baseFare)) : 0;
                  const savings = route ? (parseFloat(route.baseFare) * (pkg.discount / 100)) : 0;
                  
                  return (
                    <Card
                      key={pkg.type}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedPackage === pkg.type
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      } ${pkg.popular ? 'ring-2 ring-green-200' : ''}`}
                      onClick={() => setSelectedPackage(pkg.type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">{pkg.name}</h3>
                          {pkg.popular && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{pkg.duration}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-lg font-bold text-green-600">
                              ${packagePrice.toFixed(2)}
                            </span>
                          </div>
                          
                          {pkg.discount > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                Save ${savings.toFixed(2)} per trip
                              </span>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-600">{pkg.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method */}
          {selectedRoute && (
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
                        <p className="text-xs text-gray-500">Instant monthly payment</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="onemoney" className="py-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-purple-600 text-lg">📱</span>
                      <div>
                        <p className="font-medium">OneMoney</p>
                        <p className="text-xs text-gray-500">Monthly auto-debit</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subscription Benefits */}
          {selectedRoute && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Subscription Benefits</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Guaranteed seat reservation</li>
                <li>• Priority booking for popular times</li>
                <li>• No daily booking hassle</li>
                <li>• Automatic payment processing</li>
                <li>• Cancel or pause anytime</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          {selectedRoute && (
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleSubscription}
                disabled={subscriptionMutation.isPending}
                className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary/90"
              >
                {subscriptionMutation.isPending ? "Processing..." : "Subscribe Now"}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full py-3 rounded-xl font-medium"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}