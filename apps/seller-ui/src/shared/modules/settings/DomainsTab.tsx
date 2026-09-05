"use client";

import { useState } from "react";
import { Check, Copy, Globe } from "lucide-react";
import {
  Button,
  Field,
  Figure,
  Panel,
  PanelHead,
  StatusPill,
} from "@/shared/components/ui";

const CNAME_TARGET = "seller.shopname.com";

export default function DomainsTab() {
  const [domain, setDomain] = useState("");
  const [copied, setCopied] = useState(false);

  const copyCname = async () => {
    try {
      await navigator.clipboard.writeText(CNAME_TARGET);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — the value is selectable in the page regardless */
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <Panel>
        <PanelHead
          title="Custom domain"
          note="Serve your shop from your own address instead of a Eshop URL."
          actions={<StatusPill tone="warn">Not available yet</StatusPill>}
        />
        <div className="space-y-4 p-5">
          <Field
            label="Domain name"
            placeholder="yourdomain.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled
            hint="Enabled once the storefront is deployed behind a domain router."
          />
          <Button variant="primary" disabled>
            Save domain
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelHead title="Connected domain" />
        <div className="flex items-center gap-2.5 px-5 py-5 text-sm text-on-ink-muted">
          <Globe size={16} className="text-on-ink-faint" aria-hidden="true" />
          No domain connected yet.
        </div>
      </Panel>

      <Panel>
        <PanelHead
          title="DNS records"
          note="Add these at your registrar before connecting a domain."
        />
        <div className="space-y-3 p-5">
          <div className="border border-ink-border bg-ink-raised p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-on-ink">CNAME</p>
                <p className="mt-0.5 text-xs text-on-ink-muted">
                  Point the <Figure>www</Figure> host at
                </p>
              </div>
              <button
                type="button"
                onClick={copyCname}
                className="inline-flex items-center gap-1.5 border border-ink-border px-2 py-1 text-xs text-on-ink transition-colors hover:border-terra/50"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-pos" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} aria-hidden="true" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <Figure className="mt-2 block text-sm text-terra">
              {CNAME_TARGET}
            </Figure>
          </div>

          {/*
            The A record used to sit here beside a working Copy button whose value
            was the literal string "YOUR_SERVER_IP" — copying it handed the seller
            a placeholder to paste into their registrar. It stays listed, without
            a copy control, until there is a real address to give.
          */}
          <div className="border border-dashed border-ink-border p-4">
            <p className="text-sm font-medium text-on-ink">A record</p>
            <p className="mt-0.5 text-xs text-on-ink-muted">
              Point the root <Figure>@</Figure> host at the storefront IP. The
              address is issued when your shop is deployed.
            </p>
          </div>
        </div>
        <p className="border-t border-ink-border px-5 py-3 text-xs text-on-ink-faint">
          DNS changes can take up to 24 hours to propagate.
        </p>
      </Panel>
    </div>
  );
}
