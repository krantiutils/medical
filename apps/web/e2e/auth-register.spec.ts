/**
 * User Registration E2E Tests
 *
 * Tests for US-041: Verify user registration flow works correctly
 */

import { test, expect } from "@playwright/test";

// Generate a unique email for successful registration tests
const generateUniqueEmail = () =>
  `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

test.describe("Registration Page - Basic Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/register");
  });

  test("should load registration page with form", async ({ page }) => {
    // Check page heading
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Create Account");
  });

  test("should display all form fields", async ({ page }) => {
    // Full Name field
    const nameInput = page.getByLabel(/full name/i);
    await expect(nameInput).toBeVisible();

    // Email field
    const emailInput = page.getByLabel(/email address/i);
    await expect(emailInput).toBeVisible();

    // Password field
    const passwordInput = page.getByLabel(/^password$/i);
    await expect(passwordInput).toBeVisible();

    // Confirm Password field
    const confirmPasswordInput = page.getByLabel(/confirm password/i);
    await expect(confirmPasswordInput).toBeVisible();
  });

  test("should display Create Account button", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: /create account/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test("should display Google sign-in button", async ({ page }) => {
    const googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    await expect(googleButton).toBeVisible();
  });

  test("should display 'Or continue with' divider", async ({ page }) => {
    await expect(page.getByText("Or continue with")).toBeVisible();
  });

  test("should display login link for existing users", async ({ page }) => {
    await expect(page.getByText("Already have an account?")).toBeVisible();
    const signInLink = page.getByRole("link", { name: "Sign In" });
    await expect(signInLink).toBeVisible();
  });

  test("should display terms and privacy policy links", async ({ page }) => {
    // Scope to the main content area to avoid matching footer links
    const main = page.locator("main");
    const termsLink = main.getByRole("link", { name: "Terms of Service" });
    const privacyLink = main.getByRole("link", { name: "Privacy Policy" });
    await expect(termsLink).toBeVisible();
    await expect(privacyLink).toBeVisible();
  });
});

test.describe("Registration Form - Validation Errors", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/register");
  });

  test("should show validation error for empty email field", async ({
    page,
  }) => {
    // Fill everything except email
    await page.getByLabel(/full name/i).fill("Test User");
    await page.getByLabel(/^password$/i).fill("ValidPass123!");
    await page.getByLabel(/confirm password/i).fill("ValidPass123!");

    // Try to submit
    await page.getByRole("button", { name: /create account/i }).click();

    // HTML5 validation should prevent submission
    // Check that the email input has the validation message
    const emailInput = page.getByLabel(/email address/i);
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe("");
  });

  test("should show validation error for invalid email format", async ({
    page,
  }) => {
    // Fill form with invalid email
    await page.getByLabel(/full name/i).fill("Test User");
    await page.getByLabel(/email address/i).fill("invalid-email");
    await page.getByLabel(/^password$/i).fill("ValidPass123!");
    await page.getByLabel(/confirm password/i).fill("ValidPass123!");

    // Try to submit
    await page.getByRole("button", { name: /create account/i }).click();

    // HTML5 validation should show email format error
    const emailInput = page.getByLabel(/email address/i);
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe("");
  });

  test("should show validation error for empty password field", async ({
    page,
  }) => {
    // Fill everything except password
    await page.getByLabel(/full name/i).fill("Test User");
    await page.getByLabel(/email address/i).fill("test@example.com");
    // Leave password empty
    await page.getByLabel(/confirm password/i).fill("SomePassword!");

    // Try to submit
    await page.getByRole("button", { name: /create account/i }).click();

    // HTML5 validation should prevent submission
    const passwordInput = page.getByLabel(/^password$/i);
    const validationMessage = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe("");
  });

  test("should show error for password shorter than 8 characters", async ({
    page,
  }) => {
    // Fill form with short password
    await page.getByLabel(/full name/i).fill("Test User");
    await page.getByLabel(/email address/i).fill(generateUniqueEmail());
    await page.getByLabel(/^password$/i).fill("short");
    await page.getByLabel(/confirm password/i).fill("short");

    // Submit the form
    await page.getByRole("button", { name: /create account/i }).click();

    // Should show error message
    await expect(
      page.getByText(/password must be at least 8 characters/i)
    ).toBeVisible();
  });

  test("should show error for mismatched passwords", async ({ page }) => {
    // Fill form with mismatched passwords
    await page.getByLabel(/full name/i).fill("Test User");
    await page.getByLabel(/email address/i).fill(generateUniqueEmail());
    await page.getByLabel(/^password$/i).fill("ValidPassword123!");
    await page.getByLabel(/confirm password/i).fill("DifferentPassword123!");

    // Submit the form
    await page.getByRole("button", { name: /create account/i }).click();

    // Should show error message
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("should show validation error for empty confirm password field", async ({
    page,
  }) => {
    // Fill everything except confirm password
    await page.getByLabel(/full name/i).fill("Test User");
    await page.getByLabel(/email address/i).fill("test@example.com");
    await page.getByLabel(/^password$/i).fill("ValidPassword123!");
    // Leave confirm password empty

    // Try to submit
    await page.getByRole("button", { name: /create account/i }).click();

    // HTML5 validation should prevent submission
    const confirmPasswordInput = page.getByLabel(/confirm password/i);
    const validationMessage = await confirmPasswordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe("");
  });
});

test.describe("Registration Form - Duplicate Email", () => {
  test("should show error for duplicate email", async ({ page }) => {
    await page.goto("/en/register");

    // Use an email that already exists in the seeded test data
    // The seed.ts creates testuser@example.com
    await page.getByLabel(/full name/i).fill("Duplicate User");
    await page.getByLabel(/email address/i).fill("testuser@example.com");
    await page.getByLabel(/^password$/i).fill("ValidPassword123!");
    await page.getByLabel(/confirm password/i).fill("ValidPassword123!");

    // Submit the form
    await page.getByRole("button", { name: /create account/i }).click();

    // Should show duplicate email error
    await expect(
      page.getByText(/user with this email already exists/i)
    ).toBeVisible();
  });
});

test.describe("Registration Form - Successful Registration", () => {
  test("should successfully register and redirect on valid submission", async ({
    page,
  }) => {
    await page.goto("/en/register");

    const uniqueEmail = generateUniqueEmail();

    // Fill in valid registration data
    await page.getByLabel(/full name/i).fill("New Test User");
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel(/^password$/i).fill("ValidPassword123!");
    await page.getByLabel(/confirm password/i).fill("ValidPassword123!");

    // Submit the form
    await page.getByRole("button", { name: /create account/i }).click();

    // Button should show loading state
    await expect(
      page.getByRole("button", { name: /creating account/i })
    ).toBeVisible();

    // Should eventually redirect to homepage (successful auto-login) or login page
    // Wait for navigation away from register page - homepage is /en or /en/ or /en/login
    await page.waitForURL(
      (url) => {
        const path = url.pathname;
        // Accept homepage (/en, /en/) or login page (/en/login)
        return (
          /^\/(en|ne)\/?$/.test(path) || /^\/(en|ne)\/login/.test(path)
        );
      },
      { timeout: 15000 }
    );

    // Verify we are not still on the register page
    await expect(page).not.toHaveURL(/\/register/);
  });

  test("should show success message on successful registration", async ({
    page,
  }) => {
    await page.goto("/en/register");

    const uniqueEmail = generateUniqueEmail();

    // Fill in valid registration data
    await page.getByLabel(/full name/i).fill("Another Test User");
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel(/^password$/i).fill("ValidPassword123!");
    await page.getByLabel(/confirm password/i).fill("ValidPassword123!");

    // Submit the form
    await page.getByRole("button", { name: /create account/i }).click();

    // Should show success message before redirect
    await expect(
      page.getByText(/account created successfully/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Registration Form - Button States", () => {
  test("should disable submit button while loading", async ({ page }) => {
    await page.goto("/en/register");

    const uniqueEmail = generateUniqueEmail();

    // Fill in valid registration data
    await page.getByLabel(/full name/i).fill("Button Test User");
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel(/^password$/i).fill("ValidPassword123!");
    await page.getByLabel(/confirm password/i).fill("ValidPassword123!");

    // Submit the form
    const submitButton = page.getByRole("button", { name: /create account/i });
    await submitButton.click();

    // Button should become disabled with loading text
    const loadingButton = page.getByRole("button", {
      name: /creating account/i,
    });
    await expect(loadingButton).toBeDisabled();
  });
});

test.describe("Registration Page - Navigation", () => {
  test("should navigate to login page when clicking Sign In link", async ({
    page,
  }) => {
    await page.goto("/en/register");

    const signInLink = page.getByRole("link", { name: "Sign In" });
    await signInLink.click();

    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("should navigate to terms page when clicking Terms of Service link", async ({
    page,
  }) => {
    await page.goto("/en/register");

    // Scope to main content to avoid footer links
    const main = page.locator("main");
    const termsLink = main.getByRole("link", { name: "Terms of Service" });
    await termsLink.click();

    await expect(page).toHaveURL(/\/en\/terms/);
  });

  test("should navigate to privacy page when clicking Privacy Policy link", async ({
    page,
  }) => {
    await page.goto("/en/register");

    // Scope to main content to avoid footer links
    const main = page.locator("main");
    const privacyLink = main.getByRole("link", { name: "Privacy Policy" });
    await privacyLink.click();

    await expect(page).toHaveURL(/\/en\/privacy/);
  });
});

test.describe("Registration Page - Google OAuth", () => {
  test("should have Google sign-in button that initiates OAuth flow", async ({
    page,
  }) => {
    await page.goto("/en/register");

    const googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    await expect(googleButton).toBeVisible();

    // Google button should have the Google logo SVG
    const googleSvg = googleButton.locator("svg");
    await expect(googleSvg).toBeVisible();
  });
});

test.describe("Registration Page - Language Support", () => {
  test("should load registration page in Nepali", async ({ page }) => {
    await page.goto("/ne/register");

    // Page should load without errors
    await expect(page).toHaveURL(/\/ne\/register/);

    // Form should still be present
    const submitButton = page.getByRole("button", { name: /create account/i });
    await expect(submitButton).toBeVisible();
  });
});

test.describe("Registration Page - UI Elements", () => {
  test("should display decorative panel on desktop", async ({ page }) => {
    // Use desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/en/register");

    // The decorative panel contains the Nepali "स्वास्थ्य" text which is only visible on lg+ viewport
    // It has text-5xl font-black classes and contains "स्वास्थ्य"
    const brandingText = page.locator("div.text-5xl");
    await expect(brandingText).toBeVisible();
    await expect(brandingText).toContainText("स्वास्थ्य");

    // Also verify the English "Swasthya" subtext in the decorative panel
    const englishBranding = page.locator("div.text-lg.uppercase").filter({ hasText: "Swasthya" });
    await expect(englishBranding).toBeVisible();
  });

  test("should show mobile color bar on mobile viewport", async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en/register");

    // Mobile color bar should be visible (the lg:hidden flex bar at bottom)
    const mobileBar = page.locator("div.lg\\:hidden.h-4.flex");
    await expect(mobileBar).toBeVisible();
  });

  test("should show 'Get Started' badge", async ({ page }) => {
    await page.goto("/en/register");

    await expect(page.getByText("Get Started")).toBeVisible();
  });

  test("should show tagline about Nepal healthcare directory", async ({
    page,
  }) => {
    await page.goto("/en/register");

    await expect(
      page.getByText("Join Nepal's healthcare professional directory")
    ).toBeVisible();
  });
});
