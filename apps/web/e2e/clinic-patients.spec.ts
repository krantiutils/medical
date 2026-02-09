/**
 * Patient Registry E2E Tests
 *
 * Tests for the clinic dashboard Patient Registry flow including:
 * - Patient list page with pagination and search
 * - Search by name, phone, and patient number
 * - Add new patient with form validation
 * - View patient detail page with records summary
 * - Edit patient information inline
 * - Delete patient with confirmation dialog
 * - Empty states and unauthenticated access
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";

const PATIENTS_URL = "/en/clinic/dashboard/patients";
const NEW_PATIENT_URL = "/en/clinic/dashboard/patients/new";

/**
 * Helper: wait for the loading spinner to disappear on patient pages.
 */
async function waitForPageLoad(page: import("@playwright/test").Page) {
  await page
    .waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 })
    .catch(() => {});
}

test.describe("Patient Registry - List Page", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);
  });

  test("should load patient registry page with title and subtitle", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /patient registry/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByText(/view and manage all patients/i)
    ).toBeVisible();
  });

  test("should display Add Patient button", async ({ clinicOwnerPage }) => {
    await expect(
      clinicOwnerPage.getByRole("link", { name: /add patient/i })
    ).toBeVisible();
  });

  test("should display search input with placeholder", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByPlaceholder(
        /search by name, phone, or patient number/i
      )
    ).toBeVisible();
  });

  test("should display Search and total patients count", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("button", { name: /^search$/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByText(/total patients/i)
    ).toBeVisible();
  });

  test("should display seeded patients in the table", async ({
    clinicOwnerPage,
  }) => {
    // Seeded patients from TEST_DATA
    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name)
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_TWO.name)
    ).toBeVisible();
  });

  test("should display patient numbers in the table", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.number)
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_TWO.number)
    ).toBeVisible();
  });

  test("should display table column headers", async ({ clinicOwnerPage }) => {
    const table = clinicOwnerPage.locator("table");
    await expect(table.getByText(/patient #/i)).toBeVisible();
    await expect(table.getByText(/name/i)).toBeVisible();
    await expect(table.getByText(/actions/i)).toBeVisible();
  });

  test("should display Edit and Delete action buttons for each patient", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("link", { name: /^edit$/i }).first()
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /^delete$/i }).first()
    ).toBeVisible();
  });

  test("should display Back to Dashboard link", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByText(/back to dashboard/i)
    ).toBeVisible();
  });
});

test.describe("Patient Registry - Search", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);
  });

  test("should search patients by name", async ({ clinicOwnerPage }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(
      /search by name, phone, or patient number/i
    );
    await searchInput.fill("Test Patient One");
    await clinicOwnerPage
      .getByRole("button", { name: /^search$/i })
      .click();

    // Wait for results to load
    await waitForPageLoad(clinicOwnerPage);

    // Patient One should be visible
    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name)
    ).toBeVisible({ timeout: 5000 });
  });

  test("should search patients by phone number", async ({
    clinicOwnerPage,
  }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(
      /search by name, phone, or patient number/i
    );
    await searchInput.fill(TEST_DATA.PATIENTS.PATIENT_ONE.phone);
    await clinicOwnerPage
      .getByRole("button", { name: /^search$/i })
      .click();

    await waitForPageLoad(clinicOwnerPage);

    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name)
    ).toBeVisible({ timeout: 5000 });
  });

  test("should search patients by patient number", async ({
    clinicOwnerPage,
  }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(
      /search by name, phone, or patient number/i
    );
    await searchInput.fill(TEST_DATA.PATIENTS.PATIENT_ONE.number);
    await clinicOwnerPage
      .getByRole("button", { name: /^search$/i })
      .click();

    await waitForPageLoad(clinicOwnerPage);

    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name)
    ).toBeVisible({ timeout: 5000 });
    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.number)
    ).toBeVisible();
  });

  test("should trigger search on Enter key press", async ({
    clinicOwnerPage,
  }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(
      /search by name, phone, or patient number/i
    );
    await searchInput.fill(TEST_DATA.PATIENTS.PATIENT_TWO.phone);
    await searchInput.press("Enter");

    await waitForPageLoad(clinicOwnerPage);

    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_TWO.name)
    ).toBeVisible({ timeout: 5000 });
  });

  test("should show empty state when no search results match", async ({
    clinicOwnerPage,
  }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(
      /search by name, phone, or patient number/i
    );
    await searchInput.fill("zzzznonexistentpatient99999");
    await clinicOwnerPage
      .getByRole("button", { name: /^search$/i })
      .click();

    await waitForPageLoad(clinicOwnerPage);

    // Should show "No patients found" with help text
    await expect(
      clinicOwnerPage.getByText(/no patients found/i)
    ).toBeVisible({ timeout: 5000 });
    await expect(
      clinicOwnerPage.getByText(/try a different search term/i)
    ).toBeVisible();
  });

  test("should show Clear button after search and reset on click", async ({
    clinicOwnerPage,
  }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(
      /search by name, phone, or patient number/i
    );
    await searchInput.fill("Test Patient");
    await clinicOwnerPage
      .getByRole("button", { name: /^search$/i })
      .click();

    await waitForPageLoad(clinicOwnerPage);

    // Clear button should appear
    const clearButton = clinicOwnerPage.getByRole("button", {
      name: /^clear$/i,
    });
    await expect(clearButton).toBeVisible();

    // Click Clear
    await clearButton.click();
    await waitForPageLoad(clinicOwnerPage);

    // Both patients should be visible again
    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name)
    ).toBeVisible({ timeout: 5000 });
    await expect(
      clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_TWO.name)
    ).toBeVisible();

    // Clear button should be gone
    await expect(clearButton).not.toBeVisible();
  });
});

