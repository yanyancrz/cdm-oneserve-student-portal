import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),

        VitePWA({
            registerType: "autoUpdate",

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
                        type: "image/png"
                    },
                    {
                        src: "/icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png"
                    }
                ]
            }
        })
    ]
});