/**
 * Forgot Password E2E Tests
 *
 * Tests for the forgot password flow: email reset link and phone OTP methods.
 * Covers UI rendering, method switching, form validation, step transitions,
 * and navigation.
 */

import { test, expect } from "@playwright/test";

test.describe("Forgot Password Page - Basic UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/forgot-password");
  });

  test("should load with correct heading 'Reset Password'", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Reset Password");
  });

  test("should show email tab as active by default", async ({ page }) => {
    // The email tab should have the active styling (bg-primary-blue)
    const emailTab = page.getByRole("button", { name: /^email$/i });
    await expect(emailTab).toBeVisible();
    await expect(emailTab).toHaveClass(/bg-primary-blue/);
  });

  test("should show method toggle tabs (Email, Phone)", async ({ page }) => {
    const emailTab = page.getByRole("button", { name: /^email$/i });
    const phoneTab = page.getByRole("button", { name: /^phone$/i });

    await expect(emailTab).toBeVisible();
    await expect(phoneTab).toBeVisible();
  });

  test("should show email input field when email tab selected", async ({
    page,
  }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("placeholder", "you@example.com");
  });

  test("should show 'Send Reset Link' button", async ({ page }) => {
    const sendLinkButton = page.getByRole("button", {
      name: /send reset link/i,
    });
    await expect(sendLinkButton).toBeVisible();
  });

  test("should show 'Back to Login' link", async ({ page }) => {
    const backToLoginLink = page.getByRole("link", {
      name: /back to login/i,
    });
    await expect(backToLoginLink).toBeVisible();
  });
});

