/**
 * i18n Auth Error Messages E2E Tests
 *
 * Tests that auth error messages are properly translated when using Nepali locale.
 * A Nepali user browsing /ne/* should see Nepali error messages, labels, and headings.
 *
 * Verifies:
 * - Login page shows Nepali errors for URL error parameters
 * - Login page shows Nepali errors for wrong credentials
 * - Login page shows Nepali UI labels
 * - Register page shows Nepali heading
 * - Forgot-password page shows Nepali heading
 * - English vs Nepali pages show different language content for same error
 */

import { test, expect } from "@playwright/test";
import { TEST_DATA } from "./fixtures/test-utils";

/**
 * Regex to detect Devanagari script characters (used by Nepali).
 * Matches Unicode range U+0900-U+097F.
 */
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

/**
 * Regex to detect only ASCII Latin letters (English).
 * If a string matches this AND does not match Devanagari, it's English.
 */
const LATIN_ONLY_REGEX = /^[A-Za-z\s.,!?'"()-]+$/;

test.describe("Nepali Login Page - Error URL Parameters", () => {
  test("should show Nepali error for CredentialsSignin error code", async ({
    page,
  }) => {
    await page.goto("/ne/login?error=CredentialsSignin");

    // The login page renders error in a div with primary-red styling
    const errorBox = page.locator('[class*="primary-red"]').first();
    await expect(errorBox).toBeVisible();

    // Should contain the Nepali translation for invalid credentials
    // Login defaults to phone method, so CredentialsSignin maps to phone error
    // But the key point: it must be Nepali, not English
    const errorText = await errorBox.textContent();
    expect(errorText).not.toBeNull();
    expect(DEVANAGARI_REGEX.test(errorText!)).toBe(true);
  });

  test("should show Nepali error for OAuthAccountNotLinked error code", async ({
    page,
  }) => {
    await page.goto("/ne/login?error=OAuthAccountNotLinked");

    const errorBox = page.locator('[class*="primary-red"]').first();
    await expect(errorBox).toBeVisible();

    // Should show the Nepali OAuth error:
    // "यो इमेल पहिले नै अर्को खातासँग जोडिएको छ"
    await expect(errorBox).toContainText(
      "यो इमेल पहिले नै अर्को खातासँग जोडिएको छ"
    );
  });

  test("should show Nepali error for unknown error code (generic fallback)", async ({
    page,
  }) => {
    await page.goto("/ne/login?error=SomeUnknownError");

    const errorBox = page.locator('[class*="primary-red"]').first();
    await expect(errorBox).toBeVisible();

    // Should fall back to the generic Nepali error:
    // "साइन इन गर्दा त्रुटि भयो"
    await expect(errorBox).toContainText("साइन इन गर्दा त्रुटि भयो");
  });

  test("error text should contain Nepali characters, not English", async ({
    page,
  }) => {
    await page.goto("/ne/login?error=CredentialsSignin");

    const errorBox = page.locator('[class*="primary-red"]').first();
    await expect(errorBox).toBeVisible();

    const errorText = (await errorBox.textContent()) ?? "";
    // Must contain Devanagari script
    expect(DEVANAGARI_REGEX.test(errorText)).toBe(true);
    // Must NOT be a purely Latin/English string
    expect(LATIN_ONLY_REGEX.test(errorText.trim())).toBe(false);
  });
});

test.describe("Nepali Login Page - Wrong Credentials", () => {
  test("should show Nepali error when logging in with wrong password", async ({
    page,
  }) => {
    await page.goto("/ne/login");

    // The login page defaults to "phone" auth method.
    // Switch to email tab to test email login.
    const emailTab = page.getByRole("button", { name: /इमेलबाट/i });
    await emailTab.click();

    // Fill in credentials with wrong password
    await page.getByLabel(/इमेल/i).fill(TEST_DATA.USER.email);
    await page.getByLabel(/पासवर्ड/i).fill("wrongpassword123");

    // Submit the form
    await page.getByRole("button", { name: /साइन इन$/i }).click();

    // Wait for the form to finish loading (button text changes back from "साइन इन हुँदैछ...")
    await expect(
      page.getByRole("button", { name: /साइन इन$/i })
    ).toBeVisible({ timeout: 15000 });

    // Error box should appear with Nepali text
    const errorBox = page.locator('[class*="primary-red"]').first();
    await expect(errorBox).toBeVisible({ timeout: 10000 });

    const errorText = (await errorBox.textContent()) ?? "";
    // Error message should be in Nepali (Devanagari script)
    expect(DEVANAGARI_REGEX.test(errorText)).toBe(true);
  });

  test("error message should NOT be in English", async ({ page }) => {
    await page.goto("/ne/login");

    // Switch to email tab
    const emailTab = page.getByRole("button", { name: /इमेलबाट/i });
    await emailTab.click();

    // Fill wrong credentials
    await page.getByLabel(/इमेल/i).fill(TEST_DATA.USER.email);
    await page.getByLabel(/पासवर्ड/i).fill("wrongpassword123");

    // Submit
    await page.getByRole("button", { name: /साइन इन$/i }).click();

    // Wait for response
    await expect(
      page.getByRole("button", { name: /साइन इन$/i })
    ).toBeVisible({ timeout: 15000 });

    const errorBox = page.locator('[class*="primary-red"]').first();
    await expect(errorBox).toBeVisible({ timeout: 10000 });

    const errorText = (await errorBox.textContent()) ?? "";

    // Should NOT contain common English error phrases
    expect(errorText.toLowerCase()).not.toContain("invalid email");
    expect(errorText.toLowerCase()).not.toContain("invalid password");
    expect(errorText.toLowerCase()).not.toContain("error occurred");
    expect(errorText.toLowerCase()).not.toContain("incorrect");
  });
});

test.describe("Nepali Login Page - UI Labels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ne/login");
  });

  test("should show Nepali heading 'साइन इन'", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("साइन इन");
  });

  test("should show Nepali welcome badge 'स्वागत छ'", async ({ page }) => {
    await expect(page.getByText("स्वागत छ")).toBeVisible();
  });

  test("should show Nepali password label 'पासवर्ड'", async ({ page }) => {
    // The password label should be visible in Nepali
    await expect(page.getByText("पासवर्ड", { exact: false })).toBeVisible();
  });

  test("should show Nepali 'no account' text and create account link", async ({
    page,
  }) => {
    // "खाता छैन?" and "खाता बनाउनुहोस्"
    await expect(page.getByText("खाता छैन?")).toBeVisible();
    await expect(page.getByText("खाता बनाउनुहोस्")).toBeVisible();
  });

  test("should show Nepali auth method tabs", async ({ page }) => {
    // Phone tab: "फोनबाट"
    await expect(page.getByRole("button", { name: /फोनबाट/ })).toBeVisible();
    // Email tab: "इमेलबाट"
    await expect(page.getByRole("button", { name: /इमेलबाट/ })).toBeVisible();
  });

  test("should show Nepali forgot password link", async ({ page }) => {
    // Switch to email tab so password field and forgot link are visible
    await page.getByRole("button", { name: /इमेलबाट/ }).click();

    await expect(page.getByText("पासवर्ड बिर्सनुभयो?")).toBeVisible();
  });
});

