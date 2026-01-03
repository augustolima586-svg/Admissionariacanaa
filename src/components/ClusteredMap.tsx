
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { Member } from '../types';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ClusteredMapProps {
    members: Member[];
}

// Coordinates for countries
const countryCoordinates: Record<string, [number, number]> = {
    'Brasil': [-14.2350, -51.9253],
    'EUA': [37.0902, -95.7129],
    'Portugal': [39.3999, -8.2245],
    'Espanha': [40.4637, -3.7492],
    'Moçambique': [-18.6657, 35.5296],
    'Angola': [-11.2027, 17.8739],
    'Argentina': [-38.4161, -63.6167],
    'Chile': [-35.6751, -71.5430],
    'Uruguai': [-32.5228, -55.7658],
    'Paraguai': [-23.4425, -58.4438],
    'Bolívia': [-16.2902, -63.5887],
    'Peru': [-9.1900, -75.0152],
    'Colômbia': [4.5709, -74.2973],
    'Venezuela': [6.4238, -66.5897],
    'Equador': [-1.8312, -78.1834],
    'França': [46.2276, 2.2137],
    'Alemanha': [51.1657, 10.4515],
    'Reino Unido': [55.3781, -3.4360],
    'Itália': [41.8719, 12.5674],
    'Japão': [36.2048, 138.2529],
    'China': [35.8617, 104.1954],
    'Índia': [20.5937, 78.9629],
    'Austrália': [-25.2744, 133.7751],
    'Canadá': [56.1304, -106.3468],
    'México': [23.6345, -102.5528],
    'Israel': [31.0461, 34.8516],
    // Default fallback
    'Outro': [0, 0]
};

// Helper: Add small random noise to coordinates to prevent exact overlap
const jitter = (coord: number) => coord + (Math.random() - 0.5) * 0.1;

const ClusteredMap: React.FC<ClusteredMapProps> = ({ members }) => {
    // Filter members with valid countries and map to marker data
    const markers = members
        .filter(m => m.country && m.country.trim() !== '')
        .map(m => {
            const country = m.country?.trim() || 'Brasil';
            const baseCoords = countryCoordinates[country] || countryCoordinates['Brasil'];
            // Jitter coordinates so markers for the same country don't perfectly stack
            const position: [number, number] = [jitter(baseCoords[0]), jitter(baseCoords[1])];
            return {
                id: m.id,
                name: m.name,
                country: country,
                role: m.status,
                position
            };
        });

    return (
        <div className="w-full h-[400px] rounded-[3rem] overflow-hidden shadow-2xl relative z-0">
            <MapContainer
                center={[-14.2350, -51.9253]} // Start focused on Brazil
                zoom={3}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MarkerClusterGroup
                    chunkedLoading
                    showCoverageOnHover={false}
                    maxClusterRadius={60}
                // Custom cluster icon styling can be added here if needed
                >
                    {markers.map((marker) => (
                        <Marker key={marker.id} position={marker.position}>
                            <Popup>
                                <div className="p-2 text-center">
                                    <p className="font-bold text-slate-900">{marker.name}</p>
                                    <p className="text-xs text-slate-500 uppercase">{marker.role} • {marker.country}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
};

export default ClusteredMap;
