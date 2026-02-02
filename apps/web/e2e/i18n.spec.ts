/**
 * Language Switching (i18n) E2E Tests
 *
 * Tests for US-047: Verify language switching works correctly
 *
 * NOTE: The current implementation has URL-based language switching via next-intl middleware,
 * but the page content (homepage, header, footer) is mostly hardcoded in English.
 * These tests verify the URL switching behavior and the language switcher UI functionality.
 */

import { test, expect } from "@playwright/test";

test.describe("Default Language", () => {
  test("should default to English when accessing root path", async ({ page }) => {
    await page.goto("/");

    // Should be redirected to /en/
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("should load homepage content on /en/ path", async ({ page }) => {
    await page.goto("/en");

    // Check for homepage content
    const headline = page.locator("h1");
    await expect(headline).toBeVisible();
    await expect(headline).toContainText("Find Your");
    await expect(headline).toContainText("Doctor");
  });

  test("should show EN link as active in language switcher", async ({ page }) => {
    await page.goto("/en");

    const header = page.locator("header");
    // EN link should have active styling (bg-foreground text-white)
    const enLink = header.getByRole("link", { name: "EN", exact: true });
    await expect(enLink).toHaveClass(/bg-foreground/);
  });
});

test.describe("Language Switcher Visibility", () => {
  test("should show language switcher in desktop header", async ({ page }) => {
    await page.goto("/en");

    const header = page.locator("header");
    const enLink = header.getByRole("link", { name: "EN", exact: true });
    const neLink = header.getByRole("link", { name: "NE", exact: true });

    await expect(enLink).toBeVisible();
    await expect(neLink).toBeVisible();
  });

  test("should show language switcher in mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en");

    // Open mobile menu
    const menuButton = page.getByRole("button", { name: /toggle navigation/i });
    await menuButton.click();

    // Get mobile menu dropdown
    const header = page.locator("header");
    const mobileMenuDropdown = header.locator("div.lg\\:hidden").filter({ has: page.locator("nav") });

    // Language switcher should be visible in mobile menu
    await expect(mobileMenuDropdown.getByRole("link", { name: "EN", exact: true })).toBeVisible();
    await expect(mobileMenuDropdown.getByRole("link", { name: "NE", exact: true })).toBeVisible();
  });
});

test.describe("Switch to Nepali (URL)", () => {
  test("should switch URL to /ne/ when clicking NE link", async ({ page }) => {
    await page.goto("/en");

    const header = page.locator("header");
    const neLink = header.getByRole("link", { name: "NE", exact: true });
    await neLink.click();

    // URL should now contain /ne/
    await expect(page).toHaveURL(/\/ne\/?$/);
  });

  test("should show NE link as active after switching", async ({ page }) => {
    await page.goto("/ne");

    const header = page.locator("header");
    // NE link should have active styling
    const neLink = header.getByRole("link", { name: "NE", exact: true });
    await expect(neLink).toHaveClass(/bg-foreground/);
  });

  test("should load page content on /ne/ path", async ({ page }) => {
    await page.goto("/ne");

    // The page should load with the /ne/ URL
    await expect(page).toHaveURL(/\/ne\/?$/);

    // Homepage content loads (content is hardcoded in English)
    const headline = page.locator("h1");
    await expect(headline).toBeVisible();
  });
});

