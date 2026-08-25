"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

const BENEFITS = [
  "Сравнение с листингами квартир по всем локациям, районам и внутри конкретного проекта",
  "Off-plan и вторичная недвижимость",
  "База постоянно обновляется",
];

function collectUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  return utm;
}

export default function LeadGate() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          company,
          pageUrl: window.location.href,
          referrer: document.referrer || undefined,
          utm: collectUtm(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Не удалось отправить заявку. Попробуйте ещё раз.");
        setSending(false);
        return;
      }

      // Cookie доступа уже установлена ответом — перерисовываем серверный компонент.
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Проверьте соединение и попробуйте ещё раз.");
      setSending(false);
    }
  };

  const inputClass = "rounded border border-border px-3 py-2 text-ink";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-10">
        <div className="flex flex-col gap-5">
          <Image
            src="/tranio-logo.png"
            alt="Tranio"
            width={172}
            height={47}
            priority
            className="h-auto w-[144px] max-w-[144px] sm:w-[172px] sm:max-w-[172px]"
          />
          <div>
            <h1 className="text-2xl font-medium text-ink sm:text-3xl">
              Калькулятор позиции юнита на рынках Пхукета и Паттайи
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Калькулятор покажет, насколько цена вашей недвижимости отличается
              от аналогов по острову. Оставьте контакты, чтобы открыть доступ.
            </p>
          </div>
          <ul className="grid gap-2 text-sm text-ink">
            {BENEFITS.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-muted">
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-border bg-white p-5"
        >
          <h2 className="text-sm font-medium text-ink">Получить доступ</h2>

          <label className="grid gap-1 text-sm">
            <span className="text-muted">Имя</span>
            <input
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Евгений"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-muted">Телефон / WhatsApp</span>
            <input
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+66 123 456 789"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-muted">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </label>

          {/* honeypot: скрыт от людей, видим для ботов */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="hidden"
          />

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="rounded bg-ink px-5 py-2 text-sm text-white disabled:opacity-50"
          >
            {sending ? "Отправляем…" : "Открыть калькулятор"}
          </button>

          <p className="text-xs leading-relaxed text-muted">
            Нажимая кнопку, вы соглашаетесь на обработку персональных данных и
            получение консультации по подбору недвижимости.
          </p>
        </form>
      </div>
    </main>
  );
}
