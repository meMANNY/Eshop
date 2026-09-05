"use client";

import { useState } from "react";
import { Globe, Store, Wallet } from "lucide-react";
import DomainsTab from "@/shared/modules/settings/DomainsTab";
import GeneralTab from "@/shared/modules/settings/GeneralTab";
import WithdrawTab from "@/shared/modules/settings/WithdrawTab";
import { Crumbs, PageShell, PageTitle } from "@/shared/components/ui";

type Tab = "general" | "domains" | "withdraw";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Store size={15} /> },
  { id: "domains", label: "Custom domains", icon: <Globe size={15} /> },
  { id: "withdraw", label: "Withdraw method", icon: <Wallet size={15} /> },
];

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  return (
    <PageShell>
      <Crumbs trail={["Settings"]} />
      <PageTitle title="Settings" meta="Your shop, its domains and how you get paid." />

      {/*
        `role="tablist"` plus the selected state is what makes these read as one
        control rather than three unrelated buttons — and it replaces the blue
        underline, which was the only blue left in a coral app.
      */}
      <div role="tablist" className="mb-6 flex gap-1 border-b border-ink-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
              activeTab === tab.id
                ? "border-terra-2 text-on-ink"
                : "border-transparent text-on-ink-muted hover:text-on-ink"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && <GeneralTab />}
      {activeTab === "domains" && <DomainsTab />}
      {activeTab === "withdraw" && <WithdrawTab />}
    </PageShell>
  );
}
