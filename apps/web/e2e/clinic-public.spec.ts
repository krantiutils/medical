/**
 * Clinic Public Page E2E Tests
 *
 * Tests for US-075: Verify clinic public page works correctly end-to-end
 */

import { test, expect, TEST_DATA, assertMetaTags, assertJsonLd } from "./fixtures/test-utils";
import { SEED_DATA } from "./fixtures/seed";

// Test data constants based on seeded data
const TEST_CLINIC = SEED_DATA.CLINICS[3]; // Dashboard Test Clinic - verified with doctors
const TEST_PHARMACY = SEED_DATA.CLINICS[2]; // Test Pharmacy - verified
const TEST_CLINIC_UNVERIFIED = SEED_DATA.CLINICS[0]; // Test Clinic One - not verified

test.describe("Clinic Public Page - Basic Functionality", () => {
  test("should load clinic page with correct name", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify the page loads with the clinic's name in h1
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_CLINIC.name);
  });

  test("should display clinic type badge", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify type badge is displayed (POLYCLINIC)
    await expect(page.getByText("Polyclinic")).toBeVisible();
  });

  test("should display address", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify address is displayed
    await expect(page.getByText(TEST_CLINIC.address)).toBeVisible();
  });

  test("should display verified badge", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verified badge should be visible in the main content
    const mainContent = page.locator("main");
    await expect(mainContent.getByText("Verified", { exact: true })).toBeVisible();
  });

  test("should display phone number with clickable link", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify phone number is displayed and clickable
    const phoneLink = page.getByRole("link", { name: TEST_CLINIC.phone });
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toHaveAttribute("href", `tel:${TEST_CLINIC.phone}`);
  });

  test("should display email with clickable link", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify email is displayed and clickable
    const emailLink = page.getByRole("link", { name: TEST_CLINIC.email });
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute("href", `mailto:${TEST_CLINIC.email}`);
  });

  test("should display website link", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify website link is displayed
    await expect(page.getByRole("link", { name: /Visit Website/i })).toBeVisible();
  });
});

test.describe("Clinic Public Page - Contact Information", () => {
  test("should display contact information section", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify contact information heading
    await expect(page.getByRole("heading", { name: /Contact Information/i })).toBeVisible();
  });

  test("should display phone label", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify phone label
    await expect(page.getByText("Phone", { exact: true })).toBeVisible();
  });

  test("should display email label", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify email label
    await expect(page.getByText("Email", { exact: true })).toBeVisible();
  });
});

test.describe("Clinic Public Page - Operating Hours", () => {
  test("should display operating hours section", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify operating hours heading
    await expect(page.getByRole("heading", { name: /Operating Hours/i })).toBeVisible();
  });

  test("should display all days of the week", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (const day of days) {
      await expect(page.getByText(day, { exact: true }).first()).toBeVisible();
    }
  });

  test("should show closed status for Sunday", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Sunday should show as Closed based on seed data
    // Find the row containing Sunday and check for Closed text
    const operatingHoursSection = page.getByRole("heading", { name: /Operating Hours/i }).locator("..");
    const sundayText = operatingHoursSection.getByText("Sunday", { exact: true });
    await expect(sundayText).toBeVisible();
    // The closed text should be in the same parent row
    await expect(operatingHoursSection.getByText("Closed")).toBeVisible();
  });

  test("should show open times for weekdays", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Monday should show 09:00 - 17:00 based on seed data
    const mondayRow = page.locator("div").filter({ hasText: /^Monday/ }).first();
    await expect(mondayRow).toContainText("09:00");
    await expect(mondayRow).toContainText("17:00");
  });
});

test.describe("Clinic Public Page - Services", () => {
  test("should display services section", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify services heading
    await expect(page.getByRole("heading", { name: /Services Offered/i })).toBeVisible();
  });

  test("should display service tags", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Services are stored as service IDs (general, specialist, lab)
    // They should be displayed with their labels
    await expect(page.getByText("General Consultation", { exact: true })).toBeVisible();
    await expect(page.getByText("Specialist Consultation", { exact: true })).toBeVisible();
    await expect(page.getByText("Lab Tests", { exact: true })).toBeVisible();
  });
});

