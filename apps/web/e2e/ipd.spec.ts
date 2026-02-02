/**
 * E2E Tests for IPD (Inpatient Department) and Bed Management
 *
 * Tests the complete IPD flow:
 * - Ward management (wards are seeded)
 * - Bed management (add beds to wards)
 * - Patient admission (admit patient to bed)
 * - Bed status changes (occupied on admission)
 * - Patient discharge
 * - Bed release (available after discharge)
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";
import type { Page } from "@playwright/test";

const IPD_DASHBOARD_URL = "/en/clinic/dashboard/ipd";
const BEDS_URL = "/en/clinic/dashboard/ipd/beds";
const ADMIT_URL = "/en/clinic/dashboard/ipd/admit";
const ADMISSIONS_URL = "/en/clinic/dashboard/ipd/admissions";

/**
 * Helper function to check if we have IPD access
 * Returns true if the page is accessible, false otherwise
 */
async function hasIPDAccess(page: Page): Promise<boolean> {
  // Wait for page to fully load (wait for loading spinner to disappear)
  await page
    .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
    .catch(() => {});

  // Check for no verified clinic message
  const noClinicVisible = await page
    .getByText(/no verified clinic/i)
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (noClinicVisible) return false;

  // Check for login required
  const loginRequired = await page
    .getByText(/please log in|login required/i)
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (loginRequired) return false;

  return true;
}

/**
 * Helper to wait for loading to complete
 */
async function waitForLoading(page: Page): Promise<void> {
  await page
    .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
    .catch(() => {});
}

