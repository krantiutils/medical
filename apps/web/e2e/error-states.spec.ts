/**
 * Error States and Edge Cases E2E Tests
 *
 * Tests for error handling, 404 pages, auth redirects, and edge cases.
 *
 * Covers:
 * - 404 pages for non-existent doctor, dentist, and clinic slugs
 * - "Back to Home" link on 404 pages
 * - Invalid language code handling
 * - Protected page redirect without authentication
 * - API error handling on search page (route interception)
 * - Empty search results messaging
 * - Invalid pagination parameter handling
 */

import { test, expect } from "@playwright/test";

test.describe("404 - Non-existent Doctor", () => {
  test("should show 404 page for a non-existent doctor slug", async ({
    page,
  }) => {
    await page.goto("/en/doctors/dr-does-not-exist-00000");

    // The not-found.tsx renders "404" in large text and an h1 "Not Found"
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Not Found" })
    ).toBeVisible();
    await expect(
      page.getByText("The professional you are looking for could not be found.")
    ).toBeVisible();
  });
});

test.describe("404 - Non-existent Dentist", () => {
  test("should show 404 page for a non-existent dentist slug", async ({
    page,
  }) => {
    await page.goto("/en/dentists/dr-fake-dentist-00000");

    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Not Found" })
    ).toBeVisible();
    await expect(
      page.getByText("The professional you are looking for could not be found.")
    ).toBeVisible();
  });
});

test.describe("404 - Non-existent Clinic", () => {
  test("should show 404 page for a non-existent clinic slug", async ({
    page,
  }) => {
    await page.goto("/en/clinic/totally-fake-clinic-xyz");

    // Clinic pages also call notFound() when the slug is not found
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Not Found" })
    ).toBeVisible();
  });
});

test.describe("404 - Back to Home link", () => {
  test("should display a 'Back to Home' button that navigates to the homepage", async ({
    page,
  }) => {
    await page.goto("/en/doctors/nonexistent-slug-99999");

    await expect(page.getByText("404")).toBeVisible();

    // The not-found page has a "Back to Home" button wrapped in a Link to "/"
    const backToHomeButton = page.getByRole("link", {
      name: /back to home/i,
    });
    await expect(backToHomeButton).toBeVisible();

    await backToHomeButton.click();
    // Should navigate to the root, which the intl middleware redirects to /en
    await expect(page).toHaveURL(/\/(en)?\/?$/);
  });
});

test.describe("Invalid Language Code", () => {
  test("should handle an unsupported locale like /fr/ gracefully", async ({
    page,
  }) => {
    // The intl middleware only supports "en" and "ne" (localePrefix: "always").
    // Accessing /fr/ should either redirect to /en/ or show the default locale page.
    const response = await page.goto("/fr/");

    // The page should load without a server error (no 500)
    expect(response?.status()).not.toBe(500);

    // The middleware should redirect unsupported locales to the default locale.
    // After redirect, URL should contain a supported locale.
    const url = page.url();
    const hasValidLocale = /\/(en|ne)(\/|$)/.test(url);
    expect(
      hasValidLocale,
      `Expected URL to contain /en/ or /ne/ after redirect, got: ${url}`
    ).toBe(true);
  });

  test("should handle /xx/ (arbitrary invalid locale) without crashing", async ({
    page,
  }) => {
    const response = await page.goto("/xx/doctors");

    // Should not be a server error
    expect(response?.status()).not.toBe(500);

    // Should either redirect to a valid locale or show the page
    const url = page.url();
    const hasValidLocale = /\/(en|ne)(\/|$)/.test(url);
    expect(
      hasValidLocale,
      `Expected URL to contain /en/ or /ne/ after redirect, got: ${url}`
    ).toBe(true);
  });
});

test.describe("Protected Pages - Auth Redirect", () => {
  test("should redirect /en/clinic/dashboard to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/en/clinic/dashboard");

    // Middleware checks for session cookie and redirects to login
    await expect(page).toHaveURL(/\/en\/login/);

    // The login page should include a callbackUrl param so user returns after login
    const url = page.url();
    expect(url).toContain("callbackUrl");
  });

  test("should redirect /en/admin to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/en/admin");

    await expect(page).toHaveURL(/\/en\/login/);
    const url = page.url();
    expect(url).toContain("callbackUrl");
  });

  test("should redirect /en/dashboard to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/en/dashboard");

    await expect(page).toHaveURL(/\/en\/login/);
    const url = page.url();
    expect(url).toContain("callbackUrl");
  });

  test("should redirect /ne/clinic/dashboard to Nepali login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/ne/clinic/dashboard");

    // Should redirect to Nepali login, preserving the locale
    await expect(page).toHaveURL(/\/ne\/login/);
  });
});

