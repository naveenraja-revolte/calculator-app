export type Operator = "+" | "−" | "×" | "÷";

export interface CalculatorState {
  display: string;
  stored: number | null;
  operator: Operator | null;
  awaiting: boolean;
  expression: string;
  error: string | null;
}

export const initialState: CalculatorState = {
  display: "0",
  stored: null,
  operator: null,
  awaiting: false,
  expression: "",
  error: null,
};

export const operatorSymbols: Operator[] = ["+", "−", "×", "÷"];

function formatNumber(value: number): string {
  return String(Number(value.toPrecision(12)));
}

function calculate(left: number, right: number, operator: Operator): number {
  switch (operator) {
    case "+":
      return left + right;
    case "−":
      return left - right;
    case "×":
      return left * right;
    case "÷":
      return left / right;
  }
}

function enterDigit(state: CalculatorState, digit: string): CalculatorState {
  const starting =
    state.awaiting || state.error !== null || state.display.includes("e");
  const current = starting ? "0" : state.display;
  if (current.replace(/[^0-9]/g, "").length >= 12 && current !== "0")
    return state;
  const negative = current.startsWith("-");
  const unsigned = negative ? current.slice(1) : current;
  const display =
    (negative ? "-" : "") + (unsigned === "0" ? digit : unsigned + digit);
  return {
    ...(state.error ? initialState : state),
    display,
    awaiting: false,
    error: null,
    expression: state.operator && !state.error ? state.expression : "",
  };
}

function finishOperation(
  state: CalculatorState,
  next: Operator | null,
): CalculatorState {
  const right = Number(state.display);
  const hasOperation = state.operator !== null && state.stored !== null;
  if (state.awaiting && hasOperation) {
    return next
      ? {
          ...state,
          operator: next,
          expression: `${formatNumber(state.stored!)} ${next}`,
        }
      : state;
  }
  const result = hasOperation
    ? calculate(state.stored!, right, state.operator!)
    : right;
  if (!Number.isFinite(result)) {
    return {
      ...initialState,
      display: "Error",
      error:
        state.operator === "÷" && right === 0
          ? "Cannot divide by zero. Enter a number or press AC."
          : "Result is too large. Enter a number or press AC.",
    };
  }
  const display = formatNumber(result);
  const expression = next
    ? `${display} ${next}`
    : hasOperation
      ? `${formatNumber(state.stored!)} ${state.operator} ${state.display} =`
      : state.expression;
  return {
    display,
    stored: next ? Number(display) : null,
    operator: next,
    awaiting: true,
    expression,
    error: null,
  };
}

export function calculatorReducer(
  state: CalculatorState,
  action: string,
): CalculatorState {
  if (action === "AC") return initialState;
  if (/^\d$/.test(action)) return enterDigit(state, action);
  if (action === ".") {
    const base = state.error ? initialState : state;
    const starting = base.awaiting || base.display.includes("e");
    if (!starting && base.display.includes(".")) return base;
    return {
      ...base,
      display: starting ? "0." : base.display + ".",
      awaiting: false,
      expression: base.operator ? base.expression : "",
    };
  }
  if (state.error) return state;
  if (operatorSymbols.includes(action as Operator)) {
    return finishOperation(state, action as Operator);
  }
  if (action === "=") return finishOperation(state, null);
  if (action === "⌫") {
    if (state.awaiting) return state.operator ? state : initialState;
    const shortened = state.display.includes("e")
      ? "0"
      : state.display.slice(0, -1);
    return {
      ...state,
      display: shortened && shortened !== "-" ? shortened : "0",
    };
  }
  if (action === "±") {
    const current = state.awaiting && state.operator ? "0" : state.display;
    return {
      ...state,
      display: current.startsWith("-") ? current.slice(1) : "-" + current,
      awaiting: false,
      expression: state.operator ? state.expression : "",
    };
  }
  if (action === "%") {
    return {
      ...state,
      display: formatNumber(Number(state.display) / 100),
      awaiting: false,
      expression: state.operator ? state.expression : "",
    };
  }
  return state;
}

const keyboardActions: Record<string, string> = {
  "-": "−",
  "*": "×",
  "/": "÷",
  Enter: "=",
  Escape: "AC",
  Delete: "AC",
  Backspace: "⌫",
};

export function actionForKey(key: string): string | null {
  if (/^[0-9.+%=]$/.test(key)) return key;
  return keyboardActions[key] ?? null;
}
