import { expect, test } from "playwright/test";

const baseURL = process.env.BASE_URL;
test.use({ baseURL });

test.afterEach(async ({ page }) => {
  if (process.env.QA_VIDEO === "1") await page.waitForTimeout(1500);
});

test("keypad calculates an addition and displays the expression", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "8" }).click();
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: "2" }).click();
  await page.getByRole("button", { name: "Equals" }).click();

  await expect(page.getByRole("status", { name: "Result" })).toHaveText("10");
  await expect(page.getByText("8 + 2 =", { exact: true })).toBeVisible();
});

test("division by zero is announced and can be recovered", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "5" }).click();
  await page.getByRole("button", { name: "Divide" }).click();
  await page.getByRole("button", { name: "0" }).click();
  await page.getByRole("button", { name: "Equals" }).click();

  await expect(page.getByRole("status", { name: "Result" })).toHaveText("Error");
  const error = page
    .getByRole("alert")
    .filter({ hasText: "Cannot divide by zero. Enter a number or press AC." });
  await expect(error).toHaveText(
    "Cannot divide by zero. Enter a number or press AC.",
  );

  await page.getByRole("button", { name: "3" }).click();
  await expect(page.getByRole("status", { name: "Result" })).toHaveText("3");
  await expect(error).toHaveCount(0);
});

test("keyboard input calculates and Escape clears the calculator", async ({ page }) => {
  await page.goto("/");

  // Confirm client-side handlers are active before testing the window key listener.
  await page.getByRole("button", { name: "8" }).click();
  await expect(page.getByRole("status", { name: "Result" })).toHaveText("8");
  await page.getByRole("button", { name: "All clear" }).click();
  await expect(page.getByRole("status", { name: "Result" })).toHaveText("0");

  await page.keyboard.press("8");
  await page.keyboard.press("+");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");

  await expect(page.getByRole("status", { name: "Result" })).toHaveText("10");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("status", { name: "Result" })).toHaveText("0");
});

test("input stops at the 12-digit limit", async ({ page }) => {
  await page.goto("/");

  for (const digit of "1234567890123") {
    await page.getByRole("button", { name: digit }).click();
  }

  await expect(page.getByRole("status", { name: "Result" })).toHaveText("123456789012");
});
