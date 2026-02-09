import { test as base, Page, expect } from "@playwright/test";

/**
 * Test data constants for E2E tests
 * These correspond to seeded test data
 */
export const TEST_DATA = {
  // Test user credentials
  USER: {
    email: "testuser@example.com",
    password: "TestPassword123!",
    name: "Test User",
  },
  PROFESSIONAL: {
    email: "professional@example.com",
    password: "Professional123!",
    name: "Dr. Test Professional",
  },
  ADMIN: {
    email: "admin@example.com",
    password: "AdminPassword123!",
    name: "Admin User",
  },
  CLINIC_OWNER: {
    email: "clinicowner@example.com",
    password: "ClinicOwner123!",
    name: "Clinic Owner",
  },

  // Test professional slugs (doctors)
  DOCTORS: {
    DR_RAM_SHARMA: "dr-ram-sharma-12345",
    DR_SITA_THAPA: "dr-sita-thapa-12346",
    DR_HARI_PRASAD: "dr-hari-prasad-12347",
    UNCLAIMED: "dr-unclaimed-doctor-99999",
    VERIFIED: "dr-verified-doctor-88888",
  },

  // Test dentists
  DENTISTS: {
    DR_DENTAL_ONE: "dr-dental-one-D1001",
    DR_DENTAL_TWO: "dr-dental-two-D1002",
    DR_DENTAL_THREE: "dr-dental-three-D1003",
  },

  // Test pharmacists
  PHARMACISTS: {
    PHARMACIST_ONE: "pharmacist-one-P1001",
    PHARMACIST_TWO: "pharmacist-two-P1002",
  },

  // Registration numbers for search testing
  REGISTRATION_NUMBERS: {
    DOCTOR: "12345",
    DENTIST: "D1001",
    PHARMACIST: "P1001",
    UNCLAIMED: "99999",
    INVALID: "INVALID12345",
  },

  // Test clinics
  CLINICS: {
    DASHBOARD_CLINIC: {
      name: "Dashboard Test Clinic",
      slug: "dashboard-test-clinic",
      type: "POLYCLINIC",
    },
    TEST_PHARMACY: {
      name: "Test Pharmacy",
      slug: "test-pharmacy",
      type: "PHARMACY",
    },
    TEST_CLINIC_UNVERIFIED: {
      name: "Test Clinic One",
      slug: "test-clinic-one",
      type: "CLINIC",
    },
  },

  // Test services for billing
  SERVICES: {
    CONSULTATION: { name: "General Consultation", price: 500 },
    FOLLOWUP: { name: "Follow-up Visit", price: 300 },
    XRAY: { name: "X-Ray", price: 1200 },
    BLOOD_TEST: { name: "Blood Test", price: 800 },
    ECG: { name: "ECG", price: 600 },
    DRESSING_INACTIVE: { name: "Dressing", price: 200 },
  },

  // Test patients for billing
  PATIENTS: {
    PATIENT_ONE: {
      name: "Test Patient One",
      phone: "9841000001",
      number: "PAT-2026-0001",
    },
    PATIENT_TWO: {
      name: "Test Patient Two",
      phone: "9841000002",
      number: "PAT-2026-0002",
    },
  },

  // Test reviews
  REVIEWS: {
    PUBLISHED_WITH_RESPONSE: {
      text: "Excellent service and professional staff. Highly recommend!",
      doctorResponse: "Thank you for your kind feedback. We are glad to have helped.",
      rating: 5,
    },
    PUBLISHED_NO_RESPONSE: {
      text: "Good experience overall. Would visit again.",
      rating: 4,
    },
    UNPUBLISHED: {
      text: "Service could be improved. Long wait times.",
      rating: 2,
    },
  },

  // Pharmacy POS test data
  PRODUCTS: {
    PARACETAMOL: { name: "Paracetamol 500mg", barcode: "PARA500", price: 30, gstRate: 5 },
    AMOXICILLIN: { name: "Amoxicillin 250mg", barcode: "AMOX250", price: 100, gstRate: 5 },
    VITAMIN_C: { name: "Vitamin C 1000mg", barcode: "VITC1000", price: 200, gstRate: 12 },
    THERMOMETER: { name: "Digital Thermometer", barcode: "THERM001", price: 350, gstRate: 18 },
  },

  BATCHES: {
    PARA_BATCH_1: { number: "PARA-BATCH-001", expiresInDays: 60, qty: 100 }, // Expires sooner (FEFO test)
    PARA_BATCH_2: { number: "PARA-BATCH-002", expiresInDays: 180, qty: 200 }, // Expires later
  },

  CREDIT_ACCOUNTS: {
    RAM_BAHADUR: { name: "Ram Bahadur", phone: "9801234567", balance: 500 },
    SITA_KUMARI: { name: "Sita Kumari", phone: "9802345678", balance: 0 },
  },

  // IPD test data - wards and beds
  WARDS: {
    GENERAL_A: { name: "General Ward A", type: "GENERAL" },
    ICU: { name: "ICU", type: "ICU" },
  },

  BEDS: {
    A101: { number: "A-101", wardIndex: 0, dailyRate: 500 },
    A102: { number: "A-102", wardIndex: 0, dailyRate: 500 },
    A103: { number: "A-103", wardIndex: 0, dailyRate: 500 },
    ICU01: { number: "ICU-01", wardIndex: 1, dailyRate: 2000 },
    ICU02: { number: "ICU-02", wardIndex: 1, dailyRate: 2000 },
  },
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
  professionalPage: Page;
  clinicOwnerPage: Page;
}>({
  /**
   * Provides a page with a regular user logged in
   */
  authenticatedPage: async ({ page }, use) => {
    await login(page, TEST_DATA.USER.email, TEST_DATA.USER.password);
    await use(page);
  },

  /**
   * Provides a page with an admin user logged in
   */
  adminPage: async ({ page }, use) => {
    await login(page, TEST_DATA.ADMIN.email, TEST_DATA.ADMIN.password);
    await use(page);
  },

  /**
   * Provides a page with a professional user logged in
   */
  professionalPage: async ({ page }, use) => {
    await login(
      page,
      TEST_DATA.PROFESSIONAL.email,
      TEST_DATA.PROFESSIONAL.password
    );
    await use(page);
  },

  /**
   * Provides a page with a clinic owner logged in
   */
  clinicOwnerPage: async ({ page }, use) => {
    await login(
      page,
      TEST_DATA.CLINIC_OWNER.email,
      TEST_DATA.CLINIC_OWNER.password
    );
    await use(page);
  },
});

