
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TooltipCard, CHART_COLORS, axisProps } from './ChartTooltip';
import { formatMoney, pluralize } from '../../lib/format';

/**
 * Horizontal bars, one per row of data.
 * Clicking a bar sends its complete data row to the parent.
 */
export default function HorizontalBarChart({
  data,
  valueKey,
  currency,
  periodLabel,
  onBarClick,
}) {
  const height = Math.max(130, data.length * 46 + 24);

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const row = payload[0].payload;

    return (
      <TooltipCard
        title={row.label}
        rows={[
          {
            label: periodLabel,
            value: formatMoney(row[valueKey], currency),
            color: row.color || CHART_COLORS.lavender,
          },
          {
            label: 'Subscriptions',
            value: pluralize(row.count, 'subscription'),
          },
          {
            label: 'Action',
            value: 'Click to view details',
          },
        ]}
      />
    );
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          barCategoryGap={12}
        >
          <CartesianGrid
            stroke="rgba(255, 255, 255, 0.05)"
            horizontal={false}
            strokeDasharray="3 3"
          />

          <XAxis
            type="number"
            {...axisProps}
            tickFormatter={(v) =>
              formatMoney(v, currency, { compact: true })
            }
            allowDecimals={false}
          />

          <YAxis
            type="category"
            dataKey="label"
            {...axisProps}
            width={100}
            tick={{ ...axisProps.tick, fill: CHART_COLORS.muted }}
            tickFormatter={(v) =>
              v.length > 15 ? `${v.slice(0, 14)}…` : v
            }
          />

          <Tooltip
            content={renderTooltip}
            cursor={{
              fill: 'rgba(255, 255, 255, 0.04)',
              radius: 6,
            }}
          />

          <Bar
            dataKey={valueKey}
            radius={[0, 6, 6, 0]}
            maxBarSize={22}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
            cursor="pointer"
            onClick={(entry) => {
              const row = entry?.payload || entry;
              if (row && onBarClick) onBarClick(row);
            }}
          >
            {data.map((row) => (
              <Cell
                key={row.label}
                fill={row.color || CHART_COLORS.lavender}
                cursor="pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
