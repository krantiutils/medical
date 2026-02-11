/**
 * Homepage and Navigation E2E Tests
 *
 * Tests for US-037: Verify homepage and navigation work correctly
 */

import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("should load with 'FIND YOUR DOCTOR' heading visible", async ({ page }) => {
    // The headline has "Find Your" and "Doctor" as separate text elements
    const headline = page.locator("h1");
    await expect(headline).toBeVisible();
    await expect(headline).toContainText("Find Your");
    await expect(headline).toContainText("Doctor");
  });

  test("should display search input and it should be functional", async ({ page }) => {
    // Use the hero section search input (border-4, larger one)
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await expect(searchInput).toBeVisible();

    // Verify input is functional by typing
    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");
  });

  test("should navigate to search page when searching", async ({ page }) => {
    // Use the hero section search input
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await searchInput.fill("cardiologist");

    // Find and click the hero search button (the large one, not the header icon)
    const heroSection = page.locator("section").first();
    const searchButton = heroSection.getByRole("button", { name: /search/i });
    await searchButton.click();

    // Verify navigation to search page with query parameter
    await expect(page).toHaveURL(/\/en\/search\?q=cardiologist/);
  });

  test("should display category cards for Doctors, Dentists, and Pharmacists", async ({
    page,
  }) => {
    // Check category section - category cards are in the section after hero
    const categorySection = page.locator("section").nth(1);

    // Verify category names are displayed as h3 headings in the category cards
    await expect(categorySection.getByRole("heading", { name: "Doctors", level: 3 })).toBeVisible();
    await expect(categorySection.getByRole("heading", { name: "Dentists", level: 3 })).toBeVisible();
    await expect(categorySection.getByRole("heading", { name: "Pharmacists", level: 3 })).toBeVisible();

    // Verify the "Browse X" links are present in category cards
    await expect(categorySection.getByText("Browse Doctors")).toBeVisible();
    await expect(categorySection.getByText("Browse Dentists")).toBeVisible();
    await expect(categorySection.getByText("Browse Pharmacists")).toBeVisible();
  });

  test("should display quick stats section", async ({ page }) => {
    // Verify the stats for doctors, dentists, and pharmacists are shown
    await expect(page.getByText("38,000+")).toBeVisible();
    await expect(page.getByText("2,500+")).toBeVisible();
    await expect(page.getByText("5,000+")).toBeVisible();
  });
});

test.describe("Navigation Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("should show all navigation links", async ({ page }) => {
    // Get the header element
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Check desktop navigation is visible (hidden class lg:flex)
    const desktopNav = header.locator("nav.hidden.lg\\:flex");
    await expect(desktopNav).toBeVisible();

    // Verify all nav links are present in header
    await expect(header.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(header.getByRole("link", { name: "Doctors", exact: true })).toBeVisible();
    await expect(header.getByRole("link", { name: "Dentists", exact: true })).toBeVisible();
    await expect(header.getByRole("link", { name: "Pharmacists", exact: true })).toBeVisible();
  });

  test("should navigate to Doctors page when clicking Doctors link", async ({
    page,
  }) => {
    const header = page.locator("header");
    const doctorsLink = header.getByRole("link", { name: "Doctors", exact: true });
    await doctorsLink.click();

    // Allow extra time for first-time page compilation in dev mode
    await expect(page).toHaveURL(/\/en\/doctors/, { timeout: 15000 });
  });

  test("should navigate to Dentists page when clicking Dentists link", async ({
    page,
  }) => {
    const header = page.locator("header");
    const dentistsLink = header.getByRole("link", { name: "Dentists", exact: true });
    await dentistsLink.click();

    await expect(page).toHaveURL(/\/en\/dentists/, { timeout: 15000 });
  });

  test("should navigate to Pharmacists page when clicking Pharmacists link", async ({
    page,
  }) => {
    const header = page.locator("header");
    const pharmacistsLink = header.getByRole("link", { name: "Pharmacists", exact: true });
    await pharmacistsLink.click();

    await expect(page).toHaveURL(/\/en\/pharmacists/);
  });

  test("should navigate to homepage when clicking logo", async ({ page }) => {
    // First navigate away from homepage
    await page.goto("/en/doctors");
    await expect(page).toHaveURL(/\/en\/doctors/);

    // Click the logo in header (link with aria-label "Swasthya - Home")
    const header = page.locator("header");
    const logo = header.getByRole("link", { name: "Swasthya - Home" });
    await logo.click();

    // Should be back at homepage
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("should show Login button in header", async ({ page }) => {
    const header = page.locator("header");
    const loginButton = header.getByRole("link", { name: /login/i });
    await expect(loginButton).toBeVisible();
  });

  test("should show language switcher with EN and NE options", async ({
    page,
  }) => {
    const header = page.locator("header");
    // Look for EN and NE language links in header
    const enLink = header.getByRole("link", { name: "EN", exact: true });
    const neLink = header.getByRole("link", { name: "NE", exact: true });

    await expect(enLink).toBeVisible();
    await expect(neLink).toBeVisible();
  });

  test("should switch to Nepali when clicking NE language link", async ({
    page,
  }) => {
    const header = page.locator("header");
    const neLink = header.getByRole("link", { name: "NE", exact: true });
    await neLink.click();

    // URL should now contain /ne/
    await expect(page).toHaveURL(/\/ne\/?$/);
  });
});

