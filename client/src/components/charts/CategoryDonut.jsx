import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TooltipCard, CHART_COLORS } from './ChartTooltip';
import { formatMoney, pluralize } from '../../lib/format';

/**
 * Donut + legend of spending per category.
 * `data` comes from categoryBreakdown(); `period` is 'monthly' or 'yearly'.
 */
export default function CategoryDonut({ data, currency, period = 'monthly', height = 200 }) {
  const total = data.reduce((sum, d) => sum + d[period], 0);

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <TooltipCard
        title={item.label}
        rows={[
          {
            label: period === 'monthly' ? 'Per month' : 'Per year',
            value: formatMoney(item[period], currency),
            color: item.color,
          },
          { label: 'Share', value: `${Math.round((item[period] / total) * 100)}%` },
          { label: 'Subscriptions', value: pluralize(item.count, 'service') },
        ]}
      />
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative w-full max-w-[210px] shrink-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={period}
              nameKey="label"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke={CHART_COLORS.surface}
              strokeWidth={3}
              startAngle={90}
              endAngle={-270}
              isAnimationActive
              animationDuration={750}
              animationEasing="ease-out"
            >
              {data.map((d) => (
                <Cell key={d.category} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} wrapperStyle={{ zIndex: 10 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">Total</span>
          <span className="font-display text-lg font-bold text-fg tabular tracking-tight">
            {formatMoney(total, currency, { compact: true })}
          </span>
          <span className="text-[11px] font-medium text-faint">{period === 'monthly' ? '/mo' : '/yr'}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {data.map((d) => {
          const share = total ? (d[period] / total) * 100 : 0;
          return (
            <li key={d.category} className="group flex items-center gap-3 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full transition-transform group-hover:scale-125"
                style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}66` }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-fg/90 group-hover:text-fg">{d.label}</span>
                <span className="block text-[11px] text-faint">{pluralize(d.count, 'plan')}</span>
              </span>
              <span className="text-right tabular">
                <span className="block font-semibold text-fg">{formatMoney(d[period], currency)}</span>
                <span className="block text-[11px] font-medium text-faint">{Math.round(share)}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
