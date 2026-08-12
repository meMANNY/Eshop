"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Field, Modal } from "@/shared/components/ui";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteShopModal({
  open,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const [confirmText, setConfirmText] = useState("");
  const armed = confirmText === "DELETE";

  return (
    <Modal
      open={open}
      onClose={onClose}
      tone="neg"
      title="Delete your shop?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {/* The typed confirmation is the guard; the button stays inert until it matches. */}
          <Button variant="danger" disabled={loading || !armed} onClick={onConfirm}>
            {loading ? "Deleting…" : "Delete shop"}
          </Button>
        </>
      }
    >
      <p>
        Your shop and its products come off the storefront now. You have{" "}
        <strong className="text-[var(--text)]">28 days</strong> to restore it,
        after which it is removed for good.
      </p>

      {/*
        The 28-day window was stated twice — once here and again in a second
        panel below it. The genuinely surprising consequence is the email lockout,
        so that is what gets the callout.
      */}
      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-warn/30 bg-warn/10 p-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-warn" size={16} aria-hidden="true" />
        <p className="text-sm text-[var(--text)]">
          After permanent deletion you cannot register a new account with this
          email address.
        </p>
      </div>

      <div className="mt-4">
        <Field
          label="Type DELETE to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          className="font-mono"
        />
      </div>
    </Modal>
  );
}
