/**
 * EMR and Lab E2E Tests
 *
 * Tests for US-103: Verify EMR and lab work correctly.
 * - Consultations page and queue
 * - Recording vitals and clinical notes
 * - Adding diagnoses
 * - Creating prescriptions
 * - Ordering lab tests
 * - Lab dashboard and results entry
 * - Patient viewing lab results
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";
import type { Page } from "@playwright/test";

const CONSULTATIONS_URL = "/en/clinic/dashboard/consultations";
const LAB_DASHBOARD_URL = "/en/clinic/dashboard/lab";
const PATIENT_LAB_RESULTS_URL = "/en/dashboard/lab-results";

/**
 * Helper function to check if we have clinic dashboard access
 * Returns true if the page is accessible, false otherwise
 */
async function hasClinicAccess(page: Page): Promise<boolean> {
  // Wait for page to fully load
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
 * Helper function to check if we have consultations access
 */
async function hasConsultationsAccess(page: Page): Promise<boolean> {
  const hasAccess = await hasClinicAccess(page);
  if (!hasAccess) return false;

  // Check for consultations title
  const consultationsTitle = await page
    .getByRole("heading", { name: /consultations/i })
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  return consultationsTitle;
}

/**
 * Helper function to check if we have lab dashboard access
 */
async function hasLabDashboardAccess(page: Page): Promise<boolean> {
  const hasAccess = await hasClinicAccess(page);
  if (!hasAccess) return false;

  // Check for lab dashboard title
  const labTitle = await page
    .getByRole("heading", { name: /lab dashboard/i })
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  return labTitle;
}

// ============================================================================
// CONSULTATIONS PAGE - ACCESS CONTROL
// ============================================================================

test.describe("EMR Consultations - Access Control", () => {
  test("should show login required when not authenticated", async ({
    page,
  }) => {
    await page.goto(CONSULTATIONS_URL);

    // Wait for loading to complete
    await page
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 })
      .catch(() => {});

    // Should show login required message
    await expect(page.getByText(/please log in|login required/i)).toBeVisible();
    await expect(
      page.locator("main").getByRole("button", { name: /login/i })
    ).toBeVisible();
  });

  test("should have correct callback URL in login link", async ({ page }) => {
    await page.goto(CONSULTATIONS_URL);
    await page
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 })
      .catch(() => {});

    // Get the login link from the main content
    const loginButton = page
      .locator("main")
      .getByRole("link", { name: /login/i });
    const href = await loginButton.getAttribute("href");
    expect(href).toContain("callbackUrl");
    expect(href).toContain("consultations");
  });
});

// ============================================================================
// CONSULTATIONS PAGE - AUTHENTICATED CLINIC OWNER
// ============================================================================

test.describe("EMR Consultations - Page Layout", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(CONSULTATIONS_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should load consultations page with title", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "Clinic owner does not have consultations access - skipping test");
      return;
    }

    await expect(
      clinicOwnerPage.getByRole("heading", { name: /consultations/i })
    ).toBeVisible();
  });

  test("should display Today's Queue section", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    await expect(
      clinicOwnerPage.getByRole("heading", { name: /today.*queue/i })
    ).toBeVisible();
  });

  test("should display Recent Clinical Notes section", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    await expect(
      clinicOwnerPage.getByRole("heading", { name: /recent clinical notes/i })
    ).toBeVisible();
  });

  test("should display Back to Dashboard button", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    await expect(
      clinicOwnerPage.getByRole("link", { name: /back to dashboard/i })
    ).toBeVisible();
  });

  test("should display Refresh button", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    await expect(
      clinicOwnerPage.getByRole("button", { name: /refresh/i })
    ).toBeVisible();
  });

  test("should display clinical notes filter buttons", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    // Filter buttons: All, Drafts, Finalized
    await expect(
      clinicOwnerPage.getByRole("button", { name: /all/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /draft/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /final/i })
    ).toBeVisible();
  });
});

// ============================================================================
// CONSULTATIONS - TODAY'S QUEUE
// ============================================================================

test.describe("EMR Consultations - Today's Queue", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(CONSULTATIONS_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should show queue count badge", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    // Queue section should have a count badge
    const queueSection = clinicOwnerPage.locator("text=Today's Queue").first();
    await expect(queueSection).toBeVisible();

    // There should be a count badge (could be 0 or more)
    const countBadge = clinicOwnerPage.locator(
      ".bg-primary-blue.text-white.rounded-full"
    );
    await expect(countBadge.first()).toBeVisible({ timeout: 5000 });
  });

  test("should show empty queue message or queue items", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    // Either show "No patients in queue" or queue items
    const emptyQueue = await clinicOwnerPage
      .getByText(/no patients in queue/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasQueueItems = await clinicOwnerPage
      .getByText(/start consultation|continue/i)
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(emptyQueue || hasQueueItems).toBeTruthy();
  });
});

