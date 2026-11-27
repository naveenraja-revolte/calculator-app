import { expect, test } from "playwright/test";

const baseURL = process.env.BASE_URL;
test.use({ baseURL });

test.afterEach(async ({ page }) => {
  if (process.env.QA_VIDEO === "1") await page.waitForTimeout(1500);
});

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Calculator", level: 1 }),
  ).toBeVisible();
});

async function press(page: import("playwright/test").Page, ...keys: string[]) {
  for (const key of keys) {
    await page.getByRole("button", { name: key, exact: true }).click();
  }
}

const result = (page: import("playwright/test").Page) =>
  page.getByLabel("Result");

test("renders the complete calculator and its accessible controls", async ({
  page,
}) => {
  await expect(page.getByRole("region", { name: "Calculator" })).toBeVisible();
  await expect(result(page)).toHaveText("0");

  for (const name of [
    "All clear",
    "Toggle sign",
    "Percentage",
    "Divide",
    "Multiply",
    "Subtract",
    "Add",
    "Decimal point",
    "Equals",
    "Backspace",
    ..."0123456789",
  ]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }
});

for (const operation of [
  { label: "Add", symbol: "+", expected: "10" },
  { label: "Subtract", symbol: "−", expected: "6" },
  { label: "Multiply", symbol: "×", expected: "16" },
  { label: "Divide", symbol: "÷", expected: "4" },
]) {
  test(`calculates 8 ${operation.symbol} 2 using the keypad`, async ({ page }) => {
    await press(page, "8", operation.label, "2", "Equals");
    await expect(result(page)).toHaveText(operation.expected);
    await expect(page.getByText(`8 ${operation.symbol} 2 =`, { exact: true })).toBeVisible();
  });
}

test("calculates decimal values without floating-point display artifacts", async ({
  page,
}) => {
  await press(
    page,
    "0",
    "Decimal point",
    "1",
    "Add",
    "0",
    "Decimal point",
    "2",
    "Equals",
  );
  await expect(result(page)).toHaveText("0.3");
});

test("ignores a repeated decimal point in the current operand", async ({ page }) => {
  await press(page, "1", "Decimal point", "Decimal point", "5");
  await expect(result(page)).toHaveText("1.5");
});

test("chains operations left to right and replaces a pending operator", async ({
  page,
}) => {
  await press(page, "2", "Add", "3", "Multiply", "4", "Equals");
  await expect(result(page)).toHaveText("20");

  await press(page, "All clear", "8", "Add");
  await expect(page.getByRole("button", { name: "Add" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await press(page, "Multiply", "2", "Equals");
  await expect(result(page)).toHaveText("16");

  await press(page, "All clear", "8", "Add", "Equals", "2", "Equals");
  await expect(result(page)).toHaveText("10");
});

test("toggles operand signs and converts a value to a percentage", async ({
  page,
}) => {
  await press(page, "5", "Toggle sign", "Add", "2", "Equals");
  await expect(result(page)).toHaveText("-3");

  await press(page, "All clear", "5", "Add", "Toggle sign", "2", "Equals");
  await expect(result(page)).toHaveText("3");

  await press(page, "All clear", "5", "0", "Percentage");
  await expect(result(page)).toHaveText("0.5");
});

test("clears calculator state and safely removes entered characters", async ({
  page,
}) => {
  await press(page, "1", "Add", "2", "All clear");
  await expect(result(page)).toHaveText("0");

  await press(page, "1", "2", "Backspace");
  await expect(result(page)).toHaveText("1");

  await press(page, "All clear", "1", "Toggle sign", "Backspace");
  await expect(result(page)).toHaveText("0");
});

test("announces division by zero and recovers from the error", async ({ page }) => {
  await press(page, "5", "Divide", "0", "Equals");
  const errorAlert = page
    .getByRole("region", { name: "Calculator" })
    .getByRole("alert");
  await expect(errorAlert).toHaveText(
    "Cannot divide by zero. Enter a number or press AC.",
  );
  await expect(result(page)).toHaveText("Error");

  await press(page, "3");
  await expect(errorAlert).toHaveCount(0);
  await expect(result(page)).toHaveText("3");

  await press(page, "5", "Divide", "0", "Equals", "All clear");
  await expect(errorAlert).toHaveCount(0);
  await expect(result(page)).toHaveText("0");
});

test("accepts up to twelve input digits and ignores additional digits", async ({
  page,
}) => {
  await press(page, ..."123456789012345".split(""));
  await expect(result(page)).toHaveText("123456789012");
});

test("supports keyboard arithmetic, editing, and clear shortcuts", async ({
  page,
}) => {
  await page.getByRole("button", { name: "All clear" }).click();
  await page.keyboard.press("8");
  await page.keyboard.press("Shift+Equal");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expect(result(page)).toHaveText("10");

  await page.keyboard.press("Escape");
  await page.keyboard.press("8");
  await page.keyboard.press("-");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expect(result(page)).toHaveText("6");

  await page.keyboard.press("Escape");
  await page.keyboard.press("8");
  await page.keyboard.press("Shift+Digit8");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expect(result(page)).toHaveText("16");

  await page.keyboard.press("Escape");
  await page.keyboard.press("8");
  await page.keyboard.press("/");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expect(result(page)).toHaveText("4");

  await page.keyboard.press("Escape");
  await page.keyboard.press("1");
  await page.keyboard.press("2");
  await page.keyboard.press("Backspace");
  await expect(result(page)).toHaveText("1");
  await page.keyboard.press("Delete");
  await expect(result(page)).toHaveText("0");
});

test("ignores unsupported and modified keyboard input", async ({ page }) => {
  await page.keyboard.press("a");
  await page.keyboard.press("Control+1");
  await expect(result(page)).toHaveText("0");
});

test("shows the not-found page and returns to the calculator", async ({ page }) => {
  await page.goto("/unknown-calculator-route");
  await expect(
    page.getByRole("heading", { name: "Page not found", level: 1 }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Back to calculator" }).click();
  await expect(page).toHaveURL(baseURL + "/");
  await expect(result(page)).toHaveText("0");
});
