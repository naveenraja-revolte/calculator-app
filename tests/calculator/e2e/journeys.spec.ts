import { expect, test } from "playwright/test";

const baseURL = process.env.BASE_URL;
test.use({ baseURL });

test.afterEach(async ({ page }) => {
  if (process.env.QA_VIDEO === "1") await page.waitForTimeout(1500);
});

async function press(page: import("playwright/test").Page, ...keys: string[]) {
  const names: Record<string, string> = {
    AC: "All clear",
    "±": "Toggle sign",
    "%": "Percentage",
    "÷": "Divide",
    "×": "Multiply",
    "−": "Subtract",
    "+": "Add",
    ".": "Decimal point",
    "=": "Equals",
  };
  for (const key of keys) {
    await page.getByRole("button", { name: names[key] ?? key }).click();
  }
}

test("completes and displays an arithmetic journey", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Calculator" })).toBeVisible();
  await press(page, "9", "÷", "3", "=", "+", "4", "=");
  await expect(page.getByLabel("Result")).toHaveText("7");
  await expect(page.getByLabel("Expression")).toHaveText("3 + 4 =");
});

test("recovers from error and completes a fresh calculation", async ({ page }) => {
  await page.goto("/");
  await press(page, "6", "÷", "0", "=");
  await expect(
    page.getByRole("region", { name: "Calculator" }).getByRole("alert"),
  ).toHaveText("Cannot divide by zero. Enter a number or press AC.");
  await press(page, "7", "+", "5", "=");
  await expect(
    page.getByRole("region", { name: "Calculator" }).getByRole("alert"),
  ).toHaveCount(0);
  await expect(page.getByLabel("Result")).toHaveText("12");
  await expect(page.getByLabel("Expression")).toHaveText("7 + 5 =");
});

test("mixes keyboard and keypad input in a single journey", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "4" }).click();
  await expect(page.getByLabel("Result")).toHaveText("4");
  await page.keyboard.press("+");
  await page.getByRole("button", { name: "6" }).click();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Result")).toHaveText("10");
  await expect(page.getByLabel("Expression")).toHaveText("4 + 6 =");
});
