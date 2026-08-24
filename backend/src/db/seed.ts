import { db, pool } from "./client";
import { tenants, users, drivers, vehicles, shipments } from "./schema";
import { hashPassword } from "../lib/crypto";
import { logger } from "../lib/logger";

/**
 * Idempotent-ish: re-running against an already-seeded database will
 * fail on the tenant slug's unique constraint rather than duplicate
 * data — run `npm run db:migrate:reset`-equivalent (drop + recreate)
 * first if you want a truly clean reseed.
 */
async function main() {
  logger.info("Seeding development data…");

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Acme Logistics",
      slug: "acme-logistics",
      plan: "growth",
      status: "active",
      industry: "Logistics & Transportation",
      companySize: "51–200 employees",
      city: "Austin",
      state: "TX",
      country: "United States",
    })
    .returning();
  if (!tenant) throw new Error("Failed to seed tenant");

  const passwordHash = await hashPassword("DevPassword!123");

  const [owner] = await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      name: "Jordan Lee",
      email: "jordan@acmelogistics.com",
      passwordHash,
      role: "owner",
      status: "active",
      emailVerifiedAt: new Date(),
    })
    .returning();

  const [dispatcher] = await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      name: "Sam Rivera",
      email: "sam@acmelogistics.com",
      passwordHash,
      role: "dispatcher",
      status: "active",
      emailVerifiedAt: new Date(),
    })
    .returning();

  const [vehicle] = await db
    .insert(vehicles)
    .values({ tenantId: tenant.id, plateNumber: "TX-48213", type: "Cargo van", capacityKg: 1200 })
    .returning();
  if (!vehicle) throw new Error("Failed to seed vehicle");

  const [driver] = await db
    .insert(drivers)
    .values({
      tenantId: tenant.id,
      name: "Morgan Alvarez",
      phone: "+1 (512) 555-0134",
      licenseNumber: "TX-DL-9981234",
      assignedVehicleId: vehicle.id,
    })
    .returning();
  if (!driver) throw new Error("Failed to seed driver");

  await db.insert(shipments).values([
    {
      tenantId: tenant.id,
      trackingCode: "TRK-48213",
      originAddress: "500 Industrial Pkwy, Austin, TX",
      destinationAddress: "1200 Congress Ave, Austin, TX",
      status: "in_transit",
      priority: "standard",
      driverId: driver.id,
      vehicleId: vehicle.id,
    },
    {
      tenantId: tenant.id,
      trackingCode: "TRK-48198",
      originAddress: "500 Industrial Pkwy, Austin, TX",
      destinationAddress: "88 Reno St, Reno, NV",
      status: "delivered",
      priority: "expedited",
      driverId: driver.id,
      vehicleId: vehicle.id,
      deliveredAt: new Date(),
    },
    {
      tenantId: tenant.id,
      trackingCode: "TRK-48176",
      originAddress: "500 Industrial Pkwy, Austin, TX",
      destinationAddress: "40 Boise Ave, Boise, ID",
      status: "queued",
      priority: "standard",
    },
  ]);

  logger.info(
    { tenantSlug: tenant.slug, owner: owner?.email, dispatcher: dispatcher?.email },
    "Seed complete — log in with jordan@acmelogistics.com / DevPassword!123",
  );

  await pool.end();
}

main().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
