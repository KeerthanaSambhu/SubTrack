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
                    boxShadow: `0 0 6px color-mix(in oklab, ${row.color} 50%, transparent)`,
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

/*
 * Chart colours are CSS variables (defined in index.css), so charts switch
 * with the light/dark theme like everything else. Recharts passes these
 * straight to SVG fill/stroke, which resolve var() at paint time.
 */
export const CHART_COLORS = {
  lavender: 'var(--color-lavender)',
  lavenderStrong: 'var(--color-lavender-strong)',
  lime: 'var(--color-lime)',
  muted: 'var(--color-muted)',
  faint: 'var(--color-faint)',
  line: 'var(--color-line)',
  surface: 'var(--color-surface)',
  raised: 'var(--color-raised)',
  grid: 'var(--color-grid)',
  hoverTint: 'var(--color-hover-tint)',
};

// Recharts axis styling, shared by all charts.
export const axisProps = {
  stroke: 'transparent',
  tick: { fill: CHART_COLORS.muted, fontSize: 11, fontFamily: 'Geist, sans-serif' },
  tickLine: false,
  axisLine: false,
};

export const gridProps = {
  stroke: CHART_COLORS.grid,
  strokeDasharray: '3 3',
  vertical: false,
};
