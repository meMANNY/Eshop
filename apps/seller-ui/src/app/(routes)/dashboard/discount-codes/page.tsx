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
        <div className='flex items-center justify-between mb-1'>
            <div className='flex items-center gap-3'>
                {/* Coral marker — echoes the sidebar's "you are here" accent. */}
                <span aria-hidden='true' className='h-7 w-[3px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.6)]'/>
                <h2 className='text-2xl font-semibold text-white'>
                    Discount Codes
                </h2>
            </div>
            <button onClick={()=>setShowModal(true)} className='flex items-center gap-1.5 rounded-lg bg-[#ff6f61] px-4 py-2 text-base font-medium text-white shadow-lg shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d]'>
                <Plus size={18}/> Create Discount
            </button>
        </div>
        <div className='mt-1 flex items-center text-sm'>
                        <Link href="/dashboard" className='text-slate-400 transition-colors hover:text-[#ff8a7d]'>
                            Dashboard
                        </Link>
                        <ChevronRight size={16} className='mx-1 text-slate-600'/>
                        <span className='text-slate-200'>Discount Codes</span>
        </div>

        <div className='mt-8 rounded-xl border border-slate-800 bg-[#141922] p-6 shadow-md'>
            <h3 className='mb-4 text-lg font-semibold text-white'>
                Your Discount Codes
            </h3>
            {
                isLoading ? (
                    <p className='py-6 text-center text-slate-400'>
                        Loading discount codes...
                    </p>

                ):(
                    <div className='overflow-x-auto'>
                    <table className='w-full text-white'>
                        <thead>
                            <tr className='border-b border-slate-800'>
                                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>Title</th>
                                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>Type</th>
                                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>Value</th>
                                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>Code</th>
                                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>Action</th>
                            </tr>

                        </thead>
                        <tbody>
                            {discountCodes?.map((discount: any)=>(
                                <tr key={discount?.id}
                                className='border-b border-slate-800 transition-colors hover:bg-white/[0.03]'>
                                    <td className='p-3 font-medium text-slate-100'>{discount?.public_name}</td>
                                    <td className='p-3'>
                                        <span className='inline-flex items-center rounded-full border border-slate-700 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-slate-300'>
                                            {discount.discountType === "percentage" ? "Percentage (%)" : "Flat (USD)"}
                                        </span>
                                    </td>
                                    <td className='p-3 font-semibold text-white'>
                                        {discount.discountType === "percentage" ?
                                            `${discount.discountValue}%` :
                                            `$${discount.discountValue}`}
                                    </td>
                                    <td className='p-3'>
                                        <span className='inline-block rounded border border-slate-800 bg-white/[0.03] px-2 py-0.5 font-mono text-sm text-[#ff8a7d]'>
                                            {discount.discountCode}
                                        </span>
                                    </td>
                                    <td className='p-3'>
                                        <button
                                        onClick={()=>handleDeleteClick(discount)}
                                        aria-label='Delete discount code'
                                        className='text-slate-400 transition-colors hover:text-red-400'>
                                            <Trash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )
            }
            {!isLoading && discountCodes?.length === 0 && (
                <p className='block w-full pt-6 text-center text-slate-400'>
                    No discount codes found!
                </p>
            )}
        </div>

        {/* Show Discount Modal */}
        {showModal && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
                <div className='w-[450px] max-w-full rounded-xl border border-slate-800 bg-[#141922] p-6 shadow-2xl'>
                    <div className='flex items-center justify-between border-b border-slate-800 pb-3'>
                        <h3 className='text-xl font-semibold text-white'>Create Discount Code</h3>
                        <button onClick={()=>setShowModal(false)} aria-label='Close' className='text-slate-400 transition-colors hover:text-white'>
                            <X size={22}/>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className='mt-4'>
                        <Input
                        label='Discount Title'
                        {...register("public_name",{required: "Title is required"})}
                        />
                        {errors.public_name && <p className='mt-1 text-xs text-red-400'>{errors.public_name.message}</p>}
                        {/*Discount Type*/}
                        <div className='mt-4'>
                            <label className='mb-1 block text-sm font-semibold text-slate-300'>Discount Type</label>
                            <Controller
                                control={control}
                                name='discountType'
                                rules={{ required: "Discount type is required" }}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className='w-full rounded-md border border-slate-700 bg-transparent p-2 text-white outline-none transition-colors focus:border-[#ff6f61] [&>option]:bg-[#141922] [&>option]:text-white'
                                    >
                                        <option value='percentage'>Percentage (%)</option>
                                        <option value='flat'>Flat Amount ($)</option>
                                    </select>
                                )}
                            />
                            {errors.discountType && <p className='mt-1 text-xs text-red-400'>{errors.discountType.message}</p>}
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
                            {errors.discountValue && <p className='mt-1 text-xs text-red-400'>{errors.discountValue.message}</p>}
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
                            {errors.discountCode && <p className='mt-1 text-xs text-red-400'>{errors.discountCode.message}</p>}
                        </div>
                        <button type='submit'
                        disabled = {createDiscountCodeMutation.isPending}
                        className='mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff6f61] py-2 text-base font-medium text-white shadow-lg shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d] disabled:cursor-not-allowed disabled:opacity-60'>
                            <Plus size={18}/>
                            {createDiscountCodeMutation.isPending ? "Creating..." : "Create Discount Code"}
                        </button>
                        {createDiscountCodeMutation.isError && (
                            <p className='mt-2 text-center text-sm text-red-400'>
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