test.describe("Clinic Public Page - Doctors List", () => {
  test("should display medical team section", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify medical team heading
    await expect(page.getByRole("heading", { name: /Our Medical Team/i })).toBeVisible();
  });

  test("should display affiliated doctors", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Dashboard Test Clinic should have Dr. Ram Sharma and Dr. Sita Thapa affiliated
    await expect(page.getByRole("heading", { name: /Dr\. Ram Sharma/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Dr\. Sita Thapa/i }).first()).toBeVisible();
  });

  test("should display doctor type badges", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Doctor type badges should be visible
    const doctorBadges = page.getByText("Doctor", { exact: true });
    await expect(doctorBadges.first()).toBeVisible();
  });

  test("should display View Profile links", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Wait for clinic content to render (not a 404 page)
    await expect(page.getByRole("heading", { level: 1 })).toContainText(TEST_CLINIC.name, { timeout: 15000 });

    // View Profile links should be visible
    const viewProfileLinks = page.getByText("View Profile", { exact: true });
    await expect(viewProfileLinks.first()).toBeVisible();
  });

  test("should navigate to doctor profile when clicking doctor card", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Wait for clinic content to render (not a 404 page)
    await expect(page.getByRole("heading", { level: 1 })).toContainText(TEST_CLINIC.name, { timeout: 15000 });

    // Click on the "View Profile" link for Dr. Ram Sharma
    const viewProfileLink = page.getByRole("link", { name: /View Profile/i }).first();
    await viewProfileLink.click();

    // Should navigate to doctor detail page (allow extra time for compilation)
    await expect(page).toHaveURL(/\/en\/doctors\/dr-ram-sharma-12345/, { timeout: 15000 });
  });
});

test.describe("Clinic Public Page - 404 Handling", () => {
  test("should return 404 for non-existent clinic", async ({ page }) => {
    const response = await page.goto("/en/clinic/non-existent-clinic-xyz");

    // Should return 404 status
    expect(response?.status()).toBe(404);
  });

  test("should return 404 for unverified clinic", async ({ page }) => {
    // Test Clinic One is unverified
    const response = await page.goto(`/en/clinic/${TEST_CLINIC_UNVERIFIED.slug}`);

    // Should return 404 status for unverified clinics
    expect(response?.status()).toBe(404);
  });

  test("should display 404 page content for invalid clinic", async ({ page }) => {
    await page.goto("/en/clinic/non-existent-clinic-xyz");

    // 404 page should be displayed
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});

test.describe("Clinic Public Page - SEO Meta Tags", () => {
  test("should have correct page title", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Title should include clinic name and type
    await assertMetaTags(page, {
      title: new RegExp(`${TEST_CLINIC.name}.*Polyclinic`, "i"),
    });
  });

  test("should have meta description", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Description should mention the clinic name
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute("content");
    expect(content).toContain(TEST_CLINIC.name);
  });

  test("should have OpenGraph title", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    const ogTitle = page.locator('meta[property="og:title"]');
    const content = await ogTitle.getAttribute("content");
    expect(content).toContain(TEST_CLINIC.name);
  });

  test("should have OpenGraph description", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveAttribute("content", /.+/);
  });

  test("should have canonical URL", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    const canonical = page.locator('link[rel="canonical"]');
    const href = await canonical.getAttribute("href");
    expect(href).toContain(`/en/clinic/${TEST_CLINIC.slug}`);
  });
});

