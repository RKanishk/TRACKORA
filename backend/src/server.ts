import { env } from "./config/env";
import { createApp } from "./app";
import { pool } from "./db/client";
import { logger } from "./lib/logger";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Trackora API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, "Error while closing HTTP server");
      process.exitCode = 1;
    }
    try {
      await pool.end();
      logger.info("Database pool closed");
    } catch (poolErr) {
      logger.error({ err: poolErr }, "Error closing database pool");
    } finally {
      process.exit();
    }
  });

  // Force-exit if graceful shutdown hangs (e.g. a stuck connection).
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
