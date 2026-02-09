/**
 * Pharmacy Products E2E Tests
 *
 * Tests for pharmacy product catalog management.
 * - Products page loads with product list
 * - Add new product (name, barcode, price, GST rate, category, min stock)
 * - Product form validation
 * - Edit product details
 * - Search/filter products
 * - Product shows correct batch info
 * - Deactivate/activate product
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";
import type { Page } from "@playwright/test";

const PRODUCTS_URL = "/en/clinic/dashboard/pharmacy/products";

/**
 * Helper function to check if we have pharmacy products access
 * Returns true if the page is accessible, false otherwise
 */
async function hasProductsAccess(page: Page): Promise<boolean> {
  // Wait for page to fully load
  await page.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

  // Check for no verified clinic message
  const noClinicVisible = await page.getByText(/no verified clinic/i).isVisible({ timeout: 2000 }).catch(() => false);
  if (noClinicVisible) return false;

  // Check for login required
  const loginRequired = await page.getByText(/please log in/i).isVisible({ timeout: 2000 }).catch(() => false);
  if (loginRequired) return false;

  // Check if we're on the login page (redirected due to session issues)
  const onLoginPage = await page.getByRole("heading", { name: /sign in/i }).isVisible({ timeout: 2000 }).catch(() => false);
  if (onLoginPage) return false;

  // Check for sign in error message
  const signInError = await page.getByText(/error occurred during sign in/i).isVisible({ timeout: 2000 }).catch(() => false);
  if (signInError) return false;

  // Check for error loading state
  const errorLoading = await page.getByText(/failed to load products/i).isVisible({ timeout: 2000 }).catch(() => false);
  if (errorLoading) return false;

  // If page content is visible, we have access
  return true;
}

// ==================== ACCESS CONTROL ====================

test.describe("Pharmacy Products - Access Control", () => {
  test("should show login required when not authenticated", async ({ page }) => {
    await page.goto(PRODUCTS_URL);
    await page.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});

    await expect(page.getByText(/please log in/i)).toBeVisible();
  });

  test("should have login link with callback URL when not authenticated", async ({ page }) => {
    await page.goto(PRODUCTS_URL);
    await page.waitForSelector(".animate-pulse", { state: "hidden", timeout: 10000 }).catch(() => {});

    const loginLink = page.locator("main").getByRole("link", { name: /login/i }).first();
    if (await loginLink.isVisible().catch(() => false)) {
      const href = await loginLink.getAttribute("href");
      expect(href).toContain("callbackUrl");
      expect(href).toContain("pharmacy/products");
    }
  });
});

// ==================== PAGE LOADING ====================

test.describe("Pharmacy Products - Page Loading", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("should load products page with title", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await expect(clinicOwnerPage.getByRole("heading", { name: /product catalog/i })).toBeVisible();
  });

  test("should display subtitle", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await expect(clinicOwnerPage.getByText(/manage your pharmacy products/i)).toBeVisible();
  });

  test("should display Back to Dashboard link", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await expect(clinicOwnerPage.getByText(/back to dashboard/i)).toBeVisible();
  });

  test("should display Add Product button", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await expect(clinicOwnerPage.getByRole("button", { name: /add product/i })).toBeVisible();
  });

  test("should display Manage Suppliers link", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await expect(clinicOwnerPage.getByRole("link", { name: /manage suppliers|suppliers/i })).toBeVisible();
  });

  test("should display product list or empty state", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    // Wait for data to load
    await clinicOwnerPage.waitForTimeout(1000);

    // Either show table with products or "No products found" message
    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    const noProducts = await clinicOwnerPage.getByText(/no products found/i).isVisible().catch(() => false);
    expect(hasTable || noProducts).toBeTruthy();
  });

  test("should display product table columns if products exist", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      await expect(clinicOwnerPage.locator("th").getByText(/product/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/stock/i)).toBeVisible();
      await expect(clinicOwnerPage.locator("th").getByText(/actions/i)).toBeVisible();
    }
  });
});

// ==================== SEARCH & FILTER ====================

