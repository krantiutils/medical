/**
 * Phone Login Tab E2E Tests
 *
 * Tests the phone/email tab switching and phone login flow on the login page.
 * The login page defaults to the phone tab. Seeded test users only have email
 * credentials, so phone login will fail — these tests verify UI behavior and
 * error handling rather than successful phone authentication.
 */

import { test, expect } from "@playwright/test";
import { TEST_DATA } from "./fixtures/test-utils";

test.describe("Phone Login Tab - UI Elements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/login");
  });

  test("should show phone tab as active by default", async ({ page }) => {
    const phoneTab = page.getByRole("button", { name: /with phone/i });
    const emailTab = page.getByRole("button", { name: /with email/i });

    await expect(phoneTab).toBeVisible();
    await expect(emailTab).toBeVisible();

    // Phone tab should have the active styling (bg-foreground text-white)
    await expect(phoneTab).toHaveClass(/bg-foreground/);
    await expect(phoneTab).toHaveClass(/text-white/);

    // Email tab should have the inactive styling
    await expect(emailTab).not.toHaveClass(/bg-foreground/);
    await expect(emailTab).not.toHaveClass(/text-white/);
  });

  test("should show phone input field with tel type", async ({ page }) => {
    const phoneInput = page.getByLabel(/phone number/i);
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute("type", "tel");
    await expect(phoneInput).toHaveAttribute("placeholder", "98XXXXXXXX");
  });

  test("should show password input", async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("should show forgot password link", async ({ page }) => {
    const forgotLink = page.getByRole("link", { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute("href", /\/en\/forgot-password/);
  });

  test("should switch to email tab when clicked", async ({ page }) => {
    const emailTab = page.getByRole("button", { name: /with email/i });
    await emailTab.click();

    // Email input should now be visible, phone input should be gone
    const emailInput = page.getByLabel(/^email$/i);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    // Phone input should not exist in the DOM (conditional rendering)
    const phoneInput = page.locator("#phone");
    await expect(phoneInput).not.toBeVisible();
  });

  test("should switch back to phone tab when clicked", async ({ page }) => {
    // First switch to email
    await page.getByRole("button", { name: /with email/i }).click();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();

    // Switch back to phone
    await page.getByRole("button", { name: /with phone/i }).click();

    const phoneInput = page.getByLabel(/phone number/i);
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute("type", "tel");

    // Email input should no longer be in the DOM
    const emailInput = page.locator("#email");
    await expect(emailInput).not.toBeVisible();
  });
});

test.describe("Phone Login Tab - Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/login");
  });

  test("should require phone number via HTML5 validation", async ({
    page,
  }) => {
    // Fill only password, leave phone empty
    await page.getByLabel(/password/i).fill("somepassword");

    // Try to submit
    await page.getByRole("button", { name: /sign in/i }).click();

    // HTML5 required validation should prevent submission
    const phoneInput = page.getByLabel(/phone number/i);
    const validationMessage = await phoneInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe("");
  });

  test("should require password via HTML5 validation", async ({ page }) => {
    // Fill phone but leave password empty
    await page.getByLabel(/phone number/i).fill("9841234567");

    // Try to submit
    await page.getByRole("button", { name: /sign in/i }).click();

    // HTML5 required validation should prevent submission
    const passwordInput = page.getByLabel(/password/i);
    const validationMessage = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe("");
  });
});

