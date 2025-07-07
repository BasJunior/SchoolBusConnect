import type { Route } from "@shared/schema";

interface RouteCardProps {
  route: Route;
  onSelect?: () => void;
}

export default function RouteCard({ route, onSelect }: RouteCardProps) {
  return (
    <div 
      className="border border-gray-200 rounded-xl p-3 mb-2 hover:border-primary transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-neutral-800">{route.name}</p>
          <p className="text-sm text-neutral-600">
            Next: 15:30 (12 mins)
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium text-neutral-800">${route.baseFare}</p>
          <p className="text-sm text-secondary">8 seats left</p>
        </div>
      </div>
    </div>
  );
}