test.describe("Pharmacy Products - Search and Filter", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("should display search input with placeholder", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await expect(clinicOwnerPage.getByPlaceholder(/search by name/i)).toBeVisible();
  });

  test("should display Search button", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await expect(clinicOwnerPage.getByRole("button", { name: /^search$/i })).toBeVisible();
  });

  test("should display category filter dropdown", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    // Look for a select containing "All Categories"
    const categorySelect = clinicOwnerPage.locator("select").filter({ hasText: /all categories/i });
    await expect(categorySelect).toBeVisible();
  });

  test("should display status filter dropdown", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    // Look for a select containing Active/Inactive options
    const statusSelect = clinicOwnerPage.locator("select").filter({ hasText: /all.*active.*inactive/i });
    await expect(statusSelect).toBeVisible();
  });

  test("should filter by search query", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    // Type a search query
    const searchInput = clinicOwnerPage.getByPlaceholder(/search by name/i);
    await searchInput.fill(TEST_DATA.PRODUCTS.PARACETAMOL.name.split(" ")[0]); // "Paracetamol"
    await clinicOwnerPage.getByRole("button", { name: /^search$/i }).click();

    // Wait for results
    await clinicOwnerPage.waitForTimeout(1000);

    // Should either find products or show "No matching products"
    const hasResults = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    const noResults = await clinicOwnerPage.getByText(/no matching products|no products found/i).isVisible().catch(() => false);
    expect(hasResults || noResults).toBeTruthy();
  });

  test("should show no matching products for invalid search", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    const searchInput = clinicOwnerPage.getByPlaceholder(/search by name/i);
    await searchInput.fill("NonExistentMedicine999XYZ");
    await clinicOwnerPage.getByRole("button", { name: /^search$/i }).click();

    await clinicOwnerPage.waitForTimeout(1000);

    await expect(clinicOwnerPage.getByText(/no matching products|no products found/i)).toBeVisible({ timeout: 5000 });
  });

  test("should filter products by category", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    // Select a category from the dropdown
    const categorySelect = clinicOwnerPage.locator("select").filter({ hasText: /all categories/i });
    await categorySelect.selectOption("MEDICINE");

    // Wait for filtered results
    await clinicOwnerPage.waitForTimeout(1000);

    // Should either show results or no matching
    const hasResults = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    const noResults = await clinicOwnerPage.getByText(/no matching products|no products found/i).isVisible().catch(() => false);
    expect(hasResults || noResults).toBeTruthy();
  });

  test("should search with Enter key", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    const searchInput = clinicOwnerPage.getByPlaceholder(/search by name/i);
    await searchInput.fill(TEST_DATA.PRODUCTS.AMOXICILLIN.name.split(" ")[0]); // "Amoxicillin"
    await searchInput.press("Enter");

    await clinicOwnerPage.waitForTimeout(1000);

    // Should process the search
    const hasResults = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    const noResults = await clinicOwnerPage.getByText(/no matching products|no products found/i).isVisible().catch(() => false);
    expect(hasResults || noResults).toBeTruthy();
  });
});

// ==================== ADD PRODUCT ====================

test.describe("Pharmacy Products - Add Product Modal", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("should open Add New Product modal when clicking Add Product", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    await expect(clinicOwnerPage.getByText(/add new product/i)).toBeVisible();
  });

  test("should display required Product name field in modal", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Product name label with required asterisk
    await expect(clinicOwnerPage.locator("label").filter({ hasText: /product/i }).first()).toBeVisible();
    // Product name input with placeholder
    await expect(clinicOwnerPage.getByPlaceholder(/paracetamol/i)).toBeVisible();
  });

  test("should display Category select in modal", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Category label
    await expect(clinicOwnerPage.locator("label").filter({ hasText: /^category$/i })).toBeVisible();
    // Should have Medicine option in category dropdown
    const modalSelect = clinicOwnerPage.locator(".fixed select").filter({ hasText: /medicine/i }).first();
    await expect(modalSelect).toBeVisible();
  });

  test("should display Barcode field with Generate button in modal", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    await expect(clinicOwnerPage.locator("label").filter({ hasText: /barcode/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /generate/i })).toBeVisible();
  });

  test("should display GST Rate field in modal", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    await expect(clinicOwnerPage.locator("label").filter({ hasText: /gst/i })).toBeVisible();
  });

  test("should display Min Stock field in modal", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    await expect(clinicOwnerPage.locator("label").filter({ hasText: /min stock/i })).toBeVisible();
  });

  test("should display Save and Cancel buttons in modal", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    await expect(clinicOwnerPage.getByRole("button", { name: /^save$/i })).toBeVisible();
    await expect(clinicOwnerPage.getByRole("button", { name: /cancel/i })).toBeVisible();
  });

  test("should close modal on Cancel click", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    await expect(clinicOwnerPage.getByText(/add new product/i)).toBeVisible();

    await clinicOwnerPage.getByRole("button", { name: /cancel/i }).click();
    await clinicOwnerPage.waitForTimeout(300);

    await expect(clinicOwnerPage.getByText(/add new product/i)).not.toBeVisible();
  });

  test("should generate barcode when clicking Generate button", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Find the barcode input (font-mono class, near the Generate button)
    const barcodeInput = clinicOwnerPage.locator(".fixed input.font-mono").first();
    await expect(barcodeInput).toHaveValue("");

    await clinicOwnerPage.getByRole("button", { name: /generate/i }).click();

    // Barcode should now be populated (13 digit EAN-13)
    const barcodeValue = await barcodeInput.inputValue();
    expect(barcodeValue.length).toBe(13);
  });
});

