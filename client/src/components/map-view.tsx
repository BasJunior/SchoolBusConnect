import { MapPin, Plus, Minus, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MapView() {
  return (
    <main className="relative h-screen bg-gray-100">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        {/* Simulated Map Background */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
                <rect width="800" height="600" fill="#f8fafc"/>
                <g stroke="#e2e8f0" stroke-width="2" fill="none">
                  <path d="M0 100 Q200 50 400 150 T800 200"/>
                  <path d="M0 200 L800 250"/>
                  <path d="M100 0 L150 600"/>
                  <path d="M300 0 L350 600"/>
                  <path d="M500 0 L550 600"/>
                  <path d="M700 0 L750 600"/>
                </g>
              </svg>
            `)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Map Overlay Elements */}
        <div className="relative w-full h-full">
          {/* Route Lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <path 
              d="M100 200 Q 300 100 500 300 T 800 400" 
              stroke="hsl(221, 83%, 53%)" 
              strokeWidth="4" 
              fill="none" 
              strokeDasharray="10,5"
            />
            <path 
              d="M150 400 Q 350 300 550 500 T 850 600" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth="4" 
              fill="none"
            />
          </svg>

          {/* Bus Stop Markers */}
          <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center" style={{ zIndex: 2 }}>
            <MapPin className="text-white w-3 h-3" />
          </div>
          <div className="absolute top-1/2 right-1/3 w-6 h-6 bg-secondary rounded-full border-4 border-white shadow-lg flex items-center justify-center" style={{ zIndex: 2 }}>
            <MapPin className="text-white w-3 h-3" />
          </div>
          <div className="absolute bottom-1/3 left-1/2 w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center" style={{ zIndex: 2 }}>
            <MapPin className="text-white w-3 h-3" />
          </div>

          {/* Current Location */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full border-4 border-white shadow-lg animate-pulse" style={{ zIndex: 3 }}></div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-20 right-4 flex flex-col space-y-2 z-10">
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 bg-white shadow-md">
          <Plus className="w-4 h-4 text-neutral-600" />
        </Button>
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 bg-white shadow-md">
          <Minus className="w-4 h-4 text-neutral-600" />
        </Button>
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 bg-white shadow-md">
          <Navigation className="w-4 h-4 text-neutral-600" />
        </Button>
      </div>
    </main>
  );
}
