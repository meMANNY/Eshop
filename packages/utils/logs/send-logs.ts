import { getProducer } from "../kafka/producer";

export type LogType = "info" | "error" | "warning" | "success" | "debug";

/*
  Every service sets this once at boot (see `setLogSource` calls in each
  main.ts) so individual call sites don't have to repeat their own name and
  can't drift out of sync with it.
*/
let defaultSource = "unknown-service";

export const setLogSource = (name: string) => {
  defaultSource = name;
};

export const getLogSource = () => defaultSource;

/**
 * Publishes one log line to the `logs` topic, which logger-service consumes and
 * fans out to connected dashboards.
 *
 * Two properties matter more than the payload, because this is called from
 * inside request handlers:
 *
 * 1. It reuses a cached producer. The previous version called `connect()` and
 *    `disconnect()` around every single send, which is a full broker handshake
 *    per log line — hundreds of milliseconds added to any request that logged.
 * 2. It never throws and never rejects. Logging is diagnostics, not business
 *    logic; an unreachable broker must not turn a successful request into a 500.
 *    That also makes it safe to call without `await`.
 */
export async function sendLog({
  type = "info",
  message,
  source,
}: {
  type?: LogType;
  message: string;
  source?: string;
}): Promise<void> {
  const logPayload = {
    type,
    message,
    timestamp: new Date().toISOString(),
    source: source ?? defaultSource,
  };

  try {
    const producer = await getProducer();
    await producer.send({
      topic: "logs",
      messages: [{ value: JSON.stringify(logPayload) }],
    });
  } catch (err) {
    // Deliberately console-only: routing this back through sendLog would
    // recurse whenever the broker is the thing that's down.
    console.error("sendLog failed:", (err as Error)?.message, logPayload);
  }
}

/**
 * Fire-and-forget form for request paths. `sendLog` already swallows its own
 * errors, but calling it without `await` leaves a floating promise; this makes
 * the intent explicit at the call site and keeps the handler off the broker's
 * latency.
 */
export function logAsync(entry: {
  type?: LogType;
  message: string;
  source?: string;
}): void {
  void sendLog(entry);
}