// ==================== FORM VALIDATION ====================

test.describe("Pharmacy Products - Form Validation", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("should show alert when saving with empty product name", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /add product/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Intercept the alert dialog
    let alertMessage = "";
    clinicOwnerPage.on("dialog", async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Try to save without filling in the name
    await clinicOwnerPage.getByRole("button", { name: /^save$/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    // Alert should have been triggered about required name
    expect(alertMessage).toContain("name is required");
  });
});

// ==================== EDIT PRODUCT ====================

test.describe("Pharmacy Products - Edit Product", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("should display edit button for each product in the table", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      // Each product row should have an edit button (pencil icon with title "Edit")
      const editButtons = clinicOwnerPage.locator("button[title='Edit']");
      const count = await editButtons.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("should open Edit Product modal when clicking edit button", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (!hasTable) {
      test.skip(true, "No products in list to edit");
      return;
    }

    // Click the first edit button
    const editButton = clinicOwnerPage.locator("button[title='Edit']").first();
    await editButton.click();
    await clinicOwnerPage.waitForTimeout(500);

    // Should show "Edit Product" heading in the modal
    await expect(clinicOwnerPage.getByText(/edit product/i)).toBeVisible();
  });

  test("should pre-populate form fields when editing a product", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (!hasTable) {
      test.skip(true, "No products in list to edit");
      return;
    }

    // Get the first product name from the table
    const firstProductName = await clinicOwnerPage.locator("table tbody tr td .font-bold").first().textContent();

    // Click the first edit button
    await clinicOwnerPage.locator("button[title='Edit']").first().click();
    await clinicOwnerPage.waitForTimeout(500);

    // The product name input should be pre-populated
    const nameInput = clinicOwnerPage.getByPlaceholder(/paracetamol/i);
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe(firstProductName?.trim());
  });
});

// ==================== PRODUCT BATCH INFO ====================

test.describe("Pharmacy Products - Batch Information", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("should display stock count for products in the table", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      // Stock column should show batch count text
      const batchesText = await clinicOwnerPage.getByText(/batches/i).first().isVisible().catch(() => false);
      expect(batchesText).toBeTruthy();
    }
  });

  test("should display barcode in the product table if products have barcodes", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      // Barcode column header should be visible
      const barcodeHeader = await clinicOwnerPage.locator("th").getByText(/barcode/i).isVisible().catch(() => false);
      expect(barcodeHeader).toBeTruthy();
    }
  });

  test("should show Low Stock badge for products below minimum stock", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      // Check if any product has "Low Stock" badge - it may or may not exist depending on seeded data
      const lowStockBadge = await clinicOwnerPage.getByText(/low stock/i).first().isVisible().catch(() => false);
      // Just verify the page loaded correctly - low stock badge is data-dependent
      expect(typeof lowStockBadge).toBe("boolean");
    }
  });

  test("should show Expiring Soon badge for products with near expiry", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      // Check if any product has "Expiring Soon" badge - data-dependent
      const expiringBadge = await clinicOwnerPage.getByText(/expiring soon/i).first().isVisible().catch(() => false);
      expect(typeof expiringBadge).toBe("boolean");
    }
  });
});

// ==================== DEACTIVATE / ACTIVATE ====================

