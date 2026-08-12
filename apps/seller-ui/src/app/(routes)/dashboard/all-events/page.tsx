"use client";

import { BellPlus } from "lucide-react";
import {
  Crumbs,
  EmptyState,
  PageShell,
  PageTitle,
  Panel,
} from "@/shared/components/ui";

/*
  The sidebar has linked here since it was written, but no page existed at this
  route — clicking "All events" produced a 404 inside the dashboard.
*/
export default function AllEventsPage() {
  return (
    <PageShell>
      <Crumbs trail={["All events"]} />
      <PageTitle
        title="All events"
        meta="Products you've put on a timed promotion."
      />
      <Panel>
        <EmptyState
          icon={<BellPlus size={28} />}
          title="No events yet"
          hint="An event is a product with a start and end date. Give one a promo window and it will appear here."
        />
      </Panel>
    </PageShell>
  );
}
