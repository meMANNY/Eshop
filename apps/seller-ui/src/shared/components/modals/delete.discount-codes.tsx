import React from 'react'
import {X, Trash} from 'lucide-react';

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
    <div className='fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50'>
                <div className='bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg'>
                    <div className='flex justify-between items-center border-b border-gray-700 pb-3 '>
                        <h3 className='text-xl text-white'>Delete Discount Code</h3>
                        <button onClick={onClose} className='text-gray-400 hover:text-white'>
                            <X size={22}/>
                        </button>
                    </div>

                    {/* Warning message */}
                    <p className='text-gray-300 mt-4'>
                        Are you sure you want to delete the discount code{" "}
                        <span className='font-semibold text-white'>
                            {discount?.public_name}
                        </span>
                        ? This action cannot be undone.
                    </p>

                    {/* Action buttons */}
                    <div className='flex justify-end items-center gap-3 mt-6'>
                        <button
                            onClick={onClose}
                            className='px-4 py-2 rounded-md text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={()=>onConfirm(discount)}
                            className='flex items-center gap-1.5 px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700 transition'
                        >
                            <Trash size={18}/> Delete
                        </button>
                    </div>
                </div>
            </div>
  )
}

export default DeleteDiscountCodeModal