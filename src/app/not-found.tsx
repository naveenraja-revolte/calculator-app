import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 font-sans text-foreground">
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
      <Link
        href="/"
        className="rounded-control text-base text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Back to calculator
      </Link>
    </main>
  );
}
