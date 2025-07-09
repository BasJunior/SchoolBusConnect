import { MapPin, Plus, Minus, Navigation, Bus, Building, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MapView() {
  const harareLocations = [
    { name: "Harare CBD", type: "city", x: "45%", y: "40%", color: "bg-blue-600" },
    { name: "University of Zimbabwe", type: "school", x: "55%", y: "25%", color: "bg-green-600" },
    { name: "Chitungwiza", type: "residential", x: "70%", y: "65%", color: "bg-purple-600" },
    { name: "Mbare Musika", type: "transport", x: "35%", y: "55%", color: "bg-orange-600" },
    { name: "Avondale", type: "residential", x: "25%", y: "30%", color: "bg-indigo-600" },
    { name: "Borrowdale", type: "residential", x: "30%", y: "20%", color: "bg-pink-600" },
    { name: "Industrial Area", type: "work", x: "65%", y: "45%", color: "bg-gray-600" },
    { name: "Eastgate Mall", type: "commercial", x: "60%", y: "35%", color: "bg-teal-600" }
  ];

  const routes = [
    { from: "45%,40%", to: "55%,25%", color: "stroke-blue-500" }, // CBD to UZ
    { from: "35%,55%", to: "60%,35%", color: "stroke-green-500" }, // Mbare to Eastgate
    { from: "25%,30%", to: "30%,20%", color: "stroke-purple-500" }, // Avondale to Borrowdale
    { from: "70%,65%", to: "45%,40%", color: "stroke-orange-500" }, // Chitungwiza to CBD
  ];

  return (
    <main className="relative h-screen bg-slate-100">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
        {/* Harare Map Background */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            {/* Background grid representing streets */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            
            {/* Major roads */}
            <path d="M0 40 L100 45" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M45 0 L50 100" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M0 60 L100 55" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M25 0 L30 100" stroke="#cbd5e1" strokeWidth="1" />
            
            {/* Route lines */}
            {routes.map((route, index) => {
              const [fromX, fromY] = route.from.split(',');
              const [toX, toY] = route.to.split(',');
              return (
                <line
                  key={index}
                  x1={fromX.replace('%', '')}
                  y1={fromY.replace('%', '')}
                  x2={toX.replace('%', '')}
                  y2={toY.replace('%', '')}
                  stroke={route.color.replace('stroke-', '#')}
                  strokeWidth="0.8"
                  strokeDasharray="2,1"
                  opacity="0.7"
                />
              );
            })}
          </svg>
        </div>

        {/* Location Markers */}
        {harareLocations.map((location, index) => (
          <div 
            key={index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: location.x, top: location.y }}
          >
            <div className={`w-8 h-8 ${location.color} rounded-full border-3 border-white shadow-lg flex items-center justify-center`}>
              {location.type === 'school' && <GraduationCap className="text-white w-4 h-4" />}
              {location.type === 'work' && <Building className="text-white w-4 h-4" />}
              {location.type === 'transport' && <Bus className="text-white w-4 h-4" />}
              {['city', 'residential', 'commercial'].includes(location.type) && <MapPin className="text-white w-4 h-4" />}
            </div>
            <div className="mt-1 text-center">
              <Badge variant="secondary" className="text-xs px-1 py-0 bg-white/90 text-gray-800">
                {location.name}
              </Badge>
            </div>
          </div>
        ))}

        {/* Current Location (You are here) */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: '45%', top: '40%' }}
        >
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div className="mt-1 text-center">
            <Badge variant="destructive" className="text-xs px-1 py-0">
              You are here
            </Badge>
          </div>
        </div>
      </div>

      {/* Map Info Panel */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20 max-w-sm">
        <h3 className="font-semibold text-sm mb-2 text-gray-800">Harare Transit Map</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>City Center & CBD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span>Universities & Schools</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
            <span>Transport Hubs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            <span>Industrial Areas</span>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-32 right-4 flex flex-col space-y-2 z-20">
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 bg-white/95 shadow-md hover:bg-gray-50">
          <Plus className="w-4 h-4 text-gray-600" />
        </Button>
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 bg-white/95 shadow-md hover:bg-gray-50">
          <Minus className="w-4 h-4 text-gray-600" />
        </Button>
        <Button size="sm" variant="outline" className="w-10 h-10 p-0 bg-white/95 shadow-md hover:bg-gray-50">
          <Navigation className="w-4 h-4 text-gray-600" />
        </Button>
      </div>
    </main>
  );
}
