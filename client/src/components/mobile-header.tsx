import { Bell, User, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";

export default function MobileHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bus className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-800">OmniRide</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="w-5 h-5 text-neutral-600" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full bg-gray-200">
            <User className="w-4 h-4 text-neutral-600" />
          </Button>
        </div>
      </div>
    </header>
  );
}