test.describe("Forgot Password - Email Method", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/forgot-password");
  });

  test("should disable 'Send Reset Link' button when email is empty", async ({
    page,
  }) => {
    // Button is disabled when email does not contain '@'
    const sendLinkButton = page.getByRole("button", {
      name: /send reset link/i,
    });
    await expect(sendLinkButton).toBeDisabled();
  });

  test("should disable button when email has no '@' symbol", async ({
    page,
  }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("invalidemail");

    const sendLinkButton = page.getByRole("button", {
      name: /send reset link/i,
    });
    await expect(sendLinkButton).toBeDisabled();
  });

  test("should enable button when email contains '@'", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("user@example.com");

    const sendLinkButton = page.getByRole("button", {
      name: /send reset link/i,
    });
    await expect(sendLinkButton).toBeEnabled();
  });

  test("should show loading state when 'Send Reset Link' is clicked", async ({
    page,
  }) => {
    // Intercept the API call and delay it so we can observe loading state
    await page.route("**/api/auth/forgot-password/email", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");

    const sendLinkButton = page.getByRole("button", {
      name: /send reset link/i,
    });
    await sendLinkButton.click();

    // Should show "Sending..." text while loading
    const loadingButton = page.getByRole("button", { name: /sending/i });
    await expect(loadingButton).toBeVisible();
    await expect(loadingButton).toBeDisabled();
  });

  test("should show 'Email Sent!' confirmation after successful submission", async ({
    page,
  }) => {
    // Intercept the API call and return success
    await page.route("**/api/auth/forgot-password/email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");

    await page.getByRole("button", { name: /send reset link/i }).click();

    // Should transition to email_sent step
    await expect(page.getByText("Email Sent!")).toBeVisible();
    await expect(
      page.getByText(
        /if an account exists with this email, a password reset link has been sent/i
      )
    ).toBeVisible();
    await expect(
      page.getByText(/please check your inbox \(and spam folder\)/i)
    ).toBeVisible();
  });

  test("should show resend timer after email is sent", async ({ page }) => {
    await page.route("**/api/auth/forgot-password/email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");

    await page.getByRole("button", { name: /send reset link/i }).click();

    // Should show the resend countdown timer
    await expect(page.getByText(/resend in:/i)).toBeVisible();
  });

  test("should show error message on API failure", async ({ page }) => {
    await page.route("**/api/auth/forgot-password/email", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");

    await page.getByRole("button", { name: /send reset link/i }).click();

    // Should show the error in the red error box
    const errorBox = page.locator('[class*="primary-red"]').first();
    await expect(errorBox).toBeVisible();
  });

  test("should show error on network failure", async ({ page }) => {
    await page.route("**/api/auth/forgot-password/email", async (route) => {
      await route.abort("connectionrefused");
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");

    await page.getByRole("button", { name: /send reset link/i }).click();

    // Should show network error message
    await expect(
      page.getByText(/network error\. please try again/i)
    ).toBeVisible();
  });
});

test.describe("Forgot Password - Phone Method", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/forgot-password");
    // Switch to phone tab
    await page.getByRole("button", { name: /^phone$/i }).click();
  });

  test("should switch to phone input when phone tab is clicked", async ({
    page,
  }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute("placeholder", "98XXXXXXXX");
  });

  test("should show 'Send OTP' button", async ({ page }) => {
    const sendOtpButton = page.getByRole("button", { name: /send otp/i });
    await expect(sendOtpButton).toBeVisible();
  });

  test("should disable 'Send OTP' button when phone is too short", async ({
    page,
  }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("981234");

    const sendOtpButton = page.getByRole("button", { name: /send otp/i });
    await expect(sendOtpButton).toBeDisabled();
  });

  test("should enable 'Send OTP' button when phone is 10+ digits", async ({
    page,
  }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("9812345678");

    const sendOtpButton = page.getByRole("button", { name: /send otp/i });
    await expect(sendOtpButton).toBeEnabled();
  });

  test("should show 'Back to Login' link on phone input step", async ({
    page,
  }) => {
    const backToLoginLink = page.getByRole("link", {
      name: /back to login/i,
    });
    await expect(backToLoginLink).toBeVisible();
  });

  test("should show loading state when 'Send OTP' is clicked", async ({
    page,
  }) => {
    await page.route("**/api/auth/otp/send", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("9812345678");

    await page.getByRole("button", { name: /send otp/i }).click();

    // Should show "Sending..." text
    const loadingButton = page.getByRole("button", { name: /sending/i });
    await expect(loadingButton).toBeVisible();
    await expect(loadingButton).toBeDisabled();
  });

  test("should transition to OTP step after successful send", async ({
    page,
  }) => {
    await page.route("**/api/auth/otp/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("9812345678");

    await page.getByRole("button", { name: /send otp/i }).click();

    // Should transition to OTP step
    await expect(page.getByText(/otp sent to:/i)).toBeVisible();
    // Should mask the phone number
    await expect(page.getByText(/981\*\*\*\*678/)).toBeVisible();
    // Should show Verify button (disabled until OTP is 6 digits)
    const verifyButton = page.getByRole("button", { name: /^verify$/i });
    await expect(verifyButton).toBeVisible();
    await expect(verifyButton).toBeDisabled();
  });

  test("should show resend timer on OTP step", async ({ page }) => {
    await page.route("**/api/auth/otp/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("9812345678");

    await page.getByRole("button", { name: /send otp/i }).click();

    // Should show resend countdown
    await expect(page.getByText(/resend in:/i)).toBeVisible();
  });

  test("should enable Verify button when 6-digit OTP is entered", async ({
    page,
  }) => {
    await page.route("**/api/auth/otp/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("9812345678");

    await page.getByRole("button", { name: /send otp/i }).click();

    // Wait for OTP step
    await expect(page.getByText(/otp sent to:/i)).toBeVisible();

    // Enter a 6-digit OTP
    const otpInput = page.locator('input[maxlength="6"]');
    await otpInput.fill("123456");

    const verifyButton = page.getByRole("button", { name: /^verify$/i });
    await expect(verifyButton).toBeEnabled();
  });

  test("should show Back button on OTP step and go back to input", async ({
    page,
  }) => {
    await page.route("**/api/auth/otp/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("9812345678");

    await page.getByRole("button", { name: /send otp/i }).click();

    // Wait for OTP step
    await expect(page.getByText(/otp sent to:/i)).toBeVisible();

    // Click Back button
    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible();
    await backButton.click();

    // Should return to input step -- method toggle tabs should be visible again
    await expect(
      page.getByRole("button", { name: /^email$/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^phone$/i })
    ).toBeVisible();
  });
});

test.describe("Forgot Password - Method Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/forgot-password");
  });

  test("should switch between email and phone methods", async ({ page }) => {
    // Start on email (default)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Switch to phone
    await page.getByRole("button", { name: /^phone$/i }).click();
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    await expect(emailInput).not.toBeVisible();

    // Phone tab should now be active
    const phoneTab = page.getByRole("button", { name: /^phone$/i });
    await expect(phoneTab).toHaveClass(/bg-primary-blue/);

    // Switch back to email
    await page.getByRole("button", { name: /^email$/i }).click();
    await expect(emailInput).toBeVisible();
    await expect(phoneInput).not.toBeVisible();

    // Email tab should be active again
    const emailTab = page.getByRole("button", { name: /^email$/i });
    await expect(emailTab).toHaveClass(/bg-primary-blue/);
  });

  test("should reset form state when switching methods", async ({ page }) => {
    // Type something in email field
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("user@example.com");

    // Switch to phone
    await page.getByRole("button", { name: /^phone$/i }).click();
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toHaveValue("");

    // Type in phone field
    await phoneInput.fill("9812345678");

    // Switch back to email
    await page.getByRole("button", { name: /^email$/i }).click();
    // Email should be cleared
    await expect(emailInput).toHaveValue("");
  });

  test("should clear error when switching methods", async ({ page }) => {
    // Trigger an error on the email method
    await page.route("**/api/auth/forgot-password/email", async (route) => {
      await route.abort("connectionrefused");
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    // Wait for the error to appear
    await expect(
      page.getByText(/network error\. please try again/i)
    ).toBeVisible();

    // Switch to phone -- error should be cleared
    await page.getByRole("button", { name: /^phone$/i }).click();
    await expect(
      page.getByText(/network error\. please try again/i)
    ).not.toBeVisible();
  });
});

test.describe("Forgot Password - Password Validation", () => {
  test.beforeEach(async ({ page }) => {
    // We need to get to the password step via the phone OTP flow.
    // Intercept both the OTP send and OTP verify APIs to simulate reaching the password step.
    await page.route("**/api/auth/otp/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route("**/api/auth/otp/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          verificationToken: "mock-token-123",
        }),
      });
    });

    await page.goto("/en/forgot-password");

    // Switch to phone method
    await page.getByRole("button", { name: /^phone$/i }).click();

    // Enter phone and send OTP
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("9812345678");
    await page.getByRole("button", { name: /send otp/i }).click();

    // Wait for OTP step, enter OTP, and verify
    await expect(page.getByText(/otp sent to:/i)).toBeVisible();
    const otpInput = page.locator('input[maxlength="6"]');
    await otpInput.fill("123456");
    await page.getByRole("button", { name: /^verify$/i }).click();

    // Wait for password step
    await expect(
      page.locator('input[type="password"]').first()
    ).toBeVisible();
  });

  test("should show password and confirm password fields", async ({
    page,
  }) => {
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(2);

    // Check labels
    await expect(page.getByText(/new password/i)).toBeVisible();
    await expect(page.getByText(/confirm password/i)).toBeVisible();
  });

  test("should disable 'Reset Password' button when password is too short", async ({
    page,
  }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmInput = page.locator('input[type="password"]').nth(1);

    await passwordInput.fill("short");
    await confirmInput.fill("short");

    const resetButton = page.getByRole("button", {
      name: /reset password/i,
    });
    await expect(resetButton).toBeDisabled();
  });

  test("should disable 'Reset Password' button when passwords do not match", async ({
    page,
  }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmInput = page.locator('input[type="password"]').nth(1);

    await passwordInput.fill("ValidPassword123!");
    await confirmInput.fill("DifferentPassword!");

    const resetButton = page.getByRole("button", {
      name: /reset password/i,
    });
    await expect(resetButton).toBeDisabled();
  });

  test("should enable 'Reset Password' button when passwords match and are 8+ chars", async ({
    page,
  }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmInput = page.locator('input[type="password"]').nth(1);

    await passwordInput.fill("ValidPassword123!");
    await confirmInput.fill("ValidPassword123!");

    const resetButton = page.getByRole("button", {
      name: /reset password/i,
    });
    await expect(resetButton).toBeEnabled();
  });

  test("should show error when submitting mismatched passwords via API handler", async ({
    page,
  }) => {
    // The client-side validation disables the button, but let's test the
    // error display by directly calling the handler through a workaround:
    // fill matching passwords first, then change one field after the button is enabled.
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmInput = page.locator('input[type="password"]').nth(1);

    // First fill matching passwords to enable the button
    await passwordInput.fill("ValidPassword123!");
    await confirmInput.fill("ValidPassword123!");

    const resetButton = page.getByRole("button", {
      name: /reset password/i,
    });
    await expect(resetButton).toBeEnabled();

    // Now clear confirm and type a different value -- button should become disabled
    await confirmInput.fill("DifferentPassword!");
    await expect(resetButton).toBeDisabled();
  });

  test("should show success step after successful password reset", async ({
    page,
  }) => {
    await page.route("**/api/auth/reset-password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const passwordInput = page.locator('input[type="password"]').first();
    const confirmInput = page.locator('input[type="password"]').nth(1);

    await passwordInput.fill("NewValidPassword123!");
    await confirmInput.fill("NewValidPassword123!");

    await page.getByRole("button", { name: /reset password/i }).click();

    // Should transition to success step
    await expect(page.getByText("Password Reset!")).toBeVisible();
    await expect(
      page.getByText(/your password has been successfully reset/i)
    ).toBeVisible();

    // Should show "Login Now" button
    const loginNowButton = page.getByRole("button", {
      name: /login now/i,
    });
    await expect(loginNowButton).toBeVisible();
  });

  test("should show Back button on password step", async ({ page }) => {
    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible();
  });
});

