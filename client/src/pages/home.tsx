import { useAuth } from "@/App";
import MobileHeader from "@/components/mobile-header";
import BottomNav from "@/components/bottom-nav";
import { useAccessibility } from "@/contexts/accessibility-context";
import MapView from "@/components/map-view";
import BottomSheet from "@/components/bottom-sheet";
import BottomNavigation from "@/components/bottom-navigation";
import EnhancedBookingModal from "@/components/enhanced-booking-modal";
import SubscriptionModal from "@/components/subscription-modal";
import { useState } from "react";

export default function Home() {
  const { user } = useAuth();
  const { announceToScreenReader } = useAccessibility();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  if (user?.userType === "driver") {
    // Redirect drivers to their dashboard
    window.location.href = "/driver";
    return null;
  }

  const handleMapBookRide = (fromLocation?: string, toLocation?: string) => {
    // Open booking modal with pre-selected locations if provided
    setIsBookingModalOpen(true);
    announceToScreenReader("Booking modal opened");
    // You could pass the location data to the modal if needed
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      <MobileHeader />
      <main id="main-content" role="main" aria-label="OmniRide transport booking interface" tabIndex={-1}>
        <MapView onBookRide={handleMapBookRide} />
        <BottomSheet 
          onBookRide={() => {
            setIsBookingModalOpen(true);
            announceToScreenReader("Booking modal opened");
          }}
          onSubscribe={() => {
            setIsSubscriptionModalOpen(true);
            announceToScreenReader("Subscription modal opened");
          }}
        />
      </main>
      <BottomNav />
      
      {isBookingModalOpen && (
        <EnhancedBookingModal 
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}
      
      {isSubscriptionModalOpen && (
        <SubscriptionModal 
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
        />
      )}
    </div>
  );
}
