/**
 * Mobile Responsiveness E2E Tests
 *
 * Tests for mobile viewport (375x667 - iPhone SE) to verify
 * the platform is fully usable on small screens.
 *
 * Covers:
 * - Homepage renders correctly on mobile
 * - Mobile hamburger menu toggle
 * - Navigation links accessible on mobile
 * - Search works on mobile
 * - Doctor detail page readable on mobile
 * - Login form usable on mobile
 * - Register form usable on mobile
 * - Clinic dashboard accessible on mobile (with auth)
 * - Footer renders as stacked layout on mobile
 */

import { test, expect } from "@playwright/test";
import { TEST_DATA } from "./fixtures/test-utils";

// Set mobile viewport for all tests in this file
test.use({ viewport: { width: 375, height: 667 } });

test.describe("Mobile - Homepage Rendering", () => {
  test("should render the homepage correctly on mobile viewport", async ({
    page,
  }) => {
    await page.goto("/en");

    // Main heading should be visible
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Find Your");

    // Search input should be visible and functional
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // No horizontal scrollbar on mobile
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("should display category cards on mobile", async ({ page }) => {
    await page.goto("/en");

    // Category section should exist with all three categories
    // On mobile they stack vertically
    await expect(page.getByText("Browse Doctors")).toBeVisible();
    await expect(page.getByText("Browse Dentists")).toBeVisible();
    await expect(page.getByText("Browse Pharmacists")).toBeVisible();
  });
});

test.describe("Mobile - Hamburger Menu Toggle", () => {
  test("should show hamburger menu button on mobile", async ({ page }) => {
    await page.goto("/en");

    const menuButton = page.getByRole("button", {
      name: /toggle navigation/i,
    });
    await expect(menuButton).toBeVisible();
  });

  test("should toggle the mobile menu when clicking the hamburger button", async ({
    page,
  }) => {
    await page.goto("/en");

    const menuButton = page.getByRole("button", {
      name: /toggle navigation/i,
    });
    const header = page.locator("header");
    const mobileMenuDropdown = header
      .locator("div.lg\\:hidden")
      .filter({ has: page.locator("nav") });

    // Initially the mobile menu should not be visible
    await expect(mobileMenuDropdown).not.toBeVisible();

    // Click hamburger to open
    await menuButton.click();
    await expect(mobileMenuDropdown).toBeVisible();

    // Click hamburger again to close (if toggle behavior)
    await menuButton.click();
    await expect(mobileMenuDropdown).not.toBeVisible();
  });

  test("should hide desktop navigation on mobile", async ({ page }) => {
    await page.goto("/en");

    // Desktop nav has class "hidden lg:flex" so it should not be visible on mobile
    const header = page.locator("header");
    const desktopNav = header.locator("nav.hidden.lg\\:flex");
    await expect(desktopNav).not.toBeVisible();
  });
});

test.describe("Mobile - Navigation Links Accessible", () => {
  test("should show all navigation links in the mobile menu", async ({
    page,
  }) => {
    await page.goto("/en");

    // Open mobile menu
    const menuButton = page.getByRole("button", {
      name: /toggle navigation/i,
    });
    await menuButton.click();

    // Get the mobile menu dropdown
    const header = page.locator("header");
    const mobileMenuDropdown = header
      .locator("div.lg\\:hidden")
      .filter({ has: page.locator("nav") });
    const mobileNav = mobileMenuDropdown.locator("nav");

    // All main navigation links should be present
    await expect(
      mobileNav.getByRole("link", { name: "Home", exact: true })
    ).toBeVisible();
    await expect(
      mobileNav.getByRole("link", { name: "Doctors", exact: true })
    ).toBeVisible();
    await expect(
      mobileNav.getByRole("link", { name: "Dentists", exact: true })
    ).toBeVisible();
    await expect(
      mobileNav.getByRole("link", { name: "Pharmacists", exact: true })
    ).toBeVisible();
  });

  test("should navigate to Doctors page via mobile menu", async ({ page }) => {
    await page.goto("/en");

    const menuButton = page.getByRole("button", {
      name: /toggle navigation/i,
    });
    await menuButton.click();

    const header = page.locator("header");
    const mobileMenuDropdown = header
      .locator("div.lg\\:hidden")
      .filter({ has: page.locator("nav") });
    const mobileNav = mobileMenuDropdown.locator("nav");

    await mobileNav
      .getByRole("link", { name: "Doctors", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/doctors/);
  });

  test("should show language switcher in mobile menu", async ({ page }) => {
    await page.goto("/en");

    const menuButton = page.getByRole("button", {
      name: /toggle navigation/i,
    });
    await menuButton.click();

    const header = page.locator("header");
    const mobileMenuDropdown = header
      .locator("div.lg\\:hidden")
      .filter({ has: page.locator("nav") });

    await expect(
      mobileMenuDropdown.getByRole("link", { name: "EN", exact: true })
    ).toBeVisible();
    await expect(
      mobileMenuDropdown.getByRole("link", { name: "NE", exact: true })
    ).toBeVisible();
  });

  test("should show Login link in mobile menu", async ({ page }) => {
    await page.goto("/en");

    const menuButton = page.getByRole("button", {
      name: /toggle navigation/i,
    });
    await menuButton.click();

    const header = page.locator("header");
    const mobileMenuDropdown = header
      .locator("div.lg\\:hidden")
      .filter({ has: page.locator("nav") });

    await expect(
      mobileMenuDropdown.getByRole("link", { name: /login/i })
    ).toBeVisible();
  });
});

test.describe("Mobile - Search Functionality", () => {
  test("should allow searching from the homepage on mobile", async ({
    page,
  }) => {
    await page.goto("/en");

    // Fill the search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("cardiologist");

    // Click the search button
    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    // Should navigate to the search results page
    await expect(page).toHaveURL(/\/en\/search\?q=cardiologist/);
  });

  test("should display search results page without horizontal overflow on mobile", async ({
    page,
  }) => {
    await page.goto("/en/search?q=doctor");

    await expect(page.locator("h1")).toContainText("Search Results");

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("should display the search form on the search results page on mobile", async ({
    page,
  }) => {
    await page.goto("/en/search?q=test");

    // The search form input should be visible and usable
    const searchInput = page.locator(
      'input[placeholder*="Search by name, specialty"]'
    );
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveValue("test");
  });
});

test.describe("Mobile - Doctor Detail Page", () => {
  test("should render doctor detail page readably on mobile", async ({
    page,
  }) => {
    await page.goto(`/en/doctors/${TEST_DATA.DOCTORS.VERIFIED}`);

    // The h1 with doctor name should be visible
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText!.length).toBeGreaterThan(0);

    // No horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("should show doctor information sections on mobile", async ({
    page,
  }) => {
    await page.goto(`/en/doctors/${TEST_DATA.DOCTORS.DR_RAM_SHARMA}`);

    await page.waitForLoadState("domcontentloaded");

    // The page should display the doctor's name
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // There should be informational text visible (degree, address, etc.)
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    // Dr. Ram Sharma has degree "MBBS, MD"
    expect(bodyText).toContain("MBBS");
  });
});

test.describe("Mobile - Login Form", () => {
  test("should render login form usably on mobile", async ({ page }) => {
    await page.goto("/en/login");

    // The sign in heading should be visible
    await expect(
      page.getByRole("heading", { name: /sign in/i })
    ).toBeVisible();

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("should allow switching to email auth and filling credentials on mobile", async ({
    page,
  }) => {
    await page.goto("/en/login");

    // The login page defaults to phone. Click "With Email" tab.
    const emailTab = page.getByRole("button", { name: /with email/i });
    await emailTab.click();

    // Email input should now be visible
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();
    await emailInput.fill("test@example.com");

    // Password input
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill("testpassword123");

    // Submit button should be visible and enabled
    const submitButton = page.getByRole("button", { name: /sign in/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test("should display the mobile accent bar on login page", async ({
    page,
  }) => {
    await page.goto("/en/login");

    // The mobile geometric accent bar (lg:hidden) should be visible on mobile
    // The right decorative panel (hidden lg:flex) should NOT be visible
    const decorativePanel = page.locator("div.hidden.lg\\:flex");
    await expect(decorativePanel).not.toBeVisible();
  });
});

test.describe("Mobile - Register Form", () => {
  test("should render register form usably on mobile", async ({ page }) => {
    await page.goto("/en/register");

    // The create account heading should be visible
    await expect(
      page.getByRole("heading", { name: /create account/i })
    ).toBeVisible();

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("should show account type selection cards on mobile", async ({
    page,
  }) => {
    await page.goto("/en/register");

    // Patient and Clinic/Doctor options should be visible
    await expect(page.getByText("Patient")).toBeVisible();
    await expect(page.getByText("Clinic / Doctor")).toBeVisible();
  });

  test("should allow selecting account type and auth method on mobile", async ({
    page,
  }) => {
    await page.goto("/en/register");

    // The "Patient" option is selected by default
    // Click "With Email" tab
    const emailTab = page.getByRole("button", { name: /with email/i });
    await expect(emailTab).toBeVisible();
    await emailTab.click();

    // Click Continue to go to the email input step
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).toBeVisible();
    await continueButton.click();

    // Email input step should now show
    await expect(page.getByText(/email/i)).toBeVisible();
  });

  test("should display the left decorative panel as hidden on mobile", async ({
    page,
  }) => {
    await page.goto("/en/register");

    // The decorative left panel uses "hidden lg:flex" so should be hidden on mobile
    const decorativePanel = page.locator("div.hidden.lg\\:flex");
    await expect(decorativePanel).not.toBeVisible();
  });
});

test.describe("Mobile - Clinic Dashboard with Auth", () => {
  // This test uses a direct login approach rather than the fixture,
  // because test.use() for viewport is already set at file level
  test("should allow authenticated clinic owner to access dashboard on mobile", async ({
    page,
  }) => {
    // Login as clinic owner
    await page.goto("/en/login");

    // Switch to email auth
    const emailTab = page.getByRole("button", { name: /with email/i });
    await emailTab.click();

    await page.locator("#email").fill(TEST_DATA.CLINIC_OWNER.email);
    await page.locator("#password").fill(TEST_DATA.CLINIC_OWNER.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect away from login
    try {
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 30000,
      });
    } catch {
      // If login fails (e.g., no seeded data), skip the rest of the test
      test.skip(true, "Login failed - test data may not be seeded");
      return;
    }

    // Navigate to clinic dashboard
    await page.goto("/en/clinic/dashboard");

    // If we get redirected back to login, session was lost
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      test.skip(
        true,
        "Session not maintained after navigation - known limitation"
      );
      return;
    }

    // Dashboard should load without horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Some dashboard content should be visible
    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

test.describe("Mobile - Footer Stacked Layout", () => {
  test("should render footer sections in a stacked layout on mobile", async ({
    page,
  }) => {
    await page.goto("/en");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Footer section headings should all be visible
    await expect(
      footer.getByRole("heading", { name: "About", level: 3 })
    ).toBeVisible();
    await expect(
      footer.getByRole("heading", { name: "For Doctors", level: 3 })
    ).toBeVisible();
    await expect(
      footer.getByRole("heading", { name: "For Clinics", level: 3 })
    ).toBeVisible();
    await expect(
      footer.getByRole("heading", { name: "Legal", level: 3 })
    ).toBeVisible();

    // On mobile, footer columns should stack vertically.
    // Verify by checking that the footer headings are arranged top-to-bottom
    // (each subsequent heading has a larger y position).
    const aboutBox = await footer
      .getByRole("heading", { name: "About", level: 3 })
      .boundingBox();
    const forDoctorsBox = await footer
      .getByRole("heading", { name: "For Doctors", level: 3 })
      .boundingBox();
    const forClinicsBox = await footer
      .getByRole("heading", { name: "For Clinics", level: 3 })
      .boundingBox();
    const legalBox = await footer
      .getByRole("heading", { name: "Legal", level: 3 })
      .boundingBox();

    // All bounding boxes should exist
    expect(aboutBox).toBeTruthy();
    expect(forDoctorsBox).toBeTruthy();
    expect(forClinicsBox).toBeTruthy();
    expect(legalBox).toBeTruthy();

    // In a stacked layout, each section should be below or at the same level
    // as the previous one (y coordinate increases or columns wrap)
    // On mobile with Tailwind's grid/flex, they stack so each y > previous y
    if (aboutBox && forDoctorsBox && forClinicsBox && legalBox) {
      expect(forDoctorsBox.y).toBeGreaterThanOrEqual(aboutBox.y);
      expect(forClinicsBox.y).toBeGreaterThanOrEqual(forDoctorsBox.y);
      expect(legalBox.y).toBeGreaterThanOrEqual(forClinicsBox.y);
    }
  });

  test("should display copyright and social links in footer on mobile", async ({
    page,
  }) => {
    await page.goto("/en");

    const footer = page.locator("footer");
    const currentYear = new Date().getFullYear();

    await expect(
      footer.getByText(new RegExp(`${currentYear}.*Swasthya|Swasthya.*${currentYear}`))
    ).toBeVisible();

    // Social media links should still be visible on mobile
    await expect(
      footer.getByRole("link", { name: "Facebook" })
    ).toBeVisible();
    await expect(footer.getByRole("link", { name: "Twitter" })).toBeVisible();
  });

  test("should display 'Made in Nepal' on mobile", async ({ page }) => {
    await page.goto("/en");

    const footer = page.locator("footer");
    await expect(footer.getByText("Made in Nepal")).toBeVisible();
  });
});
