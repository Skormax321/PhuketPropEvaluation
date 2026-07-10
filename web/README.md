# Калькулятор позиции юнита (Vercel)

Веб-приложение сравнивает ваш юнит с рынком Phuket (off-plan / ready): таблица percentiles, гистограммы, выгрузка CSV.

## Что нужно установить (Mac)

1. **Node.js LTS** — https://nodejs.org (проверка: `node -v`, `npm -v`)
2. **Python 3** + pandas (для обновления данных из корня репо)
3. Аккаунты **GitHub** и **Vercel** (https://vercel.com)

## Локальный запуск

Из корня репозитория `FazWazMay26`:

```bash
# 1. Обновить JSON из CSV (после clean_phuket_listings.py)
python3 scripts/export_listings_for_web.py

# 2. Запустить сайт
cd web
npm install
npm run dev
```

Откройте http://localhost:3000

Тест: Ready, Karon, 137000$, 30 m², 1 BR.

## Проверка логики

```bash
cd web
npm run test
```

## Деплой на Vercel (пошагово)

### 1. Залить код на GitHub

```bash
cd /path/to/FazWazMay26
git add web/ scripts/export_listings_for_web.py
git commit -m "Add unit benchmark web calculator"
git push
```

Убедитесь, что в репо есть `web/public/data/*.json` (они генерируются `export_listings_for_web.py`).

### 2. Подключить Vercel

1. Зайти на https://vercel.com/new
2. **Import Git Repository** → выбрать репозиторий
3. **Root Directory:** нажать Edit → указать `web` (важно!)
4. Framework: **Next.js** (определится автоматически)
5. **Deploy**

Через 1–2 минуты получите URL вида `https://your-project.vercel.app`.

### 3. Обновление данных

При новом скрейпе:

```bash
python3 scripts/clean_phuket_listings.py
python3 scripts/export_listings_for_web.py
git add web/public/data/
git commit -m "Refresh listing data"
git push
```

Vercel пересоберёт сайт автоматически.

## Структура

| Путь | Назначение |
|------|------------|
| `public/data/off_plan.json` | Листинги off-plan |
| `public/data/ready.json` | Листинги ready |
| `public/data/districts.json` | Районы для dropdown |
| `lib/benchmark.ts` | Логика когорт и percentiles |
| `components/` | Форма, таблица, графики, CSV |

## Ограничения v1

- Фильтр только по району (без проекта Layan / The Title)
- Данные статичные до следующего `git push`
- При первом открытии загружается ~1–2 MB JSON
