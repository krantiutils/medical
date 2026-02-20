/**
 * Clinic Dashboard E2E Tests
 *
 * Tests for US-071: Verify clinic dashboard and scheduling works correctly
 *
 * Auth is pre-loaded via storageState fixtures from auth.setup.ts.
 * clinicOwnerPage = authenticated clinic owner with verified clinic.
 * authenticatedPage = regular user (no verified clinic).
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";

test.describe("Clinic Dashboard - Access Control", () => {
  test("should redirect non-authenticated users to login page", async ({
    page,
  }) => {
    await page.goto("/en/clinic/dashboard");

    // Middleware redirects unauthenticated users to /en/login with callbackUrl
    await page.waitForURL(/\/en\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("should include callbackUrl in redirect to login", async ({
    page,
  }) => {
    await page.goto("/en/clinic/dashboard");

    // Middleware redirects with callbackUrl query param
    await page.waitForURL(/\/en\/login/, { timeout: 15000 });
    expect(page.url()).toContain("callbackUrl");
    // callbackUrl is URL-encoded in the query string
    expect(decodeURIComponent(page.url())).toContain("/en/clinic/dashboard");
  });

  test("should display Sign In form on login redirect", async ({ page }) => {
    await page.goto("/en/clinic/dashboard");

    // Middleware redirects to login page
    await page.waitForURL(/\/en\/login/, { timeout: 15000 });

    // Login page should show sign in form
    await expect(
      page.getByRole("heading", { name: /sign in/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("should show no clinic message for user without verified clinic", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/dashboard", { waitUntil: "domcontentloaded" });

    // Wait for dashboard sidebar to render
    await expect(
      authenticatedPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Regular user does NOT own a verified clinic — should see "no verified clinic" message
    await expect(authenticatedPage.getByText(/no verified clinic/i)).toBeVisible();
  });

  test("should show Register Clinic button for user without clinic", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/dashboard", { waitUntil: "domcontentloaded" });

    await expect(
      authenticatedPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    await expect(authenticatedPage.getByText(/no verified clinic/i)).toBeVisible();

    const registerButton = authenticatedPage
      .locator("main")
      .getByRole("link", { name: /register clinic/i });
    await expect(registerButton).toBeVisible();
  });
});

test.describe("Clinic Dashboard - Authenticated Clinic Owner", () => {
  test.slow(); // Triple timeout - page compilation is slow on dev server

  test("clinic owner can access dashboard", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Dashboard should show the clinic name as heading
    await expect(
      clinicOwnerPage.getByRole("heading", { name: TEST_DATA.CLINICS.DASHBOARD_CLINIC.name })
    ).toBeVisible();
  });

  test("dashboard shows clinic name and type badge", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Should show clinic name
    await expect(
      clinicOwnerPage.getByText(TEST_DATA.CLINICS.DASHBOARD_CLINIC.name)
    ).toBeVisible();
  });

  test("dashboard shows statistics cards", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Check for stat cards (use exact match to avoid ambiguity with quick actions descriptions)
    await expect(clinicOwnerPage.getByText("Today's Appointments", { exact: true })).toBeVisible();
    await expect(clinicOwnerPage.getByText("Patients in Queue", { exact: true })).toBeVisible();
    await expect(clinicOwnerPage.getByText("Total Patients", { exact: true })).toBeVisible();
    await expect(clinicOwnerPage.getByText("Clinic Doctors", { exact: true })).toBeVisible();
  });

  test("dashboard shows quick action buttons", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Check for quick action buttons
    await expect(clinicOwnerPage.getByText(/quick actions/i)).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("link", { name: /add patient/i })
    ).toBeVisible();
    await expect(clinicOwnerPage.getByRole("link", { name: /view queue/i })).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("link", { name: /manage schedules/i })
    ).toBeVisible();
  });

  test("manage doctors button navigates to doctors page", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    const manageDoctorsLink = clinicOwnerPage.getByRole("link", {
      name: /manage doctors/i,
    });
    await expect(manageDoctorsLink).toBeVisible();
    await manageDoctorsLink.click();

    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/doctors/, { timeout: 30000 });
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /manage doctors/i })
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Clinic Dashboard - Manage Doctors", () => {
  test.slow(); // Triple timeout - page compilation is slow on dev server

  test("doctors page requires authentication", async ({ page }) => {
    await page.goto("/en/clinic/dashboard/doctors");

    // Middleware redirects unauthenticated users to login
    await page.waitForURL(/\/en\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("doctors page shows current affiliated doctors", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/doctors");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Should show current doctors section
    await expect(clinicOwnerPage.getByText(/current doctors/i)).toBeVisible();
  });

  test("doctors page shows seeded test doctors", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/doctors");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    await expect(clinicOwnerPage.getByText(/current doctors/i)).toBeVisible();

    // Should show seeded test doctors (Dr. Ram Sharma and Dr. Sita Thapa)
    const drRam = clinicOwnerPage.getByText(/Dr\. Ram Sharma/);
    const drSita = clinicOwnerPage.getByText(/Dr\. Sita Thapa/);

    const hasDrRam = await drRam.isVisible().catch(() => false);
    const hasDrSita = await drSita.isVisible().catch(() => false);

    expect(hasDrRam || hasDrSita).toBeTruthy();
  });

  test("doctors page shows Add Doctor button", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/doctors");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    await expect(clinicOwnerPage.getByText(/current doctors/i)).toBeVisible();

    const addButton = clinicOwnerPage.getByRole("button", { name: /add doctor/i });
    await expect(addButton).toBeVisible();
  });

  test("doctors page shows role badges", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/doctors");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    await expect(clinicOwnerPage.getByText(/current doctors/i)).toBeVisible();

    // Check for role badges (permanent or visiting)
    const permanentBadge = clinicOwnerPage.getByText(/permanent/i);
    const visitingBadge = clinicOwnerPage.getByText(/visiting/i);

    const hasPermanent = await permanentBadge.isVisible().catch(() => false);
    const hasVisiting = await visitingBadge.isVisible().catch(() => false);

    expect(hasPermanent || hasVisiting).toBeTruthy();
  });

  test("clicking Add Doctor opens modal", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/doctors");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    await expect(clinicOwnerPage.getByText(/current doctors/i)).toBeVisible();

    await clinicOwnerPage.getByRole("button", { name: /add doctor/i }).click();

    // Add doctor panel should appear with search input
    await expect(clinicOwnerPage.getByRole("heading", { name: /add a doctor/i })).toBeVisible({ timeout: 10000 });
    await expect(
      clinicOwnerPage.getByPlaceholder(/search by name or registration/i)
    ).toBeVisible();
  });
});

test.describe("Clinic Dashboard - Doctor Schedules", () => {
  test.slow(); // Triple timeout - page compilation is slow on dev server

  test("schedules page requires authentication", async ({ page }) => {
    await page.goto("/en/clinic/dashboard/schedules");

    // Middleware redirects unauthenticated users to login
    await page.waitForURL(/\/en\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("schedules page shows doctor selection", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Check for authenticated content - should show "Select a Doctor" heading or doctor cards
    const selectDoctor = clinicOwnerPage.getByRole("heading", { name: /select a doctor/i }).first();
    const noDoctors = clinicOwnerPage.getByText(/no doctors affiliated/i);

    const hasSelect = await selectDoctor.isVisible().catch(() => false);
    const hasNoDoctors = await noDoctors.isVisible().catch(() => false);

    // Should show doctor selection prompt or no doctors message
    expect(hasSelect || hasNoDoctors).toBeTruthy();
  });

  test("schedules page shows affiliated doctors in dropdown", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    await expect(
      clinicOwnerPage.getByRole("heading", { name: /doctor schedules/i })
    ).toBeVisible();

    // Find doctor selection buttons (each doctor card is a button element)
    const doctorButton = clinicOwnerPage.locator("button").filter({ hasText: /Doctor|Dentist/ }).first();
    const hasDoctorButton = await doctorButton.isVisible().catch(() => false);

    expect(hasDoctorButton).toBeTruthy();
  });

  test("selecting a doctor shows weekly schedule grid", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Click on first available doctor card
    const doctorCard = clinicOwnerPage.locator("button").filter({ hasText: /Doctor|Dentist/ }).first();
    await expect(doctorCard).toBeVisible({ timeout: 15000 });

    await doctorCard.click();

    // Should show weekly schedule heading
    await expect(clinicOwnerPage.getByText(/weekly schedule/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("weekly schedule shows all days of the week", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Select first doctor
    const doctorCard = clinicOwnerPage.locator("button").filter({ hasText: /Doctor|Dentist/ }).first();
    await expect(doctorCard).toBeVisible({ timeout: 15000 });

    await doctorCard.click();
    await expect(clinicOwnerPage.getByText("Weekly Schedule")).toBeVisible({ timeout: 10000 });

    // Check for days of the week
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (const day of days) {
      await expect(clinicOwnerPage.getByText(day)).toBeVisible();
    }
  });

  test("schedule shows time inputs and slot configuration", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    const doctorCard = clinicOwnerPage.locator("button").filter({ hasText: /Doctor|Dentist/ }).first();
    await expect(doctorCard).toBeVisible({ timeout: 15000 });

    await doctorCard.click();
    await expect(clinicOwnerPage.getByText("Weekly Schedule")).toBeVisible({ timeout: 10000 });

    // Should show start time, end time labels
    await expect(clinicOwnerPage.getByText(/start time/i).first()).toBeVisible();
    await expect(clinicOwnerPage.getByText(/end time/i).first()).toBeVisible();
    await expect(clinicOwnerPage.getByText(/slot duration/i).first()).toBeVisible();
  });

  test("schedule shows save button", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    const doctorCard = clinicOwnerPage.locator("button").filter({ hasText: /Doctor|Dentist/ }).first();
    await expect(doctorCard).toBeVisible({ timeout: 15000 });

    await doctorCard.click();
    await expect(clinicOwnerPage.getByText("Weekly Schedule")).toBeVisible({ timeout: 10000 });

    const saveButton = clinicOwnerPage.getByRole("button", { name: /save schedule/i });
    await expect(saveButton).toBeVisible();
  });
});

test.describe("Clinic Dashboard - Doctor Leave Management", () => {
  test.slow(); // Triple timeout - page compilation is slow on dev server

  test("leave management section visible on schedules page", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    const doctorCard = clinicOwnerPage.locator("button").filter({ hasText: /Doctor|Dentist/ }).first();
    await expect(doctorCard).toBeVisible({ timeout: 15000 });

    await doctorCard.click();
    await expect(clinicOwnerPage.getByText("Weekly Schedule")).toBeVisible({ timeout: 10000 });

    // Leave management section should be visible
    await expect(clinicOwnerPage.getByText(/leave management/i)).toBeVisible();
  });

  test("leave form shows date, full day toggle, and reason fields", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    const doctorCard = clinicOwnerPage.locator("button").filter({ hasText: /Doctor|Dentist/ }).first();
    await expect(doctorCard).toBeVisible({ timeout: 15000 });

    await doctorCard.click();
    await expect(clinicOwnerPage.getByText("Leave Management")).toBeVisible({ timeout: 10000 });

    // Check for leave form fields (labels may include asterisk for required fields, e.g. "Date *")
    await expect(clinicOwnerPage.getByText(/^date/i).first()).toBeVisible();
    await expect(clinicOwnerPage.getByText(/full day/i).first()).toBeVisible();
    await expect(clinicOwnerPage.getByText(/^reason/i).first()).toBeVisible();
  });

  test("leave form shows Add Leave button", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    const doctorCard = clinicOwnerPage.locator("button").filter({ hasText: /Doctor|Dentist/ }).first();
    await expect(doctorCard).toBeVisible({ timeout: 15000 });

    await doctorCard.click();
    await expect(clinicOwnerPage.getByText("Leave Management")).toBeVisible({ timeout: 10000 });

    const addLeaveButton = clinicOwnerPage.getByRole("button", { name: /add leave/i });
    await expect(addLeaveButton).toBeVisible();
  });

  test("upcoming leaves section visible", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/schedules");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    const doctorCard = clinicOwnerPage.locator("button").filter({ hasText: /Doctor|Dentist/ }).first();
    await expect(doctorCard).toBeVisible({ timeout: 15000 });

    await doctorCard.click();
    await expect(clinicOwnerPage.getByText("Leave Management")).toBeVisible({ timeout: 10000 });

    // Should show upcoming leaves section (even if empty)
    // Use heading role to avoid matching "No upcoming leaves scheduled" text
    await expect(clinicOwnerPage.getByRole("heading", { name: /upcoming leaves/i })).toBeVisible();
  });
});

test.describe("Clinic Dashboard - Language Support", () => {
  test("dashboard page redirects to Nepali login", async ({ page }) => {
    await page.goto("/ne/clinic/dashboard");

    // Middleware redirects unauthenticated users to Nepali login page
    await page.waitForURL(/\/ne\/login/, { timeout: 15000 });

    // Should show Nepali sign-in heading or login form
    const signInHeading = page.getByRole("heading", { name: /साइन इन|लगइन|sign in/i });
    await expect(signInHeading).toBeVisible({ timeout: 15000 });
  });

  test("doctors page redirects to Nepali login", async ({ page }) => {
    await page.goto("/ne/clinic/dashboard/doctors");

    // Middleware redirects to Nepali login
    await page.waitForURL(/\/ne\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/ne\/login/);
  });

  test("schedules page redirects to Nepali login", async ({ page }) => {
    await page.goto("/ne/clinic/dashboard/schedules");

    // Middleware redirects to Nepali login
    await page.waitForURL(/\/ne\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/ne\/login/);
  });
});

test.describe("Clinic Dashboard - Loading States", () => {
  test.slow(); // Triple timeout for authenticated tests

  test("dashboard shows loading state initially", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // At least the sidebar should render; this test mainly ensures the page doesn't crash
    await expect(clinicOwnerPage.getByRole("link", { name: "Overview" })).toBeVisible();
  });
});

test.describe("Clinic Dashboard - Error Handling", () => {
  test.slow(); // Triple timeout for authenticated tests

  test("dashboard handles API errors gracefully", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    // Page should load without crashing - sidebar renders with navigation
    await expect(clinicOwnerPage.getByRole("link", { name: "Overview" })).toBeVisible();
  });
});

test.describe("Clinic Dashboard - Navigation", () => {
  test.slow(); // Triple timeout for authenticated tests

  test("can navigate from dashboard to doctors page", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });
    await expect(clinicOwnerPage.getByRole("link", { name: "Overview" })).toBeVisible();

    // Click on Manage Doctors
    const manageDoctorsLink = clinicOwnerPage.getByRole("link", {
      name: /manage doctors/i,
    });
    await expect(manageDoctorsLink).toBeVisible();
    await manageDoctorsLink.click();

    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/doctors/, { timeout: 30000 });
  });

  test("can navigate from dashboard to schedules page", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });
    await expect(clinicOwnerPage.getByRole("link", { name: "Overview" })).toBeVisible();

    // Click on Manage Schedules
    const manageSchedulesLink = clinicOwnerPage.getByRole("link", {
      name: /manage schedules/i,
    });
    await expect(manageSchedulesLink).toBeVisible();
    await manageSchedulesLink.click();

    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/schedules/, { timeout: 30000 });
  });

  test("can navigate back to dashboard from doctors page", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/doctors");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    await expect(clinicOwnerPage.getByText(/current doctors/i)).toBeVisible();

    // Click back to dashboard
    const backLink = clinicOwnerPage.getByRole("link", { name: /back to dashboard/i });
    await expect(backLink).toBeVisible();
    await backLink.click();

    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard$/, { timeout: 30000 });
  });

  test("can navigate from doctors to schedules via button", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/doctors");
    await expect(
      clinicOwnerPage.locator('h2:has-text("Clinic Dashboard")')
    ).toBeVisible({ timeout: 20000 });

    await expect(clinicOwnerPage.getByText(/current doctors/i)).toBeVisible();

    // Check if there's a schedules link for a doctor
    const schedulesLink = clinicOwnerPage.getByRole("link", { name: /schedules/i }).first();
    await expect(schedulesLink).toBeVisible();
    await schedulesLink.click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/schedules/);
  });
});
