import React from 'react'
import { Trash } from 'lucide-react'
import { Button, Modal } from '@/shared/components/ui'

const DeleteDiscountCodeModal = ({
  discount,
  onClose,
  onConfirm,
}: {
  discount: any
  onClose: () => void
  onConfirm?: any
}) => {
  return (
    <Modal
      open
      onClose={onClose}
      tone="neg"
      title="Delete this discount code?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onConfirm(discount)}>
            <Trash size={16} aria-hidden="true" />
            Delete code
          </Button>
        </>
      }
    >
      <span className="font-medium text-on-ink">
        {discount?.public_name}
      </span>
      <p className="mt-2">
        {/* Unlike products, this one has no restore path — so say so plainly. */}
        This can&apos;t be undone. Buyers using the code at checkout will stop
        getting the discount straight away.
      </p>
    </Modal>
  )
}

export default DeleteDiscountCodeModal
