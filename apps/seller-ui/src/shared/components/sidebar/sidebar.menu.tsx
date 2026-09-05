import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div className="mt-7 flex w-full flex-col gap-1 first:mt-0">
      {/* The kicker treatment without its leading rule — inside a 260px rail the
          rule would eat a third of the line. */}
      <h2 className="px-3 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-on-ink-faint">
        {title}
      </h2>
      {/*
        The children are <SidebarItem> components, which render an anchor — not
        <li>. A <ul> whose children aren't list items is invalid, and screen
        readers announce a list with zero entries.
      */}
      <div>{children}</div>
    </div>
  );
};

export default SidebarMenu;
