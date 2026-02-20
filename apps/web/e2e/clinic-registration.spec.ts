/**
 * Clinic Registration E2E Tests
 *
 * Tests for US-062: Verify clinic registration flow works correctly
 */

import { test, expect, TEST_DATA } from "./fixtures/test-utils";

// Helper to fill basic clinic form fields
async function fillBasicFormFields(
  page: import("@playwright/test").Page,
  data: {
    name: string;
    type: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  }
) {
  await page.getByLabel(/clinic name/i).fill(data.name);
  await page.getByLabel(/clinic type/i).selectOption(data.type);
  await page.getByLabel(/^address/i).fill(data.address);
  await page.getByLabel(/phone/i).fill(data.phone);
  await page.getByLabel(/email address/i).fill(data.email);
  if (data.website) {
    await page.getByLabel(/website/i).fill(data.website);
  }
}

test.describe("Clinic Registration - Access Control", () => {
  test("should show login required message for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/en/clinic/register");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Should see login prompt
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(/log in/i);
  });

  test("should show Login button for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/en/clinic/register");
    await page.waitForLoadState("networkidle");

    // Scope to main content to avoid header login link
    const main = page.locator("main");
    const loginButton = main.getByRole("link", { name: /^login$/i });
    await expect(loginButton).toBeVisible();
  });

  test("should have callback URL in login link", async ({ page }) => {
    await page.goto("/en/clinic/register");
    await page.waitForLoadState("networkidle");

    // Scope to main content to avoid header login link
    const main = page.locator("main");
    const loginLink = main.getByRole("link", { name: /^login$/i });
    await expect(loginLink).toHaveAttribute(
      "href",
      expect.stringContaining("callbackUrl")
    );
    await expect(loginLink).toHaveAttribute(
      "href",
      expect.stringContaining("clinic/register")
    );
  });

  test("should show Create Account button for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/en/clinic/register");
    await page.waitForLoadState("networkidle");

    const registerButton = page.getByRole("link", { name: /create account/i });
    await expect(registerButton).toBeVisible();
  });
});

test.describe("Clinic Registration - Basic Form Functionality", () => {
  test("should show registration form when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should see registration form heading
    const heading = authenticatedPage.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(/register your clinic/i);
  });

  test("should display all required form fields", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Check all required form fields
    await expect(authenticatedPage.getByLabel(/clinic name/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/clinic type/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/^address/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/phone/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/email address/i)).toBeVisible();
    await expect(authenticatedPage.getByLabel(/website/i)).toBeVisible();
  });

  test("should display clinic type dropdown with all options", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const typeSelect = authenticatedPage.getByLabel(/clinic type/i);
    await expect(typeSelect).toBeVisible();

    // Click to open and check options
    const options = typeSelect.locator("option");
    const optionTexts = await options.allTextContents();

    expect(optionTexts).toContain("Clinic");
    expect(optionTexts).toContain("Polyclinic");
    expect(optionTexts).toContain("Hospital");
    expect(optionTexts).toContain("Pharmacy");
  });

  test("should display Clinic Registration badge", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await expect(authenticatedPage.getByText(/clinic registration/i).first()).toBeVisible();
  });

  test("should display Register Clinic button", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const submitButton = authenticatedPage.getByRole("button", {
      name: /register clinic/i,
    });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });
});

