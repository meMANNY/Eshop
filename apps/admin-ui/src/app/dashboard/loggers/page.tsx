"use client";

import { Download, Radio, ScrollText, ArrowDownToLine } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Crumbs,
  EmptyState,
  Panel,
  PageShell,
  PageTitle,
  SearchField,
} from "../../../shared/components/ui";

type LogType = "success" | "error" | "warning" | "info" | "debug";

type LogItem = {
  type: LogType;
  message: string;
  timestamp: string;
  source?: string;
};

type Connection = "connecting" | "live" | "retrying" | "offline";

/*
  Severity is the only thing that matters at a glance here, so it is encoded
  twice: a colour on the rail and a word in the line. That is the same rule the
  StatusPill follows — the amber/green pair sits inside the marginal band for
  red-green colour blindness, so the word is what actually carries the meaning.

  Coral is deliberately absent. The palette reserves it for chrome (active nav,
  primary actions, focus) and never for data; a coral log line would read as a
  UI accent rather than a severity.
*/
const SEVERITY: Record<
  LogType,
  { tag: string; rail: string; text: string; dot: string }
> = {
  error: { tag: "ERROR", rail: "bg-neg", text: "text-neg", dot: "bg-neg" },
  warning: { tag: "WARN", rail: "bg-warn", text: "text-warn", dot: "bg-warn" },
  success: { tag: "OK", rail: "bg-pos", text: "text-pos", dot: "bg-pos" },
  info: { tag: "INFO", rail: "bg-data", text: "text-data", dot: "bg-data" },
  // `--faint` measures 3.11:1 on the panel — fine for the rail, which is a
  // graphic, but below the 4.5:1 a small tag needs. The tag steps up to muted.
  debug: {
    tag: "DEBUG",
    rail: "bg-on-ink-faint",
    text: "text-on-ink-muted",
    dot: "bg-on-ink-faint",
  },
};

const ORDER: LogType[] = ["error", "warning", "success", "info", "debug"];

/*
  A console left open overnight would otherwise grow an unbounded array and take
  the tab down with it. The stream is for watching what is happening now;
  anything older than this belongs in a downloaded file.
*/
const MAX_LOGS = 2000;

const clockTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "--:--:--"
    : d.toLocaleTimeString([], { hour12: false });
};

/* ------------------------------------------------------------------------- */

/**
 * A quiet stream and a dead socket look identical without this, which is the
 * worst failure mode a log viewer has: you assume nothing is wrong when in fact
 * nothing is arriving.
 */
