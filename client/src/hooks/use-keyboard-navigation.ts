import { useEffect } from "react";
import { useAccessibility } from "@/contexts/accessibility-context";

export function useKeyboardNavigation() {
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle escape key for modals and dropdowns
      if (event.key === "Escape") {
        const openModal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (openModal) {
          const closeButton = openModal.querySelector('button[aria-label*="close"], button[aria-label*="Close"]');
          if (closeButton) {
            (closeButton as HTMLElement).click();
            announceToScreenReader("Modal closed");
          }
        }
      }

      // Handle arrow keys for navigation
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const focusedElement = document.activeElement;
        if (focusedElement?.getAttribute('role') === 'tab') {
          event.preventDefault();
          const tablist = focusedElement.closest('[role="tablist"]');
          if (tablist) {
            const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
            const currentIndex = tabs.indexOf(focusedElement);
            
            let nextIndex;
            if (event.key === "ArrowDown") {
              nextIndex = (currentIndex + 1) % tabs.length;
            } else {
              nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            }
            
            (tabs[nextIndex] as HTMLElement).focus();
            (tabs[nextIndex] as HTMLElement).click();
          }
        }
      }

      // Handle Alt + A for accessibility toolbar
      if (event.altKey && event.key === "a") {
        event.preventDefault();
        const accessibilityButton = document.querySelector('button[aria-label*="accessibility"], button[aria-label*="Accessibility"]');
        if (accessibilityButton) {
          (accessibilityButton as HTMLElement).click();
          announceToScreenReader("Accessibility toolbar toggled");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [announceToScreenReader]);
}

// Hook for managing focus on route changes
export function useFocusManagement() {
  useEffect(() => {
    const handleRouteChange = () => {
      // Focus the main content on route change
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.focus();
      }
    };

    // Listen for navigation events
    window.addEventListener("popstate", handleRouteChange);
    
    // Focus main content on initial load
    setTimeout(handleRouteChange, 100);

    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);
}