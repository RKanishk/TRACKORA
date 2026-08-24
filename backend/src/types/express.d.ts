import type { UserRole } from "../db/schema/enums";

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      /** Set by `authenticate` (or `authenticateApiKey`) once the request is verified. */
      auth?: AuthContext;
      /** Set by `requestId` middleware; echoed back for log correlation. */
      requestId?: string;
    }
  }
}

export {};