test.describe("Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("should be visible with all sections", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Check for all footer section titles (h3 headings)
    await expect(footer.getByRole("heading", { name: "Explore", level: 3 })).toBeVisible();
    await expect(footer.getByRole("heading", { name: "For Doctors", level: 3 })).toBeVisible();
    await expect(footer.getByRole("heading", { name: "For Clinics", level: 3 })).toBeVisible();
    await expect(footer.getByRole("heading", { name: "Legal", level: 3 })).toBeVisible();
  });

  test("should display copyright notice", async ({ page }) => {
    const footer = page.locator("footer");
    const currentYear = new Date().getFullYear();

    // Check for copyright text containing year and "Swasthya"
    await expect(footer.getByText(new RegExp(`© ${currentYear} Swasthya`))).toBeVisible();
  });

  test("should display social media links", async ({ page }) => {
    const footer = page.locator("footer");

    // Check for social media links by aria-label
    await expect(footer.getByRole("link", { name: "Facebook" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Twitter" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "LinkedIn" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Instagram" })).toBeVisible();
  });

  test("should display 'Made in Nepal' text", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByText("Made in Nepal")).toBeVisible();
  });
});

test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE viewport

  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("should show hamburger menu button on mobile", async ({ page }) => {
    // The hamburger menu button should be visible on mobile
    const menuButton = page.getByRole("button", { name: /toggle navigation/i });
    await expect(menuButton).toBeVisible();
  });

  test("should toggle mobile menu when clicking hamburger button", async ({
    page,
  }) => {
    const menuButton = page.getByRole("button", { name: /toggle navigation/i });

    // Initially, mobile menu should not be visible
    // The mobile menu is inside the header with class lg:hidden
    const header = page.locator("header");
    const mobileMenuDropdown = header.locator("div.lg\\:hidden").filter({ has: page.locator("nav") });
    await expect(mobileMenuDropdown).not.toBeVisible();

    // Click hamburger to open menu
    await menuButton.click();

    // Now mobile menu dropdown should be visible
    await expect(mobileMenuDropdown).toBeVisible();

    // Verify nav links are in the mobile menu
    const mobileNav = mobileMenuDropdown.locator("nav");
    await expect(mobileNav.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Doctors", exact: true })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Dentists", exact: true })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Pharmacists", exact: true })).toBeVisible();
  });

  test("should close mobile menu when clicking a navigation link", async ({
    page,
  }) => {
    const menuButton = page.getByRole("button", { name: /toggle navigation/i });

    // Open mobile menu
    await menuButton.click();

    // Get the mobile menu dropdown
    const header = page.locator("header");
    const mobileMenuDropdown = header.locator("div.lg\\:hidden").filter({ has: page.locator("nav") });
    const mobileNav = mobileMenuDropdown.locator("nav");

    // Click on Doctors link in mobile menu
    await mobileNav.getByRole("link", { name: "Doctors", exact: true }).click();

    // Should navigate to doctors page
    await expect(page).toHaveURL(/\/en\/doctors/);

    // Mobile menu should be closed (the dropdown is not visible)
    // After navigation, the menu closes due to onClick handler
    await expect(mobileMenuDropdown).not.toBeVisible();
  });

  test("should show language switcher in mobile menu", async ({ page }) => {
    const menuButton = page.getByRole("button", { name: /toggle navigation/i });
    await menuButton.click();

    // Get the mobile menu dropdown
    const header = page.locator("header");
    const mobileMenuDropdown = header.locator("div.lg\\:hidden").filter({ has: page.locator("nav") });

    // Look for EN and NE in the mobile menu section
    await expect(mobileMenuDropdown.getByRole("link", { name: "EN", exact: true })).toBeVisible();
    await expect(mobileMenuDropdown.getByRole("link", { name: "NE", exact: true })).toBeVisible();
  });

  test("should show Login button in mobile menu", async ({ page }) => {
    const menuButton = page.getByRole("button", { name: /toggle navigation/i });
    await menuButton.click();

    // Get the mobile menu dropdown
    const header = page.locator("header");
    const mobileMenuDropdown = header.locator("div.lg\\:hidden").filter({ has: page.locator("nav") });

    // Login button should be visible in the mobile menu
    await expect(mobileMenuDropdown.getByRole("link", { name: /login/i })).toBeVisible();
  });
});

test.describe("Cross-page Navigation", () => {
  test("should be able to navigate through all main pages from homepage", async ({
    page,
  }) => {
    // Start at homepage
    await page.goto("/en");
    await expect(page.locator("h1")).toContainText("Find Your");

    // Go to Doctors via header nav
    const header = page.locator("header");
    await header.getByRole("link", { name: "Doctors", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/doctors/);
    // The doctors page h1 contains "Doctors" (the translated title)
    await expect(page.locator("h1")).toBeVisible();

    // Go to Dentists via header nav
    await header.getByRole("link", { name: "Dentists", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/dentists/);
    await expect(page.locator("h1")).toBeVisible();

    // Go to Pharmacists via header nav
    await header.getByRole("link", { name: "Pharmacists", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/pharmacists/);
    await expect(page.locator("h1")).toBeVisible();

    // Return to home via logo in header
    await header.getByRole("link", { name: "Swasthya - Home" }).click();
    await expect(page).toHaveURL(/\/en\/?$/);
    await expect(page.locator("h1")).toContainText("Find Your");
  });
});