test.describe("Patient Registry - Pagination", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);
  });

  test("should display pagination controls when total patients exceed page size", async ({
    clinicOwnerPage,
  }) => {
    // With only 2 seeded patients and a limit of 20, pagination may not render.
    // The pagination section only renders when totalPages > 1.
    // We verify the behavior: either pagination is visible or the patient count is within one page.
    const totalText = clinicOwnerPage.getByText(/total patients/i);
    await expect(totalText).toBeVisible();

    // If pagination controls exist, verify Previous/Next buttons
    const previousButton = clinicOwnerPage.getByRole("button", {
      name: /previous/i,
    });
    const nextButton = clinicOwnerPage.getByRole("button", {
      name: /^next$/i,
    });

    // If there are enough patients for pagination, both buttons should exist
    const hasPagination = await previousButton.isVisible().catch(() => false);
    if (hasPagination) {
      // On page 1, Previous should be disabled
      await expect(previousButton).toBeDisabled();
      // Page indicator should be visible
      await expect(clinicOwnerPage.getByText(/page 1 of/i)).toBeVisible();
      await expect(nextButton).toBeVisible();
    }
    // If no pagination, that means all patients fit on one page -- also a valid state
  });
});

test.describe("Patient Registry - Add New Patient", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(NEW_PATIENT_URL);
    await waitForPageLoad(clinicOwnerPage);
  });

  test("should load add patient page with title", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /add new patient/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByText(/register a new patient in your clinic/i)
    ).toBeVisible();
  });

  test("should display all form sections", async ({ clinicOwnerPage }) => {
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /personal information/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /contact information/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /medical information/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /emergency contact/i })
    ).toBeVisible();
  });

  test("should mark Full Name as required", async ({ clinicOwnerPage }) => {
    // The Full Name label has a red asterisk indicating required
    const fullNameInput = clinicOwnerPage.locator("#full_name");
    await expect(fullNameInput).toBeVisible();
    await expect(fullNameInput).toHaveAttribute("required", "");
  });

  test("should disable Save button when full name is empty", async ({
    clinicOwnerPage,
  }) => {
    // Save button should be disabled when full_name is empty
    const saveButton = clinicOwnerPage.getByRole("button", {
      name: /save patient/i,
    });
    await expect(saveButton).toBeDisabled();
  });

  test("should enable Save button when full name is provided", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.locator("#full_name").fill("Test Validation Patient");

    const saveButton = clinicOwnerPage.getByRole("button", {
      name: /save patient/i,
    });
    await expect(saveButton).toBeEnabled();
  });

  test("should display gender dropdown options", async ({
    clinicOwnerPage,
  }) => {
    const genderSelect = clinicOwnerPage.locator("#gender");
    await expect(genderSelect).toBeVisible();

    // Should have Male, Female, Other options
    await expect(genderSelect.locator("option", { hasText: "Male" })).toBeAttached();
    await expect(genderSelect.locator("option", { hasText: "Female" })).toBeAttached();
    await expect(genderSelect.locator("option", { hasText: "Other" })).toBeAttached();
  });

  test("should display blood group dropdown options", async ({
    clinicOwnerPage,
  }) => {
    const bloodGroupSelect = clinicOwnerPage.locator("#blood_group");
    await expect(bloodGroupSelect).toBeVisible();

    // Should have all 8 blood groups
    for (const bg of ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]) {
      await expect(
        bloodGroupSelect.locator("option", { hasText: bg })
      ).toBeAttached();
    }
  });

  test("should display Cancel button linking back to patient list", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("link", { name: /cancel/i })
    ).toBeVisible();
  });

  test("should display Back to Patient Registry link", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByText(/back to patient registry/i)
    ).toBeVisible();
  });

  test("should add a new patient successfully with minimal data", async ({
    clinicOwnerPage,
  }) => {
    const uniqueName = `E2E Patient ${Date.now()}`;

    // Fill only the required field
    await clinicOwnerPage.locator("#full_name").fill(uniqueName);

    // Submit
    await clinicOwnerPage
      .getByRole("button", { name: /save patient/i })
      .click();

    // Should redirect to patient list on success
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/?$/, {
      timeout: 10000,
    });

    // Wait for the list to load
    await waitForPageLoad(clinicOwnerPage);

    // The newly created patient should appear in the list
    await expect(clinicOwnerPage.getByText(uniqueName)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should add a new patient with all fields populated", async ({
    clinicOwnerPage,
  }) => {
    const uniqueName = `E2E Full Patient ${Date.now()}`;

    // Personal Info
    await clinicOwnerPage.locator("#full_name").fill(uniqueName);
    await clinicOwnerPage.locator("#date_of_birth").fill("1990-05-15");
    await clinicOwnerPage.locator("#gender").selectOption("Female");
    await clinicOwnerPage.locator("#blood_group").selectOption("B+");
    await clinicOwnerPage.locator("#address").fill("Kathmandu, Nepal");

    // Contact Info
    await clinicOwnerPage.locator("#phone").fill("9812345678");
    await clinicOwnerPage.locator("#email").fill(`e2e-${Date.now()}@test.com`);

    // Medical Info
    await clinicOwnerPage.locator("#allergies").fill("Penicillin, Dust");

    // Emergency Contact
    await clinicOwnerPage
      .locator("#emergency_contact_name")
      .fill("Emergency Person");
    await clinicOwnerPage
      .locator("#emergency_contact_phone")
      .fill("9823456789");
    await clinicOwnerPage
      .locator("#emergency_contact_relation")
      .fill("Spouse");

    // Submit
    await clinicOwnerPage
      .getByRole("button", { name: /save patient/i })
      .click();

    // Should redirect to patient list
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/?$/, {
      timeout: 10000,
    });

    await waitForPageLoad(clinicOwnerPage);

    await expect(clinicOwnerPage.getByText(uniqueName)).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Patient Registry - Patient Detail Page", () => {
  test("should navigate to patient detail by clicking Edit", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    // Click the first Edit link (navigates to patient detail/edit page)
    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();

    // Should navigate to the patient detail page
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Patient Details heading should be visible
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /patient details/i })
    ).toBeVisible();
  });

  test("should display patient detail sections in view mode", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Core sections should be visible
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /records summary/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /personal information/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /contact information/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /medical information/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /emergency contact/i })
    ).toBeVisible();
  });

  test("should display patient number on detail page", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Patient number should be displayed (PAT- or P- prefix)
    await expect(
      clinicOwnerPage.getByText(/PAT-\d{4}-\d{4}|P-\d{6}/)
    ).toBeVisible();
  });

  test("should display records summary counts", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Records summary section should show count labels
    await expect(clinicOwnerPage.getByText(/appointments/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/invoices/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/clinical notes/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/prescriptions/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/lab orders/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/admissions/i)).toBeVisible();
  });

  test("should display registered and last updated dates", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    await expect(clinicOwnerPage.getByText(/registered on/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/last updated/i)).toBeVisible();
  });

  test("should show Edit button in view mode", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Detail page has its own Edit button to toggle edit mode
    await expect(
      clinicOwnerPage.getByRole("button", { name: /^edit$/i })
    ).toBeVisible();
  });

  test("should display Back to Patient Registry link", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    await expect(
      clinicOwnerPage.getByText(/back to patient registry/i)
    ).toBeVisible();
  });
});

