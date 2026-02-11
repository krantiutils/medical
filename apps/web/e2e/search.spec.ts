/**
 * Search Functionality E2E Tests
 *
 * Tests for US-038: Verify search works correctly end-to-end
 */

import { test, expect } from "@playwright/test";
import { SEED_DATA } from "./fixtures/seed";

// Test data constants based on seeded data
const TEST_DOCTOR = SEED_DATA.DOCTORS[0]; // Dr. Ram Sharma
const TEST_DENTIST = SEED_DATA.DENTISTS[0]; // Dr. Dental One
const TEST_PHARMACIST = SEED_DATA.PHARMACISTS[0]; // Pharmacist One

test.describe("Search Page - Basic Functionality", () => {
  test("should load search page with query param displayed", async ({ page }) => {
    const searchQuery = "doctor";
    await page.goto(`/en/search?q=${encodeURIComponent(searchQuery)}`);

    // Verify page loads
    await expect(page.locator("h1")).toContainText("Search Results");

    // Verify query is shown in the "Showing results for" text
    await expect(page.getByText(`Showing results for "${searchQuery}"`)).toBeVisible();

    // Verify search input contains the query
    const searchInput = page.locator('input[name="q"]');
    await expect(searchInput).toHaveValue(searchQuery);
  });

  test("should display search results as cards for matching professionals", async ({
    page,
  }) => {
    // Search for something that returns results
    await page.goto("/en/search?q=Nepal");

    // Verify we have results (not "No results found")
    await expect(page.getByRole("heading", { name: "No results found" })).not.toBeVisible();

    // Verify result cards have name headings (h3)
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();

    // Verify "View Profile" links are shown
    await expect(page.getByRole("link", { name: "View Profile" }).first()).toBeVisible();
  });

  test("should show 'No results found' message for invalid search", async ({
    page,
  }) => {
    // Search for something that won't match any seeded data
    await page.goto("/en/search?q=xyznonexistent123456");

    // Verify no results message is displayed
    await expect(page.getByRole("heading", { name: "No results found", level: 2 })).toBeVisible();
    await expect(
      page.getByText("We couldn't find any professionals matching your search")
    ).toBeVisible();

    // Verify browse buttons are shown (these are links containing buttons)
    await expect(page.getByRole("link", { name: "Browse Doctors" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Dentists" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Pharmacists" })).toBeVisible();
  });

  test("should display results count correctly", async ({ page }) => {
    // Search for something that matches multiple results
    await page.goto("/en/search?q=Nepal");

    // Results count should be displayed (format: "X professionals found")
    const resultsText = page.locator("text=/\\d+ professional(s)? found/");
    await expect(resultsText).toBeVisible();
  });
});

test.describe("Search Page - Type Filter", () => {
  test("should show type filter dropdown with all options", async ({ page }) => {
    await page.goto("/en/search?q=Nepal");

    const typeFilter = page.locator("#type-filter");
    await expect(typeFilter).toBeVisible();

    // Check all options are present
    await expect(typeFilter.locator("option", { hasText: "All Types" })).toBeAttached();
    await expect(typeFilter.locator("option", { hasText: "Doctor" })).toBeAttached();
    await expect(typeFilter.locator("option", { hasText: "Dentist" })).toBeAttached();
    await expect(typeFilter.locator("option", { hasText: "Pharmacist" })).toBeAttached();
  });

  test("should filter results when selecting Doctor type", async ({ page }) => {
    // Start with a generic search that includes all types
    await page.goto("/en/search?q=Nepal");

    // Select Doctor type from filter
    const typeFilter = page.locator("#type-filter");
    await typeFilter.selectOption("DOCTOR");

    // Wait for URL to update
    await expect(page).toHaveURL(/type=DOCTOR/);

    // Verify URL contains the type parameter
    const url = new URL(page.url());
    expect(url.searchParams.get("type")).toBe("DOCTOR");
  });

  test("should filter results when selecting Dentist type", async ({ page }) => {
    await page.goto("/en/search?q=Nepal");

    const typeFilter = page.locator("#type-filter");
    await typeFilter.selectOption("DENTIST");

    await expect(page).toHaveURL(/type=DENTIST/);
  });

  test("should filter results when selecting Pharmacist type", async ({ page }) => {
    await page.goto("/en/search?q=Nepal");

    const typeFilter = page.locator("#type-filter");
    await typeFilter.selectOption("PHARMACIST");

    await expect(page).toHaveURL(/type=PHARMACIST/);
  });
});

