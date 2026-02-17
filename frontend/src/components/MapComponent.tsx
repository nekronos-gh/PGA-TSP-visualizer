import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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

async function fetchRoute(waypoints: Point[]): Promise<[number, number][]> {
    const coords = waypoints.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) return [];

    return data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
    );
}

export default function MapComponent({ points, onMapClick, onMarkerClick, path, mode }: MapComponentProps) {
    const [roadPath, setRoadPath] = useState<[number, number][]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Need at least 2 points to draw a route
        if (path.length < 2) {
            setRoadPath([]);
            return;
        }

        const waypoints = path.map(idx => points[idx]).filter(Boolean);
        if (waypoints.length < 2) return;

        // Add first point at the end to close the loop
        const waypointsWithLoop = [...waypoints, waypoints[0]];

        setIsLoading(true);
        fetchRoute(waypointsWithLoop)
            .then(setRoadPath)
            .catch(err => {
                console.error('Failed to fetch route:', err);
                // Just draw straight lines between the points
                const fallback = waypointsWithLoop.map(p => [p.lat, p.lng] as [number, number]);
                setRoadPath(fallback);
            })
            .finally(() => setIsLoading(false));
    }, [path, points]);

    return (
        <div className="h-full w-full relative">
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 1000,
                    background: 'white',
                    padding: '4px 10px',
                    borderRadius: 6,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    fontSize: 13
                }}>
                    Calculating route...
                </div>
            )}
            <MapContainer center={[52.52, 13.405]} zoom={13} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker onMapClick={onMapClick} mode={mode} />
                {points.map((p, idx) => (
                    <Marker
                        key={p.id}
                        position={[p.lat, p.lng]}
                        eventHandlers={{
                            click: () => onMarkerClick(p.id),
                        }}
                    >
                        <Popup>Point {idx + 1}</Popup>
                    </Marker>
                ))}
                {roadPath.length > 0 && (
                    <Polyline positions={roadPath} color="blue" weight={4} opacity={0.7} />
                )}
            </MapContainer>
        </div>
    );
}
