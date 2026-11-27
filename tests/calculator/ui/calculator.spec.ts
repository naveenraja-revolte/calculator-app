import { expect, test } from "playwright/test";

const baseURL = process.env.BASE_URL;
test.use({ baseURL });

test.afterEach(async ({ page }) => {
  if (process.env.QA_VIDEO === "1") await page.waitForTimeout(1500);
});

async function press(page: import("playwright/test").Page, ...keys: string[]) {
  for (const key of keys) {
    await page.getByRole("button", { name: keyName(key) }).click();
  }
}

function keyName(key: string): string {
  return (
    {
      AC: "All clear",
      "±": "Toggle sign",
      "%": "Percentage",
      "÷": "Divide",
      "×": "Multiply",
      "−": "Subtract",
      "+": "Add",
      ".": "Decimal point",
      "=": "Equals",
      "⌫": "Backspace",
    }[key] ?? key
  );
}

async function expectResult(page: import("playwright/test").Page, value: string) {
  await expect(page.getByLabel("Result")).toHaveText(value);
}

async function waitForCalculatorInteraction(page: import("playwright/test").Page) {
  await page.getByRole("button", { name: "1" }).click();
  await expectResult(page, "1");
  await page.getByRole("button", { name: "All clear" }).click();
  await expectResult(page, "0");
}

test("renders the named calculator and initial display", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Calculator" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Calculator keypad" })).toBeVisible();
  await expect(page.getByLabel("Expression")).toBeEmpty();
  await expectResult(page, "0");
});

for (const { label, operator, expected } of [
  { label: "addition", operator: "+", expected: "10" },
  { label: "subtraction", operator: "−", expected: "6" },
  { label: "multiplication", operator: "×", expected: "16" },
  { label: "division", operator: "÷", expected: "4" },
]) {
  test(`calculates ${label} from keypad input`, async ({ page }) => {
    await page.goto("/");
    await press(page, "8", operator, "2", "=");
    await expectResult(page, expected);
    await expect(page.getByLabel("Expression")).toHaveText(`8 ${operator} 2 =`);
  });
}

test("enters decimal operands and ignores a repeated decimal point", async ({ page }) => {
  await page.goto("/");
  await press(page, "0", ".", "1", ".", "+", "0", ".", "2", "=");
  await expectResult(page, "0.3");
});

test("announces division by zero and rejects the non-finite result", async ({ page }) => {
  await page.goto("/");
  await press(page, "5", "÷", "0", "=");
  await expectResult(page, "Error");
  await expect(
    page.getByRole("region", { name: "Calculator" }).getByRole("alert"),
  ).toHaveText("Cannot divide by zero. Enter a number or press AC.");
});

test("starts a fresh number after an arithmetic error", async ({ page }) => {
  await page.goto("/");
  await press(page, "5", "÷", "0", "=", "3");
  await expectResult(page, "3");
  await expect(
    page.getByRole("region", { name: "Calculator" }).getByRole("alert"),
  ).toHaveCount(0);
});

test("clears an arithmetic error with All clear", async ({ page }) => {
  await page.goto("/");
  await press(page, "1", "÷", "0", "=", "AC");
  await expectResult(page, "0");
  await expect(page.getByLabel("Expression")).toBeEmpty();
  await expect(
    page.getByRole("region", { name: "Calculator" }).getByRole("alert"),
  ).toHaveCount(0);
});

test("caps number entry at twelve digits", async ({ page }) => {
  await page.goto("/");
  await press(page, ..."1234567890123".split(""));
  await expectResult(page, "123456789012");
});

test("suppresses leading zeroes when a nonzero digit is entered", async ({ page }) => {
  await page.goto("/");
  await press(page, "0", "0", "0", "2");
  await expectResult(page, "2");
});

test("converts a value to its percentage", async ({ page }) => {
  await page.goto("/");
  await press(page, "5", "0", "%");
  await expectResult(page, "0.5");
});

test("toggles the sign twice to restore a positive value", async ({ page }) => {
  await page.goto("/");
  await press(page, "5", "±", "±");
  await expectResult(page, "5");
});

test("uses a negative first operand in arithmetic", async ({ page }) => {
  await page.goto("/");
  await press(page, "5", "±", "+", "2", "=");
  await expectResult(page, "-3");
});