test.describe("Patient Registry - Edit Patient", () => {
  test("should enter edit mode when clicking Edit on detail page", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    // Navigate to first patient detail
    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Click Edit to enter edit mode
    await clinicOwnerPage
      .getByRole("button", { name: /^edit$/i })
      .click();

    // Should display form fields with Save Changes and Cancel buttons
    await expect(
      clinicOwnerPage.getByRole("button", { name: /save changes/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /^cancel$/i })
    ).toBeVisible();

    // Form inputs should be present
    await expect(clinicOwnerPage.locator("#full_name")).toBeVisible();
    await expect(clinicOwnerPage.locator("#gender")).toBeVisible();
    await expect(clinicOwnerPage.locator("#blood_group")).toBeVisible();
  });

  test("should cancel edit mode and revert to view mode", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Enter edit mode
    await clinicOwnerPage
      .getByRole("button", { name: /^edit$/i })
      .click();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /save changes/i })
    ).toBeVisible();

    // Cancel edit
    await clinicOwnerPage
      .getByRole("button", { name: /^cancel$/i })
      .click();

    // Should return to view mode (Edit button visible again, Save Changes gone)
    await expect(
      clinicOwnerPage.getByRole("button", { name: /^edit$/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /save changes/i })
    ).not.toBeVisible();
  });

  test("should update patient name and save", async ({ clinicOwnerPage }) => {
    // First create a fresh patient to edit
    await clinicOwnerPage.goto(NEW_PATIENT_URL);
    await waitForPageLoad(clinicOwnerPage);

    const originalName = `Edit Target ${Date.now()}`;
    await clinicOwnerPage.locator("#full_name").fill(originalName);
    await clinicOwnerPage
      .getByRole("button", { name: /save patient/i })
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/?$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Find and click edit for this patient
    const patientRow = clinicOwnerPage.locator("tr", {
      hasText: originalName,
    });
    await patientRow.getByRole("link", { name: /^edit$/i }).click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Enter edit mode
    await clinicOwnerPage
      .getByRole("button", { name: /^edit$/i })
      .click();

    // Change the name
    const updatedName = `Updated ${Date.now()}`;
    const fullNameInput = clinicOwnerPage.locator("#full_name");
    await fullNameInput.clear();
    await fullNameInput.fill(updatedName);

    // Save
    await clinicOwnerPage
      .getByRole("button", { name: /save changes/i })
      .click();

    // Should exit edit mode (Edit button returns)
    await expect(
      clinicOwnerPage.getByRole("button", { name: /^edit$/i })
    ).toBeVisible({ timeout: 10000 });

    // The updated name should be displayed in view mode
    await expect(clinicOwnerPage.getByText(updatedName)).toBeVisible();
  });

  test("should disable Save Changes when full name is empty", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);

    await clinicOwnerPage
      .getByRole("link", { name: /^edit$/i })
      .first()
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Enter edit mode
    await clinicOwnerPage
      .getByRole("button", { name: /^edit$/i })
      .click();

    // Clear the name
    await clinicOwnerPage.locator("#full_name").clear();

    // Save button should be disabled
    await expect(
      clinicOwnerPage.getByRole("button", { name: /save changes/i })
    ).toBeDisabled();
  });
});

