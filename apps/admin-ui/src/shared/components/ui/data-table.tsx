"use client";

import { flexRender, type Table } from "@tanstack/react-table";
import React from "react";
import { Bar } from "./index";

/**
 * The ledger table — the one piece of this console the whole design hangs on, and
 * the reason every page now looks like the same product. Each page used to carry
 * its own copy of this markup, so the row height, the header casing and the hover
 * colour had all drifted apart.
 *
 * Set `meta: { align: "right" }` on a column to right-align it. Money and counts
 * want that: right-aligned tabular figures put the ones column under the ones
 * column, which is what makes a column of totals scannable.
 */
export function DataTable<T>({
  table,
  isLoading,
  isEmpty,
  empty,
  columnCount,
  footer,
}: {
  table: Table<T>;
  isLoading?: boolean;
  isEmpty?: boolean;
  empty?: React.ReactNode;
  columnCount: number;
  /** A totals row. A ledger of money that never adds up is half a ledger. */
  footer?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden border border-ink-border bg-ink-soft">
      {isLoading ? (
        <TableSkeleton columns={columnCount} />
      ) : isEmpty ? (
        empty
      ) : (
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((group) => (
                /*
                  A hard cream rule under the head, not a tinted accent one.
                  In this theme the rule is always the highest-contrast line
                  available, because separating the head from the body is
                  structural — the same device the storefront uses between
                  page sections.
                */
                <tr key={group.id} className="border-b-2 border-b-on-ink bg-ink-raised">
                  {group.headers.map((header) => {
                    const align =
                      (header.column.columnDef.meta as any)?.align === "right"
                        ? "text-right"
                        : "text-left";
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        className={`whitespace-nowrap px-4 py-3 font-mono text-[0.78em] font-semibold uppercase tracking-[0.06em] text-on-ink ${align}`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  /*
                    Hover is a background change only. The old rows used
                    `hover:scale-[1.01]`, which nudged every neighbouring row and
                    blurred the text under the transform.
                  */
                  className="border-b border-ink-border transition-colors last:border-0 hover:bg-ink-raised"
                >
                  {row.getVisibleCells().map((cell) => {
                    const align =
                      (cell.column.columnDef.meta as any)?.align === "right"
                        ? "text-right"
                        : "text-left";
                    return (
                      <td
                        key={cell.id}
                        className={`whitespace-nowrap px-4 py-3 text-on-ink ${align}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {footer ? (
              <tfoot className="border-t-2 border-t-on-ink bg-ink-raised">
                {footer}
              </tfoot>
            ) : null}
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * A skeleton in the table's own shape, rather than the centred "Loading…" line
 * the pages used before — it holds the layout still while data arrives instead of
 * making the whole page jump when the rows land.
 */
export function TableSkeleton({
  columns,
  rows = 6,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="px-4 py-3" role="status" aria-label="Loading records">
      <div className="flex gap-4 border-b-2 border-b-on-ink pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Bar key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-ink-border py-4 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Bar key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
