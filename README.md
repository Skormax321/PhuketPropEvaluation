# Калькулятор позиции юнита

## Структура

| Путь | Назначение |
|------|------------|
| `public/data/off_plan.json` | Листинги off-plan |
| `public/data/ready.json` | Листинги ready |
| `public/data/districts.json` | Районы для dropdown |
| `public/data/projects_index.json` | Проекты для dropdown |
| `scripts/clean_phuket_listings.py` | Сырой FazWaz CSV → `output/*.csv` |
| `scripts/export_listings_for_web.py` | `output/*.csv` → `public/data/*.json` |
| `lib/benchmark.ts` | Логика когорт и percentiles |
| `components/` | Форма, таблица, графики, CSV |
| `components/LeadGate.tsx` | Экран сбора контактов перед калькулятором |
| `app/api/lead/route.ts` | Приём заявки: вебхук CRM + Telegram |
| `lib/lead.ts` | Валидация лида и доставка в каналы |
| `lib/access.ts` | Подписанная cookie доступа |

## Лид-форма перед калькулятором

`app/page.tsx` на сервере проверяет cookie `ppe_access`. Если её нет — показывается
экран `LeadGate` с формой (имя, телефон/WhatsApp, email). После успешной отправки
`POST /api/lead`:

1. заявка уходит в вебхук CRM и в Telegram-чат (параллельно, таймаут 8 с);
2. в ответе ставится подписанная HMAC cookie на 30 дней;
3. `router.refresh()` перерисовывает страницу и открывает калькулятор.

Детали:

- заявка считается принятой, если сработал **хотя бы один** канал; если все
  настроенные каналы упали — пользователь видит ошибку, а лид пишется в лог рантайма;
- если каналы не настроены вовсе, доступ выдаётся, а лид пишется только в лог;
- вместе с контактами передаются `utm_*`, `page_url` и `referrer`;
- есть honeypot-поле и rate limit 5 заявок / 10 минут на IP.

Гейт мягкий: файлы `public/data/*.json` остаются доступными по прямой ссылке.

## Переменные окружения

Скопируйте `.env.example` в `.env.local` (локально) или задайте в Vercel → Settings →
Environment Variables.

| Переменная | Обязательна | Назначение |
|------------|-------------|------------|
| `ACCESS_SECRET` | да | Секрет подписи cookie доступа (`openssl rand -hex 32`) |
| `CRM_WEBHOOK_URL` | да | URL вебхука CRM |
| `CRM_WEBHOOK_FORMAT` | нет | `form` (по умолчанию, поля в стиле Tilda) или `json` |
| `CRM_WEBHOOK_AUTH` | нет | Значение заголовка `Authorization`, если хук закрыт |
| `TELEGRAM_BOT_TOKEN` | да | Токен бота от @BotFather |
| `TELEGRAM_CHAT_ID` | да | ID чата для сверки заявок |
| `TELEGRAM_THREAD_ID` | нет | ID топика в супергруппе с темами |
| `LEAD_SOURCE` | нет | Метка источника в заявке |

Бот должен быть добавлен в чат; `TELEGRAM_CHAT_ID` для групп начинается с `-100`.

## Разработка

```bash
npm ci
npm run dev
```