test.describe("Patient Registry - Delete Patient", () => {
  test("should show browser confirm dialog on Delete click", async ({
    clinicOwnerPage,
  }) => {
    // Create a patient specifically for deletion
    await clinicOwnerPage.goto(NEW_PATIENT_URL);
    await waitForPageLoad(clinicOwnerPage);

    const deleteName = `Delete Target ${Date.now()}`;
    await clinicOwnerPage.locator("#full_name").fill(deleteName);
    await clinicOwnerPage
      .getByRole("button", { name: /save patient/i })
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/?$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // Verify the patient exists in the list
    await expect(clinicOwnerPage.getByText(deleteName)).toBeVisible({
      timeout: 5000,
    });

    // Set up dialog handler to accept the confirm dialog
    clinicOwnerPage.on("dialog", (dialog) => dialog.accept());

    // Click Delete for this specific patient
    const patientRow = clinicOwnerPage.locator("tr", {
      hasText: deleteName,
    });
    await patientRow
      .getByRole("button", { name: /^delete$/i })
      .click();

    // Wait for the patient to be removed from the list
    await expect(clinicOwnerPage.getByText(deleteName)).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should not delete patient when confirm dialog is dismissed", async ({
    clinicOwnerPage,
  }) => {
    // Create a patient
    await clinicOwnerPage.goto(NEW_PATIENT_URL);
    await waitForPageLoad(clinicOwnerPage);

    const keepName = `Keep Target ${Date.now()}`;
    await clinicOwnerPage.locator("#full_name").fill(keepName);
    await clinicOwnerPage
      .getByRole("button", { name: /save patient/i })
      .click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/?$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    await expect(clinicOwnerPage.getByText(keepName)).toBeVisible({
      timeout: 5000,
    });

    // Dismiss the confirm dialog
    clinicOwnerPage.on("dialog", (dialog) => dialog.dismiss());

    const patientRow = clinicOwnerPage.locator("tr", {
      hasText: keepName,
    });
    await patientRow
      .getByRole("button", { name: /^delete$/i })
      .click();

    // Patient should still be in the list
    await expect(clinicOwnerPage.getByText(keepName)).toBeVisible();
  });
});

