import { test as setup } from "@playwright/test";
import { TEST_DATA } from "./fixtures/test-utils";

const authDir = "playwright/.auth";

async function loginAndSave(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  savePath: string
) {
  await page.goto("/en/login");
  await page.getByRole("button", { name: /with email/i }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(
    (url) =>
      /^\/(en|ne)(\/|$)/.test(url.pathname) && !url.pathname.includes("/login"),
    { timeout: 30000 }
  );
  await page.context().storageState({ path: savePath });
}

setup("authenticate as regular user", async ({ page }) => {
  await loginAndSave(
    page,
    TEST_DATA.USER.email,
    TEST_DATA.USER.password,
    `${authDir}/user.json`
  );
});

setup("authenticate as admin", async ({ page }) => {
  await loginAndSave(
    page,
    TEST_DATA.ADMIN.email,
    TEST_DATA.ADMIN.password,
    `${authDir}/admin.json`
  );
});

setup("authenticate as professional", async ({ page }) => {
  await loginAndSave(
    page,
    TEST_DATA.PROFESSIONAL.email,
    TEST_DATA.PROFESSIONAL.password,
    `${authDir}/professional.json`
  );
});

setup("authenticate as clinic owner", async ({ page }) => {
  await loginAndSave(
    page,
    TEST_DATA.CLINIC_OWNER.email,
    TEST_DATA.CLINIC_OWNER.password,
    `${authDir}/clinicOwner.json`
  );
});
