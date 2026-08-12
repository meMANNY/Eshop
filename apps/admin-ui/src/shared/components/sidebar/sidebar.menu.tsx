interface Props {
  title: string;
  children: React.ReactNode;
}

export default function SidebarMenu({ title, children }: Props) {
  return (
    <div className="mt-6 first:mt-0">
      <h3 className="mb-1.5 px-3 text-label font-semibold uppercase text-[var(--faint)]">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