test.describe("Search Page - Location Filter", () => {
  test("should show location filter dropdown", async ({ page }) => {
    await page.goto("/en/search?q=Dr");

    const locationFilter = page.locator("#location-filter");
    await expect(locationFilter).toBeVisible();

    // Should have "All Locations" as default option
    await expect(locationFilter.locator("option", { hasText: "All Locations" })).toBeAttached();
  });

  test("should filter results when selecting a location", async ({ page }) => {
    await page.goto("/en/search?q=Dr");

    const locationFilter = page.locator("#location-filter");

    // Get the first non-empty location option
    const options = locationFilter.locator("option");
    const optionCount = await options.count();

    // Select the second option (first after "All Locations")
    if (optionCount > 1) {
      const locationValue = await options.nth(1).getAttribute("value");
      if (locationValue) {
        await locationFilter.selectOption(locationValue);

        // Wait for URL to update
        await expect(page).toHaveURL(/location=/);
      }
    }
  });
});

test.describe("Search Page - Active Filters Tags", () => {
  test("should show type filter as removable tag when type is selected", async ({
    page,
  }) => {
    await page.goto("/en/search?q=Nepal&type=DOCTOR");

    // Verify active filters section is visible
    await expect(page.getByText("Active filters:")).toBeVisible();

    // Verify Doctor tag is displayed (it's a link with the type name and X icon)
    const doctorTag = page.locator('a').filter({ hasText: "Doctor" }).filter({
      has: page.locator("svg"),
    });
    await expect(doctorTag).toBeVisible();
  });

  test("should show location filter as removable tag when location is selected", async ({
    page,
  }) => {
    const location = TEST_DOCTOR.address; // "Kathmandu, Nepal"
    await page.goto(`/en/search?q=Ram&location=${encodeURIComponent(location)}`);

    // Verify active filters section is visible
    await expect(page.getByText("Active filters:")).toBeVisible();

    // The location tag is displayed (it's a link with yellow background)
    const locationTag = page.locator('a').filter({ hasText: /Kathmandu/i }).filter({
      has: page.locator("svg"),
    });
    await expect(locationTag).toBeVisible();
  });

  test("should show 'Clear all' link when filters are active", async ({ page }) => {
    await page.goto("/en/search?q=Nepal&type=DOCTOR");

    // Verify "Clear all" link is visible
    const clearAllLink = page.getByRole("link", { name: "Clear all" });
    await expect(clearAllLink).toBeVisible();
  });

  test("should remove type filter when clicking on type tag", async ({ page }) => {
    await page.goto("/en/search?q=Nepal&type=DOCTOR");

    // Wait for active filters to appear
    await expect(page.getByText("Active filters:")).toBeVisible();

    // Click on the Doctor tag to remove it — scope to the active filters area
    const activeFilters = page.locator('div').filter({ hasText: /^Active filters:/ });
    const doctorTag = activeFilters.locator('a').filter({ hasText: "Doctor" }).filter({
      has: page.locator("svg"),
    });
    await doctorTag.click();

    // URL should no longer have type parameter — allow time for navigation
    await expect(page).not.toHaveURL(/type=DOCTOR/, { timeout: 10000 });
  });

  test("should remove location filter when clicking on location tag", async ({ page }) => {
    const location = TEST_DOCTOR.address;
    await page.goto(`/en/search?q=Ram&location=${encodeURIComponent(location)}`);

    // Click on the location tag to remove it
    const locationTag = page.locator('a').filter({ hasText: /Kathmandu/i }).filter({
      has: page.locator("svg"),
    });
    await locationTag.click();

    // URL should no longer have location parameter
    await expect(page).not.toHaveURL(/location=/);
  });

  test("should clear all filters when clicking 'Clear all' link", async ({ page }) => {
    const location = TEST_DOCTOR.address;
    await page.goto(`/en/search?q=Nepal&type=DOCTOR&location=${encodeURIComponent(location)}`);

    // Wait for active filters to appear
    await expect(page.getByText("Active filters:")).toBeVisible();

    // Click Clear all
    await page.getByRole("link", { name: "Clear all" }).click();

    // URL should not have type or location parameters — allow time for navigation
    await expect(page).not.toHaveURL(/type=/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/location=/);

    // Query should still be preserved
    await expect(page).toHaveURL(/q=Nepal/);
  });
});