test.describe("Phone Login Tab - Error Handling", () => {
  test("should show error for invalid phone credentials", async ({ page }) => {
    await page.goto("/en/login");

    // Fill in a phone number that does not exist in seeded data
    await page.getByLabel(/phone number/i).fill("9800000000");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for loading state to appear and then resolve
    await expect(
      page.getByRole("button", { name: /signing in/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible({ timeout: 10000 });

    // Error message should be displayed in the error box
    const errorBox = page.locator('[class*="primary-red"]').first();
    await expect(errorBox).toBeVisible();
  });

  test("should show loading state while submitting", async ({ page }) => {
    await page.goto("/en/login");

    await page.getByLabel(/phone number/i).fill("9841234567");
    await page.getByLabel(/password/i).fill("somepassword");

    // Submit the form
    const submitButton = page.getByRole("button", { name: /sign in/i });
    await submitButton.click();

    // Button text should change to "Signing In..." and be disabled
    const loadingButton = page.getByRole("button", { name: /signing in/i });
    await expect(loadingButton).toBeVisible();
    await expect(loadingButton).toBeDisabled();
  });
});

test.describe("Email Tab - Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/login");
  });

  test("should show email input when email tab is selected", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /with email/i }).click();

    const emailInput = page.getByLabel(/^email$/i);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("placeholder", "you@example.com");
  });

  test("should hide phone input when email tab is selected", async ({
    page,
  }) => {
    // Phone input should be visible initially
    await expect(page.getByLabel(/phone number/i)).toBeVisible();

    // Switch to email tab
    await page.getByRole("button", { name: /with email/i }).click();

    // Phone input should no longer be in the DOM
    const phoneInput = page.locator("#phone");
    await expect(phoneInput).not.toBeVisible();
  });

  test("should update tab styling when switching to email", async ({
    page,
  }) => {
    const phoneTab = page.getByRole("button", { name: /with phone/i });
    const emailTab = page.getByRole("button", { name: /with email/i });

    await emailTab.click();

    // Email tab should now have active styling
    await expect(emailTab).toHaveClass(/bg-foreground/);
    await expect(emailTab).toHaveClass(/text-white/);

    // Phone tab should now have inactive styling
    await expect(phoneTab).not.toHaveClass(/bg-foreground/);
    await expect(phoneTab).not.toHaveClass(/text-white/);
  });
});

test.describe("Tab State Persistence", () => {
  test("should preserve phone value when switching tabs and back", async ({
    page,
  }) => {
    await page.goto("/en/login");

    // Type a phone number
    const phoneInput = page.getByLabel(/phone number/i);
    await phoneInput.fill("9841111111");

    // Switch to email tab
    await page.getByRole("button", { name: /with email/i }).click();

    // Switch back to phone tab
    await page.getByRole("button", { name: /with phone/i }).click();

    // Phone value should be preserved (React state persists across re-renders)
    await expect(page.getByLabel(/phone number/i)).toHaveValue("9841111111");
  });

  test("should preserve email value when switching tabs and back", async ({
    page,
  }) => {
    await page.goto("/en/login");

    // Switch to email tab and type a value
    await page.getByRole("button", { name: /with email/i }).click();
    await page.getByLabel(/^email$/i).fill("hello@example.com");

    // Switch to phone tab
    await page.getByRole("button", { name: /with phone/i }).click();

    // Switch back to email tab
    await page.getByRole("button", { name: /with email/i }).click();

    // Email value should be preserved
    await expect(page.getByLabel(/^email$/i)).toHaveValue("hello@example.com");
  });

  test("should preserve password across tab switches", async ({ page }) => {
    await page.goto("/en/login");

    // Fill password while on phone tab
    await page.getByLabel(/password/i).fill("MyPassword123!");

    // Switch to email tab
    await page.getByRole("button", { name: /with email/i }).click();

    // Password should persist because it is a shared field (not conditionally rendered)
    await expect(page.getByLabel(/password/i)).toHaveValue("MyPassword123!");

    // Switch back to phone tab
    await page.getByRole("button", { name: /with phone/i }).click();

    // Still there
    await expect(page.getByLabel(/password/i)).toHaveValue("MyPassword123!");
  });

  test("phone and email inputs should be independent", async ({ page }) => {
    await page.goto("/en/login");

    // Fill phone number
    await page.getByLabel(/phone number/i).fill("9841234567");

    // Switch to email, fill email
    await page.getByRole("button", { name: /with email/i }).click();
    await page.getByLabel(/^email$/i).fill("test@test.com");

    // Switch back to phone — phone should still have its own value
    await page.getByRole("button", { name: /with phone/i }).click();
    await expect(page.getByLabel(/phone number/i)).toHaveValue("9841234567");

    // Switch to email — email should still have its own value
    await page.getByRole("button", { name: /with email/i }).click();
    await expect(page.getByLabel(/^email$/i)).toHaveValue("test@test.com");
  });
});
