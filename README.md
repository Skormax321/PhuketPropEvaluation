# Калькулятор позиции юнита

Рынки: **Пхукет** и **Паттайя**. Данные — slim JSON в `public/data/{market}/`.

### Обновление данных

Сырые CSV FazWaz (WebScraper) рядом с репозиторием (не в git).

```bash
python3 scripts/clean_phuket_listings.py --market all   # или phuket / pattaya
python3 scripts/export_listings_for_web.py --market all
```

Курс: **32.41 THB/USD**.

#### QC при clean

- Dedupe по `unit_id` из `unit-info__description-title href` (`-u(\d+)`)
- **Без** content-dedupe по цене/площади
- `20 ≤ area ≤ 900`, `bedrooms ≤ 4`
- `20000 ≤ THB/m² ≤ 500000`
- Отброс `project` пустой/`not-set`, district ровно `Pattaya`/`Phuket`
- Типы: Condo / Apartment / Penthouse

#### Маппинг сырых колонок

| Поле | Сырой столбец |
|------|---------------|
| `project` | `unit-name` |
| `district` | `location-unit` |
| `price_usd` | `price-tag` → `/ 32.41` |
| `price_usd_sqm` | `dynamic-tooltip` → `/ 32.41` |
| `area_sqm` | `dynamic-tooltip 2` |
| `bedrooms` | title (`Studio` → 0) |

Pattaya off-plan: `Pattaya-offplan-1.csv` + `Pattaya-offplan-2.csv`.  
Промежуточные CSV: `output/{market}_off_plan.csv`, `output/{market}_ready.csv`.

## Структура

| Путь | Назначение |
|------|------------|
| `public/data/phuket/` | JSON листингов Пхукет |
| `public/data/pattaya/` | JSON листингов Паттайя |
| `scripts/clean_phuket_listings.py` | Raw → `output/*.csv` |
| `scripts/export_listings_for_web.py` | CSV → `public/data/{market}/` |
| `lib/benchmark.ts` | Когорты и percentiles |
| `components/` | Форма, таблица, графики |
