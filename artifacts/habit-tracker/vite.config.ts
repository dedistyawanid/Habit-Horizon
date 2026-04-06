import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

const isDev = process.env.NODE_ENV !== "production";

/*
 * Content-Security-Policy is relaxed in dev to accommodate Vite's HMR
 * (which needs `unsafe-eval` for source-map evaluation and `wss:` for the
 * hot-reload WebSocket).  Production tightens both.
 *
 * External origins this app actually talks to:
 *   - Supabase  (auth + DB)           https://*.supabase.co  wss://*.supabase.co
 *   - Open-Meteo (weather)            https://api.open-meteo.com
 *   - Nominatim (reverse-geocoding)   https://nominatim.openstreetmap.org
 */
const cspDirectives = [
  "default-src 'self'",

  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",

  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  "font-src 'self' https://fonts.gstatic.com data:",

  isDev
    ? "connect-src 'self' wss: https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://nominatim.openstreetmap.org"
    : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://nominatim.openstreetmap.org",

  "img-src 'self' data: https: blob:",

  "worker-src 'self' blob:",

  "frame-src 'self'",

  "frame-ancestors 'self'",

  "base-uri 'self'",

  "form-action 'self'",

  "object-src 'none'",
].join("; ");

const securityHeaders: Record<string, string> = {
  "Content-Security-Policy": cspDirectives,

  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  "X-Frame-Options": "SAMEORIGIN",

  "X-Content-Type-Options": "nosniff",

  "Referrer-Policy": "strict-origin-when-cross-origin",

  /*
   * Permissions-Policy:
   *   geolocation=(self)  — required for the weather card
   *   camera / microphone — not used; explicitly denied
   */
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: securityHeaders,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: securityHeaders,
  },
});
