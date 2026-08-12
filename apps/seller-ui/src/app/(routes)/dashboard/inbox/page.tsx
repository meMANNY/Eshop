"use client";

import { Mail } from "lucide-react";
import {
  Crumbs,
  EmptyState,
  PageShell,
  PageTitle,
  Panel,
} from "@/shared/components/ui";

/*
  The sidebar has linked here since it was written, but no page existed at this
  route — clicking "Inbox" produced a 404 inside the dashboard.
*/
export default function InboxPage() {
  return (
    <PageShell>
      <Crumbs trail={["Inbox"]} />
      <PageTitle title="Inbox" meta="Messages from buyers about their orders." />
      <Panel>
        <EmptyState
          icon={<Mail size={28} />}
          title="No messages"
          hint="When a buyer asks about an order, the conversation will open here."
        />
      </Panel>
    </PageShell>
  );
}
