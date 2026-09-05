"use client";

import { Button, Figure, Modal } from "@/shared/components/ui";

type Props = {
  open: boolean;
  loading?: boolean;
  purgeAt?: Date | string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function RestoreShopModal({
  open,
  loading,
  purgeAt,
  onClose,
  onConfirm,
}: Props) {
  const deadline = purgeAt ? new Date(purgeAt).toLocaleString() : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      tone="pos"
      title="Restore your shop?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" disabled={loading} onClick={onConfirm}>
            {loading ? "Restoring…" : "Restore shop"}
          </Button>
        </>
      }
    >
      <p>
        Your shop and its products go back on the storefront straight away. You
        can delete it again later.
      </p>

      {deadline ? (
        <p className="mt-4 border border-ink-border bg-ink-raised p-3 text-sm">
          <span className="text-on-ink-muted">Restore before</span>{" "}
          <Figure className="text-on-ink">{deadline}</Figure>
        </p>
      ) : null}
    </Modal>
  );
}
