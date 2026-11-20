/** Shared tooltip shell so every chart's hover card looks the same. */
export function TooltipCard({ title, rows }) {
  return (
    <div className="min-w-44 rounded-2xl border border-line-strong bg-surface/95 px-4 py-3 text-sm shadow-[var(--shadow-pop)] backdrop-blur-xl">
      {title && (
        <p className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-fg border-b border-line-subtle pb-1.5">
          {title}
        </p>
      )}
      <dl className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-xs">
            <dt className="flex items-center gap-2 text-muted">
              {row.color && (
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: row.color,
                    boxShadow: `0 0 6px ${row.color}80`,
                  }}
                  aria-hidden
                />
              )}
              <span>{row.label}</span>
            </dt>
            <dd className="font-semibold text-fg tabular">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export const CHART_COLORS = {
  lavender: '#a78bfa',
  lavenderStrong: '#906bf9',
  lime: '#c4e865',
  muted: '#94a3b8',
  faint: '#64748b',
  line: 'rgba(255, 255, 255, 0.08)',
  surface: '#161922',
  raised: '#212634',
};

// Recharts axis styling, shared by all charts.
export const axisProps = {
  stroke: 'transparent',
  tick: { fill: CHART_COLORS.muted, fontSize: 11, fontFamily: 'Geist, sans-serif' },
  tickLine: false,
  axisLine: false,
};

export const gridProps = {
  stroke: 'rgba(255, 255, 255, 0.06)',
  strokeDasharray: '3 3',
  vertical: false,
};
