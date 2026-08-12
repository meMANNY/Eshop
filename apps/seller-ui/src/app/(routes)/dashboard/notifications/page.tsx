"use client";

import { BellRing } from "lucide-react";
import {
  Crumbs,
  EmptyState,
  PageShell,
  PageTitle,
  Panel,
} from "@/shared/components/ui";

/*
  The sidebar has linked here since it was written, but no page existed at this
  route — clicking "Notifications" produced a 404 inside the dashboard.
*/
export default function NotificationsPage() {
  return (
    <PageShell>
      <Crumbs trail={["Notifications"]} />
      <PageTitle
        title="Notifications"
        meta="New orders, low stock and payout updates."
      />
      <Panel>
        <EmptyState
          icon={<BellRing size={28} />}
          title="Nothing to catch up on"
          hint="Alerts about your shop will collect here once notification delivery is wired up."
        />
      </Panel>
    </PageShell>
  );
}
