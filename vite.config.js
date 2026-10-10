import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),

        VitePWA({
            // "injectManifest" keeps our own src/sw.js as the service worker,
            // so the same file can host the Workbox-style precache AND the Web
            // Push handlers (`push`, `notificationclick`).
            // `self.__WB_MANIFEST` inside src/sw.js is the injection point.
            // generateSW would have thrown our worker away on every build.
            registerType: "autoUpdate",
            strategies: "injectManifest",
            srcDir: "src",

            injectManifest: {
                // Match the old generateSW output: the shell, the hashed
                // bundles and the two manifest icons, nothing else. The
                // 5 MB icon is deliberately listed explicitly, not by a
                // glob, so public/icons/icon-192 copy.png cannot sneak in.
                // The plugin adds the manifest icons and manifest.webmanifest
                // itself (additionalManifestEntries), so only the shell and the
                // hashed bundles are globbed here. The 5 MB logo icon is listed
                // by the plugin explicitly rather than by a glob, so
                // public/icons/icon-192 copy.png cannot sneak into the precache.
                globPatterns: ["**/*.{js,css,html}"],
                globIgnores: ["sw.js", "workbox-*.js"],
                // Same limit the old config used, now on the injectManifest side.
                maximumFileSizeToCacheInBytes:
                    10 * 1024 * 1024,
            },

            workbox: {
                maximumFileSizeToCacheInBytes:
                    10 * 1024 * 1024,
            },

            manifest: {
                name: "CDM OneServe",
                short_name: "OneServe",
                description:
                    "Integrated Campus Service Platform",

                theme_color: "#106A2E",
                background_color: "#F1F1F1",

                display: "standalone",
                start_url: "/",

                icons: [
                    {
                        src: "/icons/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
        }),
    ],

    build: {
        chunkSizeWarningLimit: 1000,
    },
});