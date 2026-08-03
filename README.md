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
