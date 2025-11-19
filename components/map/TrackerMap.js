"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icons in Next.js
if (typeof window !== "undefined") {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

/**
 * Component to fit map bounds to markers
 */
function FitBounds({ devices, positionMap }) {
  const map = useMap();

  useEffect(() => {
    if (devices && devices.length > 0 && positionMap) {
      const markers = [];
      devices.forEach((device) => {
        const position = positionMap.get(device.id);
        if (position && position.latitude && position.longitude) {
          markers.push([position.latitude, position.longitude]);
        }
      });

      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [devices, positionMap, map]);

  return null;
}

/**
 * TrackerMap Component
 * Displays a Leaflet map with device markers
 * @param {Object} props
 * @param {Array} props.devices - Array of device objects
 * @param {Array} props.positions - Array of position objects (optional)
 * @param {Array} props.center - Map center coordinates [lat, lng] (default: Spain)
 * @param {number} props.zoom - Initial zoom level (default: 6)
 */
function TrackerMap({
  devices = [],
  positions = [],
  center = [0, 0], // World view
  zoom = 2,
}) {
  // Create a map of deviceId to position for quick lookup
  const positionMap = useMemo(() => {
    const map = new Map();
    if (positions && Array.isArray(positions)) {
      positions.forEach((pos) => {
        if (pos.deviceId && pos.latitude && pos.longitude) {
          map.set(pos.deviceId, pos);
        }
      });
    }
    return map;
  }, [positions]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds devices={devices} positionMap={positionMap} />
        {devices &&
          Array.isArray(devices) &&
          devices.map((device) => {
            const position = positionMap.get(device.id);
            if (position && position.latitude && position.longitude) {
              return (
                <Marker
                  key={device.id}
                  position={[position.latitude, position.longitude]}
                >
                  <Popup>
                    <div>
                      <strong>{device.name || "Sin nombre"}</strong>
                      <br />
                      <span className="text-sm text-gray-600">
                        ID: {device.uniqueId}
                      </span>
                      {position.address && (
                        <>
                          <br />
                          <span className="text-sm">{position.address}</span>
                        </>
                      )}
                      {position.speed !== undefined &&
                        position.speed !== null && (
                          <>
                            <br />
                            <span className="text-sm">
                              Velocidad: {Math.round(position.speed * 1.852)}{" "}
                              km/h
                            </span>
                          </>
                        )}
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
      </MapContainer>
    </div>
  );
}

export default TrackerMap;