function ConnectionBadge({ state }: { state: Connection }) {
  const copy: Record<Connection, { label: string; dot: string; text: string }> =
    {
      connecting: {
        label: "Connecting",
        dot: "bg-on-ink-muted",
        text: "text-on-ink-muted",
      },
      live: { label: "Live", dot: "bg-pos", text: "text-pos" },
      retrying: { label: "Reconnecting", dot: "bg-warn", text: "text-warn" },
      offline: { label: "Offline", dot: "bg-neg", text: "text-neg" },
    };
  const { label, dot, text } = copy[state];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-ink-border bg-ink-raised px-3 py-1.5 text-xs font-medium ${text}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {state === "live" ? (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-60 motion-reduce:hidden`}
          />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      {label}
    </span>
  );
}

/**
 * The filter row doubles as a tally. Six identical chips would say nothing;
 * a live count per severity answers "is anything on fire?" before you read a
 * single line, and clicking it is how you narrow the stream.
 */
function TallyFilter({
  counts,
  total,
  active,
  onChange,
}: {
  counts: Record<LogType, number>;
  total: number;
  active: LogType | "all";
  onChange: (next: LogType | "all") => void;
}) {
  const items: Array<{ key: LogType | "all"; label: string; n: number }> = [
    { key: "all", label: "All", n: total },
    ...ORDER.map((t) => ({ key: t, label: SEVERITY[t].tag, n: counts[t] })),
  ];

  return (
    <div
      role="group"
      aria-label="Filter by severity"
      className="flex flex-wrap gap-2"
    >
      {items.map(({ key, label, n }) => {
        const on = active === key;
        const tone =
          key === "all" ? "text-on-ink" : SEVERITY[key as LogType].text;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(key)}
            className={`group flex items-baseline gap-2  border px-3 py-2 transition-colors ${
              on
                ? "border-terra/60 bg-ink-raised"
                : "border-ink-border bg-ink-soft hover:border-[#2f3949]"
            }`}
          >
            <span
              className={`text-label font-semibold uppercase ${
                on ? tone : "text-on-ink-muted"
              }`}
            >
              {label}
            </span>
            <span
              className={`figure text-sm leading-none ${
                n > 0 ? tone : "text-on-ink-faint"
              }`}
            >
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------------- */

export default function Page() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<LogType | "all">("all");
  const [search, setSearch] = useState("");
  const [connection, setConnection] = useState<Connection>("connecting");
  const [pinned, setPinned] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  /* ----------------------------------------------------------- transport -- */

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URI;
    if (!url) {
      console.error("NEXT_PUBLIC_SOCKET_URI is not set — no log stream.");
      setConnection("offline");
      return;
    }

    let socket: WebSocket | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      setConnection(attemptRef.current === 0 ? "connecting" : "retrying");
      socket = new WebSocket(url);

      socket.onopen = () => {
        attemptRef.current = 0;
        setConnection("live");
      };

      socket.onmessage = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data) as LogItem;
          if (!parsed?.message) return;
          setLogs((prev) => {
            const next = [...prev, parsed];
            // Trim from the front so the newest lines always survive.
            return next.length > MAX_LOGS
              ? next.slice(next.length - MAX_LOGS)
              : next;
          });
        } catch (err) {
          console.error("Invalid log format", err);
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        // Backing off matters: the logger service restarts with the rest of the
        // stack, and a tight retry loop would hammer it while it is booting.
        const wait = Math.min(1000 * 2 ** attemptRef.current, 15000);
        attemptRef.current += 1;
        setConnection(attemptRef.current > 4 ? "offline" : "retrying");
        retryRef.current = setTimeout(connect, wait);
      };

      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      disposed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (!socket) return;
      /*
        StrictMode mounts, unmounts and remounts every effect in development, so
        cleanup routinely runs while the socket is still CONNECTING — calling
        close() in that state logs "closed before the connection is established".
      */
      if (socket.readyState === WebSocket.OPEN) socket.close();
      else if (socket.readyState === WebSocket.CONNECTING)
        socket.addEventListener("open", () => socket?.close(), { once: true });
    };
  }, []);

  /* ------------------------------------------------------------ derived -- */

  const counts = useMemo(() => {
    const tally = { error: 0, warning: 0, success: 0, info: 0, debug: 0 };
    for (const log of logs) if (log.type in tally) tally[log.type] += 1;
    return tally as Record<LogType, number>;
  }, [logs]);

  // Filtering is derived, not stored. Keeping it in state meant every arriving
  // line cost two renders and could show a list one message behind.
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (activeFilter !== "all" && log.type !== activeFilter) return false;
      if (!needle) return true;
      return (
        log.message.toLowerCase().includes(needle) ||
        (log.source?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [logs, activeFilter, search]);

  /* ------------------------------------------------------------ scroll --- */

  // Only follow the tail when the reader is already at it. Yanking someone back
  // down while they are reading an error is the classic log-viewer sin.
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setPinned(atBottom);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible, pinned]);

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setPinned(true);
  };

  /* --------------------------------------------------------- shortcuts --- */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Without this, typing "1" into the search box silently switched the
      // filter to errors and the search appeared to return nothing.
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const map: Record<string, LogType | "all"> = {
        "0": "all",
        "1": "error",
        "2": "warning",
        "3": "success",
        "4": "info",
        "5": "debug",
      };
      if (map[e.key]) setActiveFilter(map[e.key]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ---------------------------------------------------------- download --- */

  const downloadLogs = () => {
    const content = visible
      .map(
        (log) =>
          `[${clockTime(log.timestamp)}] ${log.source ?? "unknown"} [${log.type.toUpperCase()}] ${log.message}`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ------------------------------------------------------------ render --- */

  const filtering = activeFilter !== "all" || search.trim().length > 0;

  return (
    <PageShell
      sys={[
        { key: "~/logs", value: `ws: ${connection}` },
        {
          value: `${visible.length.toLocaleString()} lines`,
          hideOnMobile: true,
        },
        {
          value:
            logs.length >= MAX_LOGS ? `capped at ${MAX_LOGS}` : "streaming",
          trailing: true,
        },
      ]}
    >
      <Crumbs trail={["Logs"]} />

      <PageTitle
        kicker="/loggers · every service"
        title="Service logs"
        meta={
          logs.length
            ? `${visible.length.toLocaleString()} of ${logs.length.toLocaleString()} lines${
                logs.length >= MAX_LOGS ? ` · showing the latest ${MAX_LOGS}` : ""
              }`
            : "Streaming from every service as events happen"
        }
        actions={
          <>
            <ConnectionBadge state={connection} />
            <Button onClick={downloadLogs} disabled={visible.length === 0}>
              <Download size={15} aria-hidden="true" />
              Download
            </Button>
          </>
        }
      />

      <div className="mb-5">
        <TallyFilter
          counts={counts}
          total={logs.length}
          active={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      <SearchField
        value={search}
        onChange={setSearch}
        label="Search log messages and sources"
        placeholder="Search messages or a service name…"
      />

      <Panel className="crosshairs relative overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          role="log"
          aria-live="polite"
          aria-label="Service log stream"
          className="scroll-slim h-[min(62vh,640px)] overflow-y-auto font-mono text-[12px] leading-[1.6]"
        >
          {visible.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="h-8 w-8" aria-hidden="true" />}
              title={filtering ? "No lines match" : "Waiting for the first line"}
              hint={
                filtering
                  ? "Clear the search or pick a different severity."
                  : connection === "live"
                    ? "The stream is connected. Anything a service reports will appear here."
                    : "Nothing will arrive until the logger service is reachable."
              }
              action={
                filtering ? (
                  <Button
                    variant="quiet"
                    onClick={() => {
                      setActiveFilter("all");
                      setSearch("");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <ol className="py-1">
              {visible.map((log, i) => {
                const sev = SEVERITY[log.type] ?? SEVERITY.debug;
                return (
                  <li
                    key={`${log.timestamp}-${i}`}
                    className="group flex gap-3 px-1 transition-colors hover:bg-ink-raised"
                  >
                    {/*
                      The rail is the signature of this page. Read as a column it
                      turns the stream into a health strip: a run of red is
                      visible from across the room, before a single word is read.
                    */}
                    <span
                      className={`w-[3px] shrink-0 rounded-full ${sev.rail}`}
                      aria-hidden="true"
                    />

                    <time
                      dateTime={log.timestamp}
                      className="figure shrink-0 py-1 text-xs leading-5 text-on-ink-faint"
                    >
                      {clockTime(log.timestamp)}
                    </time>

                    <span
                      className={`shrink-0 py-1 font-mono text-[11px] font-semibold uppercase leading-5 tracking-wider ${sev.text}`}
                    >
                      {sev.tag}
                    </span>

                    <span className="shrink-0 py-1 font-mono text-xs leading-5 text-on-ink-muted">
                      {log.source ?? "unknown"}
                    </span>

                    <span className="min-w-0 flex-1 whitespace-pre-wrap break-words py-1 font-mono text-xs leading-5 text-on-ink">
                      {log.message}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Appears only once following has been broken, and says how to resume. */}
        {!pinned && visible.length > 0 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-ink-soft to-transparent pb-4 pt-10">
            <button
              type="button"
              onClick={jumpToLatest}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-ink-border bg-ink-raised px-3.5 py-2 text-xs font-medium text-on-ink shadow-pop transition-colors hover:border-terra/60"
            >
              <ArrowDownToLine size={14} aria-hidden="true" />
              Jump to latest
            </button>
          </div>
        ) : null}
        <span className="xh-b" aria-hidden="true" />
      </Panel>

      <p className="mt-3 flex items-center gap-2 text-xs text-on-ink-faint">
        <Radio size={13} aria-hidden="true" />
        Press 0–5 to filter by severity. Newest lines appear at the bottom.
      </p>
    </PageShell>
  );
}
