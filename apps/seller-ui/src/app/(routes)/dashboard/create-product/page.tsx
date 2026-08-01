'use client'
import ImagePlaceHolder from "@/shared/components/image-placeholder";
import { ChevronRight } from "lucide-react";
import React, {useEffect, useState} from "react";
import {Controller, useForm} from "react-hook-form"
import Input from "../../../../../../../packages/components/input";
import ColorSelector from "../../../../../../../packages/components/color-selector";
import CustomSpecifications from "../../../../../../../packages/components/custom-specifications";
import CustomProperties from "../../../../../../../packages/components/custom-properties";
import RichTextEditor from "../../../../../../../packages/components/rich-text-editor";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import SizeSelector from "../../../../../../../packages/components/size-selector";

function Page() {

    const {
        register,
        control,
        watch,
        setValue,
        handleSubmit,
        formState:{errors},
    } = useForm()

    const [openImageModal,setOpenImageModal] = useState(false);
    const [isChanged,setIsChanged] = useState(true);
    const [images,setImages] = useState<(File | null)[]>([null]);
    const [loading, setLoading] = useState(false);

    const {data, isLoading,isError} = useQuery({
        queryKey: ["categories"],
        queryFn: async ()=>{
            try {
                const res = await axiosInstance.get("/product/api/get-categories");
                return res.data;
            } catch (error) {
                console.log(error);
            }
        },
        staleTime: 1000 * 60 * 5,
        retry:2,
        
    })

     const {data: discountCodes = [],isLoading: discountLoading} = useQuery({
        queryKey: ["shop-discounts"],
        queryFn: async () => {
            const res = await axiosInstance.get("/product/api/get-discount-codes");
            return res?.data?.discount_codes || [];
        }
    });

    const categories = data?.categories || [];
    const subCategoriesData = data?.subCategories || {};

    const selectedCategory = watch("category");
    const regularPrice = watch("regular_price");

    const subCategories = selectedCategory ? subCategoriesData[selectedCategory] || [] : [];

    // Clear the chosen subcategory whenever the category changes, so a stale
    // subcategory from the previous category can't stay selected.
    useEffect(() => {
        setValue("subCategory", "");
    }, [selectedCategory, setValue]);

    console.log(categories,subCategoriesData);

    const handleSaveDraft = () =>{

    };

    
    const convertFileToBase64 = (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }



    const handleImageChange = async(file: File | null, index: number) =>{
        if(!file)
            return;
        try {
            const base64 = await convertFileToBase64(file);
            console.log(base64);
        } catch (error) {
            
        }
        const updatedImages = [...images];
        updatedImages[index] = file;
        if(index === images.length - 1 && images.length < 8){
            updatedImages.push(null);
        }
        setImages(updatedImages);
        setValue("images",updatedImages);
    }
    const onSubmit = (data: any) => {
        console.log(data)
    }

    const handleRemoveImage = (index: number) =>{

        setImages((prevImages) =>{
            let updatedImages = [...prevImages];

            if(index === -1){
                updatedImages[0] = null;
            }else{
                updatedImages.splice(index,1);
            }

            if(!updatedImages.includes(null) && updatedImages.length < 8){
                updatedImages.push(null);
            }

            // Keep the form value in sync with the freshly computed array,
            // not the stale `images` from this render's closure.
            setValue("images",updatedImages);
            return updatedImages;
        });
    }

    return (
        <form className="w-full mx-auto p-8 shadow-md rounded-lg text-white" 
        onSubmit={handleSubmit(onSubmit)}>
            {/*Heading and Breadcrumbs*/}
            <h2 className="text-2xl py-2 font-semibold font-Poppins text-white">
                Create Product
            </h2>
            <div className="flex items-center">
                <span className="text-[#80Deea] cursor-pointer">
                    DashBoard
                </span>
                <ChevronRight size={20} className="opacity-[.8]"/>
                <span>Create Product</span>
            </div>
            {/*Content Layout */}
            <div className="py-4 w-full flex gap-6">
                {/*Left side- Image Upload section */}
                <div className="w-[35%]">
                    {images?.length > 0 && (
                        <ImagePlaceHolder
                        size="760*850"
                        file={images[0]}
                        setOpenImageModal={setOpenImageModal}
                        index={0}
                        small={false}
                        onImageChange = {handleImageChange}
                        onRemove={handleRemoveImage}
                    />
                    )}
                    <div className="grid grid-cols-2 gap-3 mt-4 flex-1">
                        {images.slice(1).map((_,index) => (
                            
                                <ImagePlaceHolder
                                size="760*850"
                                key = {index+1}
                                file={images[index+1]}
                                small = {true}
                                setOpenImageModal={setOpenImageModal}
                                index={index+1}
                                onImageChange = {handleImageChange}
                                onRemove={handleRemoveImage}
                                />
                            
                        ))}
                    </div>
                </div>
                {/*Right side - form inputs*/}
                <div className="md: w-[65%] ">
                    <div className="w-full flex gap-6">
                        {/*Product Title Input*/}
                        <div className="w-2/4">
                            <Input
                                label="Product Title*"
                                {...register("title",{required: "Title is required"})}
                                placeholder="Enter Product Title"
                            />
                            {errors.title && (<p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>)}
                        
                    
                    {/*Product Description Input*/}
                    <div className="w-full mt-2">
                        <Input
                            type="textarea"
                            rows={7}
                            cols={10}
                            label="Short Description* (Max 150 words)"
                            {...register("description",{
                                required: "Description is required",
                                validate: (value) => {
                                    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
                                    return wordCount <= 150 || `Description cannot exceed 150 words (Current: ${wordCount})`;
                                }
                            })}
                            placeholder="Enter Product Description"
                        />
                        {errors.description && (<p className="text-red-500 text-xs mt-1">{errors.description.message as string}</p>)}
                    </div>
                    {/*Product Tags Input*/}
                    <div className="w-full mt-2">
                        <Input
                            label="Tags*"
                            {...register("tags",{required: "Separate related products tags with a comma"})}
                            placeholder="apple,flagship"
                        />
                        {errors.tags && (<p className="text-red-500 text-xs mt-1">{errors.tags.message as string}</p>)}
                    </div>
                    {/*Product Brand Input*/}
                    <div className="w-full mt-2">
                        <Input
                            label="Brand"
                            {...register("brand")}
                            placeholder="Apple"
                        />
                        {errors.brand && (<p className="text-red-500 text-xs mt-1">{errors.brand.message as string}</p>)}
                    </div>
                    {/*Product Colors Selector*/}
                    <ColorSelector control={control} errors={errors} />
                    {/*Custom Specifications*/}
                    <CustomSpecifications control={control} errors={errors} />
                    {/*Custom Properties*/}
                    <CustomProperties control={control} errors={errors} />
                    {/*Mode of Payment*/}
                    <div className="w-full mt-2">
                        <label className="block font-semibold text-gray-300 mb-1">Mode of Payment*</label>
                        <select
                            defaultValue=""
                            {...register("payment_mode",{required: "Please select a mode of payment"})}
                            className="w-full rounded-md border border-slate-700 bg-transparent p-2 text-white outline-none transition-colors focus:border-[#ff6f61] [&>option]:bg-[#141922] [&>option]:text-white"
                        >
                            <option value="" disabled>Select a payment mode</option>
                            <option value="card">Credit / Debit Card</option>
                            <option value="upi">UPI</option>
                            <option value="net_banking">Net Banking</option>
                            <option value="wallet">Wallet</option>
                            <option value="cod">Cash on Delivery</option>
                            <option value="emi">EMI</option>
                        </select>
                        {errors.payment_mode && (<p className="text-red-500 text-xs mt-1">{errors.payment_mode.message as string}</p>)}
                    </div>
                    {/*Product Warranty Input*/}
                    <div className="w-full mt-2">
                        <Input
                            label="Warranty*"
                            {...register("warranty",{required: "Warranty is required"})}
                            placeholder="1 Year / No Warranty"
                        />
                        {errors.warranty && (<p className="text-red-500 text-xs mt-1">{errors.warranty.message as string}</p>)}
                    </div>
                    {/*Product Slug Input*/}
                    <div className="w-full mt-2">
                        <Input
                            label="Slug*"
                            {...register("slug",{
                                required: "Slug is required!",
                                pattern: {
                                    value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                                    message: "Invalid slug format! Use only lowercase letters, numbers and hyphens.",
                                },
                                minLength: {
                                    value: 3,
                                    message: "Slug must be at least 3 characters long.",
                                },
                                maxLength: {
                                    value: 50,
                                    message: "Slug cannot be longer than 50 characters.",
                                },
                            })}
                            placeholder="product-slug"
                        />
                        {errors.slug && (<p className="text-red-500 text-xs mt-1">{errors.slug.message as string}</p>)}
                    </div>
                    </div>
                        <div className="w-2/4">
                            <label className="block font-semibold text-gray-300 mb-1">
                                Category*
                            </label>
                            {
                                isLoading ? (
                                    <p className="text-gray-400">
                                        Loading Categories...

                                    </p>
                                ) : isError ? (
                                    <p className="text-red-500">
                                        Failed to load categories
                                    </p>
                                ) : (
                                    <Controller
                                    name="category"
                                    control={control}
                                    rules={{required: "Category is required"}}
                                    render={({field})=>(
                                        <select {...field} className="w-full border outline-none border-gray-700 bg-transparent">
                                            {" "}
                                            <option value="" className="bg-black">
                                                Select Category
                                            </option>
                                            {categories?.map((category: string) => (
                                                <option key={category} value={category} className="bg-black">
                                                    {category}
                                                </option>
                                            ))}

                                        </select>
                                    )}/>
                                )
                            }
                            {errors.category && (<p className="text-red-500 text-xs mt-1">{errors.category.message as string}</p>)}

                            {/*Subcategories*/}
                            <div className="w-full mt-2">
                                <label className="block font-semibold text-gray-300 mb-1">
                                    Subcategory*
                                </label>
                                <Controller
                                name="subCategory"
                                control={control}
                                rules={{required: "Subcategory is required"}}
                                render={({field})=>(
                                    <select
                                    {...field}
                                    disabled={!selectedCategory || subCategories.length === 0}
                                    className="w-full border outline-none border-gray-700 bg-transparent disabled:cursor-not-allowed disabled:opacity-50">
                                        {" "}
                                        <option value="" className="bg-black">
                                            {selectedCategory ? "Select Subcategory" : "Select a category first"}
                                        </option>
                                        {subCategories?.map((subCategory: string) => (
                                            <option key={subCategory} value={subCategory} className="bg-black">
                                                {subCategory}
                                            </option>
                                        ))}

                                    </select>
                                )}/>
                                {errors.subCategory && (<p className="text-red-500 text-xs mt-1">{errors.subCategory.message as string}</p>)}
                            </div>
                            {/*Detailed Description*/}
                            <div className="mt-2">
                                <label className="block font-semibold text-gray-300 mb-1">
                                    Detailed Description* (Min 100 words)
                                </label>
                                <Controller
                                name="detailed_description"
                                control={control}
                                rules={{
                                    required: "Detailed description is required",
                                    validate: (value) => {
                                        const text = value ? value.replace(/<[^>]*>/g, "").trim() : "";
                                        const wordCount = text.split(/\s+/).filter(Boolean).length;
                                        return wordCount >= 100 || `Detailed description must be at least 100 words (Current: ${wordCount})`;
                                    },
                                }}
                                render={({field})=>(
                                    <RichTextEditor value={field.value} onChange={field.onChange} />
                                )}/>
                                {errors.detailed_description && (<p className="text-red-500 text-xs mt-1">{errors.detailed_description.message as string}</p>)}
                            </div>
                            {/*Video URL*/}
                            <div className="w-full mt-2">
                                <Input
                                    label="Video URL"
                                    {...register("video_url",{
                                        pattern: {
                                            value: /^https:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]+(\S*)?$/,
                                            message: "Enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=xxxxxxxxxxx)",
                                        },
                                    })}
                                    placeholder="https://www.youtube.com/watch?v=xxxxxxxxxxx"
                                />
                                {errors.video_url && (<p className="text-red-500 text-xs mt-1">{errors.video_url.message as string}</p>)}
                            </div>
                            {/*Regular Price*/}
                            <div className="mt-2">
                                <Input
                                    label="Regular Price*"
                                    type="number"
                                    {...register("regular_price",{
                                        required: "Regular price is required",
                                        valueAsNumber: true,
                                        min: { value: 1, message: "Price must be at least 1" },
                                        validate: (value) => !isNaN(value) || "Only numbers are allowed",
                                    })}
                                    placeholder="20"
                                />
                                {errors.regular_price && (<p className="text-red-500 text-xs mt-1">{errors.regular_price.message as string}</p>)}
                            </div>
                            {/*Sale Price*/}
                            <div className="mt-2">
                                <Input
                                    label="Sale Price*"
                                    type="number"
                                    {...register("sale_price",{
                                        required: "Sale price is required",
                                        valueAsNumber: true,
                                        min: { value: 1, message: "Sale price must be at least 1" },
                                        validate: (value) => {
                                            if (isNaN(value)) return "Only numbers are allowed";
                                            if (regularPrice && value >= regularPrice) {
                                                return "Sale price must be less than the regular price";
                                            }
                                            return true;
                                        },
                                    })}
                                    placeholder="15"
                                />
                                {errors.sale_price && (<p className="text-red-500 text-xs mt-1">{errors.sale_price.message as string}</p>)}
                            </div>
                            {/*Stock*/}
                            <div className="mt-2">
                                <Input
                                    label="Stock*"
                                    type="number"
                                    {...register("stock",{
                                        required: "Stock is required",
                                        valueAsNumber: true,
                                        min: { value: 1, message: "Stock must be at least 1" },
                                        max: { value: 1000, message: "Stock cannot exceed 1000" },
                                        validate: (value) => {
                                            if (isNaN(value)) return "Only numbers are allowed";
                                            if (!Number.isInteger(value)) return "Stock must be a whole number";
                                            return true;
                                        },
                                    })} 
                                    placeholder="100"
                                />
                                {errors.stock && (<p className="text-red-500 text-xs mt-1">{errors.stock.message as string}</p>)}
                            </div>
                            {/*Size Selector*/}
                            <div className="mt-2">
                                <SizeSelector control={control} errors={errors}/>

                            </div>
                            <div className="mt-3">
                                <label className="block font-semibold text-gray-300 mb-1">
                                    Select Discount Codes (Optional)
                                </label>
                                {discountLoading ? (
                                    <p className="text-gray-400">
                                        Loading discount codes ...
                                    </p>
                                ): (
                                    <div className="flex flex-wrap gap-2">
                                        {discountCodes?.map((code: any) => (
                                            <button key={code.id}
                                            type="button"
                                            onClick={()=>{
                                                const currentSelection = watch("discountCodes") || [];
                                                const updatedSelection = currentSelection?.includes(
                                                    code.id
                                                ) ? currentSelection.filter((id: string)=> id !== code.id) : [...currentSelection, code.id];
                                                setValue("discountCodes",updatedSelection);
                                            }}
                                            className={`px-3 py-1 rounded-md font-semibold border ${watch("discountCodes")?.includes(code.id) ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-gray-700 text-gray-300 hover:border-gray-500"}`}>
                                                {code?.public_name} ({code.discountValue}{code.discountType === "percentage" ? "%" : "$"})
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                {isChanged && (
                    <button 
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md">
                        Save Draft
                    </button>
                )}
                <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                disabled = {loading}>
                    {loading? "Creating..." : "Create"}
                </button>
            </div>

            
        </form>
    );
}

export default Page;