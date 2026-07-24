# Калькулятор позиции юнита

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
