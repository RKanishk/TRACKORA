import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { ServerResponse } from "node:http";

// The dev server runs on :3000 (the origin the backend allows via CORS_ORIGIN)
// and proxies /api to the backend. Proxying keeps the browser on a single
// origin, so the httpOnly refresh cookie (scoped to /api/v1/auth) stays
// first-party and no cross-origin CORS dance is needed in development.
//
// The default target is 127.0.0.1 (not "localhost") on purpose: on Windows +
// Node 18+, "localhost" resolves to IPv6 (::1) first and the proxy's
// autoSelectFamily logic can burn attempts on an address the backend isn't
// listening on, producing the noisy "AggregateError [ECONNREFUSED] …
// internalConnectMultiple" errors. Pinning IPv4 avoids that ambiguity.
const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? "http://127.0.0.1:4000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: PROXY_TARGET,
        changeOrigin: true,
        // When the backend isn't up yet, respond with a single clean 502 JSON
        // (matching the API's error envelope) and log one concise hint, instead
        // of letting every request dump an ECONNREFUSED stack trace to the console.
        configure: (proxy) => {
          let warned = false;
          proxy.on("error", (err, _req, res) => {
            if (!warned) {
              const reason = (err as { code?: string }).code ?? err.message;
              console.warn(
                `\n[proxy] Cannot reach the Trackora backend at ${PROXY_TARGET} (${reason}).\n` +
                  `        Start it first: in the backend project run \`npm run dev\` ` +
                  `(with Postgres running), then reload.\n`,
              );
              warned = true;
            }
            if (res instanceof ServerResponse && !res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: {
                    code: "BACKEND_UNREACHABLE",
                    message: "The Trackora API is not reachable from the dev proxy.",
                  },
                  requestId: "dev-proxy",
                }),
              );
            }
          });
        },
      },
    },
  },
  preview: {
    port: 3000,
  },
});