test.describe("Clinic Registration - Form Validation", () => {
  test("should show validation error for empty clinic name", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Try to submit without filling name
    await authenticatedPage.getByLabel(/clinic type/i).selectOption("CLINIC");
    await authenticatedPage.getByLabel(/^address/i).fill("Test Address");
    await authenticatedPage.getByLabel(/phone/i).fill("9812345678");
    await authenticatedPage.getByLabel(/email address/i).fill("test@clinic.com");

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();

    // Should show error
    await expect(authenticatedPage.getByText(/clinic name is required/i)).toBeVisible();
  });

  test("should show validation error for invalid phone number", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await authenticatedPage.getByLabel(/clinic name/i).fill("Test Clinic");
    await authenticatedPage.getByLabel(/clinic type/i).selectOption("CLINIC");
    await authenticatedPage.getByLabel(/^address/i).fill("Test Address");
    await authenticatedPage.getByLabel(/phone/i).fill("12345"); // Invalid
    await authenticatedPage.getByLabel(/email address/i).fill("test@clinic.com");

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();

    // Should show phone validation error
    await expect(authenticatedPage.getByText(/valid.*phone/i)).toBeVisible();
  });

  test("should show validation error for invalid email format", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await authenticatedPage.getByLabel(/clinic name/i).fill("Test Clinic");
    await authenticatedPage.getByLabel(/clinic type/i).selectOption("CLINIC");
    await authenticatedPage.getByLabel(/^address/i).fill("Test Address");
    await authenticatedPage.getByLabel(/phone/i).fill("9812345678");
    await authenticatedPage.getByLabel(/email address/i).fill("invalid-email");

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();

    // Should show email validation error
    await expect(authenticatedPage.getByText(/valid email/i)).toBeVisible();
  });

  test("should show validation error for invalid website URL", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await authenticatedPage.getByLabel(/clinic name/i).fill("Test Clinic");
    await authenticatedPage.getByLabel(/clinic type/i).selectOption("CLINIC");
    await authenticatedPage.getByLabel(/^address/i).fill("Test Address");
    await authenticatedPage.getByLabel(/phone/i).fill("9812345678");
    await authenticatedPage.getByLabel(/email address/i).fill("test@clinic.com");
    await authenticatedPage.getByLabel(/website/i).fill("not-a-url");

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();

    // Should show URL validation error
    await expect(authenticatedPage.getByText(/valid url/i)).toBeVisible();
  });

  test("should clear validation error when user starts typing", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Submit empty form to trigger error
    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();

    // Error should be visible
    await expect(authenticatedPage.getByText(/clinic name is required/i)).toBeVisible();

    // Start typing in name field
    await authenticatedPage.getByLabel(/clinic name/i).fill("T");

    // Error should be cleared
    await expect(authenticatedPage.getByText(/clinic name is required/i)).not.toBeVisible();
  });
});

test.describe("Clinic Registration - Logo Upload", () => {
  test("should display logo upload section", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await expect(authenticatedPage.getByText(/clinic logo/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/jpg or png, max 5mb/i)).toBeVisible();
  });

  test("should display upload logo button", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await expect(authenticatedPage.getByText(/upload logo/i)).toBeVisible();
  });
});

test.describe("Clinic Registration - Photos Upload", () => {
  test("should display photos upload section", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await expect(authenticatedPage.getByText(/clinic photos/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/max 5 photos/i)).toBeVisible();
  });

  test("should display upload photos button", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await expect(authenticatedPage.getByText(/upload photos/i)).toBeVisible();
  });
});

test.describe("Clinic Registration - Operating Hours", () => {
  test("should display operating hours section", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await expect(authenticatedPage.getByText(/operating hours/i).first()).toBeVisible();
  });

  test("should display all days of the week", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (const day of days) {
      await expect(authenticatedPage.getByText(day)).toBeVisible();
    }
  });

  test("should have all days closed by default", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Check that "Closed" labels are visible for all days
    const closedLabels = authenticatedPage.getByText("Closed", { exact: true });
    expect(await closedLabels.count()).toBeGreaterThanOrEqual(7);
  });

  test("should toggle day open/closed when clicking toggle", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Find Sunday's toggle button and click it
    const sundayToggle = authenticatedPage.getByRole("button", { name: /toggle sunday/i });
    await sundayToggle.click();

    // Now Sunday should show time inputs
    const sundayOpenTime = authenticatedPage.locator("#sunday-open");
    await expect(sundayOpenTime).toBeVisible();
  });

  test("should show time inputs when day is toggled open", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Toggle Monday open
    const mondayToggle = authenticatedPage.getByRole("button", { name: /toggle monday/i });
    await mondayToggle.click();

    // Should see time inputs for Monday
    await expect(authenticatedPage.locator("#monday-open")).toBeVisible();
    await expect(authenticatedPage.locator("#monday-close")).toBeVisible();
  });
});

