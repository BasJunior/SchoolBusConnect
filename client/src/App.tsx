import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Routes from "@/pages/routes";
import History from "@/pages/history";
import Profile from "@/pages/profile";
import DriverDashboard from "@/pages/driver-dashboard";
import TrackingPage from "@/pages/tracking";
import BookingsPage from "@/pages/bookings";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

// Simple authentication state without context for now
let currentUser: User | null = null;
let authListeners: Array<() => void> = [];

export function useAuth() {
  const [user, setUser] = useState<User | null>(currentUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('omniride_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        currentUser = userData;
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('omniride_user');
      }
    }
    setIsLoading(false);

    // Subscribe to auth changes
    const listener = () => setUser(currentUser);
    authListeners.push(listener);

    return () => {
      authListeners = authListeners.filter(l => l !== listener);
    };
  }, []);

  const login = (userData: User) => {
    currentUser = userData;
    setUser(userData);
    localStorage.setItem('omniride_user', JSON.stringify(userData));
    authListeners.forEach(listener => listener());
  };

  const logout = () => {
    currentUser = null;
    setUser(null);
    localStorage.removeItem('omniride_user');
    authListeners.forEach(listener => listener());
  };

  return { user, login, logout, isLoading };
}

function AppRouter() {
  const { user, isLoading } = useAuth();
  const path = window.location.pathname;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Simple routing based on pathname
  switch (path) {
    case '/routes':
      return <Routes />;
    case '/bookings':
      return <BookingsPage />;
    case '/history':
      return <History />;
    case '/tracking':
      return <TrackingPage />;
    case '/profile':
      return <Profile />;
    case '/driver':
      return <DriverDashboard />;
    case '/':
      return <Home />;
    default:
      return <NotFound />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
