/**
 * Claim Profile E2E Tests
 *
 * Tests for US-043: Verify the profile claim flow works correctly
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";

test.describe("Claim Page - Not Authenticated", () => {
  test("should show login required message when not authenticated", async ({
    page,
  }) => {
    await page.goto("/en/claim");

    await expect(
      page.getByText(/please log in to claim a profile/i)
    ).toBeVisible({ timeout: 15000 });
  });

  test("should display Login button when not authenticated", async ({
    page,
  }) => {
    await page.goto("/en/claim");

    const loginButton = page
      .locator("main")
      .getByRole("link", { name: /^login$/i });
    await expect(loginButton).toBeVisible({ timeout: 15000 });
  });

  test("should display Register button when not authenticated", async ({
    page,
  }) => {
    await page.goto("/en/claim");

    const registerButton = page
      .locator("main")
      .getByRole("link", { name: /^register$/i });
    await expect(registerButton).toBeVisible({ timeout: 15000 });
  });

  test("should include callbackUrl in login link", async ({ page }) => {
    await page.goto("/en/claim?registration=12345");

    const loginLink = page
      .locator("main")
      .getByRole("link", { name: /^login$/i });
    await expect(loginLink).toBeVisible({ timeout: 15000 });

    const href = await loginLink.getAttribute("href");
    expect(href).toContain("callbackUrl");
    expect(href).toContain("/claim");
  });
});

test.describe("Verification Form - Not Authenticated", () => {
  test("should show login required when accessing verification page directly", async ({
    page,
  }) => {
    await page.goto("/en/claim/some-professional-id/verify");

    await expect(
      page.getByText(/please log in to verify your profile/i)
    ).toBeVisible({ timeout: 15000 });
  });

  test("should have login button on verification page when not authenticated", async ({
    page,
  }) => {
    await page.goto("/en/claim/some-professional-id/verify");

    const loginButton = page
      .locator("main")
      .getByRole("link", { name: /^login$/i });
    await expect(loginButton).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Claim Page - Authenticated - Single Test Flow", () => {
  test("complete claim flow: login, search, navigate to verification form", async ({
    authenticatedPage,
  }) => {
    // Navigate to claim page and verify authenticated content
    await authenticatedPage.goto("/en/claim");

    // Wait for page to load
    await authenticatedPage.waitForSelector("main h1", { timeout: 10000 });

    // Check if we're authenticated by looking for the registration input
    const registrationInput = authenticatedPage.locator("#registration");
    await expect(registrationInput).toBeVisible();

    // Verify page elements when authenticated
    const heading = authenticatedPage.getByRole("heading", { level: 1 });
    await expect(heading).toContainText("Claim Your Profile");

    // Search for an unclaimed professional
    await registrationInput.fill(TEST_DATA.REGISTRATION_NUMBERS.UNCLAIMED);
    await authenticatedPage.getByRole("button", { name: /search/i }).click();

    // Verify search results
    await expect(authenticatedPage.getByText(/Dr\. Unclaimed Doctor/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(
      authenticatedPage.getByText(TEST_DATA.REGISTRATION_NUMBERS.UNCLAIMED)
    ).toBeVisible();
    await expect(authenticatedPage.getByText(/MBBS/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/Pokhara/i)).toBeVisible();

    // Verify Start Claim Process button is visible
    const claimButton = authenticatedPage.getByRole("link", {
      name: /start claim process/i,
    });
    await expect(claimButton).toBeVisible();

    // Navigate to verification form
    await claimButton.click();
    await authenticatedPage.waitForURL(/\/claim\/[^/]+\/verify/, { timeout: 15000 });

    // Verify verification form elements
    await expect(
      authenticatedPage.getByRole("heading", { name: /verify your identity/i })
    ).toBeVisible({ timeout: 20000 });
    await expect(authenticatedPage.getByText(/government id/i).first()).toBeVisible();
    await expect(
      authenticatedPage.getByText(/professional certificate/i).first()
    ).toBeVisible();
    await expect(authenticatedPage.getByText(/Dr\. Unclaimed Doctor/i)).toBeVisible();

    // Verify submit button is disabled without files
    const submitButton = authenticatedPage.getByRole("button", {
      name: /submit verification request/i,
    });
    await expect(submitButton).toBeDisabled();

    // Upload files and verify submit becomes enabled
    const governmentIdInput = authenticatedPage.locator('input[type="file"]').first();
    await governmentIdInput.setInputFiles({
      name: "gov-id.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake content"),
    });

    const certificateInput = authenticatedPage.locator('input[type="file"]').nth(1);
    await certificateInput.setInputFiles({
      name: "certificate.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake content"),
    });

    await expect(submitButton).toBeEnabled();

    // Test cancel button
    const cancelButton = authenticatedPage.getByRole("link", { name: /cancel/i });
    await expect(cancelButton).toBeVisible();
  });

  test("search shows 'not found' for invalid registration number", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/claim");

    // Check if authenticated
    const registrationInput = authenticatedPage.locator("#registration");
    await expect(registrationInput).toBeVisible({ timeout: 10000 });

    await registrationInput.fill(TEST_DATA.REGISTRATION_NUMBERS.INVALID);
    await authenticatedPage.getByRole("button", { name: /search/i }).click();

    await expect(
      authenticatedPage.getByText(/no professional found with this registration number/i)
    ).toBeVisible({ timeout: 15000 });
  });

  test("shows 'already claimed' message for claimed profile", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/claim");

    // Check if authenticated
    const registrationInput = authenticatedPage.locator("#registration");
    await expect(registrationInput).toBeVisible({ timeout: 10000 });

    // Registration 88888 is claimed by professional user in seed data
    await registrationInput.fill("88888");
    await authenticatedPage.getByRole("button", { name: /search/i }).click();

    await expect(
      authenticatedPage.getByText(/this profile has already been claimed/i)
    ).toBeVisible({ timeout: 15000 });

    // Should NOT have Start Claim Process button
    const claimButton = authenticatedPage.getByRole("link", {
      name: /start claim process/i,
    });
    await expect(claimButton).not.toBeVisible();
  });

  test("auto-search on initial load with registration param", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto(
      `/en/claim?registration=${TEST_DATA.REGISTRATION_NUMBERS.UNCLAIMED}`
    );

    // Check if authenticated by looking for the registration input
    const registrationInput = authenticatedPage.locator("#registration");
    await expect(registrationInput).toBeVisible({ timeout: 10000 });

    // Should auto-search and display results
    await expect(authenticatedPage.getByText(/Dr\. Unclaimed Doctor/i)).toBeVisible({
      timeout: 20000,
    });
  });

  test("shows correct type labels for different professional types", async ({
    authenticatedPage,
  }) => {
    // Test Doctor type
    await authenticatedPage.goto(
      `/en/claim?registration=${TEST_DATA.REGISTRATION_NUMBERS.UNCLAIMED}`
    );

    // Check if authenticated
    const registrationInput = authenticatedPage.locator("#registration");
    await expect(registrationInput).toBeVisible({ timeout: 10000 });

    await expect(authenticatedPage.getByText("Doctor", { exact: true })).toBeVisible({
      timeout: 20000,
    });

    // Test Dentist type
    await authenticatedPage.goto(
      `/en/claim?registration=${TEST_DATA.REGISTRATION_NUMBERS.DENTIST}`
    );
    await expect(authenticatedPage.getByText("Dentist", { exact: true })).toBeVisible({
      timeout: 20000,
    });

    // Test Pharmacist type
    await authenticatedPage.goto(
      `/en/claim?registration=${TEST_DATA.REGISTRATION_NUMBERS.PHARMACIST}`
    );
    await expect(authenticatedPage.getByText("Pharmacist", { exact: true })).toBeVisible({
      timeout: 20000,
    });
  });
});

test.describe("Claim Flow - Language Support", () => {
  test("should load claim page in Nepali when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/ne/claim");

    // Check if authenticated by looking for registration input
    const registrationInput = authenticatedPage.locator("#registration");
    await expect(registrationInput).toBeVisible({ timeout: 10000 });

    // Check for Nepali heading (only shown when authenticated)
    await expect(
      authenticatedPage.getByText(/आफ्नो प्रोफाइल दाबी गर्नुहोस्/)
    ).toBeVisible({ timeout: 10000 });
  });

  test("should show Nepali search results", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto(
      `/ne/claim?registration=${TEST_DATA.REGISTRATION_NUMBERS.UNCLAIMED}`
    );

    // Check if authenticated
    const registrationInput = authenticatedPage.locator("#registration");
    await expect(registrationInput).toBeVisible({ timeout: 10000 });

    // Should show Nepali name
    await expect(authenticatedPage.getByText(/डा\. अनक्लेम्ड डक्टर/i)).toBeVisible({
      timeout: 20000,
    });
  });

  test("should show login required in Nepali when not authenticated", async ({
    page,
  }) => {
    await page.goto("/ne/claim");

    await expect(
      page.getByText(/प्रोफाइल दाबी गर्न लगइन गर्नुहोस्/)
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Verification Form - File Upload", () => {
  test("should accept and display uploaded files", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto(
      `/en/claim?registration=${TEST_DATA.REGISTRATION_NUMBERS.UNCLAIMED}`
    );

    // Wait for claim button
    const claimButton = authenticatedPage.getByRole("link", {
      name: /start claim process/i,
    });
    await expect(claimButton).toBeVisible({ timeout: 10000 });

    await claimButton.click();
    await authenticatedPage.waitForURL(/\/claim\/[^/]+\/verify/, { timeout: 15000 });

    // Test JPG upload for government ID
    const governmentIdInput = authenticatedPage.locator('input[type="file"]').first();
    await governmentIdInput.setInputFiles({
      name: "test-government-id.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake image content"),
    });

    await expect(authenticatedPage.getByText(/selected file/i).first()).toBeVisible();
    await expect(authenticatedPage.getByText(/test-government-id\.jpg/i)).toBeVisible();

    // Test PDF upload for certificate
    const certificateInput = authenticatedPage.locator('input[type="file"]').nth(1);
    await certificateInput.setInputFiles({
      name: "test-certificate.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake pdf content"),
    });

    await expect(authenticatedPage.getByText(/test-certificate\.pdf/i)).toBeVisible();

    // Test removing file
    const removeButton = authenticatedPage.getByRole("button", { name: /remove/i }).first();
    await removeButton.click();
    await expect(authenticatedPage.getByText(/test-government-id\.jpg/i)).not.toBeVisible();
    await expect(authenticatedPage.getByText(/drag and drop/i).first()).toBeVisible();
  });

  test("should show file size and format requirements", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto(
      `/en/claim?registration=${TEST_DATA.REGISTRATION_NUMBERS.UNCLAIMED}`
    );

    const claimButton = authenticatedPage.getByRole("link", {
      name: /start claim process/i,
    });
    await expect(claimButton).toBeVisible({ timeout: 10000 });

    await claimButton.click();
    await authenticatedPage.waitForURL(/\/claim\/[^/]+\/verify/, { timeout: 15000 });

    await expect(
      authenticatedPage.getByText(/maximum file size: 10mb/i).first()
    ).toBeVisible();
    await expect(authenticatedPage.getByText(/jpg, png, pdf/i).first()).toBeVisible();
  });
});

test.describe("Verification Form - Submission", () => {
  test("should show success or pending message after submission", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto(
      `/en/claim?registration=${TEST_DATA.REGISTRATION_NUMBERS.UNCLAIMED}`
    );

    const claimButton = authenticatedPage.getByRole("link", {
      name: /start claim process/i,
    });
    await expect(claimButton).toBeVisible({ timeout: 10000 });

    await claimButton.click();
    await authenticatedPage.waitForURL(/\/claim\/[^/]+\/verify/, { timeout: 15000 });

    // Upload both files
    const governmentIdInput = authenticatedPage.locator('input[type="file"]').first();
    await governmentIdInput.setInputFiles({
      name: "gov-id.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake content"),
    });

    const certificateInput = authenticatedPage.locator('input[type="file"]').nth(1);
    await certificateInput.setInputFiles({
      name: "certificate.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake content"),
    });

    // Submit
    await authenticatedPage
      .getByRole("button", { name: /submit verification request/i })
      .click();

    // Should show success or already pending message
    const successMessage = authenticatedPage.getByText(/verification request submitted/i);
    const pendingMessage = authenticatedPage.getByText(
      /already have a pending verification request/i
    );

    await expect(successMessage.or(pendingMessage)).toBeVisible({
      timeout: 20000,
    });
  });
});
