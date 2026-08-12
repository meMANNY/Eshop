import React from 'react'
import { RotateCcw, Trash } from 'lucide-react'
import { Button, Modal } from '@/shared/components/ui'

/**
 * Built on the shared Modal, which is a headlessui Dialog — so this now traps
 * focus, closes on Escape and restores focus to whatever opened it. The
 * hand-rolled overlay it replaces did none of those: you could tab out of the
 * dialog into the page behind it while a destructive confirm was open.
 */
const DeleteConfirmationModal = ({
  product,
  onClose,
  onConfirm,
  onRestore,
  isLoading = false,
}: any) => {
  // A soft-deleted product is restored rather than re-deleted.
  const isDeleted = product?.isDeleted;

  return (
    <Modal
      open
      onClose={onClose}
      tone={isDeleted ? 'pos' : 'neg'}
      title={isDeleted ? 'Restore this product?' : 'Delete this product?'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {isDeleted ? (
            <Button variant="primary" onClick={onRestore} disabled={isLoading}>
              <RotateCcw size={16} aria-hidden="true" />
              {isLoading ? 'Restoring…' : 'Restore product'}
            </Button>
          ) : (
            <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
              <Trash size={16} aria-hidden="true" />
              {isLoading ? 'Deleting…' : 'Delete product'}
            </Button>
          )}
        </>
      }
    >
      <span className="font-medium text-[var(--text)]">{product?.title}</span>
      <p className="mt-2">
        {isDeleted
          ? 'It is currently scheduled for deletion. Restoring puts it back on the storefront immediately.'
          : 'It comes off the storefront now and is deleted for good in 24 hours. You can restore it any time before then.'}
      </p>
    </Modal>
  )
}

export default DeleteConfirmationModal
