/**
 * Dr. Prefix Display E2E Tests
 *
 * Regression tests for the double "Dr." prefix bug.
 *
 * The bug: Database stores names like "Dr. Ram Sharma" (with prefix baked in).
 * The getDisplayName() utility prepends "Dr." for DOCTOR and DENTIST types.
 * Result: "Dr. Dr. Ram Sharma" was rendered on the page.
 *
 * The fix: Either the database stores plain names ("Ram Sharma") and
 * getDisplayName() adds the prefix, OR getDisplayName() strips an existing
 * prefix before prepending. Either way, the page must show "Dr." exactly once
 * for doctors and dentists, and never for pharmacists.
 */

import { test, expect } from "@playwright/test";
import { SEED_DATA } from "./fixtures/seed";

const TEST_DOCTOR = SEED_DATA.DOCTORS[0]; // Dr. Ram Sharma
const TEST_DOCTOR_2 = SEED_DATA.DOCTORS[1]; // Dr. Sita Thapa
const TEST_DENTIST = SEED_DATA.DENTISTS[0]; // Dr. Dental One
const TEST_PHARMACIST = SEED_DATA.PHARMACISTS[0]; // Pharmacist One

test.describe("Doctor Detail Page - Name Display", () => {
  test("should display doctor name with Dr. prefix in the heading", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();

    // Heading must contain "Dr." at least once
    await expect(heading).toContainText("Dr.");
  });

  test("should NOT display double Dr. prefix on doctor detail page", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    const heading = page.getByRole("heading", { level: 1 });
    const headingText = await heading.textContent();

    // The critical regression check: "Dr. Dr." must never appear
    expect(headingText).not.toContain("Dr. Dr.");
    expect(headingText).not.toContain("Dr.Dr.");
  });

  test("should show Dr. prefix exactly once for a second doctor", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR_2.slug}`);

    const heading = page.getByRole("heading", { level: 1 });
    const headingText = await heading.textContent();

    expect(headingText).not.toBeNull();
    expect(headingText).not.toContain("Dr. Dr.");
    expect(headingText).not.toContain("Dr.Dr.");

    // Should contain "Dr." exactly once - count occurrences
    const drCount = (headingText!.match(/Dr\./g) || []).length;
    expect(drCount).toBe(1);
  });

  test("should not have double prefix in page title meta tag", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    const title = await page.title();
    expect(title).not.toContain("Dr. Dr.");
    expect(title).not.toContain("Dr.Dr.");
  });

  test("should not have double prefix in meta description", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute("content");

    expect(content).not.toBeNull();
    expect(content).not.toContain("Dr. Dr.");
    expect(content).not.toContain("Dr.Dr.");
  });

  test("should not have double prefix in JSON-LD structured data", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    const jsonLdScript = page.locator('script[type="application/ld+json"]').first();
    const content = await jsonLdScript.textContent();

    expect(content).not.toBeNull();
    expect(content).not.toContain("Dr. Dr.");
    expect(content).not.toContain("Dr.Dr.");
  });
});

test.describe("Dentist Detail Page - Name Display", () => {
  test("should display dentist name with Dr. prefix in the heading", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST.slug}`);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();

    // Dentists should also display "Dr." prefix
    await expect(heading).toContainText("Dr.");
  });

  test("should NOT display double Dr. prefix on dentist detail page", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST.slug}`);

    const heading = page.getByRole("heading", { level: 1 });
    const headingText = await heading.textContent();

    expect(headingText).not.toContain("Dr. Dr.");
    expect(headingText).not.toContain("Dr.Dr.");
  });

  test("should show Dr. prefix exactly once for dentist", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST.slug}`);

    const heading = page.getByRole("heading", { level: 1 });
    const headingText = await heading.textContent();

    expect(headingText).not.toBeNull();

    const drCount = (headingText!.match(/Dr\./g) || []).length;
    expect(drCount).toBe(1);
  });

  test("should not have double prefix in dentist page title", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST.slug}`);

    const title = await page.title();
    expect(title).not.toContain("Dr. Dr.");
  });

  test("should not have double prefix in dentist JSON-LD", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST.slug}`);

    const jsonLdScript = page.locator('script[type="application/ld+json"]').first();
    const content = await jsonLdScript.textContent();

    expect(content).not.toBeNull();
    expect(content).not.toContain("Dr. Dr.");
  });
});

test.describe("Pharmacist Detail Page - Name Display", () => {
  test("should display pharmacist name WITHOUT Dr. prefix", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();

    const headingText = await heading.textContent();
    expect(headingText).not.toBeNull();

    // Pharmacists must never show "Dr." prefix
    expect(headingText).not.toMatch(/^Dr\./);
    expect(headingText).not.toContain("Dr. ");
  });

  test("should display the pharmacist full name as-is", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    const heading = page.getByRole("heading", { level: 1 });
    // The heading should contain the pharmacist's full_name without any "Dr." prefix
    await expect(heading).toContainText(TEST_PHARMACIST.full_name);
  });

  test("should not have Dr. prefix in pharmacist page title", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    const title = await page.title();
    expect(title).not.toContain("Dr.");
  });

  test("should not have Dr. prefix in pharmacist JSON-LD", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    const jsonLdScript = page.locator('script[type="application/ld+json"]').first();
    const content = await jsonLdScript.textContent();

    expect(content).not.toBeNull();
    expect(content).not.toContain("Dr.");
  });
});

