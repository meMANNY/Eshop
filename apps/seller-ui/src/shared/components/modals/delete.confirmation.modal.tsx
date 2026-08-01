import React from 'react'
import { X, Trash, RotateCcw } from 'lucide-react'

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
        <div className='fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg'>
                <div className='flex justify-between items-center border-b border-gray-700 pb-3'>
                    <h3 className='text-xl text-white'>
                        {isDeleted ? 'Restore Product' : 'Delete Product'}
                    </h3>
                    <button onClick={onClose} className='text-gray-400 hover:text-white'>
                        <X size={22} />
                    </button>
                </div>

                {/* Message */}
                {isDeleted ? (
                    <p className='text-gray-300 mt-4'>
                        <span className='font-semibold text-white'>{product?.title}</span> is
                        scheduled for deletion. Do you want to restore it?
                    </p>
                ) : (
                    <p className='text-gray-300 mt-4'>
                        Are you sure you want to delete{' '}
                        <span className='font-semibold text-white'>{product?.title}</span>? It
                        will be scheduled for permanent deletion in 24 hours, and you can
                        restore it before then.
                    </p>
                )}

                {/* Actions */}
                <div className='flex justify-end items-center gap-3 mt-6'>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className='px-4 py-2 rounded-md text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Cancel
                    </button>
                    {isDeleted ? (
                        <button
                            onClick={onRestore}
                            disabled={isLoading}
                            className='flex items-center gap-1.5 px-4 py-2 rounded-md text-sm text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            <RotateCcw size={18} /> {isLoading ? 'Restoring...' : 'Restore'}
                        </button>
                    ) : (
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className='flex items-center gap-1.5 px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed'
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