test.describe("Nepali Register Page - UI", () => {
  test("should load /ne/register with Nepali heading 'खाता बनाउनुहोस्'", async ({
    page,
  }) => {
    await page.goto("/ne/register");

    await expect(page).toHaveURL(/\/ne\/register/);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("खाता बनाउनुहोस्");
  });

  test("should show Nepali account type descriptions", async ({ page }) => {
    await page.goto("/ne/register");

    // Patient option: "बिरामी"
    await expect(page.getByText("बिरामी")).toBeVisible();
    // Clinic option: "क्लिनिक / डाक्टर"
    await expect(page.getByText("क्लिनिक / डाक्टर")).toBeVisible();
  });

  test("should show Nepali auth method tabs on register page", async ({
    page,
  }) => {
    await page.goto("/ne/register");

    await expect(page.getByRole("button", { name: /फोनबाट/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /इमेलबाट/ })).toBeVisible();
  });

  test("should show Nepali sign-in link for existing users", async ({
    page,
  }) => {
    await page.goto("/ne/register");

    await expect(page.getByText("पहिले नै खाता छ?")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "साइन इन" })
    ).toBeVisible();
  });
});

test.describe("Nepali Forgot Password Page - UI", () => {
  test("should load /ne/forgot-password with Nepali heading 'पासवर्ड रिसेट'", async ({
    page,
  }) => {
    await page.goto("/ne/forgot-password");

    await expect(page).toHaveURL(/\/ne\/forgot-password/);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("पासवर्ड रिसेट");
  });

  test("should show Nepali method toggle tabs", async ({ page }) => {
    await page.goto("/ne/forgot-password");

    // Email tab: "इमेल"
    await expect(page.getByRole("button", { name: "इमेल" })).toBeVisible();
    // Phone tab: "फोन"
    await expect(page.getByRole("button", { name: "फोन" })).toBeVisible();
  });

  test("should show Nepali back-to-login link", async ({ page }) => {
    await page.goto("/ne/forgot-password");

    await expect(page.getByText("लगइनमा फर्कनुहोस्")).toBeVisible();
  });

  test("should show Nepali subtitle for email method", async ({ page }) => {
    await page.goto("/ne/forgot-password");

    // Default method is email, so subtitle should be in Nepali
    await expect(
      page.getByText("आफ्नो इमेल प्रविष्ट गर्नुहोस्")
    ).toBeVisible();
  });
});

