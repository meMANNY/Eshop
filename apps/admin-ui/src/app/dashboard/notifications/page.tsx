"use client";

import { BellRing } from "lucide-react";
import {
  Crumbs,
  EmptyState,
  PageShell,
  PageTitle,
  Panel,
} from "@/shared/components/ui";

export default function NotificationsPage() {
  return (
    <PageShell>
      <Crumbs trail={["Notifications"]} />
      <PageTitle
        title="Notifications"
        meta="Platform-wide alerts raised by the services."
      />
      <Panel>
        {/*
          A placeholder that says what the page will hold. The previous version
          rendered the bare string "notifications page", which reads as a broken
          page rather than an unfinished one.
        */}
        <EmptyState
          icon={<BellRing size={28} />}
          title="Nothing to review"
          hint="Alerts from the order, product and auth services will collect here once notification delivery is wired up."
        />
      </Panel>
    </PageShell>
  );
}
