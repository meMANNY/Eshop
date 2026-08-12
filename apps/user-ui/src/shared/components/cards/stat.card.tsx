export default function StatCard({ title, count, Icon }: any) {
  return (
    <div className="flex items-center justify-between rounded-card border border-rule bg-surface p-6 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-coral/40 hover:shadow-lift motion-reduce:transform-none motion-reduce:transition-none">
      <div>
        <h3 className="text-label font-semibold uppercase text-ink-muted">
          {title}
        </h3>
        {/* The count is the point of the tile, so it gets the tabular figure
            treatment — a dashboard of these shouldn't jitter as numbers change. */}
        <p className="figure mt-1.5 text-3xl font-semibold text-ink">{count}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-coral-soft">
        <Icon className="h-6 w-6 text-coral-ink" />
      </div>
    </div>
  );
}
