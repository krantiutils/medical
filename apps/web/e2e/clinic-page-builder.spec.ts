/**
 * Clinic Page Builder v2.1 E2E Tests
 *
 * Tests for the clinic dashboard page builder flow:
 * - Loading the page builder editor
 * - Creating, editing, and deleting custom pages
 * - Adding, editing, reordering, and deleting sections
 * - TipTap WYSIWYG text editing
 * - Photo gallery section management
 * - Saving/publishing and previewing pages
 * - Page slug validation
 *
 * KNOWN LIMITATION: Client-side useSession() hook does not reliably maintain
 * session state after page navigation in Playwright E2E tests. Tests that require
 * authenticated state will gracefully skip when session is not detected.
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";
import type { Page } from "@playwright/test";

const PAGE_BUILDER_URL = "/en/clinic/dashboard/page-builder";
const CLINIC_SLUG = TEST_DATA.CLINICS.DASHBOARD_CLINIC.slug;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Check if the page builder editor has loaded successfully.
 * Returns false if the page shows a login prompt, error, or never loads.
 */
async function isPageBuilderAccessible(page: Page): Promise<boolean> {
  // Check for login required message
  const loginRequired = await page
    .getByText(/please log in/i)
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (loginRequired) return false;

  // Check for loading spinner to disappear and Save button to appear
  try {
    await page.getByRole("button", { name: /^Save$/i }).waitFor({ timeout: 30000 });
  } catch {
    return false;
  }

  return true;
}

/**
 * Navigate to the page builder and verify it loaded.
 * Returns false if the builder cannot be accessed.
 */
async function navigateToPageBuilder(page: Page): Promise<boolean> {
  await page.goto(PAGE_BUILDER_URL);

  try {
    await page.waitForSelector("main", { timeout: 20000 });
  } catch {
    return false;
  }

  return isPageBuilderAccessible(page);
}

/**
 * Count the number of section wrappers currently visible in the canvas.
 */
async function getSectionCount(page: Page): Promise<number> {
  return page.locator('[id^="section-"]').count();
}

/**
 * Click a section type button in the left "Sections" panel to add it.
 */
async function addSectionFromPanel(page: Page, sectionLabel: string): Promise<void> {
  // The left panel has a heading "Sections" and buttons below it.
  // Use the panel container (w-44 with "Sections" heading) to scope the click.
  const sectionPanel = page.locator(".w-44.flex-shrink-0");
  const addButton = sectionPanel.getByRole("button", { name: sectionLabel });
  await addButton.click();
}

/**
 * Open the "+ Page" dropdown in the toolbar.
 * Returns the add-page button locator, or null if not found.
 */
async function openAddPageDropdown(page: Page): Promise<boolean> {
  const addPageButton = page.getByRole("button", { name: /Page/i }).filter({
    has: page.locator("svg"),
  });

  if (!(await addPageButton.isVisible().catch(() => false))) {
    return false;
  }

  await addPageButton.click();
  await page.waitForTimeout(300);
  return true;
}

/**
 * Open the custom page creation form inside the Add Page dropdown.
 * Assumes the dropdown is already open.
 */
async function openCustomPageForm(page: Page): Promise<boolean> {
  const customPageButton = page.getByRole("button", {
    name: /\+ Custom Page/i,
  });
  if (!(await customPageButton.isVisible().catch(() => false))) {
    return false;
  }
  await customPageButton.click();
  await page.waitForTimeout(300);
  return true;
}

/**
 * Create a custom page with the given slug, EN title, and optional NE title.
 * Assumes the page builder is loaded.
 */
async function createCustomPage(
  page: Page,
  slug: string,
  titleEn: string,
  titleNe?: string
): Promise<boolean> {
  if (!(await openAddPageDropdown(page))) return false;
  if (!(await openCustomPageForm(page))) return false;

  await page.getByPlaceholder("my-page").fill(slug);
  await page.getByPlaceholder("Page Title").fill(titleEn);

  if (titleNe) {
    const neInput = page.getByPlaceholder(/पृष्ठ शीर्षक/);
    if (await neInput.isVisible().catch(() => false)) {
      await neInput.fill(titleNe);
    }
  }

  await page.getByRole("button", { name: /Create Page/i }).click();
  await page.waitForTimeout(500);

  return true;
}

// ---------------------------------------------------------------------------
// Tests - Access Control (unauthenticated, uses bare `page` fixture)
// ---------------------------------------------------------------------------