test.describe("Switch Back to English", () => {
  test("should switch URL back to /en/ when clicking EN link from Nepali", async ({ page }) => {
    await page.goto("/ne");

    const header = page.locator("header");
    const enLink = header.getByRole("link", { name: "EN", exact: true });
    await enLink.click();

    // URL should now contain /en/
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("should show EN link as active after switching back", async ({ page }) => {
    await page.goto("/ne");

    const header = page.locator("header");
    await header.getByRole("link", { name: "EN", exact: true }).click();

    await expect(page).toHaveURL(/\/en\/?$/);

    const enLink = header.getByRole("link", { name: "EN", exact: true });
    await expect(enLink).toHaveClass(/bg-foreground/);
  });
});

test.describe("Language Persistence Across Navigation", () => {
  test("should maintain /en/ URL when navigating to Doctors page", async ({ page }) => {
    await page.goto("/en");

    const header = page.locator("header");
    await header.getByRole("link", { name: "Doctors", exact: true }).click();

    await expect(page).toHaveURL(/\/en\/doctors/);
  });

  test("should maintain /ne/ URL when navigating to Doctors page", async ({ page }) => {
    await page.goto("/ne");

    const header = page.locator("header");
    // Navigation links are hardcoded in English
    await header.getByRole("link", { name: "Doctors", exact: true }).click();

    await expect(page).toHaveURL(/\/ne\/doctors/);
  });

  test("should maintain /en/ URL through multiple page navigations", async ({ page }) => {
    await page.goto("/en");

    const header = page.locator("header");

    // Navigate to Doctors
    await header.getByRole("link", { name: "Doctors", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/doctors/);

    // Navigate to Dentists
    await header.getByRole("link", { name: "Dentists", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/dentists/);

    // Navigate to Pharmacists
    await header.getByRole("link", { name: "Pharmacists", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/pharmacists/);

    // Navigate back to Home
    await header.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("should maintain /ne/ URL through multiple page navigations", async ({ page }) => {
    await page.goto("/ne");

    const header = page.locator("header");

    // Navigate to Doctors (links are in English)
    await header.getByRole("link", { name: "Doctors", exact: true }).click();
    await expect(page).toHaveURL(/\/ne\/doctors/);

    // Navigate to Dentists
    await header.getByRole("link", { name: "Dentists", exact: true }).click();
    await expect(page).toHaveURL(/\/ne\/dentists/);

    // Navigate to Pharmacists
    await header.getByRole("link", { name: "Pharmacists", exact: true }).click();
    await expect(page).toHaveURL(/\/ne\/pharmacists/);

    // Navigate back to Home
    await header.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL(/\/ne\/?$/);
  });
});

test.describe("Direct URL Navigation", () => {
  test("should load /en/doctors page correctly", async ({ page }) => {
    await page.goto("/en/doctors");

    await expect(page).toHaveURL(/\/en\/doctors/);
    // Page should load with doctors content
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should load /ne/doctors page correctly", async ({ page }) => {
    await page.goto("/ne/doctors");

    await expect(page).toHaveURL(/\/ne\/doctors/);
    // Page should load
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should load /en/search page correctly", async ({ page }) => {
    await page.goto("/en/search?q=test");

    await expect(page).toHaveURL(/\/en\/search\?q=test/);
    // Search page should load - use .first() to handle multiple main elements
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("should load /ne/search page correctly", async ({ page }) => {
    await page.goto("/ne/search?q=test");

    await expect(page).toHaveURL(/\/ne\/search\?q=test/);
    // Search page should load - use .first() to handle multiple main elements
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("should load /en/login page correctly", async ({ page }) => {
    await page.goto("/en/login");

    await expect(page).toHaveURL(/\/en\/login/);
    // Login form should be visible
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should load /ne/login page correctly", async ({ page }) => {
    await page.goto("/ne/login");

    await expect(page).toHaveURL(/\/ne\/login/);
    // Login form should be visible
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("Invalid Language Handling", () => {
  test("should prepend default language to invalid language paths", async ({ page }) => {
    // Try to access with an invalid language code
    // next-intl middleware prepends the default locale
    await page.goto("/fr");

    // Should be at /en/fr (invalid paths get default locale prepended)
    await expect(page).toHaveURL(/\/en\/fr/);
  });

  test("should prepend default language to invalid nested paths", async ({ page }) => {
    // Try to access with an invalid language code on a nested path
    await page.goto("/xx/doctors");

    // Should be at /en/xx/doctors (default locale prepended)
    await expect(page).toHaveURL(/\/en\/xx\/doctors/);
  });
});

test.describe("404 Handling", () => {
  test("should show 404 page in English for non-existent pages", async ({ page }) => {
    await page.goto("/en/nonexistent-page-12345");

    // Should stay on the URL
    await expect(page).toHaveURL(/\/en\/nonexistent-page-12345/);
    // Should show 404 page (checking for "not found" text, case insensitive)
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });

  test("should show 404 page for /ne/ non-existent pages", async ({ page }) => {
    await page.goto("/ne/nonexistent-page-12345");

    // Should stay on the URL
    await expect(page).toHaveURL(/\/ne\/nonexistent-page-12345/);
    // Should show 404 page
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });
});

test.describe("Language Switching on Different Pages", () => {
  test("should preserve path when switching language on Doctors page", async ({ page }) => {
    await page.goto("/en/doctors");

    const header = page.locator("header");
    const neLink = header.getByRole("link", { name: "NE", exact: true });
    await neLink.click();

    // Should preserve the /doctors path
    await expect(page).toHaveURL(/\/ne\/doctors/);
  });

  test("should preserve path when switching language on Search page", async ({ page }) => {
    await page.goto("/en/search?q=cardiology");

    const header = page.locator("header");
    const neLink = header.getByRole("link", { name: "NE", exact: true });
    await neLink.click();

    // Should preserve the /search path
    await expect(page).toHaveURL(/\/ne\/search/);
  });

  test("should preserve path when switching language on Login page", async ({ page }) => {
    await page.goto("/en/login");

    const header = page.locator("header");
    const neLink = header.getByRole("link", { name: "NE", exact: true });
    await neLink.click();

    // Should preserve the /login path
    await expect(page).toHaveURL(/\/ne\/login/);
  });

  test("should preserve path when switching language on Register page", async ({ page }) => {
    await page.goto("/en/register");

    const header = page.locator("header");
    const neLink = header.getByRole("link", { name: "NE", exact: true });
    await neLink.click();

    // Should preserve the /register path
    await expect(page).toHaveURL(/\/ne\/register/);
  });
});

test.describe("Mobile Language Switching", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should switch to /ne/ URL in mobile view", async ({ page }) => {
    await page.goto("/en");

    // Open mobile menu
    const menuButton = page.getByRole("button", { name: /toggle navigation/i });
    await menuButton.click();

    // Get mobile menu dropdown
    const header = page.locator("header");
    const mobileMenuDropdown = header.locator("div.lg\\:hidden").filter({ has: page.locator("nav") });

    // Click NE link in mobile menu
    await mobileMenuDropdown.getByRole("link", { name: "NE", exact: true }).click();

    // Should navigate to /ne/
    await expect(page).toHaveURL(/\/ne\/?$/);
  });

  test("should switch to /en/ URL in mobile view", async ({ page }) => {
    await page.goto("/ne");

    // Open mobile menu
    const menuButton = page.getByRole("button", { name: /toggle navigation/i });
    await menuButton.click();

    // Get mobile menu dropdown
    const header = page.locator("header");
    const mobileMenuDropdown = header.locator("div.lg\\:hidden").filter({ has: page.locator("nav") });

    // Click EN link in mobile menu
    await mobileMenuDropdown.getByRole("link", { name: "EN", exact: true }).click();

    // Should navigate to /en/
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("should close mobile menu after language switch", async ({ page }) => {
    await page.goto("/en");

    // Open mobile menu
    const menuButton = page.getByRole("button", { name: /toggle navigation/i });
    await menuButton.click();

    // Get mobile menu dropdown
    const header = page.locator("header");
    const mobileMenuDropdown = header.locator("div.lg\\:hidden").filter({ has: page.locator("nav") });
    await expect(mobileMenuDropdown).toBeVisible();

    // Click NE link in mobile menu
    await mobileMenuDropdown.getByRole("link", { name: "NE", exact: true }).click();

    // Wait for navigation
    await expect(page).toHaveURL(/\/ne\/?$/);

    // Mobile menu should be closed after navigation
    await expect(mobileMenuDropdown).not.toBeVisible();
  });
});

test.describe("Language Switcher State", () => {
  test("EN should be highlighted on English pages", async ({ page }) => {
    await page.goto("/en/doctors");

    const header = page.locator("header");
    const enLink = header.getByRole("link", { name: "EN", exact: true });
    const neLink = header.getByRole("link", { name: "NE", exact: true });

    // EN should have active background
    await expect(enLink).toHaveClass(/bg-foreground/);
    // NE should not have active background
    await expect(neLink).not.toHaveClass(/bg-foreground/);
  });

  test("NE should be highlighted on Nepali pages", async ({ page }) => {
    await page.goto("/ne/doctors");

    const header = page.locator("header");
    const enLink = header.getByRole("link", { name: "EN", exact: true });
    const neLink = header.getByRole("link", { name: "NE", exact: true });

    // NE should have active background
    await expect(neLink).toHaveClass(/bg-foreground/);
    // EN should not have active background
    await expect(enLink).not.toHaveClass(/bg-foreground/);
  });
});

test.describe("Language Links Navigation", () => {
  test("EN link should point to English version of current page", async ({ page }) => {
    await page.goto("/ne/doctors");

    const header = page.locator("header");
    const enLink = header.getByRole("link", { name: "EN", exact: true });

    // Check the href attribute
    await expect(enLink).toHaveAttribute("href", "/en/doctors");
  });

  test("NE link should point to Nepali version of current page", async ({ page }) => {
    await page.goto("/en/doctors");

    const header = page.locator("header");
    const neLink = header.getByRole("link", { name: "NE", exact: true });

    // Check the href attribute
    await expect(neLink).toHaveAttribute("href", "/ne/doctors");
  });

  test("Language links should update when navigating to different pages", async ({ page }) => {
    await page.goto("/en");

    const header = page.locator("header");

    // On homepage, NE link should point to /ne
    let neLink = header.getByRole("link", { name: "NE", exact: true });
    await expect(neLink).toHaveAttribute("href", /\/ne\/?$/);

    // Navigate to doctors
    await header.getByRole("link", { name: "Doctors", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/doctors/);

    // NE link should now point to /ne/doctors
    neLink = header.getByRole("link", { name: "NE", exact: true });
    await expect(neLink).toHaveAttribute("href", "/ne/doctors");
  });
});
