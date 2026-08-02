import React from 'react'
import { X, Trash, RotateCcw, AlertTriangle } from 'lucide-react'

const DeleteConfirmationModal = ({
    product,
    onClose,
    onConfirm,
    onRestore,
    isLoading = false,
}: any) => {
    // A soft-deleted product can be restored instead of re-deleted.
    const isDeleted = product?.isDeleted;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
            <div className='w-[450px] max-w-full rounded-xl border border-slate-800 bg-[#141922] p-6 shadow-2xl'>
                <div className='flex items-center justify-between border-b border-slate-800 pb-3'>
                    <h3 className='text-xl font-semibold text-white'>
                        {isDeleted ? 'Restore Product' : 'Delete Product'}
                    </h3>
                    <button onClick={onClose} aria-label='Close' className='text-slate-400 transition-colors hover:text-white'>
                        <X size={22} />
                    </button>
                </div>

                {/* Message */}
                <div className='mt-4 flex gap-3'>
                    <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${
                            isDeleted
                                ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 ring-red-500/20'
                        }`}
                    >
                        {isDeleted ? <RotateCcw size={18} /> : <AlertTriangle size={18} />}
                    </span>
                    {isDeleted ? (
                        <p className='text-sm leading-relaxed text-slate-300'>
                            <span className='font-semibold text-white'>{product?.title}</span> is
                            scheduled for deletion. Do you want to restore it?
                        </p>
                    ) : (
                        <p className='text-sm leading-relaxed text-slate-300'>
                            Are you sure you want to delete{' '}
                            <span className='font-semibold text-white'>{product?.title}</span>? It
                            will be scheduled for permanent deletion in 24 hours, and you can
                            restore it before then.
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className='mt-6 flex items-center justify-end gap-3'>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className='rounded-lg border border-slate-700 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        Cancel
                    </button>
                    {isDeleted ? (
                        <button
                            onClick={onRestore}
                            disabled={isLoading}
                            className='flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            <RotateCcw size={18} /> {isLoading ? 'Restoring...' : 'Restore'}
                        </button>
                    ) : (
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className='flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            <Trash size={18} /> {isLoading ? 'Deleting...' : 'Delete'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DeleteConfirmationModal
