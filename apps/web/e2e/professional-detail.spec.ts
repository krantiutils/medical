/**
 * Professional Detail Pages E2E Tests
 *
 * Tests for US-039: Verify professional profile pages work correctly end-to-end
 */

import { test, expect, TEST_DATA, assertMetaTags, assertJsonLd } from "./fixtures/test-utils";
import { SEED_DATA } from "./fixtures/seed";

// Test data constants based on seeded data
const TEST_DOCTOR = SEED_DATA.DOCTORS[0]; // Dr. Ram Sharma - verified
const TEST_DOCTOR_UNVERIFIED = SEED_DATA.DOCTORS[2]; // Dr. Hari Prasad - not verified
const TEST_DOCTOR_UNCLAIMED = SEED_DATA.DOCTORS[3]; // Dr. Unclaimed Doctor - unclaimed
const TEST_VERIFIED_DOCTOR = SEED_DATA.DOCTORS[4]; // Dr. Verified Doctor - verified
const TEST_DENTIST = SEED_DATA.DENTISTS[0]; // Dr. Dental One - verified
const TEST_DENTIST_UNVERIFIED = SEED_DATA.DENTISTS[1]; // Dr. Dental Two - not verified
const TEST_PHARMACIST = SEED_DATA.PHARMACISTS[0]; // Pharmacist One - verified
const TEST_PHARMACIST_UNVERIFIED = SEED_DATA.PHARMACISTS[1]; // Pharmacist Two - not verified

test.describe("Doctor Detail Page - Basic Functionality", () => {
  test("should load doctor page with correct name and details", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Verify the page loads with the doctor's name in h1
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_DOCTOR.full_name);

    // Verify "Dr." prefix is displayed
    await expect(heading).toContainText("Dr.");
  });

  test("should display registration number", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Verify registration number is displayed
    await expect(page.getByText(`NMC Registration No: ${TEST_DOCTOR.registration_number}`)).toBeVisible();
  });

  test("should display degree/qualifications", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Verify degree is displayed
    await expect(page.getByText(TEST_DOCTOR.degree)).toBeVisible();
  });

  test("should display address", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Verify address is displayed under the Address section
    const addressSection = page.locator("dt").filter({ hasText: "Address" });
    await expect(addressSection).toBeVisible();

    // Verify the actual address value
    await expect(page.getByText(TEST_DOCTOR.address)).toBeVisible();
  });

  test("should display specialties in the details section", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Find the specialties section and verify the specialties within it
    const specialtiesSection = page.locator("dt").filter({ hasText: "Specialties" });
    await expect(specialtiesSection).toBeVisible();

    // Verify the specialties are displayed in the definition (dd) following the term
    const specialtiesList = page.locator("dt").filter({ hasText: "Specialties" }).locator("~ dd");
    for (const specialty of TEST_DOCTOR.specialties) {
      await expect(specialtiesList.getByText(specialty)).toBeVisible();
    }
  });
});

test.describe("Doctor Detail Page - Verified Badge", () => {
  test("should show verified badge for verified professionals", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_VERIFIED_DOCTOR.slug}`);

    // Verified badge should be visible - it's in a styled container with an icon
    // The badge contains "Verified" text in the main content area (not footer)
    const mainContent = page.locator("main");
    await expect(mainContent.getByText("Verified", { exact: true })).toBeVisible();
  });

  test("should NOT show verified badge for unverified professionals", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR_UNVERIFIED.slug}`);

    // Verified badge should NOT be visible in the main content
    const mainContent = page.locator("main");
    await expect(mainContent.getByText("Verified", { exact: true })).not.toBeVisible();
  });
});

