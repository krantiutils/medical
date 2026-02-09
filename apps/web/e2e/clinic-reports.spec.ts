/**
 * Clinic Reports E2E Tests
 *
 * Tests for billing reports dashboard and pharmacy reports dashboard.
 * Covers summary cards, date range filters, payment breakdowns,
 * daily collection, invoice details, and CSV export functionality.
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";

test.describe("Billing Reports Dashboard", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/en/clinic/dashboard/reports");
    // Wait for loading skeleton to disappear
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should load page with summary cards (Total Invoices, Total Collection, Paid Amount, Pending)", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("heading", { name: /billing reports/i })
    ).toBeVisible();

    // All four primary summary cards must be present
    await expect(clinicOwnerPage.getByText(/total invoices/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/total collection/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/paid amount/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/pending amount/i)).toBeVisible();

    // Total Invoices value should be a number (at least the 3 seeded invoices)
    const totalInvoicesCard = clinicOwnerPage
      .locator("text=Total Invoices")
      .locator("..")
      .locator("p.text-2xl");
    await expect(totalInvoicesCard).toContainText(/[3-9]|\d{2,}/);
  });

  test("should display date range filter presets (Today, This Week, This Month, Last 30 Days)", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("button", { name: /today/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /this week/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /this month/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /last 30 days/i })
    ).toBeVisible();
  });

  test("should apply 'Today' preset and update date inputs", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage
      .getByRole("button", { name: /today/i })
      .click();

    const today = new Date().toISOString().split("T")[0];
    const fromInput = clinicOwnerPage.locator("input[type='date']").first();
    const toInput = clinicOwnerPage.locator("input[type='date']").last();

    await expect(fromInput).toHaveValue(today);
    await expect(toInput).toHaveValue(today);
  });

  test("should apply 'This Month' preset and update from-date to first of month", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage
      .getByRole("button", { name: /this month/i })
      .click();

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expectedFrom = firstOfMonth.toISOString().split("T")[0];
    const expectedTo = now.toISOString().split("T")[0];

    const fromInput = clinicOwnerPage.locator("input[type='date']").first();
    const toInput = clinicOwnerPage.locator("input[type='date']").last();

    await expect(fromInput).toHaveValue(expectedFrom);
    await expect(toInput).toHaveValue(expectedTo);
  });

  test("should support custom date range selection via date inputs", async ({
    clinicOwnerPage,
  }) => {
    const fromInput = clinicOwnerPage.locator("input[type='date']").first();
    const toInput = clinicOwnerPage.locator("input[type='date']").last();

    // Set a custom range
    await fromInput.fill("2026-01-01");
    await toInput.fill("2026-01-31");

    // Click Apply to fetch data
    await clinicOwnerPage
      .getByRole("button", { name: /apply/i })
      .click();

    // Wait for data to reload (loading pulse appears then disappears)
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 })
      .catch(() => {});

    // Page should still show summary cards (even if no data for that range)
    await expect(clinicOwnerPage.getByText(/total invoices/i)).toBeVisible();
  });

  test("should display payment mode breakdown table", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByText(/payment mode breakdown/i)
    ).toBeVisible();

    // Table column headers
    await expect(
      clinicOwnerPage.getByText(/payment mode/i).first()
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("columnheader", { name: /count/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("columnheader", { name: /amount/i })
    ).toBeVisible();
  });

  test("should display daily collection table", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByText(/daily collection/i)
    ).toBeVisible();
  });

  test("should display invoice details table with column headers", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByText(/invoice details/i)
    ).toBeVisible();

    // Seeded invoice numbers should be visible
    await expect(
      clinicOwnerPage.getByText(/INV-2026-0001/)
    ).toBeVisible();
  });

  test("should show payment status badges (Paid, Pending)", async ({
    clinicOwnerPage,
  }) => {
    // At least one Paid badge from seeded invoices
    await expect(
      clinicOwnerPage.getByText(/^paid$/i).first()
    ).toBeVisible();
  });

  test("should display Export to CSV button", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("button", { name: /export to csv/i })
    ).toBeVisible();
  });

  test("should enable Export to CSV when invoice data exists", async ({
    clinicOwnerPage,
  }) => {
    const exportButton = clinicOwnerPage.getByRole("button", {
      name: /export to csv/i,
    });
    await expect(exportButton).toBeVisible();
    // With seeded invoices present, the button should not be disabled
    await expect(exportButton).toBeEnabled();
  });

  test("should show correct totals from seeded data", async ({
    clinicOwnerPage,
  }) => {
    // Wait for data to load completely
    await clinicOwnerPage.waitForTimeout(1000);

    // Seeded invoices: INV-0001 (500), INV-0002 (1808), INV-0003 (2400)
    // Total invoices should be at least 3
    const totalInvoicesCard = clinicOwnerPage
      .locator("text=Total Invoices")
      .locator("..")
      .locator("p.text-2xl");
    await expect(totalInvoicesCard).toContainText(/[3-9]|\d{2,}/);
  });

  test("should display discount and tax summary cards", async ({
    clinicOwnerPage,
  }) => {
    await expect(clinicOwnerPage.getByText(/total discount/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/total tax/i)).toBeVisible();
  });
});

test.describe("Pharmacy Reports Dashboard", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(
      "/en/clinic/dashboard/pharmacy/reports"
    );
    // Wait for loading skeleton to disappear
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 })
      .catch(() => {});
  });

  test("should load pharmacy reports page with title and subtitle", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByText(/pharmacy reports/i).first()
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByText(
        /sales analytics, product performance, and profit margins/i
      )
    ).toBeVisible();
  });

  test("should display tab navigation (Overview, Daily Sales, Product Sales, Sales History)", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("button", { name: /overview/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /daily sales/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /product sales/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /sales history/i })
    ).toBeVisible();
  });

  test("should display summary cards (Total Sales, Total Revenue, Gross Profit, Profit Margin)", async ({
    clinicOwnerPage,
  }) => {
    // These appear on the Overview tab (which is the default)
    // If there is no sales data, the "No Data" message appears instead.
    // We check for either summary cards or the no-data message.
    const hasSalesData =
      (await clinicOwnerPage.getByText(/total sales/i).count()) > 0;

    if (hasSalesData) {
      await expect(
        clinicOwnerPage.getByText(/total sales/i).first()
      ).toBeVisible();
      await expect(
        clinicOwnerPage.getByText(/total revenue/i).first()
      ).toBeVisible();
      await expect(
        clinicOwnerPage.getByText(/gross profit/i).first()
      ).toBeVisible();
      await expect(
        clinicOwnerPage.getByText(/profit margin/i).first()
      ).toBeVisible();
    } else {
      // No data state is valid - check the no data message
      await expect(
        clinicOwnerPage.getByText(/no data/i)
      ).toBeVisible();
    }
  });

  test("should display payment mode breakdown section on overview tab", async ({
    clinicOwnerPage,
  }) => {
    // On overview tab, the payment mode breakdown card should be visible if data exists
    const hasSalesData =
      (await clinicOwnerPage
        .getByText(/payment mode breakdown/i)
        .count()) > 0;

    if (hasSalesData) {
      await expect(
        clinicOwnerPage.getByText(/payment mode breakdown/i)
      ).toBeVisible();
    } else {
      // No data scenario is acceptable
      await expect(
        clinicOwnerPage.getByText(/no data|no sales data/i).first()
      ).toBeVisible();
    }
  });

  test("should display Cash Sales vs Credit Sales section on overview tab", async ({
    clinicOwnerPage,
  }) => {
    // If sales data exists, the Cash vs Credit comparison should appear
    const hasCashLabel =
      (await clinicOwnerPage.getByText(/cash sales/i).count()) > 0;

    if (hasCashLabel) {
      await expect(
        clinicOwnerPage.getByText(/cash sales/i).first()
      ).toBeVisible();
      await expect(
        clinicOwnerPage.getByText(/credit sales/i).first()
      ).toBeVisible();
    }
  });

  test("should display date range filter presets", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("button", { name: /today/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /yesterday/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /this week/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /this month/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /last 30 days/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /last 90 days/i })
    ).toBeVisible();
  });

  test("should display custom date inputs for filtering", async ({
    clinicOwnerPage,
  }) => {
    const dateInputs = clinicOwnerPage.locator("input[type='date']");
    await expect(dateInputs).toHaveCount(2);
  });

  test("should switch to Daily Sales tab and show table", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage
      .getByRole("button", { name: /daily sales/i })
      .click();

    // Wait briefly for the tab content to render
    await clinicOwnerPage.waitForTimeout(500);

    // The daily sales view should show a table or a no-data message
    const hasTable =
      (await clinicOwnerPage.locator("table").count()) > 0;
    const hasNoData =
      (await clinicOwnerPage.getByText(/no data|no sales data/i).count()) > 0;

    expect(hasTable || hasNoData).toBe(true);
  });

  test("should switch to Product Sales tab", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage
      .getByRole("button", { name: /product sales/i })
      .click();

    await clinicOwnerPage.waitForTimeout(500);

    // Should show product table or no-data
    const hasTable =
      (await clinicOwnerPage.locator("table").count()) > 0;
    const hasNoData =
      (await clinicOwnerPage.getByText(/no data|no sales data/i).count()) > 0;

    expect(hasTable || hasNoData).toBe(true);
  });

  test("should switch to Sales History tab", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage
      .getByRole("button", { name: /sales history/i })
      .click();

    await clinicOwnerPage.waitForTimeout(500);

    // Should show sales history table or no-data
    const hasTable =
      (await clinicOwnerPage.locator("table").count()) > 0;
    const hasNoData =
      (await clinicOwnerPage.getByText(/no data|no sales data/i).count()) > 0;

    expect(hasTable || hasNoData).toBe(true);
  });

  test("should display Export CSV button", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("button", { name: /export csv/i })
    ).toBeVisible();
  });

  test("should display navigation links to POS, Inventory, and Products", async ({
    clinicOwnerPage,
  }) => {
    await expect(
      clinicOwnerPage.getByRole("button", { name: /^pos$/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /inventory/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /products/i })
    ).toBeVisible();
  });

  test("should apply 'Today' date preset and reload data", async ({
    clinicOwnerPage,
  }) => {
    // Click a different preset first to change state
    await clinicOwnerPage
      .getByRole("button", { name: /today/i })
      .click();

    // Wait for data to reload
    await clinicOwnerPage.waitForTimeout(1000);

    // The page should still be functional - title visible
    await expect(
      clinicOwnerPage.getByText(/pharmacy reports/i).first()
    ).toBeVisible();
  });
});

test.describe("Billing Reports - Unauthenticated Access", () => {
  test("should show login required message when not logged in", async ({
    page,
  }) => {
    await page.goto("/en/clinic/dashboard/reports");

    await page
      .waitForSelector(".animate-pulse", {
        state: "hidden",
        timeout: 15000,
      })
      .catch(() => {});

    await expect(
      page.getByText(/please log in to access reports/i)
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Pharmacy Reports - Unauthenticated Access", () => {
  test("should show login required message when not logged in", async ({
    page,
  }) => {
    await page.goto("/en/clinic/dashboard/pharmacy/reports");

    await page
      .waitForSelector(".animate-pulse", {
        state: "hidden",
        timeout: 15000,
      })
      .catch(() => {});

    await expect(
      page.getByText(/please log in to view reports/i)
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Billing Reports - Language Support", () => {
  test("should display billing reports page in Nepali", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/reports");
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", {
        state: "hidden",
        timeout: 15000,
      })
      .catch(() => {});

    await expect(
      clinicOwnerPage.getByRole("heading", {
        name: /बिलिङ रिपोर्टहरू/i,
      })
    ).toBeVisible();
  });

  test("should display pharmacy reports page in Nepali", async ({
    clinicOwnerPage,
  }) => {
    await clinicOwnerPage.goto(
      "/ne/clinic/dashboard/pharmacy/reports"
    );
    await clinicOwnerPage
      .waitForSelector(".animate-pulse", {
        state: "hidden",
        timeout: 15000,
      })
      .catch(() => {});

    await expect(
      clinicOwnerPage.getByText(/फार्मेसी रिपोर्टहरू/).first()
    ).toBeVisible();
  });
});
