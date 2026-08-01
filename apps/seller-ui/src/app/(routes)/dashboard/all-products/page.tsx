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
                className='w-12 h-12 rounded-md object-cover'
                />
            ) : (
                <div className='w-12 h-12 rounded-md bg-gray-800'/>
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
                className='text-blue-400 hover:underline'
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
                    <span>${sale_price}</span>
                    {regular_price > sale_price && (
                        <span className='text-gray-500 line-through text-xs'>${regular_price}</span>
                    )}
                </div>
            )
        }

    },{
        accessorKey: "stock",
        header: "Stock",
        cell: ({row}: any) => {
            return (
                <span className={row.original.stock < 10 ? 'text-red-500' : 'text-white'}>{row.original.stock} left</span>
            )
        }

    },{
        accessorKey: "category",
        header: "Category",
        cell: ({row}: any) => {
            return (
                <span className='text-gray-300'>{row.original.category}</span>
            )
        }
    },{
        accessorKey: "ratings",
        header: "Rating",
        cell: ({row}: any) => {
            return (
                <div className='flex items-center gap-2'>
                    <Star size={16} className='text-yellow-400'/>
                    <span>{row.original.ratings ?? 5}</span>
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
                    className='text-gray-400 transition-colors hover:text-blue-400'
                    title='View product'
                    >
                        <Eye size={18}/>
                    </Link>
                    <Link
                    href={`/dashboard/edit-product/${row.original.id}`}
                    className='text-gray-400 transition-colors hover:text-green-400'
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
                    className='text-gray-400 transition-colors hover:text-indigo-400'
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
                    className='text-gray-400 transition-colors hover:text-red-500'
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
        <div className='w-full min-h-screen p-8'>
            <div className='flex justify-between items-center mb-1'>
                <h2 className='text-2xl text-white font-semibold'>
                    All Products
                </h2>
                <Link href="/dashboard/create-product" className='flex items-center gap-1.5 px-4 py-2 text-base rounded-md shadow-md bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white '>
                    <Plus size={18}/> Add Product
                </Link>
            </div>
            <div className="flex items-center text-white">
                            <Link href="/dashboard" className="text-[#80Deea] cursor-pointer">
                                DashBoard
                            </Link>
                            <ChevronRight size={20} className="opacity-[.8]"/>
                            <span className='text-white'>All Products</span>
            </div>
        
        
            <div className='mt-6 mb-4 flex items-center bg-gray-900 p-2 rounded-md flex-1'>
                <Search size={18} className='text-gray-400 mr-2'/>
                <input
                type='text'
                placeholder='Search Products...'
                className='w-full bg-transparent text-white outline-none'
                value={globalFilter}
                onChange={(e)=>setGlobalFilter(e.target.value)}
                />
            </div>
        {/* Table */}
            <div className='overflow-x-auto rounded-md bg-gray-900 p-4 shadow-md'>
                {isLoading ? (
                    <p className='text-center text-gray-400'>Loading products...</p>
                ) : products.length === 0 ? (
                    <p className='text-center text-gray-400'>No products found!</p>
                ) : (
                    <table className='w-full text-white'>
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className='border-b border-gray-800'>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className='p-3 text-left'>
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
                                <tr key={row.id} className='border-b border-gray-800 transition hover:bg-gray-800'>
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