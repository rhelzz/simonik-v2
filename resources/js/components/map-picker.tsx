import { MapPin, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MapPickerProps {
    latitude: string | number;
    longitude: string | number;
    radius: number;
    onLocationChange: (lat: number, lng: number) => void;
}

export function MapPicker({
    latitude,
    longitude,
    radius,
    onLocationChange,
}: MapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
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

    // Initialize Map
    useEffect(() => {
        if (!leafletLoaded || !mapContainerRef.current) {
            return;
        }

        const L = (window as any).L;

        if (!L) {
            return;
        }

        const defaultLat = parseFloat(latitude?.toString()) || -6.914744;
        const defaultLng = parseFloat(longitude?.toString()) || 107.60981;

        // Initialize map
        const map = L.map(mapContainerRef.current).setView(
            [defaultLat, defaultLng],
            16,
        );
        mapRef.current = map;

        // Add Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Add Marker
        const marker = L.marker([defaultLat, defaultLng], {
            draggable: true,
        }).addTo(map);
        markerRef.current = marker;

        // Add Circle
        const circle = L.circle([defaultLat, defaultLng], {
            color: '#3b82f6', // blue
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            radius: radius,
        }).addTo(map);
        circleRef.current = circle;

        // Setup Drag Event
        marker.on('drag', () => {
            const position = marker.getLatLng();
            circle.setLatLng(position);
        });

        marker.on('dragend', () => {
            const position = marker.getLatLng();
            onLocationChange(position.lat, position.lng);
        });

        // Setup Map Click Event
        map.on('click', (e: any) => {
            const position = e.latlng;
            marker.setLatLng(position);
            circle.setLatLng(position);
            onLocationChange(position.lat, position.lng);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leafletLoaded]);

    // Handle updates from inputs to map
    useEffect(() => {
        if (!leafletLoaded || !mapRef.current) {
            return;
        }

        const lat = parseFloat(latitude?.toString());
        const lng = parseFloat(longitude?.toString());

        if (!isNaN(lat) && !isNaN(lng)) {
            const currentMarker = markerRef.current;

            if (currentMarker) {
                const currentCenter = currentMarker.getLatLng();

                if (currentCenter.lat !== lat || currentCenter.lng !== lng) {
                    const newPos = [lat, lng] as [number, number];
                    currentMarker.setLatLng(newPos);

                    if (circleRef.current) {
                        circleRef.current.setLatLng(newPos);
                    }

                    mapRef.current.panTo(newPos);
                }
            }
        }
    }, [latitude, longitude, leafletLoaded]);

    // Handle radius updates
    useEffect(() => {
        if (!leafletLoaded || !circleRef.current) {
            return;
        }

        circleRef.current.setRadius(radius);
    }, [radius, leafletLoaded]);

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    onLocationChange(lat, lng);
                },
                (error) => {
                    alert(
                        'Gagal mendeteksi lokasi perangkat: ' + error.message,
                    );
                },
                { enableHighAccuracy: true },
            );
        } else {
            alert('Browser tidak mendukung pendeteksian lokasi.');
        }
    };

    if (loadingError) {
        return (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-line bg-canvas/30 text-sm text-red-500">
                Gagal memuat pustaka peta Leaflet. Pastikan koneksi internet
                aktif.
            </div>
        );
    }

    if (!leafletLoaded) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-canvas/30 text-sm text-muted">
                <LoaderCircle className="size-6 animate-spin text-primary" />
                <span>Memuat Peta...</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase">
                    Pilih lokasi di peta
                </span>
                <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                    <MapPin className="size-3.5" />
                    Gunakan Lokasi Perangkat
                </button>
            </div>
            <div
                ref={mapContainerRef}
                className="z-10 h-64 w-full overflow-hidden rounded-2xl border border-line shadow-sm"
            />
            <p className="text-xs text-muted">
                Klik peta atau seret marker biru untuk memperbarui koordinat
                secara presisi.
            </p>
        </div>
    );
}
