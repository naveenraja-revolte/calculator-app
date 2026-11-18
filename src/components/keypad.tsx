import type { Operator } from "@/lib/calculator";

type Key = {
  value: string;
  label: string;
  kind?: "utility" | "operator" | "equals";
};

const keys: Key[] = [
  { value: "AC", label: "All clear", kind: "utility" },
  { value: "±", label: "Toggle sign", kind: "utility" },
  { value: "%", label: "Percentage", kind: "utility" },
  { value: "÷", label: "Divide", kind: "operator" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "×", label: "Multiply", kind: "operator" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "−", label: "Subtract", kind: "operator" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "+", label: "Add", kind: "operator" },
  { value: "0", label: "0" },
  { value: ".", label: "Decimal point" },
  { value: "=", label: "Equals", kind: "equals" },
];

export function Keypad({
  onPress,
  activeOperator,
}: {
  onPress: (key: string) => void;
  activeOperator: Operator | null;
}) {
  return (
    <div
      role="group"
      aria-label="Calculator keypad"
      className="grid grid-cols-4 gap-2"
    >
      {keys.map((key) => {
        const active = key.kind === "operator" && activeOperator === key.value;
        const tone =
          key.kind === "equals" || active
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : key.kind === "operator"
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : key.kind === "utility"
                ? "bg-muted text-muted-foreground hover:bg-border"
                : "bg-card text-card-foreground border border-border hover:bg-muted";
        return (
          <button
            key={key.value}
            type="button"
            aria-label={key.label}
            aria-pressed={key.kind === "operator" ? active : undefined}
            onClick={() => onPress(key.value)}
            className={`h-16 min-w-0 cursor-pointer rounded-control text-xl font-medium tabular-nums transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 ${key.value === "0" ? "col-span-2" : ""} ${tone}`}
          >
            {key.value}
          </button>
        );
      })}
    </div>
  );
}