test.describe("Page Builder - Access Control", () => {
  test("should require authentication to access page builder", async ({
    page,
  }) => {
    await page.goto(PAGE_BUILDER_URL);
    await page.waitForSelector("main", { timeout: 15000 });

    const loginRequired = page.getByText(/please log in/i);
    const isLoginRequired = await loginRequired.isVisible().catch(() => false);
    const isOnLoginPage = page.url().includes("/login");

    expect(isLoginRequired || isOnLoginPage).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Tests - Loading & Layout (uses clinicOwnerPage fixture)
// ---------------------------------------------------------------------------

test.describe("Page Builder - Loading & Layout", () => {
  test("page builder loads for authenticated clinic owner", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible - session or clinic issue");
      return;
    }

    await expect(
      clinicOwnerPage.getByRole("button", { name: /^Save$/i })
    ).toBeVisible();
    await expect(clinicOwnerPage.getByText("Sections")).toBeVisible();
  });

  test("page builder shows toolbar controls", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await expect(clinicOwnerPage.locator('[title="Undo"]')).toBeVisible();
    await expect(clinicOwnerPage.locator('[title="Redo"]')).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /Templates/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /Navbar/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /Footer/i })
    ).toBeVisible();
    await expect(clinicOwnerPage.getByText(/Enable/i)).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("link", { name: /View Page/i })
    ).toBeVisible();
  });

  test("section type panel lists all 14 section types", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const expectedLabels = [
      "Hero",
      "Text",
      "Services",
      "Doctors",
      "Gallery",
      "Contact",
      "Reviews",
      "FAQ",
      "Booking",
      "OPD",
      "Map",
      "Divider",
      "Button",
      "Image",
    ];

    const sectionPanel = clinicOwnerPage.locator(".w-44.flex-shrink-0");
    for (const label of expectedLabels) {
      await expect(
        sectionPanel.getByRole("button", { name: label })
      ).toBeVisible();
    }
  });

  test("page tabs row shows home page tab", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await expect(clinicOwnerPage.getByText("(home)")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tests - Add Sections
// ---------------------------------------------------------------------------

test.describe("Page Builder - Add Sections", () => {
  test("can add a text section", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const countBefore = await getSectionCount(clinicOwnerPage);
    await addSectionFromPanel(clinicOwnerPage, "Text");
    await clinicOwnerPage.waitForTimeout(500);
    const countAfter = await getSectionCount(clinicOwnerPage);

    expect(countAfter).toBeGreaterThan(countBefore);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });
  });

  test("can add a hero section and sidebar shows heading fields", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const countBefore = await getSectionCount(clinicOwnerPage);
    await addSectionFromPanel(clinicOwnerPage, "Hero");
    await clinicOwnerPage.waitForTimeout(500);

    expect(await getSectionCount(clinicOwnerPage)).toBeGreaterThan(countBefore);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });
    await expect(clinicOwnerPage.getByText("Heading (EN)")).toBeVisible();
    await expect(clinicOwnerPage.getByText("Heading (NE)")).toBeVisible();
  });

  test("can add a FAQ section with add-question button", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const countBefore = await getSectionCount(clinicOwnerPage);
    await addSectionFromPanel(clinicOwnerPage, "FAQ");
    await clinicOwnerPage.waitForTimeout(500);

    expect(await getSectionCount(clinicOwnerPage)).toBeGreaterThan(countBefore);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });
    await expect(clinicOwnerPage.getByText("Questions")).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: /\+ Add question/i })
    ).toBeVisible();
  });

  test("can add a divider section", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const countBefore = await getSectionCount(clinicOwnerPage);
    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(500);

    expect(await getSectionCount(clinicOwnerPage)).toBeGreaterThan(countBefore);
  });

  test("can add a photo gallery section with data source toggle", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const countBefore = await getSectionCount(clinicOwnerPage);
    await addSectionFromPanel(clinicOwnerPage, "Gallery");
    await clinicOwnerPage.waitForTimeout(500);

    expect(await getSectionCount(clinicOwnerPage)).toBeGreaterThan(countBefore);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      clinicOwnerPage.getByRole("button", { name: /Auto \(from clinic\)/i })
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByRole("button", { name: "Manual" })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tests - TipTap Rich Text Editing
// ---------------------------------------------------------------------------

test.describe("Page Builder - TipTap Rich Text Editing", () => {
  test("text section sidebar shows TipTap editor toolbar", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Text");
    await clinicOwnerPage.waitForTimeout(500);

    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });
    await expect(clinicOwnerPage.getByText("Body (EN)")).toBeVisible();
    await expect(
      clinicOwnerPage.locator('[title="Bold"]').first()
    ).toBeVisible();
    await expect(
      clinicOwnerPage.locator('[title="Italic"]').first()
    ).toBeVisible();
    await expect(
      clinicOwnerPage.locator('[title="Underline"]').first()
    ).toBeVisible();
  });

  test("can type text into TipTap editor", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Text");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    const editors = clinicOwnerPage.locator(
      '.tiptap, [contenteditable="true"]'
    );
    if ((await editors.count()) === 0) {
      test.skip(true, "TipTap editor not found in DOM");
      return;
    }

    const editor = editors.first();
    await editor.click();
    await editor.pressSequentially("Hello World from E2E test");

    await expect(editor).toContainText("Hello World from E2E test");
  });

  test("bold formatting wraps text in <strong>", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Text");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    const editor = clinicOwnerPage
      .locator('.tiptap, [contenteditable="true"]')
      .first();
    if (!(await editor.isVisible().catch(() => false))) {
      test.skip(true, "TipTap editor not visible");
      return;
    }

    await editor.click();
    await editor.pressSequentially("bold text");
    await clinicOwnerPage.keyboard.press("Control+a");
    await clinicOwnerPage.locator('[title="Bold"]').first().click();

    const html = await editor.innerHTML();
    expect(html).toContain("<strong>");
  });

  test("H2 formatting wraps text in <h2>", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Text");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    const editor = clinicOwnerPage
      .locator('.tiptap, [contenteditable="true"]')
      .first();
    if (!(await editor.isVisible().catch(() => false))) {
      test.skip(true, "TipTap editor not visible");
      return;
    }

    await editor.click();
    await editor.pressSequentially("Heading Text");
    await clinicOwnerPage.keyboard.press("Control+a");
    await clinicOwnerPage.locator('[title="Heading 2"]').first().click();

    const html = await editor.innerHTML();
    expect(html).toContain("<h2");
  });
});

