"use client";

import { CalendarPlus, Plus } from "lucide-react";
import Link from "next/link";
import {
  Crumbs,
  EmptyState,
  PageShell,
  PageTitle,
  Panel,
} from "@/shared/components/ui";

/*
  The sidebar has linked here since it was written, but no page existed at this
  route — clicking "Create event" produced a 404 inside the dashboard.
*/
export default function CreateEventPage() {
  return (
    <PageShell>
      <Crumbs trail={["Create event"]} />
      <PageTitle
        title="Create event"
        meta="Put one of your products on a timed promotion."
      />
      <Panel>
        <EmptyState
          icon={<CalendarPlus size={28} />}
          title="Event creation isn't built yet"
          hint="For now, give a product a start and end date when you create it and it counts as an event."
          action={
            <Link
              href="/dashboard/create-product"
              className="inline-flex items-center gap-2 rounded-lg bg-coral px-3.5 py-2 text-sm font-medium text-[#1a0d0b] transition-colors hover:bg-coral-dim"
            >
              <Plus size={16} aria-hidden="true" />
              Create a product
            </Link>
          }
        />
      </Panel>
    </PageShell>
  );
}
