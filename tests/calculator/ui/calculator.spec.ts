import { expect, test, type Page } from "@playwright/test";

const keyLabels: Record<string, string> = {
  "+": "Add",
  "−": "Subtract",
  "×": "Multiply",
  "÷": "Divide",
  AC: "All clear",
  "±": "Toggle sign",
  "%": "Percentage",
  ".": "Decimal point",
  "=": "Equals",
  "⌫": "Backspace",
};

async function pressButtons(page: Page, keys: string[]) {
  for (const key of keys) {
    await page
      .getByRole("button", { name: keyLabels[key] ?? key, exact: true })
      .click();
  }
}

async function enterDigits(page: Page, value: string) {
  for (const digit of value) await pressButtons(page, [digit]);
}

async function expectResult(page: Page, expected: string) {
  await expect(page.getByRole("status", { name: "Result" })).toHaveText(
    expected,
  );
}

test.describe("Calculator UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.afterEach(async ({ page }) => {
    if (process.env.QA_VIDEO === "1") await page.waitForTimeout(1500);
  });

  test("starts with a zero result", async ({ page }) => {
    await expectResult(page, "0");
  });

  test("renders its named calculator region and keypad", async ({ page }) => {
    await expect(
      page.getByRole("region", { name: "Calculator" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Calculator keypad" }),
    ).toBeVisible();
  });

  test("exposes an accessible result output", async ({ page }) => {
    await expect(page.getByRole("status", { name: "Result" })).toBeVisible();
  });

  test("shows the calculator heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Calculator", level: 1 }),
    ).toBeVisible();
  });

  for (const digit of "0123456789") {
    test(`digit button ${digit} enters that digit`, async ({ page }) => {
      await pressButtons(page, [digit]);
      await expectResult(page, digit);
    });
  }

  for (const [, label] of [
    ["+", "Add"],
    ["−", "Subtract"],
    ["×", "Multiply"],
    ["÷", "Divide"],
  ]) {
    test(`${label} button becomes the active operator`, async ({ page }) => {
      const operatorButton = page.getByRole("button", { name: label });
      await expect(operatorButton).toHaveAttribute("aria-pressed", "false");
      await operatorButton.click();
      await expect(operatorButton).toHaveAttribute("aria-pressed", "true");
    });
  }

  const arithmeticCases = [
    { left: "8", operator: "+", right: "2", result: "10" },
    { left: "7", operator: "+", right: "3", result: "10" },
    { left: "9", operator: "+", right: "3", result: "12" },
    { left: "0", operator: "+", right: "4", result: "4" },
    { left: "6", operator: "+", right: "1", result: "7" },
    { left: "8", operator: "−", right: "2", result: "6" },
    { left: "7", operator: "−", right: "3", result: "4" },
    { left: "9", operator: "−", right: "3", result: "6" },
    { left: "0", operator: "−", right: "4", result: "-4" },
    { left: "6", operator: "−", right: "1", result: "5" },
    { left: "8", operator: "×", right: "2", result: "16" },
    { left: "7", operator: "×", right: "3", result: "21" },
    { left: "9", operator: "×", right: "3", result: "27" },
    { left: "0", operator: "×", right: "4", result: "0" },
    { left: "6", operator: "×", right: "1", result: "6" },
    { left: "8", operator: "÷", right: "2", result: "4" },
    { left: "9", operator: "÷", right: "3", result: "3" },
    { left: "0", operator: "÷", right: "4", result: "0" },
    { left: "6", operator: "÷", right: "2", result: "3" },
    { left: "7", operator: "÷", right: "2", result: "3.5" },
  ];

  for (const { left, operator, right, result } of arithmeticCases) {
    test(`${left} ${operator} ${right} equals ${result}`, async ({ page }) => {
      await enterDigits(page, left);
      await pressButtons(page, [operator]);
      await enterDigits(page, right);
      await pressButtons(page, ["="]);
      await expectResult(page, result);
    });
  }

  const decimalCases = [
    { keys: ["0", ".", "1", "+", "0", ".", "2", "="], result: "0.3" },
    { keys: [".", "5", ".", "2"], result: "0.52" },
    { keys: ["1", ".", "2", ".", "3"], result: "1.23" },
    { keys: ["5", ".", "0", "−", "2", ".", "5", "="], result: "2.5" },
    { keys: ["1", "÷", "3", "="], result: "0.333333333333" },
    { keys: ["2", ".", "5", "×", "2", "="], result: "5" },
    { keys: ["."], result: "0." },
    { keys: ["0", ".", "1", ".", "2"], result: "0.12" },
  ];

  for (const { keys, result } of decimalCases) {
    test(`decimal input ${keys.join(" ")} displays ${result}`, async ({
      page,
    }) => {
      await pressButtons(page, keys);
      await expectResult(page, result);
    });
  }

  for (const digit of "0123456789") {
    test(`keyboard digit ${digit} enters that digit`, async ({ page }) => {
      await page.keyboard.press(digit);
      await expectResult(page, digit);
    });
  }

  const keyboardCases = [
    { keys: ["8", "-", "2", "Enter"], result: "6" },
    { keys: ["8", "*", "2", "Enter"], result: "16" },
    { keys: ["8", "/", "2", "Enter"], result: "4" },
    { keys: ["1", ".", "5"], result: "1.5" },
    { keys: ["5", "0", "%"], result: "0.5" },
    { keys: ["8", "-", "2", "="], result: "6" },
  ];

  for (const { keys, result } of keyboardCases) {
    test(`keyboard sequence ${keys.join(" ")} displays ${result}`, async ({
      page,
    }) => {
      for (const key of keys) await page.keyboard.press(key);
      await expectResult(page, result);
    });
  }

  for (const key of ["Escape", "Delete"]) {
    test(`keyboard ${key} clears the current input`, async ({ page }) => {
      await enterDigits(page, "42");
      await page.keyboard.press(key);
      await expectResult(page, "0");
    });
  }

  test("keyboard Backspace removes the last digit", async ({ page }) => {
    await enterDigits(page, "42");
    await page.keyboard.press("Backspace");
    await expectResult(page, "4");
  });

  const signAndPercentageCases = [
    { keys: ["5", "0", "%"], result: "0.5" },
    { keys: ["1", "0", "%"], result: "0.1" },
    { keys: ["0", "%"], result: "0" },
    { keys: ["5", "±"], result: "-5" },
    { keys: ["5", "±", "±"], result: "5" },
    { keys: ["5", "+", "±", "2", "="], result: "3" },
    { keys: ["5", "±", "+", "2", "="], result: "-3" },
    { keys: ["2", "+", "2", "=", "±"], result: "-4" },
    { keys: ["5", "±", "0", "%"], result: "-0.05" },
  ];

  for (const { keys, result } of signAndPercentageCases) {
    test(`sign or percentage sequence ${keys.join(" ")} displays ${result}`, async ({
      page,
    }) => {
      await pressButtons(page, keys);
      await expectResult(page, result);
    });
  }

  const editingCases = [
    { keys: ["AC"], result: "0" },
    { keys: ["1", "2", "AC"], result: "0" },
    { keys: ["1", "+", "2", "AC"], result: "0" },
    { keys: ["1", "2", "⌫"], result: "1" },
    { keys: ["1", "±", "⌫"], result: "0" },
    { keys: ["2", "+", "3", "=", "⌫"], result: "0" },
    { keys: ["2", "+", "⌫", "3", "="], result: "5" },
    { keys: ["1", ".", "⌫"], result: "1" },
  ];

  for (const { keys, result } of editingCases) {
    test(`clear or backspace sequence ${keys.join(" ")} displays ${result}`, async ({
      page,
    }) => {
      await pressButtons(page, keys);
      await expectResult(page, result);
    });
  }

  const boundaryCases = [
    { keys: [..."123456789012"], result: "123456789012" },
    { keys: [..."1234567890123"], result: "123456789012" },
    { keys: ["0", "0", "2"], result: "2" },
    { keys: ["±", ..."1234567890123"], result: "-123456789012" },
  ];

  for (const { keys, result } of boundaryCases) {
    test(`digit boundary input ${keys.join("")} displays ${result}`, async ({
      page,
    }) => {
      await pressButtons(page, keys);
      await expectResult(page, result);
    });
  }

  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    test(`unsupported keyboard key ${letter} leaves the result unchanged`, async ({
      page,
    }) => {
      await page.keyboard.press(letter);
      await expectResult(page, "0");
    });
  }

  const divisionByZeroCases = [
    ["5", "÷", "0", "="],
    ["0", "÷", "0", "="],
    ["8", "÷", "±", "0", "="],
  ];

  for (const keys of divisionByZeroCases) {
    test(`division by zero ${keys.join(" ")} announces an error`, async ({
      page,
    }) => {
      await pressButtons(page, keys);
      await expectResult(page, "Error");
      await expect(page.getByRole("alert")).toHaveText(
        "Cannot divide by zero. Enter a number or press AC.",
      );
    });
  }

  const recoveryCases = [
    { recovery: ["3"], result: "3" },
    { recovery: ["."], result: "0." },
    { recovery: ["AC"], result: "0" },
  ];

  for (const { recovery, result } of recoveryCases) {
    test(`recovers from division error with ${recovery.join(" ")}`, async ({
      page,
    }) => {
      await pressButtons(page, ["5", "÷", "0", "="]);
      await pressButtons(page, recovery);
      await expectResult(page, result);
      await expect(page.getByRole("alert")).toHaveCount(0);
    });
  }

  const chainedCases = [
    { keys: ["2", "+", "3", "×", "4", "="], result: "20" },
    { keys: ["8", "+", "=", "2", "="], result: "10" },
    { keys: ["2", "+", "3", "=", "×", "2", "="], result: "10" },
    { keys: ["2", "+", "3", "=", "4"], result: "4" },
  ];

  for (const { keys, result } of chainedCases) {
    test(`chained calculation ${keys.join(" ")} displays ${result}`, async ({
      page,
    }) => {
      await pressButtons(page, keys);
      await expectResult(page, result);
    });
  }

  test("repeated multiplication rejects a non-finite result and recovers", async ({
    page,
  }) => {
    const operand = "999999999999";
    await enterDigits(page, operand);
    await pressButtons(page, ["×"]);

    for (let multiplication = 0; multiplication < 26; multiplication += 1) {
      await enterDigits(page, operand);
      await pressButtons(page, [multiplication === 25 ? "=" : "×"]);
    }

    await expectResult(page, "Error");
    await expect(page.getByRole("alert")).toHaveText(
      "Result is too large. Enter a number or press AC.",
    );
    await pressButtons(page, ["AC"]);
    await expectResult(page, "0");
  });
});