export { expect };

/**
 * Login helper function
 * Performs login through the UI
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/en/login");

  // Login page defaults to phone tab — switch to email tab first
  await page.getByRole("button", { name: /with email/i }).click();

  // Fill in credentials
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // Submit form
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for redirect to homepage or dashboard
  // Matches /en, /en/, /en/dashboard, /ne, /ne/, /ne/dashboard
  await page.waitForURL(/\/(en|ne)(\/dashboard|\/)?$/, { timeout: 30000 });
}

/**
 * Logout helper function
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu or logout button
  const logoutButton = page.getByRole("button", { name: /logout|sign out/i });
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Try the API directly
    await page.goto("/api/auth/signout");
    await page.getByRole("button", { name: /sign out/i }).click();
  }

  // Wait for redirect to login or home
  await page.waitForURL(/\/(en|ne)(\/login|\/)?$/);
}

/**
 * Register a new user through the UI
 */
export async function registerUser(
  page: Page,
  data: {
    name: string;
    email: string;
    password: string;
  }
): Promise<void> {
  await page.goto("/en/register");

  await page.getByLabel(/name/i).fill(data.name);
  await page.getByLabel(/email/i).fill(data.email);
  await page.getByLabel(/^password$/i).fill(data.password);
  await page.getByLabel(/confirm password/i).fill(data.password);

  await page.getByRole("button", { name: /register|sign up|create/i }).click();
}

/**
 * Navigate to a professional's detail page
 */
export async function goToProfessionalPage(
  page: Page,
  slug: string,
  type: "doctor" | "dentist" | "pharmacist" = "doctor",
  lang: "en" | "ne" = "en"
): Promise<void> {
  await page.goto(`/${lang}/${type}/${slug}`);
}

