interface Props {
  title: string;
  children: React.ReactNode;
}

export default function SidebarMenu({ title, children }: Props) {
  return (
    <div className="mt-7 first:mt-0">
      {/* The kicker treatment without its leading rule — inside a 248px rail the
          rule would eat a third of the line. */}
      <h3 className="px-3 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-on-ink-faint">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}
