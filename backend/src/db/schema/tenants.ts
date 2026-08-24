import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

import { planEnum, tenantStatusEnum } from "./enums";

/**
 * The tenant is the isolation boundary for everything else in the
 * schema. Every tenant-scoped table below carries a `tenantId` foreign
 * key back to this table — see `db/tenant-scope.ts` for how that's
 * enforced consistently at the repository layer.
 */
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: planEnum("plan").notNull().default("starter"),
  status: tenantStatusEnum("status").notNull().default("pending_verification"),
  billingCycle: text("billing_cycle").notNull().default("monthly"),

  // Business address, captured during onboarding.
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),

  website: text("website"),
  industry: text("industry"),
  companySize: text("company_size"),
  logoUrl: text("logo_url"),

  /** Free-form per-tenant settings (feature flags, branding, etc). */
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
