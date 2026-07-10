# Калькулятор позиции юнита (Vercel)

Веб-приложение сравнивает ваш юнит с рынком Phuket (off-plan / ready): KPI, таблица percentiles, гистограммы, опционально — позиция внутри проекта.

## Что нужно установить

1. **Node.js LTS** — https://nodejs.org (`node -v`, `npm -v`)
2. **Python 3** + pandas (для обновления данных)
3. Аккаунты **GitHub** и **Vercel** (https://vercel.com)

## Локальный запуск

Из корня репозитория:

```bash
# 1. Обновить JSON из CSV (после clean_phuket_listings.py)
python3 scripts/export_listings_for_web.py

# 2. Запустить сайт
npm install
npm run dev
```

Откройте http://localhost:3000

Тест: Ready, Karon, 137000$, 30 m², 1 BR.

## Проверка логики

```bash
npm run test
npm run build
```

## Деплой на Vercel

1. https://vercel.com/new → Import репозиторий `PhuketPropEvaluation`
2. **Root Directory:** оставить пустым (приложение в корне репо)
3. Framework: **Next.js**
4. **Deploy**

**Settings → Build & Development Settings** (если 404 NOT_FOUND):

| Поле | Значение |
|------|----------|
| Framework Preset | Next.js |
| Root Directory | пусто |
| Build Command | пусто (дефолт) |
| Output Directory | **пусто** (не `.next`, не `web/.next`) |
| Node.js Version | 20.x |

После смены настроек: Deployments → Redeploy → без build cache.

Открывай URL кнопкой **Visit** на Ready-деплое, не старый bookmark.

После push в `main` Vercel пересобирает автоматически.

### Обновление данных

```bash
python3 scripts/clean_phuket_listings.py
python3 scripts/export_listings_for_web.py
git add public/data/
git commit -m "Refresh listing data"
git push
```

## Структура

| Путь | Назначение |
|------|------------|
| `public/data/off_plan.json` | Листинги off-plan |
| `public/data/ready.json` | Листинги ready |
| `public/data/districts.json` | Районы для dropdown |
| `public/data/projects_index.json` | Проекты для dropdown |
| `lib/benchmark.ts` | Логика когорт и percentiles |
| `components/` | Форма, таблица, графики, CSV |
