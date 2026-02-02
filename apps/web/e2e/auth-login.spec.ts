/**
 * User Login E2E Tests
 *
 * Tests for US-042: Verify user login flow works correctly
 */

import { test, expect } from "@playwright/test";
import { TEST_DATA } from "./fixtures/test-utils";

test.describe("Login Page - Basic Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/login");
  });

  test("should load login page with form", async ({ page }) => {
    // Check page heading
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Sign In");
  });

  test("should display all form fields", async ({ page }) => {
    // Email field
    const emailInput = page.getByLabel(/email address/i);
    await expect(emailInput).toBeVisible();

    // Password field
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
  });

  test("should display Sign In button", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: /sign in/i });
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

  test("should display register link for new users", async ({ page }) => {
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    const createAccountLink = page.getByRole("link", { name: "Create Account" });
    await expect(createAccountLink).toBeVisible();
  });

  test("should display 'Welcome Back' badge", async ({ page }) => {
    await expect(page.getByText("Welcome Back")).toBeVisible();
  });

  test("should display account access tagline", async ({ page }) => {
    await expect(
      page.getByText("Access your healthcare professional account")
    ).toBeVisible();
  });
});

test.describe("Login Form - Validation Errors", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/login");
  });

  test("should show HTML5 validation error for empty email field", async ({
    page,
  }) => {
    // Fill password but leave email empty
    await page.getByLabel(/password/i).fill("somepassword");

    // Try to submit
    await page.getByRole("button", { name: /sign in/i }).click();

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel(/email address/i);
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe("");
  });

  test("should show HTML5 validation error for invalid email format", async ({
    page,
  }) => {
    // Fill form with invalid email
    await page.getByLabel(/email address/i).fill("invalid-email");
    await page.getByLabel(/password/i).fill("somepassword");

    // Try to submit
    await page.getByRole("button", { name: /sign in/i }).click();

    // HTML5 validation should show email format error
    const emailInput = page.getByLabel(/email address/i);
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe("");
  });

  test("should show HTML5 validation error for empty password field", async ({
    page,
  }) => {
    // Fill email but leave password empty
    await page.getByLabel(/email address/i).fill("test@example.com");

    // Try to submit
    await page.getByRole("button", { name: /sign in/i }).click();

    // HTML5 validation should prevent submission
    const passwordInput = page.getByLabel(/password/i);
    const validationMessage = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe("");
  });
});

