"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 font-sans text-foreground">
      <h1 className="font-heading text-2xl font-semibold text-balance">
        Calculator could not load
      </h1>
      <p role="alert" className="text-base text-muted-foreground">
        Please try again.
      </p>
      <button
        onClick={reset}
        type="button"
        className="min-h-12 cursor-pointer rounded-control bg-primary px-6 text-base text-primary-foreground transition duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95"
      >
        Try again
      </button>
    </main>
  );
}
