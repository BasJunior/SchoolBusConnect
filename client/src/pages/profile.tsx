import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Settings, 
  Shield, 
  Gift, 
  LogOut, 
  Edit, 
  Star,
  Crown,
  Trophy,
  Bell,
  Eye,
  Lock,
  Smartphone,
  Route,
  Award,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/App";
import MobileHeader from "@/components/mobile-header";
import BottomNav from "@/components/bottom-nav";
import ProfileModal from "@/components/profile-modal";

export default function Profile() {
  const { user, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-16">
        <MobileHeader />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No User Profile</h2>
            <p className="text-gray-500">Please log in to view your profile</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      <MobileHeader />
      
      <main className="container mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
                  {user.isVerified && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-600 mb-1">{user.email}</p>
                <p className="text-gray-600 mb-3">{user.phone}</p>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="capitalize">
                    {user.userType}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{user.rating || '5.0'}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>

            {/* Driver Stats */}
            {user.userType === "driver" && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  Driver Statistics
                </h3>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-semibold text-lg">{user.rating || '5.0'}</span>
                    </div>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-semibold text-lg mb-1">{user.totalTrips || 0}</div>
                    <p className="text-sm text-gray-600">Total Trips</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="font-semibold text-lg">{user.isVerified ? 'Yes' : 'No'}</span>
                    </div>
                    <p className="text-sm text-gray-600">Verified</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <Edit className="w-4 h-4 mr-3" />
              Edit Profile
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Bell className="w-4 h-4 mr-3" />
              Notifications
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-3" />
              Privacy & Security
            </Button>
            
            {user.userType === "driver" && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <Route className="w-4 h-4 mr-3" />
                Manage Routes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardContent className="p-4">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
      
      {isProfileModalOpen && (
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </div>
  );
}