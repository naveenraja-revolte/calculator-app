const skeletonKeys = [
  "clear",
  "sign",
  "percentage",
  "divide",
  "seven",
  "eight",
  "nine",
  "multiply",
  "four",
  "five",
  "six",
  "subtract",
  "one",
  "two",
  "three",
  "add",
  "zero-left",
  "zero-right",
  "decimal",
  "equals",
];

export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4 text-foreground">
      <div
        role="status"
        className="w-full max-w-sm rounded-container border border-border bg-card p-6 motion-safe:animate-pulse"
      >
        <span className="sr-only">Loading calculator…</span>
        <div className="mb-6 h-24 rounded-control bg-muted" />
        <div className="grid grid-cols-4 gap-2" aria-hidden="true">
          {skeletonKeys.map((keyId) => (
            <div key={keyId} className="h-16 rounded-control bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