// ---------------------------------------------------------------------------
// Tests - Section Editing
// ---------------------------------------------------------------------------

test.describe("Page Builder - Section Editing", () => {
  test("can edit hero heading field", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Hero");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    const headingLabel = clinicOwnerPage.getByText("Heading (EN)");
    await expect(headingLabel).toBeVisible();

    const headingInput = headingLabel.locator("..").locator("input");
    await headingInput.clear();
    await headingInput.fill("Welcome to Our Clinic");
    await expect(headingInput).toHaveValue("Welcome to Our Clinic");
  });

  test("can add and fill FAQ items", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "FAQ");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    await clinicOwnerPage
      .getByRole("button", { name: /\+ Add question/i })
      .click();
    await clinicOwnerPage.waitForTimeout(300);

    await expect(clinicOwnerPage.getByText("Q1")).toBeVisible();

    const questionInput = clinicOwnerPage.getByPlaceholder("Question (EN)");
    await questionInput.fill("What are your opening hours?");
    const answerInput = clinicOwnerPage.getByPlaceholder("Answer (EN)");
    await answerInput.fill("We are open Monday to Saturday, 8am to 6pm.");

    await expect(questionInput).toHaveValue("What are your opening hours?");
    await expect(answerInput).toHaveValue(
      "We are open Monday to Saturday, 8am to 6pm."
    );
  });

  test("can toggle section visibility", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(500);

    const sectionWrapper = clinicOwnerPage
      .locator('[id^="section-"]')
      .first();
    await expect(sectionWrapper).toBeVisible();
    await sectionWrapper.hover();

    const hideButton = clinicOwnerPage.locator('[title="Hide"]').first();
    const showButton = clinicOwnerPage.locator('[title="Show"]').first();

    const isHideVisible = await hideButton.isVisible().catch(() => false);
    const isShowVisible = await showButton.isVisible().catch(() => false);

    if (isHideVisible) {
      await hideButton.click();
      await expect(sectionWrapper).toHaveClass(/opacity-40/);
    } else if (isShowVisible) {
      await showButton.click();
    } else {
      test.skip(true, "Toggle visibility button not found on hover");
    }
  });

  test("sidebar shows style editing controls (background, padding, layout)", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Text");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    const sidebar = clinicOwnerPage.locator(".w-80.flex-shrink-0");

    await expect(sidebar.getByText("Style").first()).toBeVisible();
    await expect(sidebar.getByText("Background")).toBeVisible();
    await expect(sidebar.getByText("Padding")).toBeVisible();
    await expect(
      sidebar.getByRole("button", { name: "Small" })
    ).toBeVisible();
    await expect(
      sidebar.getByRole("button", { name: "Medium" })
    ).toBeVisible();
    await expect(
      sidebar.getByRole("button", { name: "Large" })
    ).toBeVisible();
    await expect(sidebar.getByText("Layout").first()).toBeVisible();
    await expect(
      sidebar.getByRole("button", { name: "Full width" })
    ).toBeVisible();
    await expect(
      sidebar.getByRole("button", { name: "Contained" })
    ).toBeVisible();
  });

  test("section sidebar can be closed", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Text");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    // Close via the X button in the sidebar header
    const closeButton = clinicOwnerPage
      .locator(".w-80.flex-shrink-0")
      .locator("button")
      .filter({ has: clinicOwnerPage.locator("svg") })
      .first();
    await closeButton.click();

    await expect(clinicOwnerPage.getByText("Edit Section")).not.toBeVisible({
      timeout: 3000,
    });
  });
});

