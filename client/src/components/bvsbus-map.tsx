import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";

type Position = [number, number];

const AACHEN_CENTER: Position = [50.7753, 6.0839];

function Recenter({ position }: { position: Position }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 13, { duration: 0.8 });
  }, [map, position]);

  return null;
}

export default function BVSBusMap() {
  const [position, setPosition] = useState<Position>(AACHEN_CENTER);
  const [hasLiveLocation, setHasLiveLocation] = useState(false);

  function locate() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition([coords.latitude, coords.longitude]);
        setHasLiveLocation(true);
      },
      () => {
        setPosition(AACHEN_CENTER);
        setHasLiveLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }

  useEffect(() => {
    locate();
  }, []);

  return (
    <div className="relative h-[310px] w-full overflow-hidden bg-neutral-200">
      <MapContainer
        center={position}
        zoom={13}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter position={position} />
        <CircleMarker
          center={position}
          radius={9}
          pathOptions={{ fillOpacity: 1, weight: 4 }}
        >
          <Popup>{hasLiveLocation ? "Your current location" : "Aachen area"}</Popup>
        </CircleMarker>
      </MapContainer>

      <button
        type="button"
        onClick={locate}
        className="absolute bottom-5 right-5 z-[500] grid h-11 w-11 place-items-center rounded-full bg-white shadow-lg"
        aria-label="Center map on my location"
      >
        <LocateFixed className="h-5 w-5" />
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-20 bg-gradient-to-b from-black/35 to-transparent" />
    </div>
  );
}