test.describe("Clinic Public Page - JSON-LD Structured Data", () => {
  test("should have JSON-LD script", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Script elements are hidden, so check textContent instead of visibility
    const jsonLdScript = page.locator('script[type="application/ld+json"]').first();
    const content = await jsonLdScript.textContent();
    expect(content).not.toBeNull();
    expect(content).toContain("@context");
  });

  test("should have correct schema type for polyclinic", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Polyclinic should use MedicalClinic schema
    const data = await assertJsonLd(page, "MedicalClinic");
    expect(data.name).toBe(TEST_CLINIC.name);
  });

  test("should have correct schema type for pharmacy", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_PHARMACY.slug}`);

    // Pharmacy should use Pharmacy schema
    const data = await assertJsonLd(page, "Pharmacy");
    expect(data.name).toBe(TEST_PHARMACY.name);
  });

  test("should include address in JSON-LD", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    const data = await assertJsonLd(page, "MedicalClinic");
    expect(data.address).toBeDefined();
    expect((data.address as { streetAddress?: string }).streetAddress).toBe(TEST_CLINIC.address);
  });

  test("should include telephone in JSON-LD", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    const data = await assertJsonLd(page, "MedicalClinic");
    expect(data.telephone).toBe(TEST_CLINIC.phone);
  });

  test("should include opening hours in JSON-LD", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    const data = await assertJsonLd(page, "MedicalClinic");
    expect(data.openingHours).toBeDefined();
    expect(Array.isArray(data.openingHours)).toBe(true);
  });
});

test.describe("Clinic Public Page - Different Clinic Types", () => {
  test("should display Hospital type correctly", async ({ page }) => {
    // Test Hospital is unverified, so we skip this test
    // In a real scenario, we would have a verified hospital
    test.skip(true, "No verified hospital in seed data");
  });

  test("should display Pharmacy type correctly", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_PHARMACY.slug}`);

    // Verify pharmacy type badge
    await expect(page.getByText("Pharmacy", { exact: true }).first()).toBeVisible();

    // Verify clinic name
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_PHARMACY.name);
  });

  test("should display Polyclinic type correctly", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Verify polyclinic type badge
    await expect(page.getByText("Polyclinic", { exact: true })).toBeVisible();
  });
});

test.describe("Clinic Public Page - Language Support", () => {
  test("should load page in Nepali", async ({ page }) => {
    await page.goto(`/ne/clinic/${TEST_CLINIC.slug}`);

    // Page should load with clinic name
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_CLINIC.name);
  });

  test("should display Nepali operating hours labels", async ({ page }) => {
    await page.goto(`/ne/clinic/${TEST_CLINIC.slug}`);

    // Should show Nepali day names
    await expect(page.getByText("आइतबार", { exact: true }).first()).toBeVisible(); // Sunday
    await expect(page.getByText("सोमबार", { exact: true }).first()).toBeVisible(); // Monday
  });

  test("should display Nepali section headings", async ({ page }) => {
    await page.goto(`/ne/clinic/${TEST_CLINIC.slug}`);

    // Should show Nepali section headings
    await expect(page.getByRole("heading", { name: /सम्पर्क जानकारी/i })).toBeVisible(); // Contact Information
    await expect(page.getByRole("heading", { name: /खुल्ने समय/i })).toBeVisible(); // Operating Hours
  });

  test("should have correct language alternates", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Check for language alternate links
    const enAlternate = page.locator('link[hreflang="en"]');
    const neAlternate = page.locator('link[hreflang="ne"]');

    await expect(enAlternate).toHaveAttribute("href", new RegExp(`/en/clinic/${TEST_CLINIC.slug}`));
    await expect(neAlternate).toHaveAttribute("href", new RegExp(`/ne/clinic/${TEST_CLINIC.slug}`));
  });
});

test.describe("Clinic Public Page - Photo Gallery", () => {
  // Note: Dashboard Test Clinic doesn't have photos in seed data
  // These tests would pass if photos were added

  test("should not show photo gallery section when no photos", async ({ page }) => {
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Photo gallery heading should not be visible if no photos
    const photoGalleryHeading = page.getByRole("heading", { name: /Photo Gallery/i });
    await expect(photoGalleryHeading).not.toBeVisible();
  });
});

test.describe("Clinic Public Page - Responsive Design", () => {
  test("should display correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Clinic name should still be visible
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_CLINIC.name);
  });

  test("should display correctly on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`/en/clinic/${TEST_CLINIC.slug}`);

    // Clinic name should still be visible
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(TEST_CLINIC.name);
  });
});
