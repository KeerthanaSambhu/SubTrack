import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TooltipCard, CHART_COLORS, axisProps, gridProps } from './ChartTooltip';
import { formatMoney, pluralize } from '../../lib/format';

const PERIOD_LABEL = { past: 'Charged', current: 'This month', future: 'Projected' };

/** Bars of real charges per calendar month — past months charged, future months projected. */
export default function SpendingTrendChart({ data, currency }) {
  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const m = payload[0].payload;
    return (
      <TooltipCard
        title={m.fullLabel}
        rows={[
          {
            label: PERIOD_LABEL[m.period],
            value: formatMoney(m.total, currency),
            color: m.period === 'current' ? CHART_COLORS.lime : CHART_COLORS.lavender,
          },
          { label: 'Payments', value: pluralize(m.payments, 'charge') },
        ]}
      />
    );
  };

  const fillFor = (period) => (period === 'current' ? CHART_COLORS.lime : CHART_COLORS.lavender);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted" aria-hidden>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-lavender shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
          <span>Historical spend</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-lime shadow-[0_0_8px_rgba(196,232,101,0.5)]" />
          <span className="text-fg font-semibold">Current month</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-lavender/30 ring-1 ring-lavender/60" />
          <span>Projected renewals</span>
        </span>
      </div>
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap="24%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} interval={0} tick={{ ...axisProps.tick, fontSize: 11 }} />
            <YAxis
              {...axisProps}
              width={56}
              tickFormatter={(v) => formatMoney(v, currency, { compact: true })}
              allowDecimals={false}
            />
            <Tooltip content={renderTooltip} cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 8 }} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={38} isAnimationActive animationDuration={750} animationEasing="ease-out">
              {data.map((m) => (
                <Cell
                  key={m.key}
                  fill={fillFor(m.period)}
                  fillOpacity={m.period === 'future' ? 0.35 : 1}
                  stroke={m.period === 'future' ? CHART_COLORS.lavender : 'none'}
                  strokeOpacity={0.8}
                  strokeWidth={m.period === 'future' ? 1.5 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Screen-reader summary */}
      <ul className="sr-only">
        {data.map((m) => (
          <li key={m.key}>
            {m.fullLabel}: {formatMoney(m.total, currency)} ({PERIOD_LABEL[m.period].toLowerCase()})
          </li>
        ))}
      </ul>
    </div>
  );
}
