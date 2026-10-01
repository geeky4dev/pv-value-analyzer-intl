import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "leaflet/dist/leaflet.css";

const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function PVGISMap({ lat, lon, onClick }) {
  const hasCoords = lat !== "" && lon !== "";
  const center = hasCoords
    ? [parseFloat(lat), parseFloat(lon)]
    : [48.1374, 11.5755]; // München por defecto

  return (
    <div style={{ height: "300px", width: "100%", marginTop: "8px" }}>
      <MapContainer
        center={center}
        zoom={10}
        style={{ 
          height: "100%", 
          width: "100%", 
          cursor: "crosshair"
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap-Mitwirkende'
        />

        {/* Escucha clics en el mapa */}
        <ClickHandler onClick={onClick} />

        {/* Marcador en las coords actuales */}
        {hasCoords && (
          <Marker
            position={[parseFloat(lat), parseFloat(lon)]}
            icon={DefaultIcon}
          >
            <Popup>
              Lat: {parseFloat(lat).toFixed(5)}, Lon: {parseFloat(lon).toFixed(5)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default PVGISMap;




