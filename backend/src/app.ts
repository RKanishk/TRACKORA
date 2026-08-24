import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import { logger } from "./lib/logger";
import { requestId } from "./middleware/request-id";
import { apiRateLimiter } from "./middleware/rate-limit";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

import { authRouter } from "./modules/auth/auth.routes";
import { tenantsRouter } from "./modules/tenants/tenants.routes";
import { usersRouter } from "./modules/users/users.routes";
import { driversRouter } from "./modules/drivers/drivers.routes";
import { vehiclesRouter } from "./modules/vehicles/vehicles.routes";
import { shipmentsRouter } from "./modules/shipments/shipments.routes";
import { routesRouter } from "./modules/routes/routes.routes";
import { webhooksRouter } from "./modules/webhooks/webhooks.module";
import { apiKeysRouter } from "./modules/api-keys/api-keys.module";
import { auditLogsRouter } from "./modules/audit-logs/audit-logs.module";
import { analyticsRouter } from "./modules/analytics/analytics.module";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // required for correct req.ip behind a load balancer/reverse proxy

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers["x-request-id"] as string,
      autoLogging: { ignore: (req) => req.url === "/health" },
    }),
  );

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(apiRateLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const apiPrefix = "/api/v1";
  app.use(`${apiPrefix}/auth`, authRouter);
  app.use(apiPrefix, tenantsRouter);
  app.use(apiPrefix, usersRouter);
  app.use(apiPrefix, driversRouter);
  app.use(apiPrefix, vehiclesRouter);
  app.use(apiPrefix, shipmentsRouter);
  app.use(apiPrefix, routesRouter);
  app.use(apiPrefix, webhooksRouter);
  app.use(apiPrefix, apiKeysRouter);
  app.use(apiPrefix, auditLogsRouter);
  app.use(apiPrefix, analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
