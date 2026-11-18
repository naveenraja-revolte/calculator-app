import { Calculator } from "@/components/calculator";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4 font-sans text-foreground sm:p-8">
      <Calculator />
    </main>
  );
}
