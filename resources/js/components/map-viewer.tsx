import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MapViewerProps {
    latitude: string | number;
    longitude: string | number;
    radius: number;
}

export function MapViewer({ latitude, longitude, radius }: MapViewerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(
        () => typeof window !== 'undefined' && !!(window as any).L,
    );
    const [loadingError, setLoadingError] = useState(false);

    useEffect(() => {
        if (leafletLoaded) {
            return;
        }

        // Load leaflet CSS dynamically
        const cssId = 'leaflet-css';

        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        // Load leaflet JS dynamically
        const jsId = 'leaflet-js';

        if (!document.getElementById(jsId)) {
            const script = document.createElement('script');
            script.id = jsId;
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = () => setLeafletLoaded(true);
            script.onerror = () => setLoadingError(true);
            document.head.appendChild(script);
        } else {
            const interval = setInterval(() => {
                if ((window as any).L) {
                    setLeafletLoaded(true);
                    clearInterval(interval);
                }
            }, 100);

            return () => clearInterval(interval);
        }
    }, [leafletLoaded]);

    useEffect(() => {
        if (!leafletLoaded || !mapContainerRef.current) {
            return;
        }

        const L = (window as any).L;

        if (!L) {
            return;
        }

        const lat = parseFloat(latitude?.toString());
        const lng = parseFloat(longitude?.toString());

        if (isNaN(lat) || isNaN(lng)) {
            return;
        }

        // Initialize map (scroll wheel zoom disabled to prevent page scroll hijack)
        const map = L.map(mapContainerRef.current, {
            dragging: true,
            zoomControl: true,
            scrollWheelZoom: false,
        }).setView([lat, lng], 16);
        mapRef.current = map;

        // Add Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Add Marker
        L.marker([lat, lng]).addTo(map);

        // Add Circle representing radius
        L.circle([lat, lng], {
            color: '#3b82f6', // blue
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            radius: radius,
        }).addTo(map);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [leafletLoaded, latitude, longitude, radius]);

    if (loadingError) {
        return null;
    }

    if (!leafletLoaded) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-canvas/30 text-sm text-muted">
                <LoaderCircle className="size-6 animate-spin text-primary" />
                <span>Memuat Peta...</span>
            </div>
        );
    }

    const lat = parseFloat(latitude?.toString());
    const lng = parseFloat(longitude?.toString());

    if (isNaN(lat) || isNaN(lng)) {
        return (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-line bg-canvas/30 text-sm text-muted">
                Koordinat tidak valid.
            </div>
        );
    }

    return (
        <div
            ref={mapContainerRef}
            className="z-10 h-48 w-full overflow-hidden rounded-2xl border border-line shadow-sm"
        />
    );
}
