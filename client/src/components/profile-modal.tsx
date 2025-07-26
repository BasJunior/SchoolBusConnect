import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings, 
  Shield, 
  Gift, 
  LogOut, 
  Edit, 
  Save, 
  X,
  Star,
  Crown,
  Trophy,
  Bell,
  Eye,
  Lock,
  Smartphone,
  Route
} from "lucide-react";
import { useAuth } from "@/App";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DriverRouteConfig from "./driver-route-config";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isDriverRouteConfigOpen, setIsDriverRouteConfigOpen] = useState(false);
  const [editData, setEditData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    shareLocation: true,
    dataAnalytics: true,
    marketingEmails: false,
    pushNotifications: true,
    profileVisibility: true,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/auth/profile`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editData);
  };

  const mockRewards = [
    { id: 1, title: "Frequent Rider", description: "Complete 10 trips", points: 100, earned: true },
    { id: 2, title: "Early Bird", description: "Book morning rides 5 times", points: 50, earned: true },
    { id: 3, title: "Route Explorer", description: "Use 5 different routes", points: 75, earned: false },
    { id: 4, title: "Loyal Customer", description: "Use app for 30 days", points: 200, earned: false },
  ];

  const totalPoints = mockRewards.filter(r => r.earned).reduce((sum, r) => sum + r.points, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={`grid w-full ${user?.userType === "driver" ? "grid-cols-5" : "grid-cols-4"}`}>
            <TabsTrigger value="profile" className="text-xs">
              <User className="w-4 h-4" />
            </TabsTrigger>
            {user?.userType === "driver" && (
              <TabsTrigger value="routes" className="text-xs">
                <Route className="w-4 h-4" />
              </TabsTrigger>
            )}
            <TabsTrigger value="rewards" className="text-xs">
              <Gift className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs">
              <Shield className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {user?.fullName}
                </h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <Badge variant="secondary" className="mt-1">
                  {user?.userType === "driver" ? "Driver" : "Passenger"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              </Button>
            </div>

            <Separator />

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={editData.fullName}
                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Name</Label>
                  <p className="font-medium">{user?.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Phone</Label>
                  <p className="font-medium">{user?.phone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Account Type</Label>
                  <p className="font-medium capitalize">{user?.userType}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Driver Routes Tab */}
          {user?.userType === "driver" && (
            <TabsContent value="routes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Route className="w-5 h-5 text-blue-500" />
                    Route Management
                  </CardTitle>
                  <CardDescription>
                    Configure your routes and manage your availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <Route className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">Driver Route Configuration</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Set up your routes, schedules, and availability to receive targeted booking requests
                      </p>
                      <Button 
                        onClick={() => setIsDriverRouteConfigOpen(true)}
                        className="w-full"
                      >
                        <Route className="w-4 h-4 mr-2" />
                        Configure Routes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Your Points
                </CardTitle>
                <CardDescription>
                  Earn points by using OmniRide regularly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{totalPoints}</div>
                  <p className="text-sm text-gray-600">Total Points Earned</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Achievements
              </h4>
              {mockRewards.map((reward) => (
                <Card key={reward.id} className={reward.earned ? "border-green-200 bg-green-50" : ""}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{reward.title}</h5>
                          {reward.earned && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        </div>
                        <p className="text-sm text-gray-600">{reward.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={reward.earned ? "default" : "secondary"}>
                          {reward.points} pts
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Privacy</CardTitle>
                <CardDescription>
                  Control how your data is used and shared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="font-medium">Profile Visibility</Label>
                      <p className="text-xs text-gray-600">Show your profile to other users</p>
                    </div>
                  </div>
                  <Switch 
                    checked={privacySettings.profileVisibility}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({...privacySettings, profileVisibility: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="font-medium">Location Sharing</Label>
                      <p className="text-xs text-gray-600">Share location for better route matching</p>
                    </div>
                  </div>
                  <Switch 
                    checked={privacySettings.shareLocation}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({...privacySettings, shareLocation: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="font-medium">Data Analytics</Label>
                      <p className="text-xs text-gray-600">Help improve the app with usage data</p>
                    </div>
                  </div>
                  <Switch 
                    checked={privacySettings.dataAnalytics}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({...privacySettings, dataAnalytics: checked})
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">App Settings</CardTitle>
                <CardDescription>
                  Customize your app experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="font-medium">Push Notifications</Label>
                      <p className="text-xs text-gray-600">Get notified about ride updates</p>
                    </div>
                  </div>
                  <Switch 
                    checked={privacySettings.pushNotifications}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({...privacySettings, pushNotifications: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="font-medium">Marketing Emails</Label>
                      <p className="text-xs text-gray-600">Receive promotional offers</p>
                    </div>
                  </div>
                  <Switch 
                    checked={privacySettings.marketingEmails}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({...privacySettings, marketingEmails: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">App Version</Label>
                  <p className="text-sm text-gray-600">1.0.0</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Terms & Privacy</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Terms of Service
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Privacy Policy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Driver Route Configuration Modal */}
      {user?.userType === "driver" && (
        <DriverRouteConfig 
          isOpen={isDriverRouteConfigOpen}
          onClose={() => setIsDriverRouteConfigOpen(false)}
          driverId={user.id}
        />
      )}
    </Dialog>
  );
}