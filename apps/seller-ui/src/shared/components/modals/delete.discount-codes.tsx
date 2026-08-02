import React from 'react'
import {X, Trash, AlertTriangle} from 'lucide-react';

const DeleteDiscountCodeModal = (
    {
        discount,
        onClose,
        onConfirm
    }:{
        discount: any,
        onClose: ()=>void,
        onConfirm?: any
    }
) => {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
                <div className='w-[450px] max-w-full rounded-xl border border-slate-800 bg-[#141922] p-6 shadow-2xl'>
                    <div className='flex items-center justify-between border-b border-slate-800 pb-3'>
                        <h3 className='text-xl font-semibold text-white'>Delete Discount Code</h3>
                        <button onClick={onClose} aria-label='Close' className='text-slate-400 transition-colors hover:text-white'>
                            <X size={22}/>
                        </button>
                    </div>

                    {/* Warning message */}
                    <div className='mt-4 flex gap-3'>
                        <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20'>
                            <AlertTriangle size={18}/>
                        </span>
                        <p className='text-sm leading-relaxed text-slate-300'>
                            Are you sure you want to delete the discount code{" "}
                            <span className='font-semibold text-white'>
                                {discount?.public_name}
                            </span>
                            ? This action cannot be undone.
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className='mt-6 flex items-center justify-end gap-3'>
                        <button
                            onClick={onClose}
                            className='rounded-lg border border-slate-700 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-white/[0.08]'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={()=>onConfirm(discount)}
                            className='flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-red-600'
                        >
                            <Trash size={18}/> Delete
                        </button>
                    </div>
                </div>
            </div>
  )
}

export default DeleteDiscountCodeModal