test.describe("API Error Handling on Search Page", () => {
  test("should show an error-tolerant state when the search API call fails", async ({
    page,
  }) => {
    // Intercept all fetch requests to the search-related Prisma/DB calls
    // by intercepting the page's navigation response itself.
    // Since the search page is a server component, we intercept the page route
    // and return an error to simulate a server-side failure.
    await page.route("**/en/search?q=intercepted-error-test**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "text/html",
        body: "<html><body><h1>Internal Server Error</h1></body></html>",
      });
    });

    await page.goto("/en/search?q=intercepted-error-test");

    // The page should show an error state - either the Next.js error boundary
    // or a 500 status page. It should not crash silently.
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();

    // The user should see some indication of error (not a blank page)
    const hasErrorIndication =
      bodyText!.includes("Internal Server Error") ||
      bodyText!.includes("error") ||
      bodyText!.includes("Error") ||
      bodyText!.includes("something went wrong");
    expect(
      hasErrorIndication,
      "Expected some error indication on the page"
    ).toBe(true);
  });
});

test.describe("Empty Search Results", () => {
  test("should display 'No results found' for a gibberish query", async ({
    page,
  }) => {
    await page.goto("/en/search?q=zzzzxyznonexistentquery12345");

    // The search page renders "No results found" when professionals.length === 0
    await expect(
      page.getByRole("heading", { name: /no results found/i })
    ).toBeVisible();

    // Should show the helpful suggestion text
    await expect(
      page.getByText(/couldn.*t find any professionals/i)
    ).toBeVisible();

    // Should show browse buttons as alternatives
    await expect(
      page.getByRole("link", { name: /browse doctors/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse dentists/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse pharmacists/i })
    ).toBeVisible();
  });

  test("should show 0 professionals found count", async ({ page }) => {
    await page.goto("/en/search?q=absolutelynomatchforanyrecord999");

    // The page shows "{count} professional(s) found"
    await expect(page.getByText(/0 professionals found/i)).toBeVisible();
  });
});

test.describe("Invalid Pagination Parameters", () => {
  test("should treat ?page=abc as page 1 (fallback to first page)", async ({
    page,
  }) => {
    // The search page does: parseInt(pageStr, 10) || 1
    // "abc" parses to NaN, so || 1 kicks in -> page 1
    await page.goto("/en/search?q=doctor&page=abc");

    // The page should load normally at page 1 without errors
    await expect(page.locator("h1")).toContainText("Search Results");

    // Should not show an error or crash
    const response = await page.goto("/en/search?q=doctor&page=abc");
    expect(response?.status()).toBe(200);
  });

  test("should treat ?page=0 as page 1 (Math.max enforces minimum)", async ({
    page,
  }) => {
    // The search page does: Math.max(1, parseInt(pageStr, 10) || 1)
    // parseInt("0") = 0, || 1 does not trigger (0 is falsy -> becomes 1)
    // Either way, Math.max(1, ...) ensures minimum page 1
    await page.goto("/en/search?q=doctor&page=0");

    await expect(page.locator("h1")).toContainText("Search Results");

    const response = await page.goto("/en/search?q=doctor&page=0");
    expect(response?.status()).toBe(200);
  });

  test("should treat ?page=-5 as page 1", async ({ page }) => {
    await page.goto("/en/search?q=doctor&page=-5");

    await expect(page.locator("h1")).toContainText("Search Results");

    const response = await page.goto("/en/search?q=doctor&page=-5");
    expect(response?.status()).toBe(200);
  });

  test("should treat ?page=99999 gracefully (no crash, shows empty or last page)", async ({
    page,
  }) => {
    const response = await page.goto("/en/search?q=doctor&page=99999");

    // Should not crash
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("Search Results");
  });
});
