import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Accessibility, 
  Eye, 
  Type, 
  Volume2, 
  MousePointer, 
  Minus, 
  Plus,
  X,
  Settings
} from "lucide-react";
import { useAccessibility } from "@/contexts/accessibility-context";

export default function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    settings,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    toggleReducedMotion,
    toggleScreenReaderMode,
    announceToScreenReader,
  } = useAccessibility();

  const handleToggleToolbar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    announceToScreenReader(
      newState ? "Accessibility toolbar opened" : "Accessibility toolbar closed"
    );
  };

  const handleHighContrastToggle = () => {
    toggleHighContrast();
    announceToScreenReader(
      settings.highContrast ? "High contrast mode disabled" : "High contrast mode enabled"
    );
  };

  const handleFontSizeIncrease = () => {
    increaseFontSize();
    announceToScreenReader("Font size increased");
  };

  const handleFontSizeDecrease = () => {
    decreaseFontSize();
    announceToScreenReader("Font size decreased");
  };

  const handleReducedMotionToggle = () => {
    toggleReducedMotion();
    announceToScreenReader(
      settings.reducedMotion ? "Reduced motion disabled" : "Reduced motion enabled"
    );
  };

  const handleScreenReaderToggle = () => {
    toggleScreenReaderMode();
    announceToScreenReader(
      settings.screenReaderMode ? "Screen reader mode disabled" : "Screen reader mode enabled"
    );
  };

  return (
    <>
      {/* Accessibility button - always visible */}
      <Button
        onClick={handleToggleToolbar}
        className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        aria-label={isOpen ? "Close accessibility toolbar" : "Open accessibility toolbar"}
        aria-expanded={isOpen}
        aria-controls="accessibility-toolbar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Accessibility className="w-5 h-5" />}
      </Button>

      {/* Accessibility toolbar */}
      {isOpen && (
        <Card
          id="accessibility-toolbar"
          className="fixed top-16 right-4 z-40 w-80 max-h-96 overflow-y-auto shadow-xl"
          role="dialog"
          aria-labelledby="accessibility-toolbar-title"
          aria-modal="false"
        >
          <CardHeader className="pb-3">
            <CardTitle id="accessibility-toolbar-title" className="flex items-center gap-2 text-lg">
              <Accessibility className="w-5 h-5" />
              Accessibility Options
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* High Contrast */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="high-contrast" className="flex items-center gap-2 text-sm font-medium">
                <Eye className="w-4 h-4" />
                High Contrast Mode
              </Label>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={handleHighContrastToggle}
                aria-describedby="high-contrast-desc"
              />
            </div>
            <p id="high-contrast-desc" className="text-xs text-gray-600 ml-6">
              Increases color contrast for better visibility
            </p>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Type className="w-4 h-4" />
                Font Size
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFontSizeDecrease}
                  disabled={settings.fontSize === 'small'}
                  aria-label="Decrease font size"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-20 text-center capitalize">
                  {settings.fontSize}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFontSizeIncrease}
                  disabled={settings.fontSize === 'extra-large'}
                  aria-label="Increase font size"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="reduced-motion" className="flex items-center gap-2 text-sm font-medium">
                <MousePointer className="w-4 h-4" />
                Reduce Motion
              </Label>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={handleReducedMotionToggle}
                aria-describedby="reduced-motion-desc"
              />
            </div>
            <p id="reduced-motion-desc" className="text-xs text-gray-600 ml-6">
              Minimizes animations and transitions
            </p>

            {/* Screen Reader Mode */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="screen-reader" className="flex items-center gap-2 text-sm font-medium">
                <Volume2 className="w-4 h-4" />
                Screen Reader Mode
              </Label>
              <Switch
                id="screen-reader"
                checked={settings.screenReaderMode}
                onCheckedChange={handleScreenReaderToggle}
                aria-describedby="screen-reader-desc"
              />
            </div>
            <p id="screen-reader-desc" className="text-xs text-gray-600 ml-6">
              Optimizes interface for screen readers
            </p>

            {/* Keyboard Navigation Info */}
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Keyboard Navigation
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Tab: Navigate forward</p>
                <p>• Shift + Tab: Navigate backward</p>
                <p>• Enter/Space: Activate buttons</p>
                <p>• Escape: Close dialogs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screen reader only announcement area */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />
    </>
  );
}