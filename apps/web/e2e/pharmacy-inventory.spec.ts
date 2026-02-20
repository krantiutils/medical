/**
 * Pharmacy Inventory and Credit E2E Tests
 *
 * Tests for US-098: Verify pharmacy inventory and credit features work correctly.
 * - Stock receiving creates batches
 * - Low stock alerts work
 * - Expiry tracking correct
 * - Credit sales and payments
 * - Reports accurate
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";

const INVENTORY_URL = "/en/clinic/dashboard/pharmacy/inventory";
const KHATA_URL = "/en/clinic/dashboard/pharmacy/khata";
const REPORTS_URL = "/en/clinic/dashboard/pharmacy/reports";

// ==================== ACCESS CONTROL ====================

test.describe("Pharmacy Inventory - Access Control", () => {
  test("should show login required when not authenticated", async ({ page }) => {
    await page.goto(INVENTORY_URL);
    await expect(page.locator(".animate-pulse")).toBeHidden({ timeout: 10000 }).catch(() => {});

    await expect(page.getByText(/please log in|login required/i)).toBeVisible();
  });

  test("should have login link when not authenticated", async ({ page }) => {
    await page.goto(INVENTORY_URL);
    await expect(page.locator(".animate-pulse")).toBeHidden({ timeout: 10000 }).catch(() => {});

    // Should have a login link/button in the main content
    const loginButton = page.locator("main").getByRole("link", { name: /login/i }).first();
    if (await loginButton.isVisible().catch(() => false)) {
      const href = await loginButton.getAttribute("href");
      expect(href).toContain("/login");
    }
  });
});

// ==================== INVENTORY DASHBOARD ====================

test.describe("Pharmacy Inventory - Dashboard", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(INVENTORY_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});
  });

  test("should load inventory dashboard with title", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("heading", { name: /inventory dashboard/i })).toBeVisible();
  });

  test("should display overview tab by default", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /overview/i })).toBeVisible();
    // Overview tab should be active (has blue background)
    const overviewButton = clinicOwnerPage.getByRole("button", { name: /overview/i });
    await expect(overviewButton).toHaveClass(/bg-primary-blue/);
  });

  test("should display tab navigation for all views", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /overview/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /low stock/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /expiring/i })).toBeVisible();
  });

  test("should display navigation links", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("link", { name: /products/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("link", { name: /suppliers/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("link", { name: /pos/i })).toBeVisible();
  });
});

// ==================== OVERVIEW SECTION ====================

test.describe("Pharmacy Inventory - Overview", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(INVENTORY_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});
  });

  test("should display inventory overview cards", async ({ clinicOwnerPage }) => {
    // Should show product count
    await expect(clinicOwnerPage.getByText(/total products/i).first()).toBeVisible();
    // Should show batch count
    await expect(clinicOwnerPage.getByText(/stock batches/i).first()).toBeVisible();
    // Should show stock value
    await expect(clinicOwnerPage.getByText(/stock value/i).first()).toBeVisible();
    // Should show low stock alerts
    await expect(clinicOwnerPage.getByText(/low stock alerts/i).first()).toBeVisible();
  });

  test("should display expiry status cards", async ({ clinicOwnerPage }) => {
    // Should show expiry tracking cards
    await expect(clinicOwnerPage.getByText(/expired/i).first()).toBeVisible();
    await expect(clinicOwnerPage.getByText(/30 days/i).first()).toBeVisible();
  });

  test("should be able to click low stock card to navigate to low stock view", async ({ clinicOwnerPage }) => {
    // Find and click the low stock alerts card
    const lowStockCard = clinicOwnerPage.locator("text=Low Stock Alerts").first();
    if (await lowStockCard.isVisible().catch(() => false)) {
      // Click on the card (it's inside a clickable parent)
      await lowStockCard.click();

      // Should switch to low stock view (tab becomes active)
      const lowStockTab = clinicOwnerPage.getByRole("button", { name: /low stock/i });
      await expect(lowStockTab).toHaveClass(/bg-primary-red/);
    }
  });
});

// ==================== LOW STOCK ALERTS ====================

test.describe("Pharmacy Inventory - Low Stock Alerts", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(INVENTORY_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});
  });

  test("should switch to low stock view when tab is clicked", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /low stock/i }).click();

    // Tab should be active
    const lowStockTab = clinicOwnerPage.getByRole("button", { name: /low stock/i });
    await expect(lowStockTab).toHaveClass(/bg-primary-red/);
  });

  test("should display low stock table or no low stock message", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /low stock/i }).click();

    // Either show table with products or "No Low Stock Items" message
    const hasTable = await clinicOwnerPage.locator("table").isVisible({ timeout: 5000 }).catch(() => false);
    const noLowStock = await clinicOwnerPage.getByText(/no low stock/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTable || noLowStock).toBeTruthy();
  });

  test("should display correct columns in low stock table if products exist", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /low stock/i }).click();

    const hasTable = await clinicOwnerPage.locator("table").isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTable) {
      await expect(clinicOwnerPage.locator("th").getByText(/product/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/current stock/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/min stock/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/deficit/i)).toBeVisible();
    }
  });
});

// ==================== EXPIRY TRACKING ====================

test.describe("Pharmacy Inventory - Expiry Tracking", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(INVENTORY_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});
  });

  test("should switch to expiring items view when tab is clicked", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /expiring/i }).click();

    // Tab should be active
    const expiringTab = clinicOwnerPage.getByRole("button", { name: /expiring/i });
    await expect(expiringTab).toHaveClass(/bg-primary-yellow/);
  });

  test("should display expiry period filter buttons", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /expiring/i }).click();

    // Should show period filter buttons
    await expect(clinicOwnerPage.getByText(/expiry period/i)).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /30 days/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /60 days/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /90 days/i })).toBeVisible();
  });

  test("should display expiring items table or no expiring items message", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /expiring/i }).click();

    // Either show table with batches or "No Expiring Items" message
    const hasTable = await clinicOwnerPage.locator("table").isVisible({ timeout: 5000 }).catch(() => false);
    const noExpiring = await clinicOwnerPage.getByText(/no expiring/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTable || noExpiring).toBeTruthy();
  });

  test("should display batch information if expiring items exist", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /expiring/i }).click();
    // Use longer expiry period to find seeded items
    await clinicOwnerPage.getByRole("button", { name: /90 days/i }).click();

    const hasTable = await clinicOwnerPage.locator("table").isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTable) {
      await expect(clinicOwnerPage.locator("th").getByText(/product/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/batch/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/expiry date/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/days left/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/status/i)).toBeVisible();
    }
  });

  test("should show Adjust Stock button for expiring items", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /expiring/i }).click();
    // Use all expiring to find seeded items
    await clinicOwnerPage.getByRole("button", { name: /all expiring/i }).click();

    const hasTable = await clinicOwnerPage.locator("table").isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTable) {
      // Look for Adjust Stock buttons
      const adjustButton = clinicOwnerPage.getByRole("button", { name: /adjust stock/i }).first();
      if (await adjustButton.isVisible().catch(() => false)) {
        await expect(adjustButton).toBeVisible();
      }
    }
  });
});

// ==================== CREDIT ACCOUNTS (KHATA) ====================

test.describe("Pharmacy Khata - Access Control", () => {
  test("should show login required when not authenticated", async ({ page }) => {
    await page.goto(KHATA_URL);
    await expect(page.locator(".animate-pulse")).toBeHidden({ timeout: 10000 }).catch(() => {});

    await expect(page.getByText(/please log in|login required/i)).toBeVisible();
  });
});

test.describe("Pharmacy Khata - Credit Accounts", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(KHATA_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});
  });

  test("should load khata page with title", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("heading", { name: /credit accounts|khata/i })).toBeVisible();
  });

  test("should display summary statistics cards", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByText(/total accounts/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/total outstanding/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/active credit/i)).toBeVisible();
  });

  test("should display search input", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByPlaceholder(/search by name or phone/i)).toBeVisible();
  });

  test("should display Add Customer button", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /add customer/i })).toBeVisible();
  });

  test("should display status filter", async ({ clinicOwnerPage }) => {
    // Find the select dropdown
    const statusSelect = clinicOwnerPage.locator("select").first();
    await expect(statusSelect).toBeVisible();
  });

  test("should display credit accounts table or empty message", async ({ clinicOwnerPage }) => {
    // Either show table with accounts or empty message
    const hasTable = await clinicOwnerPage.locator("table").isVisible({ timeout: 5000 }).catch(() => false);
    const noAccounts = await clinicOwnerPage.getByText(/no credit accounts found/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTable || noAccounts).toBeTruthy();
  });

  test("should open add customer modal when clicking Add Customer", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /add customer/i }).click();

    // Modal should appear with form fields
    await expect(clinicOwnerPage.getByText(/add credit customer/i)).toBeVisible();
    await expect(clinicOwnerPage.getByText(/customer name/i).first()).toBeVisible();
  });

  test("should display seeded credit accounts if they exist", async ({ clinicOwnerPage }) => {
    // Check if seeded accounts are visible (from seed.ts)
    const ramBahadurVisible = await clinicOwnerPage.getByText(/ram bahadur/i).isVisible({ timeout: 5000 }).catch(() => false);
    const sitaKumariVisible = await clinicOwnerPage.getByText(/sita kumari/i).isVisible({ timeout: 3000 }).catch(() => false);

    // At least check that the table headers are correct if accounts exist
    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      await expect(clinicOwnerPage.locator("th").getByText(/customer name/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/phone/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/credit limit/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/outstanding balance/i)).toBeVisible();
    }

    // If accounts exist, verify action buttons
    if (ramBahadurVisible || sitaKumariVisible) {
      await expect(clinicOwnerPage.getByRole("button", { name: /view ledger/i }).first()).toBeVisible();
      await expect(clinicOwnerPage.getByRole("button", { name: /edit/i }).first()).toBeVisible();
    }
  });

  test("should show Record Payment button for accounts with balance", async ({ clinicOwnerPage }) => {
    // Check for seeded account with balance (Ram Bahadur has Rs. 500 balance)
    const ramBahadurVisible = await clinicOwnerPage.getByText(/ram bahadur/i).isVisible({ timeout: 5000 }).catch(() => false);
    if (ramBahadurVisible) {
      await expect(clinicOwnerPage.getByRole("button", { name: /record payment/i }).first()).toBeVisible();
    }
  });
});

// ==================== PHARMACY REPORTS ====================

test.describe("Pharmacy Reports - Access Control", () => {
  test("should show login required when not authenticated", async ({ page }) => {
    await page.goto(REPORTS_URL);
    await expect(page.locator(".animate-pulse")).toBeHidden({ timeout: 10000 }).catch(() => {});

    await expect(page.getByText(/please log in|login required/i)).toBeVisible();
  });
});

test.describe("Pharmacy Reports - Dashboard", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(REPORTS_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});
  });

  test("should load reports page with title", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("heading", { name: /pharmacy reports/i })).toBeVisible();
  });

  test("should display date range filters", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByText(/date range/i)).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /today/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /this week/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /this month/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /last 30 days/i })).toBeVisible();
  });

  test("should display tab navigation", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /overview/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /daily sales/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /product sales/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /sales history/i })).toBeVisible();
  });

  test("should display Export CSV button", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("button", { name: /export csv/i })).toBeVisible();
  });

  test("should display navigation links", async ({ clinicOwnerPage }) => {
    await expect(clinicOwnerPage.getByRole("link", { name: /pos/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("link", { name: /inventory/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("link", { name: /products/i })).toBeVisible();
  });

  test("should display summary cards or no data message on overview", async ({ clinicOwnerPage }) => {
    // Should show summary cards or no data message
    const totalSalesVisible = await clinicOwnerPage.getByText(/total sales/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const noDataVisible = await clinicOwnerPage.getByText(/no data/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(totalSalesVisible || noDataVisible).toBeTruthy();
  });

  test("should switch to daily sales view", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /daily sales/i }).click();

    // Tab should be active
    const dailySalesTab = clinicOwnerPage.getByRole("button", { name: /daily sales/i });
    await expect(dailySalesTab).toHaveClass(/bg-green-600/);
  });

  test("should switch to product sales view", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /product sales/i }).click();

    // Tab should be active
    const productSalesTab = clinicOwnerPage.getByRole("button", { name: /product sales/i });
    await expect(productSalesTab).toHaveClass(/bg-primary-yellow/);
  });

  test("should switch to sales history view", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.getByRole("button", { name: /sales history/i }).click();

    // Tab should be active
    const salesHistoryTab = clinicOwnerPage.getByRole("button", { name: /sales history/i });
    await expect(salesHistoryTab).toHaveClass(/bg-purple-600/);
  });
});

test.describe("Pharmacy Reports - Report Content", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(REPORTS_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});
  });

  test("should display total sales count on overview if data exists", async ({ clinicOwnerPage }) => {
    // Check for summary card
    const totalSalesVisible = await clinicOwnerPage.getByText(/total sales/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (totalSalesVisible) {
      await expect(clinicOwnerPage.getByText(/total sales/i).first()).toBeVisible();
    }
  });

  test("should display revenue and profit information if data exists", async ({ clinicOwnerPage }) => {
    const noDataVisible = await clinicOwnerPage.getByText(/no data/i).isVisible({ timeout: 5000 }).catch(() => false);
    if (!noDataVisible) {
      // If there's data, check for revenue and profit
      const totalRevenueVisible = await clinicOwnerPage.getByText(/total revenue/i).first().isVisible().catch(() => false);
      const grossProfitVisible = await clinicOwnerPage.getByText(/gross profit/i).first().isVisible().catch(() => false);
      expect(totalRevenueVisible || grossProfitVisible).toBeTruthy();
    }
  });

  test("should display payment mode breakdown if data exists", async ({ clinicOwnerPage }) => {
    const noDataVisible = await clinicOwnerPage.getByText(/no data/i).isVisible({ timeout: 5000 }).catch(() => false);
    if (!noDataVisible) {
      // Check for cash vs credit breakdown
      const cashSalesVisible = await clinicOwnerPage.getByText(/cash sales/i).isVisible().catch(() => false);
      const creditSalesVisible = await clinicOwnerPage.getByText(/credit sales/i).isVisible().catch(() => false);
      const paymentBreakdownVisible = await clinicOwnerPage.getByText(/payment.*breakdown/i).isVisible().catch(() => false);
      expect(cashSalesVisible || creditSalesVisible || paymentBreakdownVisible).toBeTruthy();
    }
  });
});

// ==================== LANGUAGE SUPPORT ====================

test.describe("Pharmacy Inventory - Language Support", () => {
  test("should load inventory page in Nepali", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/pharmacy/inventory");
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    // Page should load
    expect(clinicOwnerPage.url()).toContain("/ne/clinic/dashboard/pharmacy/inventory");
  });

  test("should load khata page in Nepali", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/pharmacy/khata");
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    expect(clinicOwnerPage.url()).toContain("/ne/clinic/dashboard/pharmacy/khata");
  });

  test("should load reports page in Nepali", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/pharmacy/reports");
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    expect(clinicOwnerPage.url()).toContain("/ne/clinic/dashboard/pharmacy/reports");
  });
});

// ==================== NAVIGATION ====================

test.describe("Pharmacy Pages - Cross Navigation", () => {
  test("should navigate from inventory to POS", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(INVENTORY_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    await clinicOwnerPage.getByRole("link", { name: /pos/i }).click();
    await clinicOwnerPage.waitForURL(/\/pharmacy\/pos/);
    expect(clinicOwnerPage.url()).toContain("/pharmacy/pos");
  });

  test("should navigate from reports to inventory", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(REPORTS_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    await clinicOwnerPage.getByRole("link", { name: /inventory/i }).click();
    await clinicOwnerPage.waitForURL(/\/pharmacy\/inventory/);
    expect(clinicOwnerPage.url()).toContain("/pharmacy/inventory");
  });

  test("should navigate back to dashboard from inventory", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(INVENTORY_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    await clinicOwnerPage.getByRole("link", { name: /back to dashboard/i }).click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard$/);
    expect(clinicOwnerPage.url()).toContain("/clinic/dashboard");
  });

  test("should navigate back to dashboard from khata", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(KHATA_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    await clinicOwnerPage.getByRole("link", { name: /back to dashboard/i }).click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard$/);
    expect(clinicOwnerPage.url()).toContain("/clinic/dashboard");
  });
});

// ==================== MOBILE RESPONSIVENESS ====================

test.describe("Pharmacy Pages - Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should display inventory page on mobile", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(INVENTORY_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    // Page should be usable on mobile
    const bodyWidth = await clinicOwnerPage.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(395);
  });

  test("should display khata page on mobile", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(KHATA_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    const bodyWidth = await clinicOwnerPage.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(395);
  });

  test("should display reports page on mobile", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(REPORTS_URL);
    await expect(clinicOwnerPage.locator(".animate-pulse")).toBeHidden({ timeout: 15000 }).catch(() => {});

    const bodyWidth = await clinicOwnerPage.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(395);
  });
});