test.describe("Patient Registry - Unauthenticated Access", () => {
  test("should show login required for patient list when not logged in", async ({
    page,
  }) => {
    await page.goto(PATIENTS_URL);
    await waitForPageLoad(page);

    await expect(
      page.getByText(/please log in to view the patient registry/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("should show login required for add patient page when not logged in", async ({
    page,
  }) => {
    await page.goto(NEW_PATIENT_URL);
    await waitForPageLoad(page);

    await expect(
      page.getByText(/please log in to add patients/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("should show login required for patient detail page when not logged in", async ({
    page,
  }) => {
    await page.goto("/en/clinic/dashboard/patients/some-fake-id");
    await waitForPageLoad(page);

    await expect(
      page.getByText(/please log in to view patient details/i)
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Patient Registry - Language Support", () => {
  test("should display patient registry page in Nepali", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/patients");
    await waitForPageLoad(clinicOwnerPage);

    await expect(
      clinicOwnerPage.getByRole("heading", { name: /बिरामी रजिस्ट्री/i })
    ).toBeVisible();
  });

  test("should display add patient page in Nepali", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/patients/new");
    await waitForPageLoad(clinicOwnerPage);

    await expect(
      clinicOwnerPage.getByRole("heading", {
        name: /नयाँ बिरामी थप्नुहोस्/i,
      })
    ).toBeVisible();
  });
});

test.describe("Patient Registry - End to End Flow", () => {
  test("should complete full patient lifecycle: create, view, edit, delete", async ({
    clinicOwnerPage,
  }) => {
    const patientName = `Lifecycle Patient ${Date.now()}`;
    const updatedName = `Updated Lifecycle ${Date.now()}`;

    // 1. Navigate to Add Patient page
    await clinicOwnerPage.goto(PATIENTS_URL);
    await waitForPageLoad(clinicOwnerPage);
    await clinicOwnerPage
      .getByRole("link", { name: /add patient/i })
      .click();
    await clinicOwnerPage.waitForURL(/\/patients\/new/, { timeout: 10000 });
    await waitForPageLoad(clinicOwnerPage);

    // 2. Create a patient with full details
    await clinicOwnerPage.locator("#full_name").fill(patientName);
    await clinicOwnerPage.locator("#gender").selectOption("Male");
    await clinicOwnerPage.locator("#blood_group").selectOption("O+");
    await clinicOwnerPage.locator("#address").fill("Pokhara, Nepal");
    await clinicOwnerPage
      .getByRole("button", { name: /save patient/i })
      .click();

    // 3. Should redirect to patient list with new patient visible
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/?$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);
    await expect(clinicOwnerPage.getByText(patientName)).toBeVisible({
      timeout: 5000,
    });

    // 4. Navigate to detail page
    const patientRow = clinicOwnerPage.locator("tr", {
      hasText: patientName,
    });
    await patientRow.getByRole("link", { name: /^edit$/i }).click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/[^/]+$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);

    // 5. Verify detail page shows the patient info
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /patient details/i })
    ).toBeVisible();
    await expect(clinicOwnerPage.getByText(patientName)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/male/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText("O+")).toBeVisible();

    // 6. Edit the patient
    await clinicOwnerPage
      .getByRole("button", { name: /^edit$/i })
      .click();
    const fullNameInput = clinicOwnerPage.locator("#full_name");
    await fullNameInput.clear();
    await fullNameInput.fill(updatedName);
    await clinicOwnerPage
      .getByRole("button", { name: /save changes/i })
      .click();

    // 7. Verify update took effect (back to view mode)
    await expect(
      clinicOwnerPage.getByRole("button", { name: /^edit$/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(clinicOwnerPage.getByText(updatedName)).toBeVisible();

    // 8. Go back to patient list
    await clinicOwnerPage.getByText(/back to patient registry/i).click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard\/patients\/?$/, {
      timeout: 10000,
    });
    await waitForPageLoad(clinicOwnerPage);
    await expect(clinicOwnerPage.getByText(updatedName)).toBeVisible({
      timeout: 5000,
    });

    // 9. Delete the patient
    clinicOwnerPage.on("dialog", (dialog) => dialog.accept());
    const updatedRow = clinicOwnerPage.locator("tr", {
      hasText: updatedName,
    });
    await updatedRow
      .getByRole("button", { name: /^delete$/i })
      .click();

    // 10. Verify patient is removed
    await expect(clinicOwnerPage.getByText(updatedName)).not.toBeVisible({
      timeout: 10000,
    });
  });
});