test.describe("Login Form - Invalid Credentials", () => {
  test("should show error message for non-existent user", async ({
    page,
  }) => {
    await page.goto("/en/login");

    // Fill in credentials for a non-existent user
    await page.getByLabel(/email address/i).fill("nonexistent@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for loading to complete
    await expect(
      page.getByRole("button", { name: /signing in/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible({
      timeout: 10000,
    });

    // Should show error message about no user found
    await expect(
      page.getByText(/no user found with this email/i)
    ).toBeVisible();
  });

  test("should show error for correct email but wrong password", async ({
    page,
  }) => {
    await page.goto("/en/login");

    // Use seeded test user email with wrong password
    await page.getByLabel(/email address/i).fill(TEST_DATA.USER.email);
    await page.getByLabel(/password/i).fill("wrongpassword123");

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for loading and response
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible({
      timeout: 10000,
    });

    // Should show error message about invalid password
    await expect(page.getByText(/invalid password/i)).toBeVisible();
  });
});

test.describe("Login Form - Successful Login", () => {
  test("should successfully login and redirect to home", async ({ page }) => {
    await page.goto("/en/login");

    // Use seeded test user credentials
    await page.getByLabel(/email address/i).fill(TEST_DATA.USER.email);
    await page.getByLabel(/password/i).fill(TEST_DATA.USER.password);

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Button should show loading state
    await expect(
      page.getByRole("button", { name: /signing in/i })
    ).toBeVisible();

    // Should redirect to homepage
    await page.waitForURL(
      (url) => {
        const path = url.pathname;
        // Accept homepage (/en, /en/) or dashboard
        return /^\/(en|ne)\/?$/.test(path) || /^\/(en|ne)\/dashboard/.test(path);
      },
      { timeout: 15000 }
    );

    // Verify we are not on the login page anymore
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("should redirect to callbackUrl after login", async ({ page }) => {
    // Navigate to login with a callback URL
    const callbackPath = "/en/dashboard/profile";
    await page.goto(`/en/login?callbackUrl=${encodeURIComponent(callbackPath)}`);

    // Use seeded test user credentials
    await page.getByLabel(/email address/i).fill(TEST_DATA.USER.email);
    await page.getByLabel(/password/i).fill(TEST_DATA.USER.password);

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to the callback URL
    await page.waitForURL(
      (url) => url.pathname.includes("/dashboard/profile"),
      { timeout: 15000 }
    );
  });

  test("should login with admin user", async ({ page }) => {
    await page.goto("/en/login");

    // Use admin credentials
    await page.getByLabel(/email address/i).fill(TEST_DATA.ADMIN.email);
    await page.getByLabel(/password/i).fill(TEST_DATA.ADMIN.password);

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect away from login
    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15000 }
    );
  });

  test("should login with professional user", async ({ page }) => {
    await page.goto("/en/login");

    // Use professional credentials
    await page
      .getByLabel(/email address/i)
      .fill(TEST_DATA.PROFESSIONAL.email);
    await page.getByLabel(/password/i).fill(TEST_DATA.PROFESSIONAL.password);

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect away from login
    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15000 }
    );
  });
});

test.describe("Login Form - Button States", () => {
  test("should disable submit button while loading", async ({ page }) => {
    await page.goto("/en/login");

    // Fill in credentials
    await page.getByLabel(/email address/i).fill(TEST_DATA.USER.email);
    await page.getByLabel(/password/i).fill(TEST_DATA.USER.password);

    // Submit the form
    const submitButton = page.getByRole("button", { name: /sign in/i });
    await submitButton.click();

    // Button should become disabled with loading text
    const loadingButton = page.getByRole("button", { name: /signing in/i });
    await expect(loadingButton).toBeDisabled();
  });
});

test.describe("Protected Pages - Redirect to Login", () => {
  test("should redirect to login when accessing dashboard/profile unauthenticated", async ({
    page,
  }) => {
    await page.goto("/en/dashboard/profile");

    // Wait for loading spinner to disappear (page finished loading session)
    await page.waitForSelector(".animate-pulse", {
      state: "hidden",
      timeout: 30000,
    });

    // Page should show login required message
    await expect(
      page.getByText(/please log in to edit your profile/i)
    ).toBeVisible();
  });

  test("should show login button on protected page when not authenticated", async ({
    page,
  }) => {
    await page.goto("/en/dashboard/profile");

    // Wait for loading spinner to disappear
    await page.waitForSelector(".animate-pulse", {
      state: "hidden",
      timeout: 30000,
    });

    // Should show login button in main content
    const main = page.locator("main");
    const loginButton = main.getByRole("link", { name: /login/i });
    await expect(loginButton).toBeVisible();
  });

  test("should include callbackUrl when redirecting from protected page", async ({
    page,
  }) => {
    await page.goto("/en/dashboard/profile");

    // Wait for loading spinner to disappear
    await page.waitForSelector(".animate-pulse", {
      state: "hidden",
      timeout: 30000,
    });

    // Find the login link in the main content (not header)
    const main = page.locator("main");
    const loginLink = main.getByRole("link", { name: /login/i });
    await expect(loginLink).toBeVisible();

    const href = await loginLink.getAttribute("href");
    expect(href).toContain("callbackUrl");
    expect(href).toContain("dashboard/profile");
  });
});

test.describe("Session Persistence", () => {
  test("should persist session across page navigation", async ({ page }) => {
    // First login
    await page.goto("/en/login");
    await page.getByLabel(/email address/i).fill(TEST_DATA.USER.email);
    await page.getByLabel(/password/i).fill(TEST_DATA.USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect away from login page
    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15000 }
    );

    // Verify we're on homepage after login (matches http://localhost:3000/en or /en/)
    await expect(page).toHaveURL(/\/(en|ne)\/?$/);

    // Navigate to other public pages to verify basic navigation works after login
    await page.goto("/en/doctors");
    await expect(page).toHaveURL(/\/doctors/);

    // The page should load correctly (not redirect to login)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // Navigate back to homepage
    await page.goto("/en");
    await expect(page).toHaveURL(/\/(en)\/?$/);

    // Verify the homepage loads correctly - hero heading says "Find Your Doctor"
    await expect(
      page.getByRole("heading", { name: /find your doctor/i })
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Logout Flow", () => {
  test("should logout via NextAuth signout endpoint", async ({ page }) => {
    // First login
    await page.goto("/en/login");
    await page.getByLabel(/email address/i).fill(TEST_DATA.USER.email);
    await page.getByLabel(/password/i).fill(TEST_DATA.USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for login to complete
    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15000 }
    );

    // Navigate to signout page
    await page.goto("/api/auth/signout");

    // Click the signout button on NextAuth's signout page
    await page.getByRole("button", { name: /sign out/i }).click();

    // Should redirect - session is now cleared
    await page.waitForURL(
      (url) => {
        // NextAuth typically redirects to homepage after signout
        const path = url.pathname;
        return /^\/(en|ne)?\/?$/.test(path) || path.includes("/login");
      },
      { timeout: 15000 }
    );

    // Verify session is cleared by trying to access protected page
    await page.goto("/en/dashboard/profile");

    // Wait for loading spinner to disappear
    await page.waitForSelector(".animate-pulse", {
      state: "hidden",
      timeout: 30000,
    });

    // Should show "please log in" message since we're logged out
    await expect(
      page.getByText(/please log in to edit your profile/i)
    ).toBeVisible();
  });
});

test.describe("Login Page - Navigation", () => {
  test("should navigate to register page when clicking Create Account link", async ({
    page,
  }) => {
    await page.goto("/en/login");

    const createAccountLink = page.getByRole("link", { name: "Create Account" });
    await createAccountLink.click();

    await expect(page).toHaveURL(/\/en\/register/);
  });
});

test.describe("Login Page - Google OAuth", () => {
  test("should have Google sign-in button that initiates OAuth flow", async ({
    page,
  }) => {
    await page.goto("/en/login");

    const googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    await expect(googleButton).toBeVisible();

    // Google button should have the Google logo SVG
    const googleSvg = googleButton.locator("svg");
    await expect(googleSvg).toBeVisible();
  });
});

test.describe("Login Page - Language Support", () => {
  test("should load login page in Nepali", async ({ page }) => {
    await page.goto("/ne/login");

    // Page should load without errors
    await expect(page).toHaveURL(/\/ne\/login/);

    // Form should still be present
    const submitButton = page.getByRole("button", { name: /sign in/i });
    await expect(submitButton).toBeVisible();
  });
});

test.describe("Login Page - UI Elements", () => {
  test("should display decorative panel on desktop", async ({ page }) => {
    // Use desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/en/login");

    // The decorative panel contains the Nepali text
    const brandingText = page.locator("div.text-5xl");
    await expect(brandingText).toBeVisible();
    await expect(brandingText).toContainText("स्वास्थ्य");

    // Also verify the English "Swasthya" subtext
    const englishBranding = page
      .locator("div.text-lg.uppercase")
      .filter({ hasText: "Swasthya" });
    await expect(englishBranding).toBeVisible();
  });

  test("should show mobile color bar on mobile viewport", async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en/login");

    // Mobile color bar should be visible
    const mobileBar = page.locator("div.lg\\:hidden.h-4.flex");
    await expect(mobileBar).toBeVisible();
  });

  test("should show error styling for error messages", async ({ page }) => {
    await page.goto("/en/login");

    // Fill in incorrect credentials
    await page.getByLabel(/email address/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for error to appear
    await page.waitForSelector('[class*="primary-red"]', { timeout: 10000 });

    // Error box should have error styling
    const errorBox = page.locator('[class*="primary-red"]').first();
    await expect(errorBox).toBeVisible();
  });
});

test.describe("Login Page - Error Messages", () => {
  test("should handle error parameter in URL", async ({ page }) => {
    // Navigate with an error parameter (e.g., from OAuth failure)
    await page.goto("/en/login?error=CredentialsSignin");

    // Should display error message
    await expect(
      page.getByText(/invalid email or password/i)
    ).toBeVisible();
  });

  test("should handle OAuthAccountNotLinked error", async ({ page }) => {
    await page.goto("/en/login?error=OAuthAccountNotLinked");

    // Should display appropriate error message
    await expect(
      page.getByText(/already associated with another account/i)
    ).toBeVisible();
  });
});