test.describe("Doctor Detail Page - Claim Profile Button", () => {
  test("should show 'Login to Claim' button for unclaimed profiles when not logged in", async ({
    page,
  }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR_UNCLAIMED.slug}`);

    // Login to claim button should be visible for unclaimed profiles
    await expect(page.getByRole("link", { name: /Login to Claim/i })).toBeVisible();
    await expect(page.getByText(/Login to claim this profile/i)).toBeVisible();
  });

  test("should have claim UI with correct login callback URL for unclaimed profiles", async ({
    page,
  }) => {
    // Navigate to the unclaimed doctor's page
    await page.goto(`/en/doctors/${TEST_DOCTOR_UNCLAIMED.slug}`);

    // When not logged in, "Login to Claim" button should be visible
    const loginButton = page.getByRole("link", { name: /Login to Claim/i });
    await expect(loginButton).toBeVisible();

    // The login link should have the correct callback URL for claiming
    // This ensures that after login, the user is redirected to the claim page
    const href = await loginButton.getAttribute("href");
    expect(href).toContain("/login");
    expect(href).toContain("callbackUrl");
    expect(href).toContain(TEST_DOCTOR_UNCLAIMED.registration_number);

    // Note: Full "Claim This Profile" test when logged in is covered in US-043 (claim-profile.spec.ts)
    // which tests the authenticated claim flow end-to-end
  });

  test("should NOT show claim button for already claimed profiles", async ({ page }) => {
    // Dr. Verified Doctor (88888) is claimed by the professional user in seed data
    await page.goto(`/en/doctors/${TEST_VERIFIED_DOCTOR.slug}`);

    // Neither "Login to Claim" nor "Claim This Profile" should be visible
    await expect(page.getByRole("link", { name: /Login to Claim/i })).not.toBeVisible();
    await expect(page.getByRole("link", { name: /Claim This Profile/i })).not.toBeVisible();
  });
});

test.describe("Doctor Detail Page - 404 Error", () => {
  test("should return 404 for invalid slug", async ({ page }) => {
    const response = await page.goto("/en/doctors/invalid-doctor-slug-12345");

    // Page should show 404 content or have 404 status
    // Next.js notFound() returns 404 status
    expect(response?.status()).toBe(404);
  });

  test("should show 404 page content for invalid slug", async ({ page }) => {
    await page.goto("/en/doctors/invalid-doctor-slug-xyz987");

    // The page should show some form of "not found" message
    // Either the status or the heading indicates not found
    const notFoundHeading = page.getByRole("heading", { name: /not found/i });
    const is404 = await notFoundHeading.isVisible().catch(() => false);

    // If no heading, check for status code
    if (!is404) {
      const response = await page.goto("/en/doctors/invalid-doctor-slug-xyz987");
      expect(response?.status()).toBe(404);
    }
  });
});

test.describe("Doctor Detail Page - SEO", () => {
  test("should have JSON-LD script present in page source", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Check JSON-LD script is present
    const jsonLdData = await assertJsonLd(page, "Physician");

    // Verify JSON-LD contains doctor's name
    expect(jsonLdData.name).toContain(TEST_DOCTOR.full_name);
  });

  test("should have meta title containing doctor name", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Verify title contains doctor's name
    await assertMetaTags(page, {
      title: new RegExp(TEST_DOCTOR.full_name),
    });
  });

  test("should have meta description containing relevant info", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Verify description exists and contains doctor info
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute("content");

    expect(content).toContain(TEST_DOCTOR.full_name);
    expect(content).toContain(TEST_DOCTOR.registration_number);
  });

  test("should have Open Graph meta tags", async ({ page }) => {
    await page.goto(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Check OG title
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toBeAttached();

    const ogTitleContent = await ogTitle.getAttribute("content");
    expect(ogTitleContent).toContain(TEST_DOCTOR.full_name);
  });
});

test.describe("Dentist Detail Page", () => {
  test("should load dentist page with correct name and details", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST.slug}`);

    // Verify the page loads with the dentist's name in h1
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_DENTIST.full_name);
    await expect(heading).toContainText("Dr.");
  });

  test("should display dentist registration number", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST.slug}`);

    // Verify registration number is displayed (dentists use NMC too)
    await expect(page.getByText(`NMC Registration No: ${TEST_DENTIST.registration_number}`)).toBeVisible();
  });

  test("should display verified badge for verified dentist", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST.slug}`);

    // Verified badge should be visible in main content
    const mainContent = page.locator("main");
    await expect(mainContent.getByText("Verified", { exact: true })).toBeVisible();
  });

  test("should NOT show verified badge for unverified dentist", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST_UNVERIFIED.slug}`);

    // Verified badge should NOT be visible in main content
    const mainContent = page.locator("main");
    await expect(mainContent.getByText("Verified", { exact: true })).not.toBeVisible();
  });

  test("should have JSON-LD with Dentist type", async ({ page }) => {
    await page.goto(`/en/dentists/${TEST_DENTIST.slug}`);

    // Check JSON-LD script is present with Dentist type
    const jsonLdData = await assertJsonLd(page, "Dentist");
    expect(jsonLdData.name).toContain(TEST_DENTIST.full_name);
  });

  test("should return 404 for invalid dentist slug", async ({ page }) => {
    const response = await page.goto("/en/dentists/invalid-dentist-slug-xyz");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Pharmacist Detail Page", () => {
  test("should load pharmacist page with correct name", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    // Verify the page loads with the pharmacist's name in h1
    // Note: Pharmacists don't have "Dr." prefix
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_PHARMACIST.full_name);
  });

  test("should display pharmacist registration number", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    // Verify registration number is displayed (pharmacists use NPC)
    await expect(page.getByText(`NPC Registration No: ${TEST_PHARMACIST.registration_number}`)).toBeVisible();
  });

  test("should display pharmacist category", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    // Category section should be visible
    const categorySection = page.locator("dt").filter({ hasText: "Category" });
    await expect(categorySection).toBeVisible();
  });

  test("should display pharmacist address when available", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    // Location section should be visible
    const locationSection = page.locator("dt").filter({ hasText: "Location" });
    await expect(locationSection).toBeVisible();

    // Verify the actual address value
    await expect(page.getByText(TEST_PHARMACIST.address)).toBeVisible();
  });

  test("should display verified badge for verified pharmacist", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    // Verified badge should be visible in main content
    const mainContent = page.locator("main");
    await expect(mainContent.getByText("Verified", { exact: true })).toBeVisible();
  });

  test("should NOT show verified badge for unverified pharmacist", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST_UNVERIFIED.slug}`);

    // Verified badge should NOT be visible in main content
    const mainContent = page.locator("main");
    await expect(mainContent.getByText("Verified", { exact: true })).not.toBeVisible();
  });

  test("should have JSON-LD with Person type for pharmacist", async ({ page }) => {
    await page.goto(`/en/pharmacists/${TEST_PHARMACIST.slug}`);

    // Check JSON-LD script is present with Person type (pharmacists use Person schema)
    const jsonLdData = await assertJsonLd(page, "Person");
    expect(jsonLdData.name).toBe(TEST_PHARMACIST.full_name);
  });

  test("should return 404 for invalid pharmacist slug", async ({ page }) => {
    const response = await page.goto("/en/pharmacists/invalid-pharmacist-slug-xyz");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Professional Detail Pages - Cross-type Navigation", () => {
  test("should navigate from search to doctor detail page", async ({ page }) => {
    // Search for the test doctor
    await page.goto(`/en/search?q=${encodeURIComponent(TEST_DOCTOR.full_name)}&type=DOCTOR`);

    // Click on View Profile
    await page.getByRole("link", { name: "View Profile" }).first().click();

    // Should be on a doctor detail page
    await expect(page).toHaveURL(/\/en\/doctors\//);

    // Page should show doctor info
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Dr.");
  });

  test("should navigate from search to dentist detail page", async ({ page }) => {
    // Search for the test dentist
    await page.goto(`/en/search?q=${encodeURIComponent(TEST_DENTIST.full_name)}&type=DENTIST`);

    // Click on View Profile
    await page.getByRole("link", { name: "View Profile" }).first().click();

    // Should be on a dentist detail page
    await expect(page).toHaveURL(/\/en\/dentists\//);
  });

  test("should navigate from search to pharmacist detail page", async ({ page }) => {
    // Search for the test pharmacist
    await page.goto(`/en/search?q=${encodeURIComponent(TEST_PHARMACIST.full_name)}&type=PHARMACIST`);

    // Click on View Profile
    await page.getByRole("link", { name: "View Profile" }).first().click();

    // Should be on a pharmacist detail page
    await expect(page).toHaveURL(/\/en\/pharmacists\//);
  });
});

test.describe("Professional Detail Pages - Language Support", () => {
  test("should load doctor page in Nepali", async ({ page }) => {
    await page.goto(`/ne/doctors/${TEST_DOCTOR.slug}`);

    // Page should load and show doctor name
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_DOCTOR.full_name);

    // URL should be in Nepali
    expect(page.url()).toContain("/ne/doctors/");
  });

  test("should load dentist page in Nepali", async ({ page }) => {
    await page.goto(`/ne/dentists/${TEST_DENTIST.slug}`);

    // Page should load
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_DENTIST.full_name);
  });

  test("should load pharmacist page in Nepali", async ({ page }) => {
    await page.goto(`/ne/pharmacists/${TEST_PHARMACIST.slug}`);

    // Page should load
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_PHARMACIST.full_name);
  });
});

test.describe("Legacy Route Redirect", () => {
  test("should redirect /doctor/[slug] to /doctors/[slug] for doctors", async ({ page }) => {
    // Navigate to the legacy route
    const response = await page.goto(`/en/doctor/${TEST_DOCTOR.slug}`);

    // Should have redirected to the new route
    await expect(page).toHaveURL(`/en/doctors/${TEST_DOCTOR.slug}`);

    // Page should load correctly
    await expect(page.getByRole("heading", { level: 1 })).toContainText(TEST_DOCTOR.full_name);
  });
});