test.describe("English vs Nepali Error Comparison", () => {
  test("CredentialsSignin error shows different text for /en/ vs /ne/", async ({
    page,
  }) => {
    // Load English login with error
    await page.goto("/en/login?error=CredentialsSignin");
    const enErrorBox = page.locator('[class*="primary-red"]').first();
    await expect(enErrorBox).toBeVisible();
    const enErrorText = (await enErrorBox.textContent()) ?? "";

    // Load Nepali login with same error
    await page.goto("/ne/login?error=CredentialsSignin");
    const neErrorBox = page.locator('[class*="primary-red"]').first();
    await expect(neErrorBox).toBeVisible();
    const neErrorText = (await neErrorBox.textContent()) ?? "";

    // The two error texts should be different (different languages)
    expect(enErrorText).not.toBe(neErrorText);

    // English should not contain Devanagari
    expect(DEVANAGARI_REGEX.test(enErrorText)).toBe(false);

    // Nepali should contain Devanagari
    expect(DEVANAGARI_REGEX.test(neErrorText)).toBe(true);
  });

  test("OAuthAccountNotLinked error shows English on /en/ and Nepali on /ne/", async ({
    page,
  }) => {
    // English
    await page.goto("/en/login?error=OAuthAccountNotLinked");
    const enErrorBox = page.locator('[class*="primary-red"]').first();
    await expect(enErrorBox).toBeVisible();
    await expect(enErrorBox).toContainText(
      "already associated with another account"
    );

    // Nepali
    await page.goto("/ne/login?error=OAuthAccountNotLinked");
    const neErrorBox = page.locator('[class*="primary-red"]').first();
    await expect(neErrorBox).toBeVisible();
    await expect(neErrorBox).toContainText(
      "यो इमेल पहिले नै अर्को खातासँग जोडिएको छ"
    );
  });

  test("/en/login shows English UI labels while /ne/login shows Nepali", async ({
    page,
  }) => {
    // English login
    await page.goto("/en/login");
    const enHeading = page.getByRole("heading", { level: 1 });
    await expect(enHeading).toContainText("Sign In");
    await expect(page.getByText("Welcome Back")).toBeVisible();

    // Nepali login
    await page.goto("/ne/login");
    const neHeading = page.getByRole("heading", { level: 1 });
    await expect(neHeading).toContainText("साइन इन");
    await expect(page.getByText("स्वागत छ")).toBeVisible();
  });
});