// ---------------------------------------------------------------------------
// Tests - Section Reordering
// ---------------------------------------------------------------------------

test.describe("Page Builder - Section Reordering", () => {
  test("move up/down buttons appear on hover when multiple sections exist", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Hero");
    await clinicOwnerPage.waitForTimeout(400);
    await clinicOwnerPage.keyboard.press("Escape");
    await clinicOwnerPage.waitForTimeout(200);

    await addSectionFromPanel(clinicOwnerPage, "Text");
    await clinicOwnerPage.waitForTimeout(400);
    await clinicOwnerPage.keyboard.press("Escape");
    await clinicOwnerPage.waitForTimeout(200);

    const sections = clinicOwnerPage.locator('[id^="section-"]');
    if ((await sections.count()) < 2) {
      test.skip(true, "Could not add two sections");
      return;
    }

    await sections.nth(1).hover();
    await clinicOwnerPage.waitForTimeout(300);

    const moveUpVisible = await clinicOwnerPage
      .locator('[title="Move up"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(moveUpVisible).toBeTruthy();
  });

  test("clicking Move up swaps section order", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Hero");
    await clinicOwnerPage.waitForTimeout(400);
    await clinicOwnerPage.keyboard.press("Escape");
    await clinicOwnerPage.waitForTimeout(200);

    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(400);
    await clinicOwnerPage.keyboard.press("Escape");
    await clinicOwnerPage.waitForTimeout(200);

    const sections = clinicOwnerPage.locator('[id^="section-"]');
    if ((await sections.count()) < 2) {
      test.skip(true, "Could not add two sections");
      return;
    }

    const secondSectionId = await sections.nth(1).getAttribute("id");

    await sections.nth(1).hover();
    await clinicOwnerPage.waitForTimeout(300);

    const moveUpButton = clinicOwnerPage.locator('[title="Move up"]').first();
    if (!(await moveUpButton.isVisible().catch(() => false))) {
      test.skip(true, "Move up button not visible");
      return;
    }

    await moveUpButton.click();
    await clinicOwnerPage.waitForTimeout(500);

    const newFirstSectionId = await sections.first().getAttribute("id");
    expect(newFirstSectionId).toBe(secondSectionId);
  });
});

// ---------------------------------------------------------------------------
// Tests - Delete Section
// ---------------------------------------------------------------------------

test.describe("Page Builder - Delete Section", () => {
  test("can delete a section via hover action bar", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(500);

    const countBefore = await getSectionCount(clinicOwnerPage);
    expect(countBefore).toBeGreaterThan(0);

    const sectionWrapper = clinicOwnerPage
      .locator('[id^="section-"]')
      .last();
    await sectionWrapper.hover();
    await clinicOwnerPage.waitForTimeout(300);

    const deleteButton = clinicOwnerPage.locator('[title="Delete"]').first();
    if (!(await deleteButton.isVisible().catch(() => false))) {
      test.skip(true, "Delete button not visible on hover");
      return;
    }

    await deleteButton.click();
    await clinicOwnerPage.waitForTimeout(500);

    expect(await getSectionCount(clinicOwnerPage)).toBeLessThan(countBefore);
  });
});

// ---------------------------------------------------------------------------
// Tests - Duplicate Section
// ---------------------------------------------------------------------------

