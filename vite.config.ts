import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Plus Jakarta Sans', {
                    weights: [400, 500, 600, 700, 800],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            registerType: 'prompt',
            // Kita daftarkan SW sendiri dari root (/sw.js) agar scope-nya '/' (lihat routes/web.php).
            injectRegister: null,
            // Service worker & manifest live under /build so they ship with Vite's asset pipeline.
            buildBase: '/build/',
            // Ikon PWA statis di public/ (di-serve dari root).
            includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
            manifest: {
                name: 'SIMONIK — Sistem Informasi Monitoring PKL',
                short_name: 'SIMONIK',
                description:
                    'Sistem Informasi Manajemen & Monitoring Praktik Kerja Lapangan (PKL).',
                lang: 'id',
                theme_color: '#4F5BD5',
                background_color: '#ECECFB',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/dashboard',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                // Hanya precache aset build (hindari model face-api ~50MB & lib besar di public/).
                globDirectory: 'public',
                globPatterns: ['build/assets/**/*.{js,css,woff2}'],
                maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
                navigateFallback: null,
                cleanupOutdatedCaches: true,
                // SW disajikan dari root via Laravel → runtime harus inline (tanpa importScripts sibling).
                inlineWorkboxRuntime: true,
                runtimeCaching: [
                    {
                        // Aset hasil build (JS/CSS ber-hash) — aman di-cache lama.
                        urlPattern: ({ url }) => url.pathname.startsWith('/build/'),
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'simonik-assets',
                            expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
                        },
                    },
                    {
                        // Font Bunny/Google.
                        urlPattern: ({ url }) =>
                            url.origin.includes('fonts.googleapis.com') ||
                            url.origin.includes('fonts.gstatic.com') ||
                            url.origin.includes('fonts.bunny.net'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'simonik-fonts',
                            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        // Ubin peta Leaflet/OSM.
                        urlPattern: ({ url }) => url.origin.includes('tile.openstreetmap.org'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'simonik-map-tiles',
                            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
});
