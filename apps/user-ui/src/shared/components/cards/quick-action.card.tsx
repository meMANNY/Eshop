export default function QuickActionCard({ Icon, title, description }: any) {
  return (
    <div className="group flex cursor-pointer items-start gap-4 rounded-card border border-rule bg-surface p-5 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-coral/40 hover:shadow-lift motion-reduce:transform-none motion-reduce:transition-none">
      {/*
        The glyph wears `coral-ink` rather than `coral`: at 2.7:1 on this tile the
        plain brand coral sits under the 3:1 floor a graphical element needs, and
        on hover the tile fills with coral so the glyph goes to dark ink for the
        same reason — white on coral is 2.7:1 the other way round.
      */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-coral-soft transition-colors duration-300 group-hover:bg-coral">
        <Icon className="h-5 w-5 text-coral-ink transition-colors duration-300 group-hover:text-[#2b0f0a]" />
      </div>
      <div>
        <h4 className="mb-1 font-jost text-sm font-semibold text-ink transition-colors group-hover:text-coral-ink">
          {title}
        </h4>
        <p className="text-xs leading-snug text-ink-muted">{description}</p>
      </div>
    </div>
  );
}
