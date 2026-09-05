import { IconTile } from "../ui";

/*
  The label is mono and the figure is display, not the other way round. In this
  theme mono carries metadata and the display face carries the thing itself, so a
  headline number is set like a headline — and the count is still tabular, so a
  row of these does not jitter as the numbers change.
*/
export default function StatCard({ title, count, Icon }: any) {
  return (
    <div className="card-hover flex items-start justify-between border border-line bg-paper p-6">
      <div>
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
          {title}
        </h3>
        <p className="figure mt-2.5 font-display text-3xl font-medium leading-none tracking-tight text-ink">
          {count}
        </p>
      </div>
      <IconTile icon={<Icon className="h-5 w-5" />} />
    </div>
  );
}
