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
        name: "CV Certo - Gerador e Gestor de Candidaturas",
        short_name: "CV Certo",
        description: "Plataforma Inteligente de Gestão de Candidaturas e Currículos Otimizados",
        lang: "pt-BR",
        theme_color: "#1E1E1E",
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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB para suportar bundle com PDF e Recharts
        // Tudo o que for gerado no build entra no precache (funciona offline)
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        cleanupOutdatedCaches: true,
        // Cache em tempo de execução
        runtimeCaching: [
          {
            // NUNCA cachear requisições ao Supabase / Edge Functions (sempre direto na rede)
            urlPattern: ({ url }) => url.hostname.includes("supabase.co"),
            handler: "NetworkOnly",
          },
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