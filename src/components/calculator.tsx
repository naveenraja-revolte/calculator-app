"use client";

import { useEffect, useReducer } from "react";
import {
  actionForKey,
  calculatorReducer,
  initialState,
} from "@/lib/calculator";
import { Keypad } from "./keypad";

export function Calculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing)
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;
      const action = actionForKey(event.key);
      if (!action) return;
      event.preventDefault();
      dispatch(action);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <section
      aria-label="Calculator"
      className="w-full max-w-sm overflow-hidden rounded-container border border-border
        bg-card p-6 text-card-foreground shadow-sm motion-safe:animate-enter sm:p-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-balance">
          Calculator
        </h1>
        <button
          type="button"
          onClick={() => dispatch("⌫")}
          aria-label="Backspace"
          title="Backspace"
          className="flex size-12 cursor-pointer items-center justify-center rounded-control
            text-muted-foreground transition duration-150 hover:bg-muted
            focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-ring active:scale-95"
        >
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-7-7 7-7Z" />
            <path d="m12 9 6 6m0-6-6 6" />
          </svg>
        </button>
      </div>
      <div className="mb-6 rounded-control bg-muted p-4 text-right tabular-nums">
        <p
          aria-label="Expression"
          className="min-h-6 truncate text-base text-muted-foreground"
        >
          {state.expression || "\u00a0"}
        </p>
        <output
          aria-label="Result"
          aria-live="polite"
          aria-atomic="true"
          className={`mt-2 block min-h-12 overflow-x-auto whitespace-nowrap font-medium tracking-tight ${
            state.display.length > 12
              ? "text-2xl"
              : state.display.length > 8
                ? "text-3xl"
                : "text-5xl"
          } ${state.error ? "text-destructive" : "text-foreground"}`}
        >
          {state.display}
        </output>
      </div>
      <Keypad
        onPress={dispatch}
        activeOperator={state.awaiting ? state.operator : null}
      />
      <p
        role={state.error ? "alert" : undefined}
        className={`mt-6 min-h-12 text-center text-sm text-pretty ${
          state.error ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {state.error || (
          <>
            Use your keyboard, too.
            <br />
            Enter to calculate · Esc to clear
          </>
        )}
      </p>
    </section>
  );
}