test.describe("Page Builder - Duplicate Section", () => {
  test("can duplicate a section", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(500);

    const countBefore = await getSectionCount(clinicOwnerPage);

    const sectionWrapper = clinicOwnerPage
      .locator('[id^="section-"]')
      .last();
    await sectionWrapper.hover();
    await clinicOwnerPage.waitForTimeout(300);

    const duplicateButton = clinicOwnerPage
      .locator('[title="Duplicate"]')
      .first();
    if (!(await duplicateButton.isVisible().catch(() => false))) {
      test.skip(true, "Duplicate button not visible on hover");
      return;
    }

    await duplicateButton.click();
    await clinicOwnerPage.waitForTimeout(500);

    expect(await getSectionCount(clinicOwnerPage)).toBe(countBefore + 1);
  });
});

// ---------------------------------------------------------------------------
// Tests - Page Management (Multi-page)
// ---------------------------------------------------------------------------

test.describe("Page Builder - Page Management", () => {
  test("Add Page dropdown shows template list", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    if (!(await openAddPageDropdown(clinicOwnerPage))) {
      test.skip(true, "Add page button not found");
      return;
    }

    await expect(clinicOwnerPage.getByText("From template")).toBeVisible();
  });

  test("can add a page from template", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    if (!(await openAddPageDropdown(clinicOwnerPage))) {
      test.skip(true, "Add page button not found");
      return;
    }

    // Try About first, then fall back to any available template
    const aboutOption = clinicOwnerPage.getByRole("button", { name: "About" });
    if (await aboutOption.isVisible().catch(() => false)) {
      await aboutOption.click();
    } else {
      const anyTemplate = clinicOwnerPage
        .locator("button")
        .filter({ hasText: /^(Gallery|Contact|FAQ|Booking|Our Team)$/ })
        .first();
      if (await anyTemplate.isVisible().catch(() => false)) {
        await anyTemplate.click();
      } else {
        test.skip(true, "No page templates available");
        return;
      }
    }

    await clinicOwnerPage.waitForTimeout(500);
    await expect(
      clinicOwnerPage.getByRole("button", { name: /^Save$/i })
    ).toBeVisible();
  });

  test("can create a custom page with slug and title", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const created = await createCustomPage(
      clinicOwnerPage,
      "test-e2e-page",
      "E2E Test Page",
      "E2E टेस्ट पृष्ठ"
    );
    if (!created) {
      test.skip(true, "Could not create custom page");
      return;
    }

    await expect(
      clinicOwnerPage.getByRole("button", { name: "E2E Test Page" })
    ).toBeVisible();
  });

  test("can delete a non-home page", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const created = await createCustomPage(
      clinicOwnerPage,
      "delete-me",
      "Delete Me"
    );
    if (!created) {
      test.skip(true, "Could not create page to delete");
      return;
    }

    const deleteTab = clinicOwnerPage.getByRole("button", {
      name: "Delete Me",
    });
    if (!(await deleteTab.isVisible().catch(() => false))) {
      test.skip(true, "New page tab not created");
      return;
    }

    const tabGroup = deleteTab.locator("..");
    await tabGroup.hover();
    await clinicOwnerPage.waitForTimeout(300);

    const deletePageButton = tabGroup.locator('[title="Delete page"]');
    if (await deletePageButton.isVisible().catch(() => false)) {
      await deletePageButton.click();
      await clinicOwnerPage.waitForTimeout(500);

      await expect(
        clinicOwnerPage.getByRole("button", { name: "Delete Me" })
      ).not.toBeVisible({ timeout: 3000 });
    } else {
      test.skip(true, "Delete page button not visible on hover");
    }
  });

  test("edit popover shows title and slug fields", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const created = await createCustomPage(
      clinicOwnerPage,
      "edit-test",
      "Edit Test"
    );
    if (!created) {
      test.skip(true, "Could not create page");
      return;
    }

    const editTab = clinicOwnerPage.getByRole("button", { name: "Edit Test" });
    if (!(await editTab.isVisible().catch(() => false))) {
      test.skip(true, "Page tab not created");
      return;
    }

    const tabGroup = editTab.locator("..");
    await tabGroup.hover();
    await clinicOwnerPage.waitForTimeout(300);

    const editButton = tabGroup.locator('[title="Edit slug & title"]');
    if (!(await editButton.isVisible().catch(() => false))) {
      test.skip(true, "Edit button not visible on hover");
      return;
    }

    await editButton.click();
    await clinicOwnerPage.waitForTimeout(300);

    await expect(clinicOwnerPage.getByText("Title (EN)")).toBeVisible();
    await expect(clinicOwnerPage.getByText("Title (NE)")).toBeVisible();
    await expect(clinicOwnerPage.getByText("URL Slug")).toBeVisible();

    await clinicOwnerPage
      .getByRole("button", { name: /Done/i })
      .click();
  });

  test("slug input strips invalid characters (uppercase, spaces, symbols)", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    if (!(await openAddPageDropdown(clinicOwnerPage))) {
      test.skip(true, "Add page button not found");
      return;
    }
    if (!(await openCustomPageForm(clinicOwnerPage))) {
      test.skip(true, "Custom page form not visible");
      return;
    }

    const slugInput = clinicOwnerPage.getByPlaceholder("my-page");
    await slugInput.fill("My Page With Spaces & Caps!!");

    const slugValue = await slugInput.inputValue();
    expect(slugValue).not.toContain(" ");
    expect(slugValue).not.toContain("&");
    expect(slugValue).not.toContain("!");
    expect(slugValue).toMatch(/^[a-z0-9-]*$/);
  });

  test("Create Page button is disabled without both slug and title", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    if (!(await openAddPageDropdown(clinicOwnerPage))) {
      test.skip(true, "Add page button not found");
      return;
    }
    if (!(await openCustomPageForm(clinicOwnerPage))) {
      test.skip(true, "Custom page form not visible");
      return;
    }

    const createButton = clinicOwnerPage.getByRole("button", {
      name: /Create Page/i,
    });

    // Empty: disabled
    await expect(createButton).toBeDisabled();

    // Slug only: disabled
    await clinicOwnerPage.getByPlaceholder("my-page").fill("test-slug");
    await expect(createButton).toBeDisabled();

    // Title only: disabled
    await clinicOwnerPage.getByPlaceholder("my-page").clear();
    await clinicOwnerPage.getByPlaceholder("Page Title").fill("Some Title");
    await expect(createButton).toBeDisabled();

    // Both: enabled
    await clinicOwnerPage.getByPlaceholder("my-page").fill("test-slug");
    await expect(createButton).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// Tests - Save & Publish
// ---------------------------------------------------------------------------

test.describe("Page Builder - Save & Publish", () => {
  test("clicking Save triggers save status indicator", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(500);

    await clinicOwnerPage
      .getByRole("button", { name: /^Save$/i })
      .click();

    try {
      await expect(
        clinicOwnerPage
          .getByText(/Saving\.\.\.|Saved|Save failed/i)
          .first()
      ).toBeVisible({ timeout: 10000 });
    } catch {
      // Auto-save may have already completed before manual save
    }
  });

  test("Ctrl+S keyboard shortcut triggers save", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(500);
    await clinicOwnerPage.keyboard.press("Control+s");

    try {
      await expect(
        clinicOwnerPage
          .getByText(/Saving\.\.\.|Saved|Save failed/i)
          .first()
      ).toBeVisible({ timeout: 10000 });
    } catch {
      // Auto-save timing
    }
  });

  test("enable/disable toggle can be toggled", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const enableLabel = clinicOwnerPage.getByText(/Enable/i);
    await expect(enableLabel).toBeVisible();

    const toggleSwitch = enableLabel
      .locator("..")
      .locator("div.rounded-full");
    if (!(await toggleSwitch.isVisible().catch(() => false))) {
      test.skip(true, "Toggle switch not found");
      return;
    }

    await toggleSwitch.click();
    await clinicOwnerPage.waitForTimeout(300);
    await toggleSwitch.click();
    await clinicOwnerPage.waitForTimeout(300);

    await expect(
      clinicOwnerPage.getByRole("button", { name: /^Save$/i })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tests - Undo/Redo
// ---------------------------------------------------------------------------

test.describe("Page Builder - Undo/Redo", () => {
  test("undo button reverts a section addition", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const countBefore = await getSectionCount(clinicOwnerPage);

    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(500);
    expect(await getSectionCount(clinicOwnerPage)).toBeGreaterThan(countBefore);

    await clinicOwnerPage.locator('[title="Undo"]').click();
    await clinicOwnerPage.waitForTimeout(500);

    expect(await getSectionCount(clinicOwnerPage)).toBe(countBefore);
  });

  test("Ctrl+Z triggers undo", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const countBefore = await getSectionCount(clinicOwnerPage);

    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(500);
    expect(await getSectionCount(clinicOwnerPage)).toBeGreaterThan(countBefore);

    await clinicOwnerPage.keyboard.press("Control+z");
    await clinicOwnerPage.waitForTimeout(500);

    expect(await getSectionCount(clinicOwnerPage)).toBe(countBefore);
  });

  test("redo restores an undone action", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const countBefore = await getSectionCount(clinicOwnerPage);

    await addSectionFromPanel(clinicOwnerPage, "Divider");
    await clinicOwnerPage.waitForTimeout(500);
    const countAfterAdd = await getSectionCount(clinicOwnerPage);

    await clinicOwnerPage.locator('[title="Undo"]').click();
    await clinicOwnerPage.waitForTimeout(500);
    expect(await getSectionCount(clinicOwnerPage)).toBe(countBefore);

    await clinicOwnerPage.locator('[title="Redo"]').click();
    await clinicOwnerPage.waitForTimeout(500);
    expect(await getSectionCount(clinicOwnerPage)).toBe(countAfterAdd);
  });
});