test.describe("Clinic Registration - Services Selection", () => {
  test("should display services section", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    await expect(authenticatedPage.getByText(/services/i).first()).toBeVisible();
  });

  test("should display predefined services", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const services = [
      "General Consultation",
      "Specialist Consultation",
      "Lab Tests",
      "X-Ray",
      "Pharmacy",
      "Emergency",
      "Surgery",
    ];

    for (const service of services) {
      // Use button role to avoid ambiguity with clinic type dropdown (e.g. "Pharmacy")
      await expect(authenticatedPage.getByRole("button", { name: service })).toBeVisible();
    }
  });

  test("should allow selecting predefined services", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Click General Consultation service
    const serviceButton = authenticatedPage.getByRole("button", {
      name: /general consultation/i,
    });
    await serviceButton.click();

    // Should show selected count
    await expect(authenticatedPage.getByText(/1 service.*selected/i)).toBeVisible();
  });

  test("should display custom service input field", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const customInput = authenticatedPage.getByPlaceholder(/add your own service/i);
    await expect(customInput).toBeVisible();
  });

  test("should allow adding custom services", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const customInput = authenticatedPage.getByPlaceholder(/add your own service/i);
    await customInput.fill("Custom Health Service");

    const addButton = authenticatedPage.getByRole("button", { name: /^add$/i });
    await addButton.click();

    // Should show the custom service as a tag
    await expect(authenticatedPage.getByText("Custom Health Service")).toBeVisible();
    await expect(authenticatedPage.getByText(/1 service.*selected/i)).toBeVisible();
  });

  test("should allow adding custom services with Enter key", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const customInput = authenticatedPage.getByPlaceholder(/add your own service/i);
    await customInput.fill("Another Custom Service");
    await customInput.press("Enter");

    // Should show the custom service as a tag
    await expect(authenticatedPage.getByText("Another Custom Service")).toBeVisible();
  });
});

test.describe("Clinic Registration - Successful Submission", () => {
  test("should show loading state during submission", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Fill form with unique data
    const uniqueName = `Test Clinic ${Date.now()}`;
    const uniqueEmail = `test-${Date.now()}@clinic.com`;

    await fillBasicFormFields(authenticatedPage, {
      name: uniqueName,
      type: "CLINIC",
      address: "Kathmandu, Nepal",
      phone: "9812345678",
      email: uniqueEmail,
    });

    // Submit and immediately check for loading state
    const submitButton = authenticatedPage.getByRole("button", { name: /register clinic/i });
    await submitButton.click();

    // Button should show loading text
    await expect(
      authenticatedPage.getByRole("button", { name: /registering/i })
    ).toBeVisible();
  });

  test("should redirect to success page after submission", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Fill form with unique data
    const uniqueName = `Success Clinic ${Date.now()}`;
    const uniqueEmail = `success-${Date.now()}@clinic.com`;

    await fillBasicFormFields(authenticatedPage, {
      name: uniqueName,
      type: "HOSPITAL",
      address: "Lalitpur, Nepal",
      phone: "9823456789",
      email: uniqueEmail,
    });

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();

    // Wait for redirect to success page
    await authenticatedPage.waitForURL(/\/clinic\/register\/success/, { timeout: 30000 });

    // Should see success message
    await expect(
      authenticatedPage.getByRole("heading", { name: /congratulations/i })
    ).toBeVisible();
  });

  test("should display clinic details on success page", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const uniqueName = `Details Clinic ${Date.now()}`;
    const uniqueEmail = `details-${Date.now()}@clinic.com`;

    await fillBasicFormFields(authenticatedPage, {
      name: uniqueName,
      type: "POLYCLINIC",
      address: "Bhaktapur, Nepal",
      phone: "9834567890",
      email: uniqueEmail,
    });

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();
    await authenticatedPage.waitForURL(/\/clinic\/register\/success/, { timeout: 30000 });

    // Should show clinic name
    await expect(authenticatedPage.getByText(uniqueName)).toBeVisible();

    // Should show clinic type
    await expect(authenticatedPage.getByText("Polyclinic")).toBeVisible();
  });

  test("should display pending verification message on success page", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const uniqueName = `Pending Clinic ${Date.now()}`;
    const uniqueEmail = `pending-${Date.now()}@clinic.com`;

    await fillBasicFormFields(authenticatedPage, {
      name: uniqueName,
      type: "PHARMACY",
      address: "Chitwan, Nepal",
      phone: "9845678901",
      email: uniqueEmail,
    });

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();
    await authenticatedPage.waitForURL(/\/clinic\/register\/success/, { timeout: 30000 });

    // Should show pending verification info
    await expect(authenticatedPage.getByText(/what's next/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/review/i).first()).toBeVisible();
  });

  test("should display confirmation email message on success page", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const uniqueName = `Email Clinic ${Date.now()}`;
    const uniqueEmail = `email-${Date.now()}@clinic.com`;

    await fillBasicFormFields(authenticatedPage, {
      name: uniqueName,
      type: "CLINIC",
      address: "Pokhara, Nepal",
      phone: "9856789012",
      email: uniqueEmail,
    });

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();
    await authenticatedPage.waitForURL(/\/clinic\/register\/success/, { timeout: 30000 });

    // Should show email confirmation message
    await expect(authenticatedPage.getByText(/email.*sent/i)).toBeVisible();
  });

  test("should have Go to Homepage button on success page", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const uniqueName = `Home Clinic ${Date.now()}`;
    const uniqueEmail = `home-${Date.now()}@clinic.com`;

    await fillBasicFormFields(authenticatedPage, {
      name: uniqueName,
      type: "CLINIC",
      address: "Biratnagar, Nepal",
      phone: "9867890123",
      email: uniqueEmail,
    });

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();
    await authenticatedPage.waitForURL(/\/clinic\/register\/success/, { timeout: 30000 });

    const homeButton = authenticatedPage.getByRole("link", { name: /go to homepage/i });
    await expect(homeButton).toBeVisible();
  });

  test("should have Register Another Clinic button on success page", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    const uniqueName = `Another Clinic ${Date.now()}`;
    const uniqueEmail = `another-${Date.now()}@clinic.com`;

    await fillBasicFormFields(authenticatedPage, {
      name: uniqueName,
      type: "CLINIC",
      address: "Birgunj, Nepal",
      phone: "9878901234",
      email: uniqueEmail,
    });

    await authenticatedPage.getByRole("button", { name: /register clinic/i }).click();
    await authenticatedPage.waitForURL(/\/clinic\/register\/success/, { timeout: 30000 });

    const registerAnotherButton = authenticatedPage.getByRole("link", {
      name: /register another clinic/i,
    });
    await expect(registerAnotherButton).toBeVisible();
  });
});

