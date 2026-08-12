import Image from "next/image";
import CalculatorPage from "@/components/CalculatorPage";
import LeadGate from "@/components/LeadGate";
import { hasAccess } from "@/lib/access";

export default async function Home() {
  if (!(await hasAccess())) {
    return <LeadGate />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col overflow-x-hidden px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <Image
          src="/tranio-logo.png"
          alt="Tranio"
          width={172}
          height={47}
          priority
          className="h-auto w-[144px] max-w-[144px] shrink-0 sm:h-11 sm:w-[172px] sm:max-w-[172px]"
        />
        <div className="min-w-0">
          <h1 className="text-xl font-medium text-ink">Калькулятор позиции юнита</h1>
          <p className="mt-1 text-sm text-muted">
            Сравнение цены, площади и $/m² с листингами квартир FazWaz (Phuket).
          </p>
        </div>
      </header>

      <div className="min-w-0 flex-1">
        <CalculatorPage />
      </div>

      <footer className="mt-12 border-t border-border pt-5 text-xs leading-relaxed text-muted">
        Источник данных: FazWaz. Выборка объявлений о продаже квартир по состоянию на
        июль 2026 года. Информация не является индивидуальной инвестиционной
        рекомендацией.
      </footer>
    </main>
  );
}