/**
 * Perform a search from the homepage
 */
export async function searchFromHomepage(
  page: Page,
  query: string,
  lang: "en" | "ne" = "en"
): Promise<void> {
  await page.goto(`/${lang}`);

  const searchInput = page.getByRole("textbox", { name: /search/i });
  await searchInput.fill(query);

  const searchButton = page.getByRole("button", { name: /search/i });
  await searchButton.click();

  // Wait for search page to load
  await page.waitForURL(/\/search\?q=/);
}

/**
 * Search for a professional by registration number on the claim page
 */
export async function searchByRegistrationNumber(
  page: Page,
  registrationNumber: string,
  lang: "en" | "ne" = "en"
): Promise<void> {
  await page.goto(`/${lang}/claim`);

  const searchInput = page.getByLabel(/registration/i);
  await searchInput.fill(registrationNumber);

  await page.getByRole("button", { name: /search/i }).click();
}

/**
 * Wait for toast notification
 */
export async function waitForToast(
  page: Page,
  text: string | RegExp
): Promise<void> {
  const toast = page.locator('[role="alert"], .toast, [class*="toast"]');
  await expect(toast).toContainText(text);
}

/**
 * Switch language
 */
export async function switchLanguage(
  page: Page,
  targetLang: "en" | "ne"
): Promise<void> {
  const langButton = page.getByRole("button", { name: targetLang.toUpperCase() });
  if (await langButton.isVisible()) {
    await langButton.click();
    await page.waitForURL(new RegExp(`/${targetLang}/`));
  } else {
    const langLink = page.getByRole("link", { name: targetLang.toUpperCase() });
    await langLink.click();
    await page.waitForURL(new RegExp(`/${targetLang}/`));
  }
}

/**
 * Upload a file in a file input
 */
export async function uploadFile(
  page: Page,
  inputSelector: string,
  filePath: string
): Promise<void> {
  const input = page.locator(inputSelector);
  await input.setInputFiles(filePath);
}

/**
 * Assert page has correct meta tags
 */
export async function assertMetaTags(
  page: Page,
  expected: {
    title?: string | RegExp;
    description?: string | RegExp;
    ogTitle?: string | RegExp;
  }
): Promise<void> {
  if (expected.title) {
    await expect(page).toHaveTitle(expected.title);
  }

  if (expected.description) {
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute("content");
    if (typeof expected.description === "string") {
      expect(content).toContain(expected.description);
    } else {
      expect(content).toMatch(expected.description);
    }
  }

  if (expected.ogTitle) {
    const ogTitle = page.locator('meta[property="og:title"]');
    const content = await ogTitle.getAttribute("content");
    if (typeof expected.ogTitle === "string") {
      expect(content).toContain(expected.ogTitle);
    } else {
      expect(content).toMatch(expected.ogTitle);
    }
  }
}

/**
 * Assert JSON-LD structured data is present
 */
export async function assertJsonLd(
  page: Page,
  expectedType: string
): Promise<Record<string, unknown>> {
  const jsonLdScript = page.locator('script[type="application/ld+json"]');
  const content = await jsonLdScript.textContent();
  expect(content).not.toBeNull();

  const data = JSON.parse(content as string) as Record<string, unknown>;
  expect(data["@type"]).toBe(expectedType);

  return data;
}

/**
 * Get current viewport size category
 */
export function getViewportCategory(
  page: Page
): "mobile" | "tablet" | "desktop" {
  const viewport = page.viewportSize();
  if (!viewport) return "desktop";

  if (viewport.width < 640) return "mobile";
  if (viewport.width < 1024) return "tablet";
  return "desktop";
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(
  page: Page,
  selector: string
): Promise<boolean> {
  const element = page.locator(selector);
  const boundingBox = await element.boundingBox();
  if (!boundingBox) return false;

  const viewport = page.viewportSize();
  if (!viewport) return false;

  return (
    boundingBox.x >= 0 &&
    boundingBox.y >= 0 &&
    boundingBox.x + boundingBox.width <= viewport.width &&
    boundingBox.y + boundingBox.height <= viewport.height
  );
}
