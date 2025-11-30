import React, { useEffect, useRef } from 'react';
import { FlightInfo, FlightPathPoint } from '../types.ts';

declare const L: any;

interface FlightPathMapProps {
    flightPath: FlightPathPoint[] | null;
    syncTime: number | null;
    flightInfo: FlightInfo | null;
}

export const FlightPathMap: React.FC<FlightPathMapProps> = ({ flightPath, syncTime, flightInfo }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const featureGroupRef = useRef<any>(null);
    const aircraftMarkerRef = useRef<any>(null);
    const lastBearingRef = useRef<number>(0);

    const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        if (lat1 === lat2 && lon1 === lon2) {
            return lastBearingRef.current;
        }
        const toRadians = (deg: number) => deg * Math.PI / 180;
        const toDegrees = (rad: number) => rad * 180 / Math.PI;

        const lat1Rad = toRadians(lat1);
        const lon1Rad = toRadians(lon1);
        const lat2Rad = toRadians(lat2);
        const lon2Rad = toRadians(lon2);

        const dLon = lon2Rad - lon1Rad;

        const y = Math.sin(dLon) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                  Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
        
        let brng = toDegrees(Math.atan2(y, x));
        const bearing = (brng + 360) % 360;
        lastBearingRef.current = bearing;
        return bearing;
    };


    // Effect to initialize the map instance and the aircraft marker
    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [23.5, 121], // Center of Taiwan
                zoom: 7,
                scrollWheelZoom: true,
            });

            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                className: 'map-tiles-osm', // Class for dark mode filtering
                maxNativeZoom: 19,
                maxZoom: 50,
            });

            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxNativeZoom: 19,
                maxZoom: 50,
            });
            
            osmLayer.addTo(map);

            const baseMaps = {
                "街道圖": osmLayer,
                "衛星圖": satelliteLayer
            };

            L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);
            L.control.scale({ imperial: false }).addTo(map);

            // Fix for map not rendering correctly in a dynamic container
            setTimeout(() => map.invalidateSize(), 100);

            mapInstanceRef.current = map;
            featureGroupRef.current = L.featureGroup().addTo(map);

            const airplaneIconSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.6));">
                  <path fill="#a855f7" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
            `;

            const aircraftIcon = L.divIcon({
                html: airplaneIconSvg,
                className: '', // Use empty class to prevent Leaflet's default styles
                iconSize: [28, 28],
                iconAnchor: [14, 14] // Center the icon
            });

            aircraftMarkerRef.current = L.marker([0,0], {
                icon: aircraftIcon,
                zIndexOffset: 1000
            });
        }
    }, []);

    // Effect to update layers when flightPath changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        const featureGroup = featureGroupRef.current;
        
        if (!map || !featureGroup) return;

        featureGroup.clearLayers();

        if (flightPath && flightPath.length >= 2) {
            const latLngs = flightPath.map(p => [p.lat, p.lng]);

            const polyline = L.polyline(latLngs, { color: 'hsl(var(--primary))', weight: 3 }).addTo(featureGroup);
            
            const startPoint = latLngs[0];
            const endPoint = latLngs[latLngs.length - 1];

            const pinSvg = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="28px" height="28px" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

            const startIcon = L.divIcon({
                html: pinSvg('#22c55e'), // green-500
                className: '',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28]
            });
            
            const endIcon = L.divIcon({
                html: pinSvg('#ef4444'), // red-500
                className: '',
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28]
            });

            L.marker(startPoint, { icon: startIcon }).bindPopup('<b>起點</b>').addTo(featureGroup);
            
            const endLat = endPoint[0];
            const endLng = endPoint[1];
            const googleMapsUrl = `https://www.google.com/maps?q=${endLat},${endLng}`;
            const popupContent = `<b>終點</b><br/><a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="color:hsl(var(--primary)); text-decoration:underline;">在 Google 地圖中開啟</a>`;
            L.marker(endPoint, { icon: endIcon }).bindPopup(popupContent).addTo(featureGroup);
            
            map.fitBounds(polyline.getBounds(), { padding: [50, 50], animate: true, duration: 0.5 });

        } else if (map) {
            map.setView([23.5, 121], 7);
        }

    }, [flightPath]);

    // Effect to move aircraft marker based on syncTime
    useEffect(() => {
        const aircraftMarker = aircraftMarkerRef.current;
        const map = mapInstanceRef.current;

        if (!aircraftMarker || !map || !flightPath || flightPath.length < 2 || !flightInfo) {
            return;
        }

        if (syncTime === null) {
            if (map.hasLayer(aircraftMarker)) {
                map.removeLayer(aircraftMarker);
            }
            return;
        }

        let pos: [number, number] | null = null;
        let bearing: number | null = null;

        for (let i = 0; i < flightPath.length - 1; i++) {
            const p1 = flightPath[i];
            const p2 = flightPath[i + 1];
            
            // Both syncTime and p.time are in the same domain (milliseconds, absolute or relative)
            // thanks to the new logic in logProcessor.
            if (syncTime >= p1.time && syncTime <= p2.time) {
                const t = (p2.time - p1.time > 0) ? (syncTime - p1.time) / (p2.time - p1.time) : 0;
                const lat = p1.lat + (p2.lat - p1.lat) * t;
                const lng = p1.lng + (p2.lng - p1.lng) * t;
                pos = [lat, lng];
                bearing = calculateBearing(p1.lat, p1.lng, p2.lat, p2.lng);
                break;
            }
        }
        
        if (!pos) {
            if (syncTime < flightPath[0].time) {
                pos = [flightPath[0].lat, flightPath[0].lng];
            } else if (syncTime > flightPath[flightPath.length - 1].time) {
                pos = [flightPath[flightPath.length - 1].lat, flightPath[flightPath.length - 1].lng];
            }
            bearing = lastBearingRef.current;
        }

        if (pos) {
            aircraftMarker.setLatLng(pos);
            const iconElement = aircraftMarker.getElement();
            if (iconElement) {
                const svgElement = iconElement.querySelector('svg');
                if (svgElement) {
                     // The SVG path points right (East, 90 deg from North).
                     // To align SVG with bearing, rotation = bearing - 90 deg.
                     const rotation = (bearing ?? lastBearingRef.current) - 90;
                     svgElement.style.transform = `rotate(${rotation}deg)`;
                }
            }

            if (!map.hasLayer(aircraftMarker)) {
                aircraftMarker.addTo(map);
            }
        }

    }, [syncTime, flightPath, flightInfo]);

    const hasValidPath = flightPath && flightPath.length >= 2;

    return (
        <div className="h-[40rem] relative">
            <div id="map-container" ref={mapContainerRef} className="h-full w-full" />
            {!hasValidPath && (
                <div className="absolute inset-0 flex items-center justify-center bg-bkg bg-opacity-75 pointer-events-none z-10">
                    <p className="text-text-secondary font-semibold p-4 rounded-lg bg-content shadow-md">
                       無 GPS 軌跡資料或資料點不足。
                    </p>
                </div>
            )}
        </div>
    );
};