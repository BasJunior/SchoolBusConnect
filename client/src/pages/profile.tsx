import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/App";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Mail, Phone, LogOut, Settings, Shield } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      
      <div className="p-4 pb-20 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{user?.fullName}</CardTitle>
                <p className="text-neutral-600 capitalize">{user?.userType}</p>
                <p className="text-sm text-neutral-500">@{user?.username}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <div className="flex items-center space-x-2 mt-1">
                <User className="w-4 h-4 text-neutral-400" />
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="w-4 h-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Phone className="w-4 h-4 text-neutral-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-neutral-600" />
                <div>
                  <p className="font-medium">Account Verification</p>
                  <p className="text-sm text-neutral-600">
                    {user?.isVerified ? "Verified" : "Not verified"}
                  </p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                user?.isVerified ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-neutral-600" />
                <div>
                  <p className="font-medium">Notification Settings</p>
                  <p className="text-sm text-neutral-600">Manage your preferences</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Dashboard Link */}
        {user?.userType === "driver" && (
          <Card>
            <CardContent className="pt-6">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = "/driver"}
              >
                Switch to Driver Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
