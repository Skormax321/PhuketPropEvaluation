import type { CohortSummary } from "@/lib/benchmark";
import { fmtMoneyUsd, fmtMoneyUsdSqm, fmtNumber, fmtPct } from "@/lib/format";

interface Props {
  rows: CohortSummary[];
}

export default function SummaryTable({ rows }: Props) {
  const visible = rows.filter((r) => r.n > 0);
  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted">Нет данных для выбранных параметров.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-[#fafaf9] text-muted">
          <tr>
            <th className="px-3 py-2 font-normal">Уровень</th>
            <th className="px-3 py-2 font-normal">n</th>
            <th className="px-3 py-2 font-normal">Med $</th>
            <th className="px-3 py-2 font-normal">Med m²</th>
            <th className="px-3 py-2 font-normal">Med $/m²</th>
            <th className="px-3 py-2 font-normal">$ pctile</th>
            <th className="px-3 py-2 font-normal">m² pctile</th>
            <th className="px-3 py-2 font-normal">$/m² pctile</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.cohort} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-ink">{r.label}</td>
              <td className="px-3 py-2">{r.n}</td>
              <td className="px-3 py-2">{fmtMoneyUsd(r.cohortMedianPriceUsd)}</td>
              <td className="px-3 py-2">{fmtNumber(r.cohortMedianAreaSqm, 0)}</td>
              <td className="px-3 py-2">{fmtMoneyUsdSqm(r.cohortMedianPriceUsdSqm)}</td>
              <td className="px-3 py-2">{fmtPct(r.pricePctile)}</td>
              <td className="px-3 py-2">{fmtPct(r.areaPctile)}</td>
              <td className="px-3 py-2">{fmtPct(r.priceSqmPctile)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-2 text-xs text-muted">
        Percentile = доля листингов ниже вашего значения. Тёмная линия на графиках — ваша цена; серая — оригинал; пунктир — медиана.
      </p>
    </div>
  );
}