test.describe("Clinic Registration - Language Support", () => {
  test("should display Nepali login prompt for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/ne/clinic/register");
    await page.waitForLoadState("networkidle");

    // Should see Nepali login prompt
    await expect(page.getByText(/कृपया लगइन/i)).toBeVisible();
  });

  test("should display Nepali form when authenticated", async ({
    authenticatedPage,
  }) => {
    // Navigate to Nepali version
    await authenticatedPage.goto("/ne/clinic/register");
    await authenticatedPage.waitForLoadState("networkidle");

    // Check if authenticated
    const nameInput = authenticatedPage.getByLabel(/क्लिनिकको नाम/i);
    await expect(nameInput).toBeVisible();

    // Should see Nepali content
    await expect(authenticatedPage.getByText(/क्लिनिक दर्ता/i)).toBeVisible();
  });

  test("should display Nepali success page", async ({ page }) => {
    // Navigate directly to success page with params (test the page itself)
    await page.goto(
      "/ne/clinic/register/success?name=टेस्ट%20क्लिनिक&slug=test-clinic&type=CLINIC"
    );
    await page.waitForLoadState("networkidle");

    // Should see Nepali congratulations
    await expect(page.getByText(/बधाई/i)).toBeVisible();
  });
});

test.describe("Clinic Registration - UI Elements", () => {
  test("should display decorative panel on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/en/clinic/register");
    await page.waitForLoadState("networkidle");

    // The decorative panel should be visible (has bg-primary-blue)
    const decorativePanel = page.locator(".bg-primary-blue").first();
    await expect(decorativePanel).toBeVisible();
  });

  test("should display mobile accent bar on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en/clinic/register");
    await page.waitForLoadState("networkidle");

    // Mobile accent bar should be visible
    const accentBar = page.locator(".lg\\:hidden.h-4.flex");
    await expect(accentBar).toBeVisible();
  });

  test("should display Swasthya branding", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/en/clinic/register");
    await page.waitForLoadState("networkidle");

    // Should see Swasthya branding in decorative panel
    await expect(page.getByText("स्वास्थ्य")).toBeVisible();
  });
});

test.describe("Clinic Registration - Success Page Navigation", () => {
  test("should navigate to homepage from success page", async ({ page }) => {
    // Navigate directly to success page
    await page.goto(
      "/en/clinic/register/success?name=Test&slug=test&type=CLINIC"
    );
    await page.waitForLoadState("networkidle");

    const homeButton = page.getByRole("link", { name: /go to homepage/i });
    await homeButton.click();

    await page.waitForURL(/\/en\/?$/);
  });

  test("should navigate back to registration from success page", async ({
    page,
  }) => {
    // Navigate directly to success page
    await page.goto(
      "/en/clinic/register/success?name=Test&slug=test&type=CLINIC"
    );
    await page.waitForLoadState("networkidle");

    const registerAnotherButton = page.getByRole("link", {
      name: /register another clinic/i,
    });
    await registerAnotherButton.click();

    await page.waitForURL(/\/en\/clinic\/register$/);
  });
});