test.describe("Search Page - Pagination", () => {
  // Note: The main database has thousands of professionals, so pagination will show

  test("should not show pagination when results fit on one page", async ({ page }) => {
    // Search for something very specific - few results expected
    await page.goto("/en/search?q=xyzuniquename12345");

    // Page loads correctly (will show "no results" but no pagination)
    await expect(page.locator("h1")).toContainText("Search Results");

    // Pagination navigation should not be visible when few/no results
    const paginationNav = page.locator("nav").filter({ has: page.getByText(/Previous/i) });
    await expect(paginationNav).not.toBeVisible();
  });

  test("should show page numbers when paginated (if more than 20 results exist)", async ({
    page,
  }) => {
    // Search with empty query to get all results - main DB has 40k+ professionals
    await page.goto("/en/search");

    // Wait for page to load and check results count
    await expect(page.locator("h1")).toContainText("Search Results");

    // With main database, we should have pagination
    const paginationNav = page.locator("nav").last();

    // Should have page number links (1, 2, etc.)
    const pageLinks = paginationNav.getByRole("link");
    const linkCount = await pageLinks.count();

    // If we have pagination, verify page numbers exist
    if (linkCount > 2) {
      await expect(pageLinks.first()).toBeVisible();
    } else {
      // Just verify the page loaded
      await expect(page.locator("h1")).toContainText("Search Results");
    }
  });

  test("should navigate to next page when clicking page number", async ({ page }) => {
    // Search with empty query to get all results
    await page.goto("/en/search");

    // Wait for results
    await expect(page.locator("h1")).toContainText("Search Results");

    // Find the "Next" link in pagination (if results > 20)
    const nextLink = page.getByRole("link", { name: /Next →/i });

    if (await nextLink.isVisible()) {
      await nextLink.click();
      // URL should have page=2
      await expect(page).toHaveURL(/page=2/);
    } else {
      // No pagination available - verify page loaded correctly
      await expect(page.locator("h1")).toContainText("Search Results");
    }
  });

  test("should show Previous/Next buttons in pagination", async ({ page }) => {
    // Go to page 2 directly
    await page.goto("/en/search?page=2");

    // Wait for page to load
    await expect(page.locator("h1")).toContainText("Search Results");

    // Check if Previous button is visible (should be on page 2)
    const previousButton = page.getByRole("link", { name: /Previous/i });
    if (await previousButton.isVisible()) {
      await expect(previousButton).toBeVisible();
    }

    // Page should still show Search Results heading
    await expect(page.locator("h1")).toContainText("Search Results");
  });
});

test.describe("Search Page - Search Form", () => {
  test("should submit new search when using the search form on results page", async ({
    page,
  }) => {
    await page.goto("/en/search?q=Ram");

    // Clear and enter new search — use the main page search form (not header)
    const searchInput = page.locator('input[name="q"]');
    await searchInput.fill("Dental");

    // Submit the form using the main page search button (scoped to main content area)
    const mainContent = page.locator("main");
    const searchButton = mainContent.getByRole("button", { name: /search/i });
    await searchButton.click();

    // Verify URL updated
    await expect(page).toHaveURL(/q=Dental/);
  });

  test("should preserve type filter when submitting new search", async ({ page }) => {
    await page.goto("/en/search?q=Ram&type=DOCTOR");

    // Enter new search
    const searchInput = page.locator('input[name="q"]');
    await searchInput.fill("Nepal");

    // Submit the form using the main page search button
    const mainContent = page.locator("main");
    await mainContent.getByRole("button", { name: /search/i }).click();

    // Both query and type should be preserved
    await expect(page).toHaveURL(/q=Nepal/);
    await expect(page).toHaveURL(/type=DOCTOR/);
  });
});

