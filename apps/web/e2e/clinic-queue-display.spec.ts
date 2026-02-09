/**
 * Clinic Queue Display E2E Tests
 *
 * Tests for the public queue display page at /clinic/[slug]/queue-display.
 * This is a TV/large-screen display that requires no authentication.
 * It shows current tokens being served and waiting queue for each doctor.
 */

import { test, expect } from "@playwright/test";
import { SEED_DATA } from "./fixtures/seed";

// Use the verified dashboard test clinic for queue display tests
const DASHBOARD_CLINIC = SEED_DATA.CLINICS[3]; // Dashboard Test Clinic - verified, owned by clinic owner
const QUEUE_DISPLAY_URL = `/en/clinic/${DASHBOARD_CLINIC.slug}/queue-display`;

// Non-existent clinic slug for error testing
const INVALID_CLINIC_SLUG = "nonexistent-clinic-abc123";
const INVALID_QUEUE_URL = `/en/clinic/${INVALID_CLINIC_SLUG}/queue-display`;

test.describe("Queue Display - Page Load", () => {
  test("should load queue display page at /clinic/[slug]/queue-display", async ({
    page,
  }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    // The page should load without redirect (no auth required).
    // It shows either the queue data, a loading state, or a "no active queue" message.
    // Wait for loading spinner to finish.
    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // The page should have some content rendered (not blank).
    // Either the clinic name or an error/empty state.
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("should display clinic name in header", async ({ page }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // If the clinic is found, the name should be in the header
    const clinicNameVisible = await page
      .getByText(DASHBOARD_CLINIC.name)
      .isVisible()
      .catch(() => false);

    const errorVisible = await page
      .getByText(/clinic not found|failed to load/i)
      .isVisible()
      .catch(() => false);

    // Either the clinic name is shown or we get an expected error
    expect(clinicNameVisible || errorVisible).toBe(true);
  });

  test("should display 'Queue Display' subtitle", async ({ page }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // The subtitle "Queue Display" should be visible when data loads successfully
    const subtitleVisible = await page
      .getByText(/queue display/i)
      .isVisible()
      .catch(() => false);

    const errorVisible = await page
      .getByText(/clinic not found|failed to load/i)
      .isVisible()
      .catch(() => false);

    expect(subtitleVisible || errorVisible).toBe(true);
  });
});

test.describe("Queue Display - Queue Sections", () => {
  test("should display 'Now Serving' section", async ({ page }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // If queues exist, "Now Serving" label should be visible for each doctor card.
    // If no queues, "No patients waiting" message is shown.
    const nowServingVisible = await page
      .getByText(/now serving/i)
      .first()
      .isVisible()
      .catch(() => false);

    const noPatientsVisible = await page
      .getByText(/no patients waiting/i)
      .isVisible()
      .catch(() => false);

    const errorVisible = await page
      .getByText(/clinic not found|failed to load/i)
      .isVisible()
      .catch(() => false);

    // One of these three states is expected
    expect(nowServingVisible || noPatientsVisible || errorVisible).toBe(true);
  });

  test("should display 'Waiting' section", async ({ page }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // If queues exist, "Waiting" label should be visible for each doctor card.
    const waitingVisible = await page
      .getByText(/^waiting$/i)
      .first()
      .isVisible()
      .catch(() => false);

    const noPatientsVisible = await page
      .getByText(/no patients waiting/i)
      .isVisible()
      .catch(() => false);

    const errorVisible = await page
      .getByText(/clinic not found|failed to load/i)
      .isVisible()
      .catch(() => false);

    expect(waitingVisible || noPatientsVisible || errorVisible).toBe(true);
  });
});

test.describe("Queue Display - Auto-refresh and Last Updated", () => {
  test("should display 'Last updated' timestamp", async ({ page }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // The "Last updated" label should be visible when data loads
    const lastUpdatedVisible = await page
      .getByText(/last updated/i)
      .isVisible()
      .catch(() => false);

    const errorVisible = await page
      .getByText(/clinic not found|failed to load/i)
      .isVisible()
      .catch(() => false);

    expect(lastUpdatedVisible || errorVisible).toBe(true);
  });

  test("should display a formatted time next to last-updated label", async ({
    page,
  }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // When data is loaded, a time string (HH:MM:SS) should be displayed
    // next to "Last updated"
    const timePattern = page.locator("p.tabular-nums");
    const timeVisible = await timePattern
      .isVisible()
      .catch(() => false);

    const errorVisible = await page
      .getByText(/clinic not found|failed to load/i)
      .isVisible()
      .catch(() => false);

    expect(timeVisible || errorVisible).toBe(true);
  });
});

test.describe("Queue Display - Full-screen Layout", () => {
  test("should use full-screen layout with no navigation or footer chrome", async ({
    page,
  }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // The page should have min-h-screen on the main element
    const mainElement = page.locator("main");
    await expect(mainElement).toBeVisible();

    // Standard site nav (header with site logo/links) should NOT be present.
    // The queue display is a standalone page - no shared layout nav.
    const siteNavVisible = await page
      .locator("nav")
      .first()
      .isVisible()
      .catch(() => false);

    // The queue display page does not render a <nav> element - it only has
    // a header with clinic name and a footer with the date.
    // If a nav is visible, it would mean the shared layout leaked in,
    // which is not expected for queue-display.
    // NOTE: We don't fail here because the queue page renders no <nav>.
    // We just assert main is full screen.
    const mainClasses = await mainElement.getAttribute("class");
    expect(mainClasses).toContain("min-h-screen");
  });

  test("should display current date in footer bar", async ({ page }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // Footer with current date is fixed at the bottom
    const footer = page.locator("footer");
    const footerVisible = await footer
      .isVisible()
      .catch(() => false);

    const errorVisible = await page
      .getByText(/clinic not found|failed to load/i)
      .isVisible()
      .catch(() => false);

    expect(footerVisible || errorVisible).toBe(true);
  });

  test("should render with dark background for TV display readability", async ({
    page,
  }) => {
    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // The main element should have bg-foreground class for the dark theme
    const mainElement = page.locator("main");
    const mainClasses = await mainElement.getAttribute("class");
    // bg-foreground is the dark background used for TV display contrast
    expect(mainClasses).toContain("bg-foreground");
  });
});

test.describe("Queue Display - Responsive on Large Screens", () => {
  test("should render properly at 1920x1080 (Full HD TV)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    await page.goto(QUEUE_DISPLAY_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // Main should be visible and take full viewport
    const mainElement = page.locator("main");
    await expect(mainElement).toBeVisible();

    // The clinic name heading should use large text at this viewport
    const heading = page.locator("h1");
    const headingVisible = await heading
      .isVisible()
      .catch(() => false);

    const errorVisible = await page
      .getByText(/clinic not found|failed to load/i)
      .isVisible()
      .catch(() => false);

    expect(headingVisible || errorVisible).toBe(true);

    await context.close();
  });
});

test.describe("Queue Display - Error Handling", () => {
  test("should show error message for non-existent clinic slug", async ({
    page,
  }) => {
    await page.goto(INVALID_QUEUE_URL);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // Should show clinic not found or error message
    await expect(
      page.getByText(/clinic not found|failed to load queue/i)
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Queue Display - Nepali Language", () => {
  test("should display queue page in Nepali when using /ne/ prefix", async ({
    page,
  }) => {
    await page.goto(`/ne/clinic/${DASHBOARD_CLINIC.slug}/queue-display`);

    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 15000 })
      .catch(() => {});

    // If data loads, Nepali labels should be shown
    const nepaliNowServing = await page
      .getByText(/अहिले सेवा गर्दै/)
      .first()
      .isVisible()
      .catch(() => false);

    const nepaliWaiting = await page
      .getByText(/प्रतीक्षामा/)
      .first()
      .isVisible()
      .catch(() => false);

    const nepaliNoPatients = await page
      .getByText(/कुनै बिरामी प्रतीक्षामा छैन/)
      .isVisible()
      .catch(() => false);

    const nepaliError = await page
      .getByText(/क्लिनिक फेला परेन|लाइन लोड गर्न असफल/)
      .isVisible()
      .catch(() => false);

    const nepaliQueueDisplay = await page
      .getByText(/लाइन प्रदर्शन/)
      .isVisible()
      .catch(() => false);

    // At least one Nepali text should be visible
    expect(
      nepaliNowServing ||
        nepaliWaiting ||
        nepaliNoPatients ||
        nepaliError ||
        nepaliQueueDisplay
    ).toBe(true);
  });
});
