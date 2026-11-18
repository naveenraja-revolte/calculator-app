import assert from "node:assert/strict";
import { test } from "node:test";
import { actionForKey, calculatorReducer, initialState } from "./calculator";

function press(...actions: string[]) {
  return actions.reduce(calculatorReducer, initialState);
}

test("all four arithmetic operations", () => {
  for (const [operator, expected] of [
    ["+", "10"],
    ["−", "6"],
    ["×", "16"],
    ["÷", "4"],
  ]) {
    assert.equal(press("8", operator!, "2", "=").display, expected);
  }
});

test("decimal arithmetic avoids floating point display artifacts", () => {
  assert.equal(press("0", ".", "1", "+", "0", ".", "2", "=").display, "0.3");
  assert.equal(press(".", "5", ".", "2").display, "0.52");
  assert.equal(press("1", "÷", "3", "=").display, "0.333333333333");
});

test("operations chain immediately and a pending operator can be replaced", () => {
  assert.equal(press("2", "+", "3", "×", "4", "=").display, "20");
  assert.equal(press("8", "+", "×", "2", "=").display, "16");
  assert.equal(press("8", "+", "=", "2", "=").display, "10");
});

test("percentage and sign toggle work on operands and results", () => {
  assert.equal(press("5", "0", "%").display, "0.5");
  assert.equal(press("5", "±", "+", "2", "=").display, "-3");
  assert.equal(press("5", "+", "±", "2", "=").display, "3");
  assert.equal(press("5", "±", "±").display, "5");
  assert.equal(press("2", "+", "2", "=", "±").display, "-4");
  assert.equal(press("2", "×", "5", "0", "%", "=").display, "1");
});

test("clear and backspace reset or remove input safely", () => {
  assert.deepEqual(press("1", "+", "2", "AC"), initialState);
  assert.equal(press("1", "2", "⌫").display, "1");
  assert.equal(press("1", "±", "⌫").display, "0");
  assert.equal(press("2", "+", "3", "=", "⌫").display, "0");
  assert.equal(press("2", "+", "⌫", "3", "=").display, "5");
});

test("division by zero is an error, not a valid number, and is recoverable", () => {
  const invalid = press("5", "÷", "0", "=");
  assert.equal(invalid.display, "Error");
  assert.match(invalid.error!, /Cannot divide by zero/);
  assert.equal(calculatorReducer(invalid, "+").display, "Error");
  assert.equal(calculatorReducer(invalid, "3").display, "3");
  assert.equal(calculatorReducer(invalid, ".").display, "0.");
  assert.deepEqual(calculatorReducer(invalid, "AC"), initialState);
  assert.equal(press("0", "÷", "0", "=").display, "Error");
});

test("overflow is rejected and input length is bounded", () => {
  const overflow = calculatorReducer(
    { ...initialState, display: "1e308", stored: 10, operator: "×" },
    "=",
  );
  assert.equal(overflow.display, "Error");
  assert.match(overflow.error!, /too large/);
  assert.equal(press(..."123456789012345".split("")).display, "123456789012");
  assert.equal(press("0", "0", "2").display, "2");
});

test("a result can start a new calculation or continue the previous result", () => {
  assert.equal(press("2", "+", "3", "=", "4").display, "4");
  assert.equal(press("2", "+", "3", "=", "×", "2", "=").display, "10");
  assert.equal(press("2", "+", "3", "=", ".", "5").display, "0.5");
});

test("scientific notation can be replaced or deleted without corrupting input", () => {
  const scientific = { ...initialState, display: "1e-12" };
  assert.equal(calculatorReducer(scientific, "2").display, "2");
  assert.equal(calculatorReducer(scientific, ".").display, "0.");
  assert.equal(calculatorReducer(scientific, "⌫").display, "0");
});

test("unknown actions are ignored and keyboard aliases map correctly", () => {
  assert.equal(calculatorReducer(initialState, "invalid"), initialState);
  for (const [key, expected] of [
    ["Enter", "="],
    ["Escape", "AC"],
    ["Backspace", "⌫"],
    ["*", "×"],
    ["/", "÷"],
    ["-", "−"],
    ["5", "5"],
  ]) {
    assert.equal(actionForKey(key!), expected);
  }
  assert.equal(actionForKey("a"), null);
});
