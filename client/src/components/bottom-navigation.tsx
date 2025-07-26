import { Home, Route, History, MapPin, User } from "lucide-react";

export default function BottomNavigation() {
  const location = window.location.pathname;

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Route, label: "Routes", path: "/routes" },
    { icon: MapPin, label: "Track", path: "/tracking" },
    { icon: History, label: "History", path: "/history" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.location.reload();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => handleNavigation(path)}
            className={`flex flex-col items-center py-1 px-2 transition-colors ${
              location === path
                ? "text-primary"
                : "text-neutral-400 hover:text-primary"
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