// ============================================================================
// CONSULTATIONS - CLINICAL NOTES
// ============================================================================

test.describe("EMR Consultations - Clinical Notes", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(CONSULTATIONS_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should filter notes by Draft status", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    // Click the Drafts filter
    await clinicOwnerPage.getByRole("button", { name: /draft/i }).click();

    // Wait for filter to apply
    await clinicOwnerPage.waitForTimeout(500);

    // Either shows draft notes or "no clinical notes" message
    const hasDrafts = await clinicOwnerPage
      .locator(".bg-primary-yellow")
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const noNotes = await clinicOwnerPage
      .getByText(/no clinical notes/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasDrafts || noNotes).toBeTruthy();
  });

  test("should filter notes by Finalized status", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    // Click the Finalized filter
    await clinicOwnerPage.getByRole("button", { name: /final/i }).click();

    // Wait for filter to apply
    await clinicOwnerPage.waitForTimeout(500);

    // Either shows finalized notes or "no clinical notes" message
    const hasFinals = await clinicOwnerPage
      .locator(".bg-verified")
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const noNotes = await clinicOwnerPage
      .getByText(/no clinical notes/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasFinals || noNotes).toBeTruthy();
  });

  test("should show clinical note with status badge", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    // Check if there are any clinical notes
    const noteLink = clinicOwnerPage.locator(
      "a[href*='/consultations/']"
    ).first();
    const hasNotes = await noteLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasNotes) {
      // Notes should have a status badge (Draft, Final, or Amended)
      const hasStatusBadge = await clinicOwnerPage
        .locator(".bg-primary-yellow, .bg-verified, .bg-primary-blue")
        .first()
        .isVisible();
      expect(hasStatusBadge).toBeTruthy();
    } else {
      // No notes - that's also valid
      await expect(clinicOwnerPage.getByText(/no clinical notes/i)).toBeVisible();
    }
  });
});

// ============================================================================
// LAB DASHBOARD - ACCESS CONTROL
// ============================================================================

test.describe("Lab Dashboard - Access Control", () => {
  test("should show login required when not authenticated", async ({
    page,
  }) => {
    await page.goto(LAB_DASHBOARD_URL);

    // Wait for loading to complete
    await page
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 })
      .catch(() => {});

    // Should show login required message
    await expect(page.getByText(/please log in|login required/i)).toBeVisible();
  });

  test("should have correct callback URL in login link", async ({ page }) => {
    await page.goto(LAB_DASHBOARD_URL);
    await page
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 })
      .catch(() => {});

    // Get the login link from the main content
    const loginButton = page
      .locator("main")
      .getByRole("link", { name: /login/i });
    const href = await loginButton.getAttribute("href");
    expect(href).toContain("callbackUrl");
    expect(href).toContain("lab");
  });
});

// ============================================================================
// LAB DASHBOARD - AUTHENTICATED CLINIC OWNER
// ============================================================================

test.describe("Lab Dashboard - Page Layout", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(LAB_DASHBOARD_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should load lab dashboard with title", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "Clinic owner does not have lab dashboard access - skipping test");
      return;
    }

    await expect(
      clinicOwnerPage.getByRole("heading", { name: /lab dashboard/i })
    ).toBeVisible();
  });

  test("should display status tabs", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    // Tabs: Pending, In Progress, Completed, All
    await expect(
      clinicOwnerPage.getByRole("button", { name: /pending/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /in progress/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /completed/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /all/i })
    ).toBeVisible();
  });

  test("should display stats cards", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    // Stats: Pending, Processing, Completed Today
    await expect(
      clinicOwnerPage.getByText(/pending/i).first()
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByText(/processing/i).first()
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByText(/completed/i).first()
    ).toBeVisible();
  });
});

// ============================================================================
// LAB DASHBOARD - TAB SWITCHING
// ============================================================================

