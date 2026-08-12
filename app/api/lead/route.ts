import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessCookieOptions, createAccessToken } from "@/lib/access";
import { parseLead, sendToCrm, sendToTelegram, type LeadPayload } from "@/lib/lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function grantAccess(body: Record<string, unknown>) {
  const res = NextResponse.json(body);
  res.cookies.set(ACCESS_COOKIE, createAccessToken(), accessCookieOptions());
  return res;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный запрос" }, { status: 400 });
  }

  // Honeypot: боты заполняют скрытое поле — отвечаем как обычно, но никуда не шлём.
  if (typeof (body as Record<string, unknown>)?.company === "string" &&
      (body as Record<string, unknown>).company !== "") {
    return grantAccess({ ok: true });
  }

  const parsed = parseLead(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const payload: LeadPayload = {
    ...parsed.lead,
    source: process.env.LEAD_SOURCE ?? "phuket-unit-benchmark",
    createdAt: new Date().toISOString(),
    ip,
    userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? undefined,
  };

  const channels: Array<{ name: string; configured: boolean; run: () => Promise<void> }> = [
    {
      name: "crm",
      configured: Boolean(process.env.CRM_WEBHOOK_URL),
      run: () => sendToCrm(payload),
    },
    {
      name: "telegram",
      configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      run: () => sendToTelegram(payload),
    },
  ];

  const active = channels.filter((c) => c.configured);
  if (active.length === 0) {
    // Каналы не настроены — лид не теряем, пишем в лог рантайма и пропускаем дальше.
    console.warn("[lead] каналы доставки не настроены, лид только в логе:", {
      ...payload,
      ip: undefined,
    });
    return grantAccess({ ok: true });
  }

  const results = await Promise.allSettled(active.map((c) => c.run()));
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[lead] ${active[i].name} failed:`, result.reason);
    }
  });

  if (results.every((r) => r.status === "rejected")) {
    console.error("[lead] лид не доставлен ни в один канал:", {
      ...payload,
      ip: undefined,
    });
    return NextResponse.json(
      { ok: false, error: "Не удалось отправить заявку. Попробуйте ещё раз." },
      { status: 502 },
    );
  }

  return grantAccess({ ok: true });
}
