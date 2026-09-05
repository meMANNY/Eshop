import { IconTile } from "../ui";

/*
  The terracotta wipe along the top edge is the theme's hover signature for a
  card that is an action rather than a destination — it grows from zero to full
  width, so the card reads as being armed rather than merely highlighted.
*/
export default function QuickActionCard({ Icon, title, description }: any) {
  return (
    <div className="card-hover group relative flex cursor-pointer flex-col overflow-hidden border border-line bg-paper p-6">
      <span
        className="absolute left-0 top-0 h-[2px] w-0 bg-terra transition-[width] duration-500 group-hover:w-full"
        aria-hidden="true"
      />

      <IconTile icon={<Icon className="h-5 w-5" />} />

      <h4 className="mt-5 font-display text-base font-medium tracking-tight text-ink transition-colors group-hover:text-terra">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-[1.55] text-ink-500">{description}</p>

      <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-terra">
        open
        <span
          className="transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </span>
    </div>
  );
}