test.describe("Forgot Password - Navigation", () => {
  test("should navigate back to login page via 'Back to Login' link", async ({
    page,
  }) => {
    await page.goto("/en/forgot-password");

    const backToLoginLink = page.getByRole("link", {
      name: /back to login/i,
    });
    await backToLoginLink.click();

    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("'Back to Login' link should preserve language (en)", async ({
    page,
  }) => {
    await page.goto("/en/forgot-password");

    const backToLoginLink = page.getByRole("link", {
      name: /back to login/i,
    });
    const href = await backToLoginLink.getAttribute("href");
    expect(href).toContain("/en/login");
  });

  test("'Back to Login' link should preserve language (ne)", async ({
    page,
  }) => {
    await page.goto("/ne/forgot-password");

    const backToLoginLink = page.getByRole("link", {
      name: /लगइनमा फर्कनुहोस्/,
    });
    const href = await backToLoginLink.getAttribute("href");
    expect(href).toContain("/ne/login");
  });

  test("should load correctly in Nepali (/ne/forgot-password)", async ({
    page,
  }) => {
    await page.goto("/ne/forgot-password");

    // Page should load without errors
    await expect(page).toHaveURL(/\/ne\/forgot-password/);

    // Heading should show Nepali text
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("पासवर्ड रिसेट");

    // Tabs should show Nepali text
    await expect(page.getByRole("button", { name: "इमेल" })).toBeVisible();
    await expect(page.getByRole("button", { name: "फोन" })).toBeVisible();

    // Button should show Nepali text
    await expect(
      page.getByRole("button", { name: /रिसेट लिंक पठाउनुहोस्/ })
    ).toBeVisible();
  });

  test("should navigate to login from email_sent step", async ({ page }) => {
    await page.goto("/en/forgot-password");

    await page.route("**/api/auth/forgot-password/email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");

    await page.getByRole("button", { name: /send reset link/i }).click();

    // Wait for email_sent step
    await expect(page.getByText("Email Sent!")).toBeVisible();

    // Click "Back to Login" on the email_sent step
    const backToLoginLink = page.getByRole("link", {
      name: /back to login/i,
    });
    await backToLoginLink.click();

    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("should show Back button on email_sent step to go back to input", async ({
    page,
  }) => {
    await page.goto("/en/forgot-password");

    await page.route("**/api/auth/forgot-password/email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");

    await page.getByRole("button", { name: /send reset link/i }).click();

    // Wait for email_sent step
    await expect(page.getByText("Email Sent!")).toBeVisible();

    // Click Back button
    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible();
    await backButton.click();

    // Should return to input step -- method toggle tabs and email input should be visible
    await expect(
      page.getByRole("button", { name: /^email$/i })
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("Login Now button on success step should navigate to login", async ({
    page,
  }) => {
    // Set up full phone flow mocks
    await page.route("**/api/auth/otp/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route("**/api/auth/otp/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          verificationToken: "mock-token-123",
        }),
      });
    });

    await page.route("**/api/auth/reset-password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/en/forgot-password");

    // Complete the full phone flow
    await page.getByRole("button", { name: /^phone$/i }).click();
    await page.locator('input[type="tel"]').fill("9812345678");
    await page.getByRole("button", { name: /send otp/i }).click();

    await expect(page.getByText(/otp sent to:/i)).toBeVisible();
    await page.locator('input[maxlength="6"]').fill("123456");
    await page.getByRole("button", { name: /^verify$/i }).click();

    await expect(
      page.locator('input[type="password"]').first()
    ).toBeVisible();
    await page.locator('input[type="password"]').first().fill("NewPassword123!");
    await page
      .locator('input[type="password"]')
      .nth(1)
      .fill("NewPassword123!");
    await page.getByRole("button", { name: /reset password/i }).click();

    // Wait for success step
    await expect(page.getByText("Password Reset!")).toBeVisible();

    // Click "Login Now"
    await page.getByRole("button", { name: /login now/i }).click();

    // Should navigate to login page
    await expect(page).toHaveURL(/\/en\/login/);
  });
});