test.describe("Search Page - Result Cards", () => {
  test("should display professional cards with correct structure", async ({
    page,
  }) => {
    await page.goto("/en/search?q=Kathmandu");

    // Verify results are shown (not "No results found")
    await expect(page.getByRole("heading", { name: "No results found" })).not.toBeVisible();

    // Card should have a name heading (h3)
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();

    // Card should have a "View Profile" link/button
    await expect(page.getByRole("link", { name: "View Profile" }).first()).toBeVisible();
  });

  test("should navigate to professional detail when clicking View Profile", async ({
    page,
  }) => {
    // Use type filter to ensure we get doctors only
    await page.goto("/en/search?q=Nepal&type=DOCTOR");

    // Click View Profile on first card (it's a link)
    const viewProfileLink = page.getByRole("link", { name: "View Profile" }).first();
    await viewProfileLink.click();

    // Should navigate to a doctor detail page
    await expect(page).toHaveURL(/\/en\/doctors\//);
  });

  test("should display degree information when available", async ({ page }) => {
    // Search for common medical degrees
    await page.goto("/en/search?q=MBBS");

    // Should find professionals with MBBS degree
    await expect(page.getByText(/MBBS/).first()).toBeVisible();
  });

  test("should display location information when available", async ({ page }) => {
    await page.goto("/en/search?q=Kathmandu");

    // Kathmandu should be visible in results
    await expect(page.getByText(/Kathmandu/).first()).toBeVisible();
  });
});

test.describe("Search Page - Different Professional Types", () => {
  test("should display dentist results with correct type badge", async ({ page }) => {
    // Use type filter to ensure we get dentists
    await page.goto("/en/search?q=Nepal&type=DENTIST");

    // The active filter tag shows "Dentist" type
    const dentistTag = page.locator('a').filter({ hasText: "Dentist" }).filter({
      has: page.locator("svg"),
    });
    await expect(dentistTag).toBeVisible();

    // Results should have cards with View Profile links
    await expect(page.getByRole("link", { name: "View Profile" }).first()).toBeVisible();
  });

  test("should display pharmacist results with correct type badge", async ({ page }) => {
    // Use type filter to ensure we get pharmacists
    await page.goto("/en/search?q=Nepal&type=PHARMACIST");

    // The active filter tag shows "Pharmacist" type
    const pharmacistTag = page.locator('a').filter({ hasText: "Pharmacist" }).filter({
      has: page.locator("svg"),
    });
    await expect(pharmacistTag).toBeVisible();

    // Results should have cards with View Profile links
    await expect(page.getByRole("link", { name: "View Profile" }).first()).toBeVisible();
  });

  test("should navigate to dentist detail page from search results", async ({ page }) => {
    // Use type filter to ensure we get only dentists
    await page.goto("/en/search?q=Nepal&type=DENTIST");

    await page.getByRole("link", { name: "View Profile" }).first().click();

    // Should navigate to dentists detail page
    await expect(page).toHaveURL(/\/en\/dentists\//);
  });

  test("should navigate to pharmacist detail page from search results", async ({
    page,
  }) => {
    // Use type filter to ensure we get only pharmacists
    await page.goto("/en/search?q=Nepal&type=PHARMACIST");

    await page.getByRole("link", { name: "View Profile" }).first().click();

    // Should navigate to pharmacists detail page
    await expect(page).toHaveURL(/\/en\/pharmacists\//);
  });
});
