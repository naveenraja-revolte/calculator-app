import { expect, test, type Page } from "playwright/test";

const baseURL = process.env.BASE_URL;
test.use({ baseURL });

test.afterEach(async ({ page }) => {
  if (process.env.QA_VIDEO === "1") await page.waitForTimeout(1500);
});

async function clickKeys(page: Page, ...names: string[]) {
  for (const name of names) {
    await page.getByRole("button", { name, exact: true }).click();
  }
}

async function enterNumber(page: Page, value: string) {
  for (const character of value) {
    await page
      .getByRole("button", {
        name: character === "." ? "Decimal point" : character,
        exact: true,
      })
      .click();
  }
}

test("renders named calculator controls and the initial result", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("region", { name: "Calculator" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Calculator", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Result")).toHaveText("0");

  const keypad = page.getByRole("group", { name: "Calculator keypad" });
  await expect(keypad).toBeVisible();
  await expect(keypad.getByRole("button")).toHaveCount(19);
  await expect(page.getByRole("button", { name: "Backspace" })).toBeVisible();
});

test("performs all four arithmetic operations", async ({ page }) => {
  await page.goto("/");
  const cases = [
    { buttons: ["8", "Add", "2", "Equals"], result: "10" },
    { buttons: ["8", "Subtract", "2", "Equals"], result: "6" },
    { buttons: ["8", "Multiply", "2", "Equals"], result: "16" },
    { buttons: ["8", "Divide", "2", "Equals"], result: "4" },
  ];

  for (const calculation of cases) {
    await clickKeys(page, "All clear", ...calculation.buttons);
    await expect(page.getByLabel("Result")).toHaveText(calculation.result);
  }
});

test("handles decimal entry, duplicate points, and calculation precision", async ({
  page,
}) => {
  await page.goto("/");

  await clickKeys(page, "0", "Decimal point", "Decimal point", "1");
  await expect(page.getByLabel("Result")).toHaveText("0.1");

  await clickKeys(page, "All clear", "Decimal point", "5", "Add", "Decimal point", "2", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("0.7");

  await clickKeys(page, "All clear", "0", "Decimal point", "1", "Add", "0", "Decimal point", "2", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("0.3");

  await clickKeys(page, "All clear", "1", "Divide", "3", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("0.333333333333");
});

test("chains operations and replaces a pending operator", async ({ page }) => {
  await page.goto("/");

  await clickKeys(page, "2", "Add", "3", "Multiply", "4", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("20");

  await clickKeys(page, "All clear", "8", "Add", "Multiply", "2", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("16");

  await clickKeys(page, "All clear", "8", "Add", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("8");
});

test("applies percentage and toggles the sign", async ({ page }) => {
  await page.goto("/");

  await clickKeys(page, "5", "0", "Percentage");
  await expect(page.getByLabel("Result")).toHaveText("0.5");

  await clickKeys(page, "All clear", "5", "Toggle sign", "Add", "2", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("-3");

  await clickKeys(page, "All clear", "5", "Add", "Toggle sign", "2", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("3");

  await clickKeys(page, "All clear", "5", "Toggle sign", "Toggle sign");
  await expect(page.getByLabel("Result")).toHaveText("5");

  await clickKeys(page, "All clear", "2", "Add", "2", "Equals", "Toggle sign");
  await expect(page.getByLabel("Result")).toHaveText("-4");
});

test("clears and backspaces without corrupting input or pending operations", async ({
  page,
}) => {
  await page.goto("/");

  await clickKeys(page, "1", "2");
  await page.getByRole("button", { name: "Backspace" }).click();
  await expect(page.getByLabel("Result")).toHaveText("1");

  await clickKeys(page, "All clear", "1", "Toggle sign");
  await page.getByRole("button", { name: "Backspace" }).click();
  await expect(page.getByLabel("Result")).toHaveText("0");

  await clickKeys(page, "All clear", "2", "Add");
  await page.getByRole("button", { name: "Backspace" }).click();
  await clickKeys(page, "3", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("5");

  await clickKeys(page, "All clear", "1", "Add", "2", "All clear");
  await expect(page.getByLabel("Result")).toHaveText("0");
});

test("supports keyboard aliases and ignores unsupported keys", async ({ page }) => {
  await page.goto("/");

  await clickKeys(page, "8");
  await expect(page.getByLabel("Result")).toHaveText("8");
  await clickKeys(page, "All clear");
  await expect(page.getByLabel("Result")).toHaveText("0");

  await page.keyboard.press("8");
  await page.keyboard.press("-");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Result")).toHaveText("6");

  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Result")).toHaveText("0");
  await page.keyboard.press("8");
  await page.keyboard.press("*");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Result")).toHaveText("16");

  await page.keyboard.press("Delete");
  await page.keyboard.press("8");
  await page.keyboard.press("/");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Result")).toHaveText("4");

  await page.keyboard.press("a");
  await expect(page.getByLabel("Result")).toHaveText("4");
});

test("announces division by zero and recovers from the error", async ({ page }) => {
  await page.goto("/");

  await clickKeys(page, "5", "Divide", "0", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("Error");
  // The alert has no accessible name, so use its exact visible text.
  const divisionError = page.getByText(
    "Cannot divide by zero. Enter a number or press AC.",
    { exact: true },
  );
  await expect(divisionError).toHaveText(
    "Cannot divide by zero. Enter a number or press AC.",
  );

  await clickKeys(page, "Add");
  await expect(page.getByLabel("Result")).toHaveText("Error");

  await clickKeys(page, "3");
  await expect(page.getByLabel("Result")).toHaveText("3");
  await expect(divisionError).toHaveCount(0);

  await clickKeys(page, "5", "Divide", "0", "Equals", "All clear");
  await expect(page.getByLabel("Result")).toHaveText("0");
});

test("enforces the 12-digit input boundary and ignores leading zeros", async ({
  page,
}) => {
  await page.goto("/");

  await enterNumber(page, "123456789012");
  await expect(page.getByLabel("Result")).toHaveText("123456789012");
  await clickKeys(page, "3");
  await expect(page.getByLabel("Result")).toHaveText("123456789012");

  await clickKeys(page, "All clear", "0", "0", "2");
  await expect(page.getByLabel("Result")).toHaveText("2");
});

test("recovers safely from scientific-notation display", async ({ page }) => {
  await page.goto("/");

  await enterNumber(page, "0.00000000001");
  await clickKeys(page, "Divide", "1", "0", "Equals");
  await expect(page.getByLabel("Result")).toHaveText("1e-12");

  await clickKeys(page, "2");
  await expect(page.getByLabel("Result")).toHaveText("2");

  await clickKeys(page, "All clear");
  await enterNumber(page, "0.00000000001");
  await clickKeys(page, "Divide", "1", "0", "Equals", "Decimal point");
  await expect(page.getByLabel("Result")).toHaveText("0.");

  await clickKeys(page, "All clear");
  await enterNumber(page, "0.00000000001");
  await clickKeys(page, "Divide", "1", "0", "Equals");
  await page.getByRole("button", { name: "Backspace" }).click();
  await expect(page.getByLabel("Result")).toHaveText("0");
});