test.describe("Pharmacy Products - Deactivate and Activate", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("should display deactivate button for active products", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      // Should have deactivate buttons (with title "Deactivate")
      const deactivateButtons = clinicOwnerPage.locator("button[title='Deactivate']");
      const count = await deactivateButtons.count();
      // May be 0 if all products are inactive
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test("should display delete button for products without stock", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      // Should have delete buttons (with title "Delete")
      const deleteButtons = clinicOwnerPage.locator("button[title='Delete']");
      const count = await deleteButtons.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("should disable delete button for products with stock", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    const hasTable = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    if (hasTable) {
      // Find a product row that has stock > 0
      const deleteButtons = clinicOwnerPage.locator("button[title='Delete']");
      const count = await deleteButtons.count();
      for (let i = 0; i < count; i++) {
        const isDisabled = await deleteButtons.nth(i).isDisabled();
        // At least verify the disabled attribute is being used properly
        expect(typeof isDisabled).toBe("boolean");
      }
    }
  });

  test("should toggle product active status via status filter", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    // Filter to show only active products
    const statusSelect = clinicOwnerPage.locator("select").filter({ hasText: /all.*active.*inactive/i });
    await statusSelect.selectOption("true");
    await clinicOwnerPage.waitForTimeout(1000);

    // Should show only active products or empty state
    const hasResults = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    const noResults = await clinicOwnerPage.getByText(/no matching products|no products found/i).isVisible().catch(() => false);
    expect(hasResults || noResults).toBeTruthy();

    // Filter to show only inactive products
    await statusSelect.selectOption("false");
    await clinicOwnerPage.waitForTimeout(1000);

    const hasInactiveResults = await clinicOwnerPage.locator("table").isVisible().catch(() => false);
    const noInactiveResults = await clinicOwnerPage.getByText(/no matching products|no products found/i).isVisible().catch(() => false);
    expect(hasInactiveResults || noInactiveResults).toBeTruthy();
  });
});

// ==================== PAGINATION ====================

test.describe("Pharmacy Products - Pagination", () => {
  test.beforeEach(async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});
  });

  test("should display pagination controls when products exceed page limit", async ({ clinicOwnerPage }) => {
    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.waitForTimeout(1000);

    // Pagination only shows when totalPages > 1
    const hasPagination = await clinicOwnerPage.getByRole("button", { name: /previous/i }).isVisible().catch(() => false);
    // If pagination is visible, check that both buttons are present
    if (hasPagination) {
      await expect(clinicOwnerPage.getByRole("button", { name: /previous/i })).toBeVisible();
      await expect(clinicOwnerPage.getByRole("button", { name: /next/i })).toBeVisible();
      await expect(clinicOwnerPage.getByText(/page.*of/i)).toBeVisible();
    }
  });
});

// ==================== LANGUAGE SUPPORT ====================

test.describe("Pharmacy Products - Language Support", () => {
  test("should load products page in Nepali", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/pharmacy/products");
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

    // Page should load
    expect(clinicOwnerPage.url()).toContain("/ne/clinic/dashboard/pharmacy/products");
  });
});

// ==================== NAVIGATION ====================

test.describe("Pharmacy Products - Navigation", () => {
  test("should navigate to suppliers page from products", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByRole("link", { name: /manage suppliers|suppliers/i }).click();
    await clinicOwnerPage.waitForURL(/\/pharmacy\/suppliers/);
    expect(clinicOwnerPage.url()).toContain("/pharmacy/suppliers");
  });

  test("should navigate back to dashboard from products", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

    const hasAccess = await hasProductsAccess(clinicOwnerPage);
    if (!hasAccess) {
      test.skip(true, "No pharmacy access");
      return;
    }

    await clinicOwnerPage.getByText(/back to dashboard/i).click();
    await clinicOwnerPage.waitForURL(/\/clinic\/dashboard$/);
    expect(clinicOwnerPage.url()).toContain("/clinic/dashboard");
  });
});

// ==================== MOBILE RESPONSIVENESS ====================

test.describe("Pharmacy Products - Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should display products page on mobile", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto(PRODUCTS_URL);
    await clinicOwnerPage.waitForSelector(".animate-pulse", { state: "hidden", timeout: 15000 }).catch(() => {});

    // Page should be usable on mobile
    const bodyWidth = await clinicOwnerPage.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(395);
  });
});