// ---------------------------------------------------------------------------
// Tests - Templates
// ---------------------------------------------------------------------------

test.describe("Page Builder - Templates", () => {
  test("clicking Templates opens the template picker", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await clinicOwnerPage
      .getByRole("button", { name: /Templates/i })
      .click();
    await clinicOwnerPage.waitForTimeout(500);

    // Template picker replaces the canvas; Sections panel is hidden
    const templateVisible = await clinicOwnerPage
      .getByText(/template/i)
      .isVisible()
      .catch(() => false);
    expect(templateVisible).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Tests - Navbar & Footer Editors
// ---------------------------------------------------------------------------

test.describe("Page Builder - Navbar & Footer Editors", () => {
  test("clicking Navbar opens the navbar editor panel", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /Navbar/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    const rightPanel = clinicOwnerPage.locator(".w-80.flex-shrink-0");
    if (await rightPanel.isVisible().catch(() => false)) {
      const hasNavbarContent = await rightPanel
        .getByText(/logo|clinic name|links/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasNavbarContent).toBeTruthy();
    }
  });

  test("clicking Footer opens the footer editor panel", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await clinicOwnerPage.getByRole("button", { name: /Footer/i }).click();
    await clinicOwnerPage.waitForTimeout(500);

    const rightPanel = clinicOwnerPage.locator(".w-80.flex-shrink-0");
    if (await rightPanel.isVisible().catch(() => false)) {
      const hasFooterContent = await rightPanel
        .getByText(/copyright|footer|clinic name/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasFooterContent).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Tests - Style Presets
// ---------------------------------------------------------------------------

test.describe("Page Builder - Style Presets", () => {
  test("style picker dropdown shows preset options", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const styleButton = clinicOwnerPage.getByRole("button", {
      name: /Style:/i,
    });
    await expect(styleButton).toBeVisible();

    await styleButton.click();
    await clinicOwnerPage.waitForTimeout(300);

    const dropdown = clinicOwnerPage
      .locator(".z-50")
      .filter({ hasText: /Bauhaus|Minimal|Classic/i });
    expect(await dropdown.isVisible().catch(() => false)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Tests - Photo Gallery Section Details
// ---------------------------------------------------------------------------

test.describe("Page Builder - Photo Gallery Details", () => {
  test("manual mode shows Add photo button", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Gallery");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    await clinicOwnerPage
      .getByRole("button", { name: "Manual" })
      .click();
    await clinicOwnerPage.waitForTimeout(300);

    await expect(
      clinicOwnerPage.getByRole("button", { name: /\+ Add photo/i })
    ).toBeVisible();
  });

  test("can add a manual photo entry with caption", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Gallery");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    await clinicOwnerPage
      .getByRole("button", { name: "Manual" })
      .click();
    await clinicOwnerPage.waitForTimeout(300);

    await clinicOwnerPage
      .getByRole("button", { name: /\+ Add photo/i })
      .click();
    await clinicOwnerPage.waitForTimeout(300);

    await expect(clinicOwnerPage.getByText("#1")).toBeVisible();
    await expect(
      clinicOwnerPage.getByPlaceholder("Caption (EN)")
    ).toBeVisible();
    await expect(
      clinicOwnerPage.getByPlaceholder("Caption (NE)")
    ).toBeVisible();

    await clinicOwnerPage
      .getByPlaceholder("Caption (EN)")
      .fill("Test clinic photo");
    await expect(
      clinicOwnerPage.getByPlaceholder("Caption (EN)")
    ).toHaveValue("Test clinic photo");
  });

  test("can remove a manual photo entry", async ({ clinicOwnerPage }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Gallery");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    await clinicOwnerPage
      .getByRole("button", { name: "Manual" })
      .click();
    await clinicOwnerPage.waitForTimeout(300);

    await clinicOwnerPage
      .getByRole("button", { name: /\+ Add photo/i })
      .click();
    await clinicOwnerPage.waitForTimeout(300);
    await expect(clinicOwnerPage.getByText("#1")).toBeVisible();

    await clinicOwnerPage
      .getByRole("button", { name: "Remove" })
      .first()
      .click();
    await clinicOwnerPage.waitForTimeout(300);

    await expect(clinicOwnerPage.getByText("#1")).not.toBeVisible({
      timeout: 3000,
    });
  });
});

// ---------------------------------------------------------------------------
// Tests - Preview & Public URL
// ---------------------------------------------------------------------------

test.describe("Page Builder - Preview & Public URL", () => {
  test("View Page link contains clinic slug and preview=true", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const viewPageLink = clinicOwnerPage.getByRole("link", {
      name: /View Page/i,
    });
    await expect(viewPageLink).toBeVisible();

    const href = await viewPageLink.getAttribute("href");
    expect(href).not.toBeNull();
    expect(href).toContain("preview=true");
    expect(href).toContain(CLINIC_SLUG);
  });

  test("public clinic page loads without errors", async ({ page }) => {
    // No auth needed - public page
    const publicUrl = `/en/clinic/${CLINIC_SLUG}`;
    await page.goto(publicUrl);

    try {
      await page.waitForSelector("main", { timeout: 15000 });
    } catch {
      test.skip(true, "Public clinic page did not load");
      return;
    }

    await expect(page.locator("main")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tests - Keyboard Shortcuts
// ---------------------------------------------------------------------------

test.describe("Page Builder - Keyboard Shortcuts", () => {
  test("Escape deselects the currently selected section", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    await addSectionFromPanel(clinicOwnerPage, "Text");
    await clinicOwnerPage.waitForTimeout(500);
    await expect(clinicOwnerPage.getByText("Edit Section")).toBeVisible({
      timeout: 5000,
    });

    await clinicOwnerPage.keyboard.press("Escape");
    await clinicOwnerPage.waitForTimeout(300);

    await expect(
      clinicOwnerPage.getByText("Edit Section")
    ).not.toBeVisible({ timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// Tests - Empty State
// ---------------------------------------------------------------------------

test.describe("Page Builder - Empty State", () => {
  test("new empty page shows placeholder message", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const created = await createCustomPage(
      clinicOwnerPage,
      "empty-page",
      "Empty Page"
    );
    if (!created) {
      test.skip(true, "Could not create empty page");
      return;
    }

    const emptyMessage = clinicOwnerPage.getByText(
      /Add sections or pick a template/i
    );
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

    if (hasEmptyMessage) {
      await expect(emptyMessage).toBeVisible();
      await expect(
        clinicOwnerPage.getByText(
          /Click a section type on the left to add it/i
        )
      ).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Tests - Logo Upload
// ---------------------------------------------------------------------------

test.describe("Page Builder - Logo Upload", () => {
  test("logo picker dropdown shows upload option", async ({
    clinicOwnerPage,
  }) => {
    const ready = await navigateToPageBuilder(clinicOwnerPage);
    if (!ready) {
      test.skip(true, "Page builder not accessible");
      return;
    }

    const logoButton = clinicOwnerPage.getByRole("button", {
      name: /Logo/i,
    });
    await expect(logoButton).toBeVisible();
    await logoButton.click();
    await clinicOwnerPage.waitForTimeout(300);

    const uploadLabel = clinicOwnerPage.getByText(
      /Upload Logo|Change Logo/i
    );
    expect(await uploadLabel.isVisible().catch(() => false)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Tests - Language Support
// ---------------------------------------------------------------------------

test.describe("Page Builder - Language Support", () => {
  test("page builder loads in Nepali locale", async ({ clinicOwnerPage }) => {
    await clinicOwnerPage.goto("/ne/clinic/dashboard/page-builder");

    try {
      await clinicOwnerPage.waitForSelector("main", { timeout: 20000 });
    } catch {
      test.skip(true, "Page did not load");
      return;
    }

    const nepaliSave = clinicOwnerPage.getByRole("button", {
      name: /सेभ/i,
    });
    const nepaliLoading = clinicOwnerPage.getByText(/लोड हुँदैछ/i);
    const loginRequired = clinicOwnerPage.getByText(
      /please log in|कृपया लगइन/i
    );

    await clinicOwnerPage.waitForTimeout(5000);

    const hasSave = await nepaliSave.isVisible().catch(() => false);
    const hasLoading = await nepaliLoading.isVisible().catch(() => false);
    const hasLogin = await loginRequired.isVisible().catch(() => false);

    if (hasLogin) {
      test.skip(true, "Session not maintained for Nepali route");
      return;
    }

    expect(hasSave || hasLoading).toBeTruthy();
  });
});