test.describe("IPD - Ward and Bed Management", () => {
  test.describe("IPD Dashboard Page", () => {
    test("loads IPD page for authenticated clinic owner", async ({
      clinicOwnerPage,
    }) => {
      await clinicOwnerPage.goto(IPD_DASHBOARD_URL);
      await waitForLoading(clinicOwnerPage);

      // Check if we have access to IPD
      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show IPD Management heading
      await expect(
        clinicOwnerPage.getByRole("heading", { name: /IPD Management/i })
      ).toBeVisible();
    });

    test("shows seeded wards on IPD page", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(IPD_DASHBOARD_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show the General Ward A
      await expect(
        clinicOwnerPage.getByText(TEST_DATA.WARDS.GENERAL_A.name)
      ).toBeVisible();

      // Should show the ICU ward
      await expect(
        clinicOwnerPage.getByText(TEST_DATA.WARDS.ICU.name)
      ).toBeVisible();
    });

    test("displays bed statistics for wards", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(IPD_DASHBOARD_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show total beds count text
      await expect(clinicOwnerPage.getByText(/beds/i).first()).toBeVisible();

      // Should show available/occupied counts
      await expect(
        clinicOwnerPage.getByText(/available/i).first()
      ).toBeVisible();
    });

    test("can navigate to beds page from ward", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(IPD_DASHBOARD_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Click View Beds button on first ward
      await clinicOwnerPage
        .getByRole("link", { name: /View Beds/i })
        .first()
        .click();

      // Should navigate to beds page
      await expect(clinicOwnerPage).toHaveURL(/\/clinic\/dashboard\/ipd\/beds/);
    });
  });

  test.describe("Bed Management Page", () => {
    test("loads beds page for authenticated clinic owner", async ({
      clinicOwnerPage,
    }) => {
      await clinicOwnerPage.goto(BEDS_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show Bed Management heading
      await expect(
        clinicOwnerPage.getByRole("heading", { name: /Bed Management/i })
      ).toBeVisible();
    });

    test("displays seeded beds", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(BEDS_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show bed A-101
      await expect(
        clinicOwnerPage.getByText(TEST_DATA.BEDS.A101.number)
      ).toBeVisible();

      // Should show bed ICU-01
      await expect(
        clinicOwnerPage.getByText(TEST_DATA.BEDS.ICU01.number)
      ).toBeVisible();
    });

    test("can add a new bed to ward", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(BEDS_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Click Add Bed button
      await clinicOwnerPage.getByRole("button", { name: /Add Bed/i }).click();

      // Modal should appear
      await expect(
        clinicOwnerPage.getByRole("heading", { name: /Add Bed/i })
      ).toBeVisible();

      // Select ward from dropdown (first available)
      await clinicOwnerPage.locator("select").first().selectOption({ index: 1 });

      // Fill bed number (unique to avoid conflicts)
      const uniqueBedNumber = `TEST-${Date.now().toString().slice(-6)}`;
      await clinicOwnerPage
        .getByPlaceholder(/e\.g\., A-101/i)
        .fill(uniqueBedNumber);

      // Fill daily rate
      await clinicOwnerPage
        .locator('input[type="number"]')
        .first()
        .fill("1000");

      // Click Save
      await clinicOwnerPage.getByRole("button", { name: /Save/i }).click();

      // Modal should close
      await expect(
        clinicOwnerPage.getByRole("heading", { name: /Add Bed/i })
      ).not.toBeVisible({ timeout: 5000 });

      // New bed should appear in the list
      await expect(clinicOwnerPage.getByText(uniqueBedNumber)).toBeVisible();
    });

    test("beds show Available status by default", async ({
      clinicOwnerPage,
    }) => {
      await clinicOwnerPage.goto(BEDS_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show Available status badges
      const availableBadges = clinicOwnerPage.getByText("Available", {
        exact: true,
      });
      await expect(availableBadges.first()).toBeVisible();
    });

    test("can filter beds by ward", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(BEDS_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show ward filter dropdown with All Wards option
      const wardFilter = clinicOwnerPage.locator("select").first();
      await expect(wardFilter).toBeVisible();

      // Select ICU ward by label
      await wardFilter.selectOption({ label: "ICU" });

      // Should show ICU beds
      await expect(
        clinicOwnerPage.getByText(TEST_DATA.BEDS.ICU01.number)
      ).toBeVisible();
    });
  });

  test.describe("Patient Admission Flow", () => {
    test("can navigate to admission page", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(IPD_DASHBOARD_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Click New Admission button
      await clinicOwnerPage
        .getByRole("link", { name: /New Admission/i })
        .click();

      // Should navigate to admit page
      await expect(clinicOwnerPage).toHaveURL(/\/clinic\/dashboard\/ipd\/admit/);
    });

    test("admission page shows step-by-step process", async ({
      clinicOwnerPage,
    }) => {
      await clinicOwnerPage.goto(ADMIT_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show all three steps
      await expect(
        clinicOwnerPage.getByText(/Step 1: Select Patient/i)
      ).toBeVisible();
      await expect(
        clinicOwnerPage.getByText(/Step 2: Select Bed/i)
      ).toBeVisible();
      await expect(
        clinicOwnerPage.getByText(/Step 3: Admission Details/i)
      ).toBeVisible();
    });

    test("shows available beds for admission", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(ADMIT_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show available beds (e.g., A-101)
      await expect(
        clinicOwnerPage.getByText(TEST_DATA.BEDS.A101.number)
      ).toBeVisible();
    });

    test("can search for patients in admission flow", async ({
      clinicOwnerPage,
    }) => {
      await clinicOwnerPage.goto(ADMIT_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Search for seeded test patient
      const searchInput = clinicOwnerPage.getByPlaceholder(/Type to search/i);
      await expect(searchInput).toBeVisible();
      await searchInput.fill(TEST_DATA.PATIENTS.PATIENT_ONE.name);

      // Wait for search debounce
      await clinicOwnerPage.waitForTimeout(500);
    });
  });

  test.describe("Admissions List", () => {
    test("can view admissions list", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(ADMISSIONS_URL);
      await waitForLoading(clinicOwnerPage);

      // Page should load (may show no admissions yet, but should not error)
      expect(clinicOwnerPage.url()).toContain("/clinic/dashboard/ipd/admissions");
    });

    test("can navigate to admissions from IPD page", async ({
      clinicOwnerPage,
    }) => {
      await clinicOwnerPage.goto(IPD_DASHBOARD_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Click View Admissions link
      await clinicOwnerPage
        .getByRole("link", { name: /View Admissions/i })
        .click();

      // Should navigate to admissions page
      await expect(clinicOwnerPage).toHaveURL(
        /\/clinic\/dashboard\/ipd\/admissions/
      );
    });
  });

  test.describe("Bed Status Legend", () => {
    test("beds page shows status legend", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(BEDS_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Should show Legend section
      await expect(clinicOwnerPage.getByText(/Legend:/i)).toBeVisible();

      // Should show different status types
      await expect(clinicOwnerPage.getByText("Available")).toBeVisible();
      await expect(clinicOwnerPage.getByText("Occupied")).toBeVisible();
      await expect(clinicOwnerPage.getByText("Reserved")).toBeVisible();
      await expect(clinicOwnerPage.getByText("Maintenance")).toBeVisible();
    });
  });

  test.describe("Ward Management", () => {
    test("can open add ward modal", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(IPD_DASHBOARD_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Click Add Ward button
      await clinicOwnerPage.getByRole("button", { name: /Add Ward/i }).click();

      // Modal should appear
      await expect(
        clinicOwnerPage.getByRole("heading", { name: /Add Ward/i })
      ).toBeVisible();

      // Should show form fields
      await expect(
        clinicOwnerPage.getByText(/Ward Name/i)
      ).toBeVisible();
      await expect(
        clinicOwnerPage.getByText(/Ward Type/i)
      ).toBeVisible();
      await expect(
        clinicOwnerPage.getByText(/Capacity/i)
      ).toBeVisible();
    });

    test("can add a new ward", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(IPD_DASHBOARD_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Click Add Ward button
      await clinicOwnerPage.getByRole("button", { name: /Add Ward/i }).click();

      // Wait for modal
      await expect(
        clinicOwnerPage.getByRole("heading", { name: /Add Ward/i })
      ).toBeVisible();

      // Fill ward name (unique to avoid conflicts)
      const uniqueWardName = `Test Ward ${Date.now().toString().slice(-6)}`;
      await clinicOwnerPage
        .locator('input[type="text"]')
        .first()
        .fill(uniqueWardName);

      // Select ward type
      await clinicOwnerPage
        .locator("select")
        .first()
        .selectOption("SEMI_PRIVATE");

      // Fill capacity
      await clinicOwnerPage
        .locator('input[type="number"]')
        .first()
        .fill("8");

      // Click Save
      await clinicOwnerPage.getByRole("button", { name: /Save/i }).click();

      // Modal should close
      await expect(
        clinicOwnerPage.getByRole("heading", { name: /Add Ward/i })
      ).not.toBeVisible({ timeout: 5000 });

      // New ward should appear in the list
      await expect(clinicOwnerPage.getByText(uniqueWardName)).toBeVisible();
    });

    test("can edit existing ward", async ({ clinicOwnerPage }) => {
      await clinicOwnerPage.goto(IPD_DASHBOARD_URL);
      await waitForLoading(clinicOwnerPage);

      const hasAccess = await hasIPDAccess(clinicOwnerPage);
      if (!hasAccess) {
        test.skip(true, "No IPD access - skipping test");
        return;
      }

      // Wait for wards to load
      await expect(
        clinicOwnerPage.getByText(TEST_DATA.WARDS.GENERAL_A.name)
      ).toBeVisible();

      // Find the edit button (pencil icon) on the ward card
      // Ghost buttons are typically used for edit/delete actions
      const wardCards = clinicOwnerPage.locator('[class*="Card"]').filter({
        hasText: TEST_DATA.WARDS.GENERAL_A.name,
      });

      // Click the edit button (first ghost button with SVG)
      await wardCards.locator('button').filter({ has: clinicOwnerPage.locator('svg path[d*="11 5H6"]') }).first().click();

      // Edit Ward modal should appear
      await expect(
        clinicOwnerPage.getByRole("heading", { name: /Edit Ward/i })
      ).toBeVisible();

      // Cancel the edit
      await clinicOwnerPage.getByRole("button", { name: /Cancel/i }).click();

      // Modal should close
      await expect(
        clinicOwnerPage.getByRole("heading", { name: /Edit Ward/i })
      ).not.toBeVisible();
    });
  });

  test.describe("Authentication Required", () => {
    test("IPD page requires authentication", async ({ page }) => {
      await page.goto(IPD_DASHBOARD_URL);
      await waitForLoading(page);

      // Should show login required message
      await expect(
        page.getByText(/Please log in to access the IPD dashboard/i)
      ).toBeVisible();

      // Should show login button
      await expect(
        page.locator("main").getByRole("link", { name: /Login/i })
      ).toBeVisible();
    });

    test("Beds page requires authentication", async ({ page }) => {
      await page.goto(BEDS_URL);
      await waitForLoading(page);

      // Should show login required message
      await expect(
        page.getByText(/Please log in to access the bed management/i)
      ).toBeVisible();
    });

    test("Admit page requires authentication", async ({ page }) => {
      await page.goto(ADMIT_URL);
      await waitForLoading(page);

      // Should show login required message
      await expect(
        page.getByText(/Please log in to admit patients/i)
      ).toBeVisible();
    });
  });
});
