# Калькулятор позиции юнита

### Обновление данных

Сырые CSV FazWaz (WebScraper) кладутся рядом с репозиторием или в `raw/` (в git не коммитятся).

```bash
# опционально: RAW_OFF=... RAW_READY=...
python3 scripts/clean_phuket_listings.py
python3 scripts/export_listings_for_web.py
git add public/data/ app/page.tsx
git commit -m "Refresh listing data"
git push
```

По умолчанию clean читает:

- `../Off-plan July 2026.csv`
- `../Ready July 2026.csv`

Курс: **32.41 THB/USD**. Фильтр площади: `20 ≤ area_sqm ≤ 900`.

#### Маппинг сырых колонок → CSV/JSON

| Поле | Сырой столбец | Значение |
|------|---------------|----------|
| `project` | `unit-name` | имя проекта |
| `district` | `location-unit` | `Subdistrict, Amphoe, Phuket` |
| `price_usd` | `price-tag` | `฿…` → `round(thb / 32.41)` |
| `price_usd_sqm` | `dynamic-tooltip` | `(฿…/SqM)` → `round(thb_sqm / 32.41)` |
| `area_sqm` | `dynamic-tooltip 2` | `N SqM` |
| `bedrooms` | `unit-info__description-title` | Studio → 0, `N Bedroom` → N |

Сегмент задаётся файлом (`Off-plan` / `Ready`), не колонкой. Промежуточные CSV: `output/phuket_off_plan.csv`, `output/phuket_ready.csv` (gitignore).

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