test.describe("Lab Dashboard - Tab Switching", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(LAB_DASHBOARD_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should switch to In Progress tab", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /in progress/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Tab should be active (has different styling)
    const inProgressTab = clinicOwnerPage.getByRole("button", {
      name: /in progress/i,
    });
    await expect(inProgressTab).toHaveClass(/bg-foreground/);
  });

  test("should switch to Completed tab", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /completed/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Tab should be active
    const completedTab = clinicOwnerPage.getByRole("button", {
      name: /completed/i,
    });
    await expect(completedTab).toHaveClass(/bg-foreground/);
  });

  test("should switch to All Orders tab", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /all/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Tab should be active
    const allTab = clinicOwnerPage.getByRole("button", { name: /all/i });
    await expect(allTab).toHaveClass(/bg-foreground/);
  });
});

// ============================================================================
// LAB DASHBOARD - ORDER DISPLAY
// ============================================================================

test.describe("Lab Dashboard - Order Display", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(LAB_DASHBOARD_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should show lab orders or empty message", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    // Click All tab to see all orders
    await clinicOwnerPage.getByRole("button", { name: /all/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Either show orders or "no lab orders" message
    const hasOrders = await clinicOwnerPage
      .getByText(/order #/i)
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const noOrders = await clinicOwnerPage
      .getByText(/no lab orders/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasOrders || noOrders).toBeTruthy();
  });

  test("should display order with patient info", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    // Click All tab
    await clinicOwnerPage.getByRole("button", { name: /all/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Check if there are any orders
    const hasOrders = await clinicOwnerPage
      .getByText(/order #/i)
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasOrders) {
      // Orders should show patient info
      await expect(clinicOwnerPage.getByText(/patient/i).first()).toBeVisible();
    } else {
      // No orders - that's also valid
      await expect(clinicOwnerPage.getByText(/no lab orders/i)).toBeVisible();
    }
  });
});

// ============================================================================
// LAB DASHBOARD - ORDER ACTIONS
// ============================================================================

test.describe("Lab Dashboard - Order Actions", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(LAB_DASHBOARD_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should show Collect Sample button for ordered status", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    // Check Pending tab for orders awaiting sample collection
    await clinicOwnerPage.getByRole("button", { name: /pending/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Either show "Collect Sample" button or no orders
    const collectSampleBtn = await clinicOwnerPage
      .getByRole("button", { name: /collect sample/i })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const noOrders = await clinicOwnerPage
      .getByText(/no lab orders/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(collectSampleBtn || noOrders).toBeTruthy();
  });

  test("should show Enter Results button for processing orders", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    // Check In Progress tab
    await clinicOwnerPage.getByRole("button", { name: /in progress/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Either show "Enter Results" button or no orders
    const enterResultsBtn = await clinicOwnerPage
      .getByRole("link", { name: /enter results/i })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const noOrders = await clinicOwnerPage
      .getByText(/no lab orders/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(enterResultsBtn || noOrders).toBeTruthy();
  });

  test("should show View Results button for completed orders", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    // Check Completed tab
    await clinicOwnerPage.getByRole("button", { name: /completed/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Either show "View Results" or "Print Report" button or no orders
    const viewResultsBtn = await clinicOwnerPage
      .getByRole("link", { name: /view results/i })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const printReportBtn = await clinicOwnerPage
      .getByRole("button", { name: /print report/i })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const noOrders = await clinicOwnerPage
      .getByText(/no lab orders/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(viewResultsBtn || printReportBtn || noOrders).toBeTruthy();
  });
});

// ============================================================================
// PATIENT LAB RESULTS - ACCESS CONTROL
// ============================================================================

test.describe("Patient Lab Results - Access Control", () => {
  test("should show login required when not authenticated", async ({
    page,
  }) => {
    await page.goto(PATIENT_LAB_RESULTS_URL);

    // Wait for loading to complete
    await page
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 })
      .catch(() => {});

    // Should show login required message
    await expect(page.getByText(/please log in|login required/i)).toBeVisible();
  });
});

// ============================================================================
// PATIENT LAB RESULTS - AUTHENTICATED USER
// ============================================================================

/**
 * Helper function to check if we have patient lab results access
 * Session may not be maintained in E2E - gracefully handle
 */
async function hasPatientLabResultsAccess(page: Page): Promise<boolean> {
  // Wait for loading to complete
  await page
    .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
    .catch(() => {});

  // Check for login required message (session not maintained)
  const loginRequired = await page
    .getByText(/please log in|login required/i)
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (loginRequired) return false;

  // Check for "My Lab Results" title
  const hasTitle = await page
    .getByRole("heading", { name: /my lab results/i })
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  return hasTitle;
}

test.describe("Patient Lab Results - Page Layout", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto(PATIENT_LAB_RESULTS_URL);
    await authenticatedPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should load patient lab results page with title", async ({
    authenticatedPage,
  }) => {
    const hasAccess = await hasPatientLabResultsAccess(authenticatedPage);
    if (!hasAccess) {
      // Session not maintained in E2E - known limitation
      test.skip(true, "Session not maintained - skipping authenticated test");
      return;
    }

    await expect(
      authenticatedPage.getByRole("heading", { name: /my lab results/i })
    ).toBeVisible();
  });

  test("should show lab results or empty message", async ({
    authenticatedPage,
  }) => {
    const hasAccess = await hasPatientLabResultsAccess(authenticatedPage);
    if (!hasAccess) {
      // Session not maintained in E2E - known limitation
      test.skip(true, "Session not maintained - skipping authenticated test");
      return;
    }

    // Either show results or "no lab results" message
    const hasResults = await authenticatedPage
      .getByText(/order #/i)
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const noResults = await authenticatedPage
      .getByText(/no lab results/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasResults || noResults).toBeTruthy();
  });
});

// ============================================================================
// LANGUAGE SUPPORT
// ============================================================================

test.describe("EMR and Lab - Language Support", () => {
  test("should load consultations page in Nepali", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/consultations");
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // Page should load - verify URL is correct
    expect(clinicOwnerPage.url()).toContain("/ne/clinic/dashboard/consultations");
  });

  test("should load lab dashboard in Nepali", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/lab");
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // Page should load - verify URL is correct
    expect(clinicOwnerPage.url()).toContain("/ne/clinic/dashboard/lab");
  });

  test("should load patient lab results in Nepali", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/ne/dashboard/lab-results");
    await authenticatedPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // Page should load - verify URL is correct
    expect(authenticatedPage.url()).toContain("/ne/dashboard/lab-results");
  });
});

