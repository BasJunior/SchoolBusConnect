import { useAuth } from "@/App";
import MobileHeader from "@/components/mobile-header";
import MapView from "@/components/map-view";
import BottomSheet from "@/components/bottom-sheet";
import BottomNavigation from "@/components/bottom-navigation";
import BookingModal from "@/components/booking-modal";
import { useState } from "react";

export default function Home() {
  const { user } = useAuth();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  if (user?.userType === "driver") {
    // Redirect drivers to their dashboard
    window.location.href = "/driver";
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileHeader />
      <MapView />
      <BottomSheet onBookRide={() => setIsBookingModalOpen(true)} />
      <BottomNavigation />
      
      {isBookingModalOpen && (
        <BookingModal 
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}
    </div>
  );
}
