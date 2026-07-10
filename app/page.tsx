import CalculatorPage from "@/components/CalculatorPage";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-xl font-medium text-ink">Калькулятор позиции юнита</h1>
        <p className="mt-1 text-sm text-muted">
          Сравнение цены, площади и $/m² с листингами квартир FazWaz (Phuket).
        </p>
      </header>
      <CalculatorPage />
    </main>
  );
}
