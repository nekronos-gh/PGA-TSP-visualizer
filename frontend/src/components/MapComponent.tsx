import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';

// Custom Tactical Icons
const DepotIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
        background-color: #0ea5e9;
        width: 16px;
        height: 16px;
        border-radius: 2px;
        box-shadow: 0 0 10px #38bdf8;
        border: 2px solid white;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const TargetIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
        background-color: #1e293b;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid #38bdf8;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

interface Point {
    id: number;
    lat: number;
    lng: number;
}

interface MapComponentProps {
    points: Point[];
    onMapClick: (lat: number, lng: number) => void;
    onMarkerClick: (id: number) => void;
    path: number[];
    mode: 'custom' | 'preset';
}

function LocationMarker({ onMapClick, mode }: { onMapClick: (lat: number, lng: number) => void, mode: 'custom' | 'preset' }) {
    useMapEvents({
        click(e) {
            if (mode === 'custom') {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

function RecenterAutomatically({ points, mode }: { points: Point[]; mode: 'custom' | 'preset' }) {
    const map = useMap();

    useEffect(() => {
        if (mode === 'preset' && points.length > 0) {
            const latLngs = points.map(p => [p.lat, p.lng] as [number, number]);
            const bounds = L.latLngBounds(latLngs);
            if (latLngs.length === 1) {
                map.flyTo(latLngs[0], 13);
            } else {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
    }, [points, mode, map]);

    return null;
}

export default function MapComponent({ points, onMapClick, onMarkerClick, path, mode }: MapComponentProps) {
    const [flightPath, setFlightPath] = useState<[number, number][]>([]);

    useEffect(() => {
        if (path.length < 2) {
            setFlightPath([]);
            return;
        }

        const waypoints = path.map(idx => points[idx]).filter(Boolean);
        if (waypoints.length < 2) return;

        // Close loop
        const waypointsWithLoop = [...waypoints, waypoints[0]];
        
        // Direct flight paths (Straight Lines)
        setFlightPath(waypointsWithLoop.map(p => [p.lat, p.lng]));
        
    }, [path, points]);

    return (
        <div className="h-full w-full bg-slate-900">
            <MapContainer 
                center={[52.52, 13.405]} 
                zoom={13} 
                scrollWheelZoom={true} 
                className="h-full w-full z-0"
                zoomControl={false} // Cleaner look
            >
                {/* CartoDB Dark Matter Tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                <LocationMarker onMapClick={onMapClick} mode={mode} />
                <RecenterAutomatically points={points} mode={mode} />
                
                {points.map((p, idx) => (
                    <Marker
                        key={p.id}
                        position={[p.lat, p.lng]}
                        icon={idx === 0 ? DepotIcon : TargetIcon}
                        eventHandlers={{
                            click: () => onMarkerClick(p.id),
                        }}
                    >
                        <Popup className="custom-popup">
                            <div className="font-mono text-xs">
                                <strong>{idx === 0 ? "DEPOT" : `TARGET-${p.id}`}</strong><br/>
                                {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                            </div>
                        </Popup>
                    </Marker>
                ))}
                
                {flightPath.length > 0 && (
                    <Polyline 
                        positions={flightPath} 
                        pathOptions={{ 
                            color: '#38bdf8', // primary-400
                            weight: 2, 
                            opacity: 0.8,
                            dashArray: '5, 10',
                            lineCap: 'round'
                        }} 
                    />
                )}
            </MapContainer>
        </div>
    );
}
