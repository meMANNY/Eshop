"use client";
import { ChevronRight, Plus, Trash, X } from 'lucide-react'
import React, { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axiosInstance';
import toast from "react-hot-toast";
import { Controller, useForm } from 'react-hook-form';
import Input from '../../../../../../../packages/components/input';
import { AxiosError } from 'axios';
import DeleteDiscountCodeModal from '../../../../shared/components/modals/delete.discount-codes'

const Page = () => {

    const [showModal, setShowModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
    const queryClient = useQueryClient();

    const handleDeleteClick = async(discount: any) =>{
        setSelectedDiscount(discount);
        setShowDeleteModal(true);


    }


    const onSubmit = (data: any) => {
        if(discountCodes.length >= 8){
            toast.error("You can only have 8 discount codes at a time");
            return;
        }
        createDiscountCodeMutation.mutate(data);
    }
    
    const {data: discountCodes = [],isLoading} = useQuery({
        queryKey: ["shop-discounts"],
        queryFn: async () => {
            const res = await axiosInstance.get("/product/api/get-discount-codes");
            return res?.data?.discount_codes || [];
        }
    });

    const {handleSubmit, register, reset, control,formState: {errors}} = useForm({
        defaultValues:{
            public_name: "",
            discountType: "percentage",
            discountValue: "",
            discountCode: ""
        }
    })
    const createDiscountCodeMutation = useMutation({
        mutationFn: async(data) => {
            await axiosInstance.post("/product/api/create-discount-code", data);
        },
        onSuccess: () => {
            toast.success("Discount code created successfully");
            
            queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
            reset();
            setShowModal(false);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    })

    const deleteDiscountCodeMutation = useMutation({
        mutationFn: async(discountId) => {
            await axiosInstance.delete(`/product/api/delete-discount-code/${discountId}`);
        },
        onSuccess: () => {
            toast.success("Discount code deleted successfully");
            
            queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
            setShowDeleteModal(false);
            setSelectedDiscount(null);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    })


  return (
    <div className='w-full min-h-screen p-8'>
        <div className='flex justify-between items-center mb-1'>
            <h2 className='text-2xl text-white font-semibold'>
                Discount Codes
            </h2>
            <button onClick={()=>setShowModal(true)} className='flex items-center gap-1.5 px-4 py-2 text-base rounded-md shadow-md bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white '>
                <Plus size={18}/> Create Discount
            </button>
        </div>
        <div className="flex items-center text-white">
                        <Link href="/dashboard" className="text-[#80Deea] cursor-pointer">
                            DashBoard
                        </Link>
                        <ChevronRight size={20} className="opacity-[.8]"/>
                        <span>Discount Codes</span>
        </div>
        
        <div className='mt-8 bg-gray-900 p-6 rounded-lg shadow-md'>
            <h3 className='text-xl font-semibold mb-4 text-white'>
                Your Discount Codes
            </h3>
            {
                isLoading ? (
                    <p className='text-gray-400 text-center'>
                        Loading discount codes...
                    </p>

                ):(
                    <table className='w-full text-white'>
                        <thead >
                            <tr className='border-b border-gray-800'>
                                <th className='p-3 text-left'>Title</th>
                                <th className='p-3 text-left'>Type</th>
                                <th className='p-3 text-left'>Value</th>
                                <th className='p-3 text-left'>Code</th>
                                <th className='p-3 text-left'>Action</th>
                            </tr>

                        </thead>
                        <tbody>
                            {discountCodes?.map((discount: any)=>(
                                <tr key={discount?.id}
                                className='border-b border-gray-800 hover:bg-gray-800 transition'>
                                    <td className='p-3'>{discount?.public_name}</td>
                                    <td className='p-3 capitalize'> 
                                        {discount.discountType === "percentage" ? "Percentage(%)" : "Flat (USD)"}
                                    </td>
                                    <td className='p-3'>
                                        {discount.discountType === "percentage" ? 
                                            `${discount.discountValue}%` :
                                            `$${discount.discountValue}`}
                                    </td>
                                    <td className="p-3 font-mono">
                                        {discount.discountCode}
                                    </td>
                                    <td className='p-3'>
                                        <button
                                        onClick={()=>handleDeleteClick(discount)}
                                        className='text-red-400 hover:text-red-300 transition'>
                                            <Trash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
            }
            {!isLoading && discountCodes?.length === 0 && (
                <p className='text-gray-400 w-full pt-4 block text-center'>
                    No discount codes found!
                </p>
            )}
        </div>

        {/* Show Discount Modal */}
        {showModal && (
            <div className='fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50'>
                <div className='bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg'>
                    <div className='flex justify-between items-center border-b border-gray-700 pb-3 '>
                        <h3 className='text-xl text-white'>Create Discount Code</h3>
                        <button onClick={()=>setShowModal(false)}>
                            <X size={22}/>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className='mt-4'>
                        <Input 
                        label='Discount Title'
                        {...register("public_name",{required: "Title is required"})}
                        /> 
                        {errors.public_name && <p className='text-red-400 text-xs mt-1'>{errors.public_name.message}</p>}
                        {/*Discount Type*/}
                        <div className='mt-4'>
                            <label className='block mb-1 text-sm text-gray-300'>Discount Type</label>
                            <Controller
                                control={control}
                                name='discountType'
                                rules={{ required: "Discount type is required" }}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className='w-full rounded-md p-2 border border-gray-700 outline-none bg-transparent text-white transition-colors focus:border-[#ff6f61]'
                                    >
                                        <option value='percentage' className='bg-gray-800'>Percentage (%)</option>
                                        <option value='flat' className='bg-gray-800'>Flat Amount ($)</option>
                                    </select>
                                )}
                            />
                            {errors.discountType && <p className='text-red-400 text-xs mt-1'>{errors.discountType.message}</p>}
                        </div>
                        {/* Discount Value */}
                        <div className='mt-4'>
                            <Input
                                label='Discount Value'
                                type='number'
                                min={0}
                                {...register("discountValue",{
                                    required: "Discount value is required",
                                    valueAsNumber: true,
                                    min: { value: 1, message: "Value must be greater than 0" },
                                })}
                            />
                            {errors.discountValue && <p className='text-red-400 text-xs mt-1'>{errors.discountValue.message}</p>}
                        </div>
                        {/*Discount Code*/}
                        <div className='mt-4'>
                            <Input
                                label='Discount Code'
                                {...register("discountCode", {
                                    required: "Code is required",
                                    minLength: { value: 3, message: "Code must be at least 3 characters"},
                                })}
                            />
                            {errors.discountCode && <p className='text-red-400 text-xs mt-1'>{errors.discountCode.message}</p>}
                        </div>
                        <button type='submit'
                        disabled = {createDiscountCodeMutation.isPending}
                        className='mt-4 w-full flex items-center gap-2 py-2 justify-center text-base rounded-md shadow-md bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white disabled:bg-indigo-400 disabled:cursor-not-allowed'>
                            <Plus size={18}/>
                            {createDiscountCodeMutation.isPending ? "Creating..." : "Create Discount Code"}
                        </button>
                        {createDiscountCodeMutation.isError && (
                            <p className='text-red-400 text-sm mt-1 text-center'>
                                {(createDiscountCodeMutation.error as AxiosError <{
                                    message: string;
                                }>)?.response?.data?.message || "Something Went Wrong"}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        )}
        {/**Delete Discount Modal**/}
        {showDeleteModal && selectedDiscount && (
           <DeleteDiscountCodeModal
           discount={selectedDiscount}
           onClose={()=>setShowDeleteModal(false)}
           onConfirm={()=>deleteDiscountCodeMutation.mutate(selectedDiscount?.id)}
           />
        )}

    </div>
  )
}

export default Page