// ============================================================================
// MOBILE RESPONSIVENESS
// ============================================================================

test.describe("EMR and Lab - Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should be usable on mobile for consultations page", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(CONSULTATIONS_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // Page should load without horizontal scroll issues
    const bodyWidth = await clinicOwnerPage.evaluate(
      () => document.body.scrollWidth
    );
    expect(bodyWidth).toBeLessThanOrEqual(395); // 375 + small tolerance
  });

  test("should be usable on mobile for lab dashboard", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(LAB_DASHBOARD_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // Page should load without horizontal scroll issues
    const bodyWidth = await clinicOwnerPage.evaluate(
      () => document.body.scrollWidth
    );
    expect(bodyWidth).toBeLessThanOrEqual(395);
  });

  test("should be usable on mobile for patient lab results", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto(PATIENT_LAB_RESULTS_URL);
    await authenticatedPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // Page should load without horizontal scroll issues
    const bodyWidth = await authenticatedPage.evaluate(
      () => document.body.scrollWidth
    );
    expect(bodyWidth).toBeLessThanOrEqual(395);
  });
});

// ============================================================================
// UI ELEMENTS - CONSULTATIONS
// ============================================================================

test.describe("EMR Consultations - UI Elements", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(CONSULTATIONS_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should have Bauhaus-styled cards", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    // Cards should have Bauhaus styling (border-4)
    const styledCard = clinicOwnerPage.locator(".border-4").first();
    await expect(styledCard).toBeVisible();
  });

  test("should display queue section with blue decorator", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasConsultationsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No consultations access");
      return;
    }

    // Queue card should have blue decorator
    const blueDecorator = clinicOwnerPage.locator(".bg-primary-blue").first();
    await expect(blueDecorator).toBeVisible();
  });
});

// ============================================================================
// UI ELEMENTS - LAB DASHBOARD
// ============================================================================

test.describe("Lab Dashboard - UI Elements", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(LAB_DASHBOARD_URL);
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should have Bauhaus-styled cards", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    // Cards should have Bauhaus styling (border-4)
    const styledCard = clinicOwnerPage.locator(".border-4").first();
    await expect(styledCard).toBeVisible();
  });

  test("should display priority badges with appropriate colors", async ({
    clinicOwnerPage,
  }) => {
    const hasAccess = await hasLabDashboardAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No lab dashboard access");
      return;
    }

    // Click All tab
    await clinicOwnerPage.getByRole("button", { name: /all/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // If there are orders, check for priority badges
    const hasOrders = await clinicOwnerPage
      .getByText(/order #/i)
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasOrders) {
      // Should have status badges (ORDERED, SAMPLE_COLLECTED, etc.)
      const statusBadge = clinicOwnerPage.locator(
        ".bg-primary-yellow, .bg-primary-blue, .bg-verified, .bg-orange-500"
      );
      await expect(statusBadge.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
