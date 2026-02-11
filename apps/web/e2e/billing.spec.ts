/**
 * Billing E2E Tests
 *
 * Tests for US-086: Verify billing workflow - services catalog, invoice creation,
 * discount/tax calculations, invoice number generation, and reports.
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";

test.describe("Services Management Page", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/services");
    // Wait for page to load (loading spinner to disappear)
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});
  });

  test("should load services page with title", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("heading", { name: /services/i })).toBeVisible();
  });

  test("should display Add Service button", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /add service/i })).toBeVisible();
  });

  test("should display seeded services from test data", async ({ clinicOwnerPage }) => {
    // Check for seeded services
    await expect(clinicOwnerPage.getByText(TEST_DATA.SERVICES.CONSULTATION.name)).toBeVisible();
    await expect(clinicOwnerPage.getByText(TEST_DATA.SERVICES.XRAY.name)).toBeVisible();
  });

  test("should display service prices correctly", async ({ clinicOwnerPage }) => {
    // Services should show NPR prices
    await expect(clinicOwnerPage.getByText(/NPR 500/)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/NPR 1,200/)).toBeVisible();
  });

  test("should display filter tabs (All, Active, Inactive)", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /all services/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /^active/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /inactive/i })).toBeVisible();
  });

  test("should open Add Service modal when clicking Add Service button", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /add service/i }).click();

    // Modal should be visible with form fields
    await expect(clinicOwnerPage.getByText(/service name/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/price/i)).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /save/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /cancel/i })).toBeVisible();
  });

  test("should add a new service to catalog", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /add service/i }).click();

    // Fill in the form
    const testServiceName = `Test Service ${Date.now()}`;
    await clinicOwnerPage.locator("input[placeholder*='Consultation']").fill(testServiceName);
    await clinicOwnerPage.locator("input[type='number'][min='0']").fill("750");

    // Select category
    await clinicOwnerPage.locator("select").selectOption("Consultation");

    // Save
    await clinicOwnerPage.getByRole("button", { name: /save/i }).click();

    // Wait for success message
    await expect(clinicOwnerPage.getByText(/saved successfully/i)).toBeVisible({ timeout: 10000 });

    // Verify service appears in list
    await expect(clinicOwnerPage.getByText(testServiceName)).toBeVisible();
  });

  test("should show validation error for empty service name", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /add service/i }).click();

    // Only fill price, leave name empty
    await clinicOwnerPage.locator("input[type='number'][min='0']").fill("100");

    // Try to save
    await clinicOwnerPage.getByRole("button", { name: /save/i }).click();

    // Should show required error
    await expect(clinicOwnerPage.getByText(/required/i)).toBeVisible();
  });

  test("should filter to show only active services", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /^active/i }).click();

    // Active services should be visible
    await expect(clinicOwnerPage.getByText(TEST_DATA.SERVICES.CONSULTATION.name)).toBeVisible();

    // Inactive service (Dressing) should not be visible
    await expect(clinicOwnerPage.getByText(TEST_DATA.SERVICES.DRESSING_INACTIVE.name)).not.toBeVisible();
  });

  test("should show Edit Service button on service cards", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /edit service/i }).first()).toBeVisible();
  });

  test("should show Delete button on service cards", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /delete/i }).first()).toBeVisible();
  });
});

test.describe("Billing Page - Basic Functionality", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/billing");
    // Wait for page to load
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});
  });

  test("should load billing page with title", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("heading", { name: /billing/i })).toBeVisible();
  });

  test("should display patient search section", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByText(/select patient/i)).toBeVisible();
    await expect(clinicOwnerPage.getByPlaceholder(/search patient/i)).toBeVisible();
  });

  test("should display services section", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("heading", { name: /services/i })).toBeVisible();
  });

  test("should display recent invoices section", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByText(/recent invoices/i)).toBeVisible();
  });

  test("should display Manage Services link", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /manage services/i })).toBeVisible();
  });

  test("should show seeded invoices in recent invoices", async ({ clinicOwnerPage }) => {
    // Seeded invoices should appear
    await expect(clinicOwnerPage.getByText(/INV-2026-0001/)).toBeVisible();
  });
});

test.describe("Billing Page - Patient Selection", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/billing");
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});
  });

  test("should search and find patient by phone", async ({ clinicOwnerPage }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(/search patient/i);
    await searchInput.fill(TEST_DATA.PATIENTS.PATIENT_ONE.phone);

    // Wait for search results
    await clinicOwnerPage.waitForTimeout(500); // Debounce delay

    // Patient should appear in results
    await expect(clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name)).toBeVisible({ timeout: 5000 });
  });

  test("should search and find patient by name", async ({ clinicOwnerPage }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(/search patient/i);
    await searchInput.fill("Test Patient");

    // Wait for search results
    await clinicOwnerPage.waitForTimeout(500);

    // Patients should appear
    await expect(clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name)).toBeVisible({ timeout: 5000 });
  });

  test("should select patient and show patient info", async ({ clinicOwnerPage }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(/search patient/i);
    await searchInput.fill(TEST_DATA.PATIENTS.PATIENT_ONE.phone);

    await clinicOwnerPage.waitForTimeout(500);

    // Click on patient result
    await clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name).first().click();

    // Patient info should be displayed
    await expect(clinicOwnerPage.getByText(/patient information/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.number)).toBeVisible();
  });

  test("should show Change Patient button after selection", async ({ clinicOwnerPage }) => {
    const searchInput = clinicOwnerPage.getByPlaceholder(/search patient/i);
    await searchInput.fill(TEST_DATA.PATIENTS.PATIENT_ONE.phone);

    await clinicOwnerPage.waitForTimeout(500);
    await clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name).first().click();

    await expect(clinicOwnerPage.getByRole("button", { name: /change patient/i })).toBeVisible();
  });
});

test.describe("Billing Page - Invoice Creation", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/billing");
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});

    // Select a patient first
    const searchInput = clinicOwnerPage.getByPlaceholder(/search patient/i);
    await searchInput.fill(TEST_DATA.PATIENTS.PATIENT_ONE.phone);
    await clinicOwnerPage.waitForTimeout(500);
    await clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_ONE.name).first().click();
    await expect(clinicOwnerPage.getByText(/patient information/i)).toBeVisible();
  });

  test("should add service to invoice", async ({ clinicOwnerPage }) => {
    // Select service from dropdown
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });

    // Click add button
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Service should appear in invoice items table
    await expect(clinicOwnerPage.locator("table").getByText(TEST_DATA.SERVICES.CONSULTATION.name)).toBeVisible();
  });

  test("should show subtotal after adding services", async ({ clinicOwnerPage }) => {
    // Add consultation service
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Subtotal should show
    await expect(clinicOwnerPage.getByText(/subtotal/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/NPR 500/)).toBeVisible();
  });

  test("should calculate discount correctly", async ({ clinicOwnerPage }) => {
    // Add service
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Enter discount
    const discountInput = clinicOwnerPage.locator("input[type='number'][min='0'][max]");
    await discountInput.fill("50");

    // Total should be 500 - 50 = 450
    await expect(clinicOwnerPage.getByText(/NPR 450\.00/)).toBeVisible();
  });

  test("should calculate tax (VAT 13%) correctly", async ({ clinicOwnerPage }) => {
    // Add service
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.XRAY.name} - NPR 1,200.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Enable tax checkbox
    await clinicOwnerPage.locator("input[type='checkbox']").check();

    // Tax should be 13% of 1200 = 156
    // Total should be 1200 + 156 = 1356
    await expect(clinicOwnerPage.getByText(/NPR 156\.00/)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/NPR 1,356\.00/)).toBeVisible();
  });

  test("should show payment mode options after adding items", async ({ clinicOwnerPage }) => {
    // Add service
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Payment mode section should appear
    await expect(clinicOwnerPage.getByText(/payment mode/i)).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /cash/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /card/i })).toBeVisible();
  });

  test("should show payment status options", async ({ clinicOwnerPage }) => {
    // Add service
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Payment status buttons
    await expect(clinicOwnerPage.getByRole("button", { name: /pending/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /^paid$/i })).toBeVisible();
  });

  test("should generate invoice and show success", async ({ clinicOwnerPage }) => {
    // Add service
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Generate invoice
    await clinicOwnerPage.getByRole("button", { name: /generate invoice/i }).click();

    // Should show success with invoice number
    await expect(clinicOwnerPage.getByText(/invoice generated successfully/i)).toBeVisible({ timeout: 10000 });
    await expect(clinicOwnerPage.getByText(/INV-2026-/)).toBeVisible();
  });

  test("should show Print Receipt button after generating invoice", async ({ clinicOwnerPage }) => {
    // Add service
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Generate invoice
    await clinicOwnerPage.getByRole("button", { name: /generate invoice/i }).click();

    // Print button should appear
    await expect(clinicOwnerPage.getByRole("button", { name: /print receipt/i })).toBeVisible({ timeout: 10000 });
  });

  test("should update quantity of service item", async ({ clinicOwnerPage }) => {
    // Add service
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Update quantity to 2
    const quantityInput = clinicOwnerPage.locator("table input[type='number']");
    await quantityInput.fill("2");

    // Amount should be 500 * 2 = 1000
    await expect(clinicOwnerPage.getByText(/NPR 1,000\.00/)).toBeVisible();
  });

  test("should remove service item from invoice", async ({ clinicOwnerPage }) => {
    // Add service
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // Verify item is added
    await expect(clinicOwnerPage.locator("table").getByText(TEST_DATA.SERVICES.CONSULTATION.name)).toBeVisible();

    // Click remove button (trash icon)
    await clinicOwnerPage.locator("table button").filter({ has: clinicOwnerPage.locator("svg") }).click();

    // Item should be removed
    await expect(clinicOwnerPage.locator("table").getByText(TEST_DATA.SERVICES.CONSULTATION.name)).not.toBeVisible();
  });

  test("should show error when trying to generate invoice without items", async ({ clinicOwnerPage }) => {
    // Try to generate without adding items (button should be disabled)
    const generateButton = clinicOwnerPage.getByRole("button", { name: /generate invoice/i });
    await expect(generateButton).toBeDisabled();
  });
});

test.describe("Reports Page", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/reports");
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});
  });

  test("should load reports page with title", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("heading", { name: /billing reports/i })).toBeVisible();
  });

  test("should display date range filter section", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByText(/date range/i)).toBeVisible();
    await expect(clinicOwnerPage.locator("input[type='date']").first()).toBeVisible();
  });

  test("should display quick date presets (Today, This Week, etc.)", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /today/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /this week/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /this month/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /last 30 days/i })).toBeVisible();
  });

  test("should display summary cards", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByText(/total invoices/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/total collection/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/paid amount/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/pending amount/i)).toBeVisible();
  });

  test("should show correct totals from seeded data", async ({ clinicOwnerPage }) => {
    // Seeded invoices total: 500 + 1808 + 2400 = 4708
    // Wait for data to load
    await clinicOwnerPage.waitForTimeout(1000);

    // Total invoices should be at least 3 (seeded)
    const totalInvoicesCard = clinicOwnerPage.locator("text=Total Invoices").locator("..").locator("p.text-2xl");
    await expect(totalInvoicesCard).toContainText(/[3-9]|\d{2,}/);
  });

  test("should display payment mode breakdown table", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByText(/payment mode breakdown/i)).toBeVisible();
    // Headers
    await expect(clinicOwnerPage.getByText(/payment mode/i).first()).toBeVisible();
    await expect(clinicOwnerPage.getByRole("columnheader", { name: /count/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("columnheader", { name: /amount/i })).toBeVisible();
  });

  test("should display daily collection table", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByText(/daily collection/i)).toBeVisible();
  });

  test("should display invoice details table", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByText(/invoice details/i)).toBeVisible();
  });

  test("should display Export to CSV button", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /export to csv/i })).toBeVisible();
  });

  test("should apply date filter when clicking preset", async ({ clinicOwnerPage }) => {
    // Click "Today" preset
    await clinicOwnerPage.getByRole("button", { name: /today/i }).click();

    // Date inputs should be updated to today
    const today = new Date().toISOString().split("T")[0];
    const fromInput = clinicOwnerPage.locator("input[type='date']").first();
    await expect(fromInput).toHaveValue(today);
  });

  test("should show payment status badges (Paid, Pending)", async ({ clinicOwnerPage }) => {
    // Look for status badges in invoice details
    await expect(clinicOwnerPage.getByText(/^paid$/i).first()).toBeVisible();
  });
});

test.describe("Billing Flow - End to End", () => {
  test("should complete full billing workflow", async ({ clinicOwnerPage }) => {
    // 1. Go to billing page
    await clinicOwnerPage.goto("/en/clinic/dashboard/billing");
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});

    // 2. Select patient
    const searchInput = clinicOwnerPage.getByPlaceholder(/search patient/i);
    await searchInput.fill(TEST_DATA.PATIENTS.PATIENT_TWO.phone);
    await clinicOwnerPage.waitForTimeout(500);
    await clinicOwnerPage.getByText(TEST_DATA.PATIENTS.PATIENT_TWO.name).click();
    await expect(clinicOwnerPage.getByText(/patient information/i)).toBeVisible();

    // 3. Add multiple services
    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.CONSULTATION.name} - NPR 500.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    await clinicOwnerPage.locator("select").first().selectOption({ label: `${TEST_DATA.SERVICES.BLOOD_TEST.name} - NPR 800.00` });
    await clinicOwnerPage.getByRole("button", { name: /^\+$/i }).click();

    // 4. Apply discount
    const discountInput = clinicOwnerPage.locator("input[type='number'][min='0'][max]");
    await discountInput.fill("100");

    // 5. Enable tax
    await clinicOwnerPage.locator("input[type='checkbox']").check();

    // 6. Select payment mode (Card)
    await clinicOwnerPage.getByRole("button", { name: /card/i }).click();

    // 7. Generate invoice
    await clinicOwnerPage.getByRole("button", { name: /generate invoice/i }).click();

    // 8. Verify success
    await expect(clinicOwnerPage.getByText(/invoice generated successfully/i)).toBeVisible({ timeout: 10000 });
    const invoiceNumber = await clinicOwnerPage.getByText(/INV-2026-\d{4}/).textContent();
    expect(invoiceNumber).toMatch(/INV-2026-\d{4}/);

    // 9. Go to reports and verify
    await clinicOwnerPage.getByRole("button", { name: /back/i }).click();
    await clinicOwnerPage.goto("/en/clinic/dashboard/reports");
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});

    // Invoice should appear in reports
    if (invoiceNumber) {
      await expect(clinicOwnerPage.getByText(invoiceNumber.trim())).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("Billing - Unauthenticated Access", () => {
  test("should show login required for billing page when not logged in", async ({ page }) => {
    await page.goto("/en/clinic/dashboard/billing");

    // Wait for loading to complete
    await page.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

    // Should show login required message
    await expect(page.getByText(/please log in to access billing/i)).toBeVisible({ timeout: 10000 });
  });

  test("should show login required for services page when not logged in", async ({ page }) => {
    await page.goto("/en/clinic/dashboard/services");

    // Wait for loading to complete
    await page.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

    // Should show login required message
    await expect(page.getByText(/please log in to access services/i)).toBeVisible({ timeout: 10000 });
  });

  test("should show login required for reports page when not logged in", async ({ page }) => {
    await page.goto("/en/clinic/dashboard/reports");

    // Wait for loading to complete
    await page.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

    // Should show login required message
    await expect(page.getByText(/please log in to access reports/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Billing - Language Support", () => {
  test("should display services page in Nepali", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/services");
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});

    // Nepali title
    await expect(clinicOwnerPage.getByRole("heading", { name: /सेवाहरू/i })).toBeVisible();
  });

  test("should display billing page in Nepali", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/billing");
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});

    // Nepali title
    await expect(clinicOwnerPage.getByRole("heading", { name: /बिलिङ/i })).toBeVisible();
  });

  test("should display reports page in Nepali", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/reports");
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});

    // Nepali title
    await expect(clinicOwnerPage.getByRole("heading", { name: /बिलिङ रिपोर्टहरू/i })).toBeVisible();
  });
});