test("uses a negative second operand in arithmetic", async ({ page }) => {
  await page.goto("/");
  await press(page, "5", "+", "±", "2", "=");
  await expectResult(page, "3");
});

test("toggles the sign of a completed result", async ({ page }) => {
  await page.goto("/");
  await press(page, "2", "+", "2", "=", "±");
  await expectResult(page, "-4");
});

test("backspace removes the last entered digit", async ({ page }) => {
  await page.goto("/");
  await press(page, "1", "2");
  await page.getByRole("button", { name: "Backspace" }).click();
  await expectResult(page, "1");
});

test("backspace on a minus sign restores zero", async ({ page }) => {
  await page.goto("/");
  await press(page, "1", "±");
  await page.getByRole("button", { name: "Backspace" }).click();
  await expectResult(page, "0");
});

test("backspace after a completed result resets the display", async ({ page }) => {
  await page.goto("/");
  await press(page, "2", "+", "3", "=", "⌫");
  await expectResult(page, "0");
});

test("replaces a pending operator with the latest operator", async ({ page }) => {
  await page.goto("/");
  await press(page, "8", "+", "×", "2", "=");
  await expectResult(page, "16");
  await expect(page.getByLabel("Expression")).toHaveText("8 × 2 =");
});

test("chains operations left to right", async ({ page }) => {
  await page.goto("/");
  await press(page, "2", "+", "3", "×", "4", "=");
  await expectResult(page, "20");
});

test("keeps the first operand when equals is pressed without a second operand", async ({ page }) => {
  await page.goto("/");
  await press(page, "8", "+", "=", "2", "=");
  await expectResult(page, "10");
});

test("starts a new calculation when a digit follows a result", async ({ page }) => {
  await page.goto("/");
  await press(page, "2", "+", "3", "=", "4");
  await expectResult(page, "4");
});

test("continues a calculation from the previous result", async ({ page }) => {
  await page.goto("/");
  await press(page, "2", "+", "3", "=", "×", "2", "=");
  await expectResult(page, "10");
});

test("starts a decimal number after a completed result", async ({ page }) => {
  await page.goto("/");
  await press(page, "2", "+", "3", "=", ".", "5");
  await expectResult(page, "0.5");
});

test("supports the keyboard Enter shortcut for calculation", async ({ page }) => {
  await page.goto("/");
  await waitForCalculatorInteraction(page);
  await page.keyboard.press("8");
  await page.keyboard.press("+");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expectResult(page, "10");
});

test("supports keyboard minus, multiplication and division aliases", async ({ page }) => {
  await page.goto("/");
  await waitForCalculatorInteraction(page);
  await page.keyboard.press("8");
  await page.keyboard.press("-");
  await page.keyboard.press("2");
  await page.keyboard.press("*");
  await page.keyboard.press("3");
  await page.keyboard.press("/");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expectResult(page, "9");
});

test("Escape clears the current calculation", async ({ page }) => {
  await page.goto("/");
  await waitForCalculatorInteraction(page);
  await page.keyboard.press("7");
  await page.keyboard.press("Escape");
  await expectResult(page, "0");
});

test("Delete clears the current calculation", async ({ page }) => {
  await page.goto("/");
  await waitForCalculatorInteraction(page);
  await page.keyboard.press("7");
  await page.keyboard.press("Delete");
  await expectResult(page, "0");
});

test("keyboard Backspace removes the last digit", async ({ page }) => {
  await page.goto("/");
  await waitForCalculatorInteraction(page);
  await page.keyboard.press("1");
  await page.keyboard.press("2");
  await page.keyboard.press("Backspace");
  await expectResult(page, "1");
});

test("ignores an unsupported keyboard key", async ({ page }) => {
  await page.goto("/");
  await waitForCalculatorInteraction(page);
  await page.keyboard.press("a");
  await expectResult(page, "0");
});

test("exposes the selected operator as pressed and clears it after selection", async ({ page }) => {
  await page.goto("/");
  const add = page.getByRole("button", { name: "Add" });
  const multiply = page.getByRole("button", { name: "Multiply" });
  await add.click();
  await expect(add).toHaveAttribute("aria-pressed", "true");
  await multiply.click();
  await expect(add).toHaveAttribute("aria-pressed", "false");
  await expect(multiply).toHaveAttribute("aria-pressed", "true");
});
