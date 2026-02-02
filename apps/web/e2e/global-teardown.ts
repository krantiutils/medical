/**
 * Playwright Global Teardown
 *
 * This file is executed once after all tests.
 * It cleans up test data from the database.
 */

import { teardownTestData, disconnectDb } from "./fixtures/seed";

async function globalTeardown(): Promise<void> {
  console.log("\n🧹 Running global teardown...");
  await teardownTestData();
  await disconnectDb();
  console.log("🧹 Global teardown complete\n");
}

export default globalTeardown;
