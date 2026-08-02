"use client"

import React,{useMemo, useState} from 'react'
import {useReactTable, getCoreRowModel,getFilteredRowModel,flexRender} from "@tanstack/react-table"
import { Search,Pencil, Trash, Eye,Plus,BarChart,Star,ChevronRight } from 'lucide-react'

import Link from 'next/link'
import axiosInstance from '@/utils/axiosInstance'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import DeleteConfirmationModal from '@/shared/components/modals/delete.confirmation.modal'
import toast from 'react-hot-toast'

const fetchProducts = async() =>{
    const res = await axiosInstance.get("/product/api/get-shop-products");
    return res?.data?.products;
}


const ProductList = () => {

    const [globalFilter,setGlobalFilter] = useState('');
    const [analyticsData,setAnalyticsData] = useState(null);
    const [showAnalytics,setShowAnalytics] = useState(false);
    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const [selectedProduct,setSelectedProduct] = useState(null);

    const queryClient = useQueryClient();

    const {data:products=[],isLoading} = useQuery({
        queryKey:['shop-products'],
        queryFn:fetchProducts,
        staleTime: 1000*60*5
    });

    const deleteMutation = useMutation({
        mutationFn: async (productId: string) => {
            await axiosInstance.delete(`/product/api/delete-product/${productId}`);
        },
        onSuccess: () => {
            toast.success("Product scheduled for deletion");
            queryClient.invalidateQueries({ queryKey: ['shop-products'] });
            setShowDeleteModal(false);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete product");
        },
    });

    const restoreMutation = useMutation({
        mutationFn: async (productId: string) => {
            await axiosInstance.put(`/product/api/restore-product/${productId}`);
        },
        onSuccess: () => {
            toast.success("Product restored successfully");
            queryClient.invalidateQueries({ queryKey: ['shop-products'] });
            setShowDeleteModal(false);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to restore product");
        },
    });

    const columns = useMemo(()=>[{
        accessorKey: "image",
        header: "Image",
        cell: ({row}: any) => {
            const src = row.original.images?.[0]?.url;
            return src ? (
                <Image
                src={src}
                alt={row.original.title ?? "product image"}
                width={48}
                height={48}
                unoptimized
                className='h-12 w-12 rounded-md object-cover ring-1 ring-slate-700/60'
                />
            ) : (
                <div className='h-12 w-12 rounded-md bg-slate-800 ring-1 ring-slate-700/60'/>
            );
        },
    }, {
        accessorKey: "name",
        header: "Product Name",
        cell: ({row}: any) => {
            const truncatedTitle = row.original.title.length > 25 ?
            row.original.title.substring(0,25) + "..." :
            row.original.title;

            return (
                <Link
                href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
                className='font-medium text-[#ff8a7d] transition-colors hover:text-[#ff6f61] hover:underline'
                title={row.original.title}
                >
                    {truncatedTitle}
                </Link>
            )
        },
    },
    {
        accessorKey: "sale_price",
        header: "Price",
        cell:({row}:any)=>{
            const { sale_price, regular_price } = row.original;
            return (
                <div className='flex items-center gap-2'>
                    <span className='font-medium text-white'>${sale_price}</span>
                    {regular_price > sale_price && (
                        <span className='text-xs text-slate-500 line-through'>${regular_price}</span>
                    )}
                </div>
            )
        }

    },{
        accessorKey: "stock",
        header: "Stock",
        cell: ({row}: any) => {
            return (
                <span className={row.original.stock < 10 ? 'text-red-400' : 'text-slate-200'}>{row.original.stock} left</span>
            )
        }

    },{
        accessorKey: "category",
        header: "Category",
        cell: ({row}: any) => {
            return (
                <span className='text-slate-300'>{row.original.category}</span>
            )
        }
    },{
        accessorKey: "ratings",
        header: "Rating",
        cell: ({row}: any) => {
            return (
                <div className='flex items-center gap-1.5'>
                    <Star size={16} className='fill-amber-400 text-amber-400'/>
                    <span className='text-slate-200'>{row.original.ratings ?? 5}</span>
                </div>
            )
        }
    },{
        id: "actions",
        header: "Actions",
        cell: ({row}: any) => {
            return (
                <div className='flex items-center gap-3'>
                    <Link
                    href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
                    className='text-slate-400 transition-colors hover:text-[#ff6f61]'
                    title='View product'
                    >
                        <Eye size={18}/>
                    </Link>
                    <Link
                    href={`/dashboard/edit-product/${row.original.id}`}
                    className='text-slate-400 transition-colors hover:text-[#ff6f61]'
                    title='Edit product'
                    >
                        <Pencil size={18}/>
                    </Link>
                    <button
                    type='button'
                    onClick={()=>{
                        setSelectedProduct(row.original);
                        setShowAnalytics(true);
                    }}
                    className='text-slate-400 transition-colors hover:text-[#ff6f61]'
                    title='View analytics'
                    >
                        <BarChart size={18}/>
                    </button>
                    <button
                    type='button'
                    onClick={()=>{
                        setSelectedProduct(row.original);
                        setShowDeleteModal(true);
                    }}
                    className='text-slate-400 transition-colors hover:text-red-400'
                    title='Delete product'
                    >
                        <Trash size={18}/>
                    </button>
                </div>
            )
        }
    }
], []);

const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: {globalFilter},
    onGlobalFilterChange: setGlobalFilter

})
    return (
        <div className='min-h-screen w-full p-8'>
            <div className='mb-1 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    {/* Coral marker — echoes the sidebar's "you are here" accent. */}
                    <span aria-hidden='true' className='h-7 w-[3px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.6)]'/>
                    <h2 className='text-2xl font-semibold text-white'>
                        All Products
                    </h2>
                </div>
                <Link href="/dashboard/create-product" className='flex items-center gap-1.5 rounded-lg bg-[#ff6f61] px-4 py-2 text-base font-medium text-white shadow-lg shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d]'>
                    <Plus size={18}/> Add Product
                </Link>
            </div>
            <div className='mt-1 flex items-center text-sm'>
                            <Link href="/dashboard" className='text-slate-400 transition-colors hover:text-[#ff8a7d]'>
                                Dashboard
                            </Link>
                            <ChevronRight size={16} className='mx-1 text-slate-600'/>
                            <span className='text-slate-200'>All Products</span>
            </div>


            <div className='mb-4 mt-6 flex flex-1 items-center rounded-lg border border-slate-800 bg-[#141922] p-2.5 transition-colors focus-within:border-[#ff6f61]/70'>
                <Search size={18} className='mr-2 text-slate-400'/>
                <input
                type='text'
                placeholder='Search products...'
                className='w-full bg-transparent text-white placeholder:text-slate-500 outline-none'
                value={globalFilter}
                onChange={(e)=>setGlobalFilter(e.target.value)}
                />
            </div>
        {/* Table */}
            <div className='overflow-x-auto rounded-xl border border-slate-800 bg-[#141922] p-4 shadow-md'>
                {isLoading ? (
                    <p className='py-6 text-center text-slate-400'>Loading products...</p>
                ) : products.length === 0 ? (
                    <p className='py-6 text-center text-slate-400'>No products found!</p>
                ) : (
                    <table className='w-full text-white'>
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className='border-b border-slate-800'>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400'>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className='border-b border-slate-800 transition-colors hover:bg-white/[0.03]'>
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className='p-3'>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {showDeleteModal && (
                    <DeleteConfirmationModal
                    product = {selectedProduct}
                    isLoading = {deleteMutation.isPending || restoreMutation.isPending}
                    onClose = {()=> setShowDeleteModal(false)}
                    onConfirm = {()=> deleteMutation.mutate((selectedProduct as any)?.id)}
                    onRestore = {()=> restoreMutation.mutate((selectedProduct as any)?.id)}
                    />
                )}
            </div>
        </div>

    )

}

export default ProductList
