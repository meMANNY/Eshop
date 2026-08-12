"use client";

import { FileClock } from "lucide-react";
import {
  Crumbs,
  EmptyState,
  PageShell,
  PageTitle,
  Panel,
} from "@/shared/components/ui";

/*
  The sidebar has linked to /dashboard/loggers since it was written, but no page
  existed at that route — clicking Loggers produced a 404 inside the console.
*/
export default function LoggersPage() {
  return (
    <PageShell>
      <Crumbs trail={["Loggers"]} />
      <PageTitle
        title="Loggers"
        meta="Service-level events streamed from the backend."
      />
      <Panel>
        <EmptyState
          icon={<FileClock size={28} />}
          title="No log stream connected"
          hint="Once the services publish their logs, successes, warnings and errors will appear here in order."
        />
      </Panel>
    </PageShell>
  );
}