test.describe("Doctors Listing Page - Name Prefixes", () => {
  test("should not contain any double Dr. prefix on doctors listing", async ({ page }) => {
    await page.goto("/en/doctors");

    // Wait for the page to fully load
    await expect(page.getByRole("heading", { level: 1, name: "Doctors" })).toBeVisible();

    // Check the entire main content for double prefix
    const mainContent = page.locator("main");
    const mainText = await mainContent.textContent();

    expect(mainText).not.toContain("Dr. Dr.");
    expect(mainText).not.toContain("Dr.Dr.");
  });

  test("should display Dr. prefix on doctor card names", async ({ page }) => {
    await page.goto("/en/doctors");

    await expect(page.getByRole("heading", { level: 1, name: "Doctors" })).toBeVisible();

    // First card name (h3) should start with "Dr."
    const firstCardName = page.getByRole("heading", { level: 3 }).first();
    await expect(firstCardName).toBeVisible();

    const nameText = await firstCardName.textContent();
    expect(nameText).toMatch(/^Dr\./);
  });

  test("should have Dr. prefix exactly once per doctor card name", async ({ page }) => {
    await page.goto("/en/doctors");

    await expect(page.getByRole("heading", { level: 1, name: "Doctors" })).toBeVisible();

    // Check first several card names for double prefix
    const cardNames = page.getByRole("heading", { level: 3 });
    const count = await cardNames.count();
    const checkCount = Math.min(count, 10); // Check up to 10 cards

    for (let i = 0; i < checkCount; i++) {
      const nameText = await cardNames.nth(i).textContent();
      expect(nameText).not.toBeNull();
      expect(nameText).not.toContain("Dr. Dr.");

      // Each doctor name should contain "Dr." exactly once
      const drOccurrences = (nameText!.match(/Dr\./g) || []).length;
      expect(drOccurrences).toBe(1);
    }
  });
});

test.describe("Dentists Listing Page - Name Prefixes", () => {
  test("should not contain any double Dr. prefix on dentists listing", async ({ page }) => {
    await page.goto("/en/dentists");

    await expect(page.getByRole("heading", { level: 1, name: "Dentists" })).toBeVisible();

    const mainContent = page.locator("main");
    const mainText = await mainContent.textContent();

    expect(mainText).not.toContain("Dr. Dr.");
    expect(mainText).not.toContain("Dr.Dr.");
  });

  test("should have Dr. prefix exactly once per dentist card name", async ({ page }) => {
    await page.goto("/en/dentists");

    await expect(page.getByRole("heading", { level: 1, name: "Dentists" })).toBeVisible();

    const cardNames = page.getByRole("heading", { level: 3 });
    const count = await cardNames.count();
    const checkCount = Math.min(count, 10);

    for (let i = 0; i < checkCount; i++) {
      const nameText = await cardNames.nth(i).textContent();
      expect(nameText).not.toBeNull();
      expect(nameText).not.toContain("Dr. Dr.");

      const drOccurrences = (nameText!.match(/Dr\./g) || []).length;
      expect(drOccurrences).toBe(1);
    }
  });
});

test.describe("Search Results - Mixed Professional Types", () => {
  test("should not show double Dr. prefix in any search result", async ({ page }) => {
    // Search broadly for results from Nepal - will include all types
    await page.goto("/en/search?q=Nepal");

    await expect(page.locator("h1")).toContainText("Search Results");

    const mainContent = page.locator("main");
    const mainText = await mainContent.textContent();

    expect(mainText).not.toContain("Dr. Dr.");
    expect(mainText).not.toContain("Dr.Dr.");
  });

  test("should show Dr. prefix for doctors in search results", async ({ page }) => {
    await page.goto("/en/search?q=Nepal&type=DOCTOR");

    await expect(page.locator("h1")).toContainText("Search Results");

    // First result card name should have "Dr." prefix
    const firstCardName = page.getByRole("heading", { level: 3 }).first();

    // Only check if there are results
    if (await firstCardName.isVisible()) {
      const nameText = await firstCardName.textContent();
      expect(nameText).toMatch(/^Dr\./);
      expect(nameText).not.toContain("Dr. Dr.");
    }
  });

  test("should show Dr. prefix for dentists in search results", async ({ page }) => {
    await page.goto("/en/search?q=Nepal&type=DENTIST");

    await expect(page.locator("h1")).toContainText("Search Results");

    const firstCardName = page.getByRole("heading", { level: 3 }).first();

    if (await firstCardName.isVisible()) {
      const nameText = await firstCardName.textContent();
      expect(nameText).toMatch(/^Dr\./);
      expect(nameText).not.toContain("Dr. Dr.");
    }
  });

  test("should NOT show Dr. prefix for pharmacists in search results", async ({ page }) => {
    await page.goto("/en/search?q=Nepal&type=PHARMACIST");

    await expect(page.locator("h1")).toContainText("Search Results");

    const firstCardName = page.getByRole("heading", { level: 3 }).first();

    if (await firstCardName.isVisible()) {
      const nameText = await firstCardName.textContent();
      expect(nameText).not.toMatch(/^Dr\./);
    }
  });

  test("should have correct prefixes across mixed type results", async ({ page }) => {
    // Broad search to get mixed results
    await page.goto("/en/search?q=Kathmandu");

    await expect(page.locator("h1")).toContainText("Search Results");

    // Scan all visible card names - none should have double prefix
    const cardNames = page.getByRole("heading", { level: 3 });
    const count = await cardNames.count();
    const checkCount = Math.min(count, 20);

    for (let i = 0; i < checkCount; i++) {
      const nameText = await cardNames.nth(i).textContent();
      expect(nameText).not.toBeNull();
      expect(nameText).not.toContain("Dr. Dr.");
      expect(nameText).not.toContain("Dr.Dr.");
    }
  });
});
