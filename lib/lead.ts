export interface LeadInput {
  name: string;
  phone: string;
  email: string;
  pageUrl?: string;
  referrer?: string;
  utm?: Record<string, string>;
}

export interface LeadPayload extends LeadInput {
  source: string;
  createdAt: string;
  ip?: string;
  userAgent?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const FETCH_TIMEOUT_MS = 8000;

function str(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/** Телефон в E.164-подобном виде: ведущий `+` (если был) и цифры. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  return raw.trim().startsWith("+") ? `+${digits}` : digits;
}

export function parseLead(
  body: unknown,
): { ok: true; lead: LeadInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Некорректный запрос" };
  }
  const raw = body as Record<string, unknown>;

  const name = str(raw.name, 100);
  if (name.length < 2) return { ok: false, error: "Укажите имя" };

  const phone = normalizePhone(str(raw.phone, 40));
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    return { ok: false, error: "Укажите телефон в международном формате" };
  }

  const email = str(raw.email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Укажите корректный email" };

  const utmRaw = (typeof raw.utm === "object" && raw.utm !== null
    ? (raw.utm as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = str(utmRaw[key], 200);
    if (value) utm[key] = value;
  }

  return {
    ok: true,
    lead: {
      name,
      phone,
      email,
      pageUrl: str(raw.pageUrl, 500) || undefined,
      referrer: str(raw.referrer, 500) || undefined,
      utm,
    },
  };
}

/**
 * Тело в формате Tilda-вебхука: поля с заглавной буквы — то, что читают
 * интеграции `tilda_to_lead`. Дубли в нижнем регистре оставлены для
 * обработчиков, которые ждут привычные `name`/`phone`/`email`.
 */
function toFormBody(payload: LeadPayload): URLSearchParams {
  const params = new URLSearchParams({
    Name: payload.name,
    Phone: payload.phone,
    Email: payload.email,
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    formname: payload.source,
    source: payload.source,
    created_at: payload.createdAt,
  });
  if (payload.pageUrl) params.set("page_url", payload.pageUrl);
  if (payload.referrer) params.set("referrer", payload.referrer);
  for (const [key, value] of Object.entries(payload.utm ?? {})) {
    params.set(key, value);
  }
  return params;
}

/** POST в вебхук CRM. Формат тела — `CRM_WEBHOOK_FORMAT`: `form` (по умолчанию) или `json`. */
export async function sendToCrm(payload: LeadPayload): Promise<void> {
  const url = process.env.CRM_WEBHOOK_URL;
  if (!url) throw new Error("CRM_WEBHOOK_URL не задан");

  const useForm = (process.env.CRM_WEBHOOK_FORMAT ?? "form") !== "json";
  const headers: Record<string, string> = {
    "Content-Type": useForm
      ? "application/x-www-form-urlencoded"
      : "application/json",
  };
  if (process.env.CRM_WEBHOOK_AUTH) {
    headers.Authorization = process.env.CRM_WEBHOOK_AUTH;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: useForm
      ? toFormBody(payload).toString()
      : JSON.stringify({
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          source: payload.source,
          created_at: payload.createdAt,
          page_url: payload.pageUrl,
          referrer: payload.referrer,
          ...payload.utm,
        }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CRM ${res.status}: ${text.slice(0, 300)}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatTelegramMessage(payload: LeadPayload): string {
  const lines = [
    "<b>Заявка на доступ к калькулятору</b>",
    `Имя: ${escapeHtml(payload.name)}`,
    `Телефон: ${escapeHtml(payload.phone)}`,
    `Email: ${escapeHtml(payload.email)}`,
  ];
  const utmEntries = Object.entries(payload.utm ?? {});
  if (utmEntries.length > 0) {
    lines.push(
      "",
      ...utmEntries.map(([key, value]) => `${key}: ${escapeHtml(value)}`),
    );
  }
  if (payload.referrer) lines.push(`Referrer: ${escapeHtml(payload.referrer)}`);
  lines.push("", `Источник: ${escapeHtml(payload.source)}`);
  return lines.join("\n");
}

export async function sendToTelegram(payload: LeadPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatTelegramMessage(payload),
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(process.env.TELEGRAM_THREAD_ID
        ? { message_thread_id: Number(process.env.TELEGRAM_THREAD_ID) }
        : {}),
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Telegram ${res.status}: ${text.slice(0, 300)}`);
  }
}
