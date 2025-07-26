import { Home, Route, Calendar, User, Car } from "lucide-react";
import { useAuth } from "@/App";

export default function BottomNav() {
  const { user } = useAuth();
  const currentPath = window.location.pathname;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/routes", icon: Route, label: "Routes" },
    { href: "/bookings", icon: Calendar, label: "Bookings" },
    ...(user?.userType === "driver" ? [{ href: "/driver", icon: Car, label: "Driver" }] : []),
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] shadow-lg"
      role="navigation"
      aria-label="Main navigation"
      style={{ display: 'block' }}
    >
      <div className="flex justify-around items-center py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5 mb-1" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}