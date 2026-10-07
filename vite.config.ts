import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        // Permite testar manifest + service worker no `npm run dev`
        enabled: true,
      },
      includeAssets: ["icons/apple-touch-icon.png", "offline.html"],
      manifest: {
        name: "Meu Sistema",
        short_name: "Sistema",
        description: "Sistema Web Instalável",
        lang: "pt-BR",
        theme_color: "#612D53",
        background_color: "#FFFFFF",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icons/maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Tudo o que for gerado no build entra no precache (funciona offline)
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        cleanupOutdatedCaches: true,
        // Cache em tempo de execução: só para o que NÃO está no precache
        runtimeCaching: [
          {
            // Imagens externas (CDN, uploads etc.)
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Exemplo: chamadas de API da própria aplicação
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 dia
              },
            },
          },
        ],
      },
    }),
  ],
});