/**
 * Playwright Global Setup
 *
 * This file is executed once before all tests.
 * It seeds the test database with fixtures.
 */

import { seedTestData, disconnectDb } from "./fixtures/seed";

async function globalSetup(): Promise<void> {
  console.log("\n📦 Running global setup...");
  await seedTestData();
  await disconnectDb();
  console.log("📦 Global setup complete\n");
}

export default globalSetup;
