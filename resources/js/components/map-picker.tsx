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
    const radiusRef = useRef(radius);
    useEffect(() => {
        radiusRef.current = radius;
    }, [radius]);
    const [leafletLoaded, setLeafletLoaded] = useState(
        () => typeof window !== 'undefined' && !!(window as any).L,
    );
    const [loadingError, setLoadingError] = useState(false);

    const lat = parseFloat(latitude?.toString());
    const lng = parseFloat(longitude?.toString());
    const hasCoords = !isNaN(lat) && !isNaN(lng);

    /** Buat marker + lingkaran radius di posisi tertentu, sekali saja. */
    function placeMarker(map: any, L: any, position: [number, number]) {
        const marker = L.marker(position, { draggable: true }).addTo(map);
        markerRef.current = marker;

        const circle = L.circle(position, {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            radius: radiusRef.current,
        }).addTo(map);
        circleRef.current = circle;

        marker.on('drag', () => circle.setLatLng(marker.getLatLng()));
        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onLocationChange(pos.lat, pos.lng);
        });
    }

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

        // Belum ada koordinat: tampilkan peta Indonesia zoom-out tanpa
        // marker/lingkaran, sampai user klik atau pakai lokasi perangkat.
        const initialView: [number, number] = hasCoords
            ? [lat, lng]
            : [-2.5, 118];

        const map = L.map(mapContainerRef.current).setView(
            initialView,
            hasCoords ? 16 : 5,
        );
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        if (hasCoords) {
            placeMarker(map, L, [lat, lng]);
        }

        map.on('click', (e: any) => {
            const position: [number, number] = [e.latlng.lat, e.latlng.lng];

            if (markerRef.current) {
                markerRef.current.setLatLng(position);
                circleRef.current?.setLatLng(position);
            } else {
                placeMarker(map, L, position);
            }

            onLocationChange(position[0], position[1]);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
                circleRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leafletLoaded]);

    // Handle updates from inputs to map (mis. tombol "Gunakan Lokasi Perangkat")
    useEffect(() => {
        if (!leafletLoaded || !mapRef.current || !hasCoords) {
            return;
        }

        const newPos: [number, number] = [lat, lng];

        if (!markerRef.current) {
            placeMarker(mapRef.current, (window as any).L, newPos);
            mapRef.current.setView(newPos, 16);

            return;
        }

        const currentCenter = markerRef.current.getLatLng();

        if (currentCenter.lat !== lat || currentCenter.lng !== lng) {
            markerRef.current.setLatLng(newPos);
            circleRef.current?.setLatLng(newPos);
            mapRef.current.panTo(newPos);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div className="relative">
                <div
                    ref={mapContainerRef}
                    className="z-10 h-64 w-full overflow-hidden rounded-2xl border border-line shadow-sm"
                />
                {!hasCoords && (
                    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-canvas/70 text-center backdrop-blur-[1px]">
                        <MapPin className="size-6 text-muted" />
                        <p className="max-w-[220px] text-xs font-medium text-ink">
                            Lokasi belum diisi
                        </p>
                        <p className="max-w-[220px] text-xs text-muted">
                            Presensi berbasis lokasi tidak aktif sampai titik
                            ini diisi.
                        </p>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted">
                {hasCoords
                    ? 'Klik peta atau seret marker biru untuk memperbarui koordinat secara presisi.'
                    : 'Klik di mana pun pada peta, atau gunakan tombol lokasi perangkat, untuk menetapkan titik pertama.'}
            </p>
        </div>
    );
}
