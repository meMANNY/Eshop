'use client'
import ImagePlaceHolder, { UploadedImage } from "@/shared/components/image-placeholder";
import { ChevronRight, Loader2, WandSparkles, X } from "lucide-react";
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
import Image from "next/image";
import { aiEnhancements, applyEnhancement } from "@/utils/AI.enhancements";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";


function Page() {

    const router = useRouter();

    const {
        register,
        control,
        watch,
        setValue,
        handleSubmit,
        formState:{errors},
    } = useForm()

    const [openImageModal,setOpenImageModal] = useState(false);
    const [selectedImageIndex,setSelectedImageIndex] = useState<number | null>(null);
    const [activeEffect,setActiveEffect] = useState<string | null>(null);
    const [enhancing,setEnhancing] = useState(false);
    const [isChanged] = useState(true);
    const [images,setImages] = useState<(UploadedImage | null)[]>([null]);
    const [uploadingIndex,setUploadingIndex] = useState<number | null>(null);
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
        setUploadingIndex(index);
        try {
            const base64 = await convertFileToBase64(file);

            const response = await axiosInstance.post(
                "/product/api/upload-product-image",
                { fileName: base64 }
            );

            const uploaded: UploadedImage = {
                fileId: response.data.fileId,
                file_url: response.data.file_url,
            };

            setImages((prevImages) => {
                const updatedImages = [...prevImages];
                updatedImages[index] = uploaded;
                // Keep a trailing empty slot for the next upload (max 8).
                if(index === updatedImages.length - 1 && updatedImages.length < 8){
                    updatedImages.push(null);
                }
                setValue("images",updatedImages);
                return updatedImages;
            });
        } catch (error) {
            console.log(error)
        } finally {
            setUploadingIndex(null);
        }
    }
    const onSubmit = async(data: any) => {

        try {
            await axiosInstance.post("/product/api/create-product",data);
            router.push("/dashboard/all-products");
        } catch (error:any) {
            toast.error(error?.data?.message);
        }
        finally{
            setLoading(true);
        }
        
    }

    const handleRemoveImage = async(index: number) =>{
        try {
            const imageToDelete = images[index];

            if(imageToDelete && typeof imageToDelete === "object" && imageToDelete.fileId){
                // Remove the asset from ImageKit so we don't leak orphaned uploads.
                await axiosInstance.delete("/product/api/delete-product-image", {
                    data: { fileId: imageToDelete.fileId },
                });
            }

            setImages((prevImages) => {
                const updatedImages = [...prevImages];
                updatedImages.splice(index,1);
                if(!updatedImages.includes(null) && updatedImages.length < 8){
                    updatedImages.push(null);
                }
                setValue("images",updatedImages);
                return updatedImages;
            });
        } catch (error) {
            console.log(error);
        }
    }

    const openEnhanceModal = (index: number) => {
        if(!images[index]) return;
        setSelectedImageIndex(index);
        setActiveEffect(null);
        setOpenImageModal(true);
    }

    const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

    // The image shown in the modal — with the currently chosen effect previewed.
    const previewUrl = selectedImage
        ? (activeEffect ? applyEnhancement(selectedImage.file_url, activeEffect) : selectedImage.file_url)
        : "";

    // Persist the previewed enhancement onto the stored image (the transformed
    // ImageKit URL is what gets saved with the product).
    const handleApplyEnhancement = () => {
        if(selectedImageIndex === null || !activeEffect) return;
        setImages((prev) => {
            const updated = [...prev];
            const img = updated[selectedImageIndex];
            if(img){
                updated[selectedImageIndex] = {
                    ...img,
                    file_url: applyEnhancement(img.file_url, activeEffect),
                };
            }
            setValue("images", updated);
            return updated;
        });
        setOpenImageModal(false);
    }

    return (
        <form className="w-full mx-auto p-8 shadow-md rounded-lg text-white"
        onSubmit={handleSubmit(onSubmit)}>
            {/*Heading and Breadcrumbs*/}
            <div className="flex items-center gap-3 py-2">
                {/* Coral marker — echoes the sidebar's "you are here" accent. */}
                <span aria-hidden="true" className="h-7 w-[3px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.6)]"/>
                <h2 className="text-2xl font-semibold font-Poppins text-white">
                    Create Product
                </h2>
            </div>
            <div className="mt-1 flex items-center text-sm">
                <span className="cursor-pointer text-slate-400 transition-colors hover:text-[#ff8a7d]">
                    Dashboard
                </span>
                <ChevronRight size={16} className="mx-1 text-slate-600"/>
                <span className="text-slate-200">Create Product</span>
            </div>
            {/*Content Layout */}
            <div className="py-4 w-full flex flex-col lg:flex-row gap-6">
                {/*Left side- Image Upload section */}
                <div className="w-full lg:w-[35%]">
                    {images?.length > 0 && (
                        <ImagePlaceHolder
                        size="760*850"
                        file={images[0]}
                        uploading={uploadingIndex === 0}
                        setOpenImageModal={setOpenImageModal}
                        onEnhance={()=>openEnhanceModal(0)}
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
                                uploading={uploadingIndex === index+1}
                                small = {true}
                                setOpenImageModal={setOpenImageModal}
                                onEnhance={()=>openEnhanceModal(index+1)}
                                index={index+1}
                                onImageChange = {handleImageChange}
                                onRemove={handleRemoveImage}
                                />
                            
                        ))}
                    </div>
                </div>
                {/*Right side - form inputs*/}
                <div className="w-full lg:w-[65%] rounded-xl border border-slate-800 bg-[#141922] p-6">
                    <div className="w-full flex flex-col md:flex-row gap-6">
                        {/*Product Title Input*/}
                        <div className="w-full md:w-2/4">
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
                            {...register("short_description",{ 
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
                        <div className="w-full md:w-2/4">
                            <label className="block font-semibold text-gray-300 mb-1">
                                Category*
                            </label>
                            {
                                isLoading ? (
                                    <p className="text-slate-400">
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
                                        <select {...field} className="w-full rounded-md border border-slate-700 bg-transparent p-2 text-white outline-none transition-colors focus:border-[#ff6f61] [&>option]:bg-[#141922] [&>option]:text-white">
                                            {" "}
                                            <option value="">
                                                Select Category
                                            </option>
                                            {categories?.map((category: string) => (
                                                <option key={category} value={category}>
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
                                    className="w-full rounded-md border border-slate-700 bg-transparent p-2 text-white outline-none transition-colors focus:border-[#ff6f61] disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#141922] [&>option]:text-white">
                                        {" "}
                                        <option value="">
                                            {selectedCategory ? "Select Subcategory" : "Select a category first"}
                                        </option>
                                        {subCategories?.map((subCategory: string) => (
                                            <option key={subCategory} value={subCategory}>
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
                                        const text = value
                                            ? value
                                                .replace(/<[^>]*>/g, " ")   // tags -> space so blocks don't merge
                                                .replace(/&nbsp;/g, " ")     // decode non-breaking spaces
                                                .replace(/&[a-z]+;/gi, " ")  // other entities -> space
                                                .trim()
                                            : "";
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
                                    <p className="text-slate-400">
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
                                            className={`px-3 py-1 rounded-md font-semibold border transition-colors ${watch("discountCodes")?.includes(code.id) ? "bg-[#ff6f61]/10 border-[#ff6f61] text-[#ff8a7d]" : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100"}`}>
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
            {
                openImageModal && selectedImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        {/*Modal Content*/}
                        <div className="w-[500px] max-w-full rounded-xl border border-slate-800 bg-[#141922] p-6 text-white shadow-2xl">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                                <h2 className="font-semibold text-lg">Enhance Product Image</h2>
                                <X size={20} className="cursor-pointer text-slate-400 transition-colors hover:text-white" onClick={()=>setOpenImageModal(false)} />
                            </div>
                            {/*Image Viewer*/}
                            <div className="relative w-full h-[300px] rounded-md overflow-hidden border border-gray-600 bg-[#0f172a]">
                                <Image
                                    key={previewUrl}
                                    src={previewUrl}
                                    alt="product-image"
                                    fill
                                    unoptimized
                                    sizes="500px"
                                    className="object-contain"
                                    onLoad={()=>setEnhancing(false)}
                                />
                                {enhancing && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                                        <Loader2 size={30} className="animate-spin text-[#ff6f61]"/>
                                    </div>
                                )}
                            </div>
                            {/*AI IMAGE ENHANCEMENT*/}
                            <div className="mt-5">
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">AI Enhancements</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {aiEnhancements.map(({label, transformation})=>(
                                        <button
                                        key={transformation}
                                        type="button"
                                        disabled={enhancing}
                                        onClick={()=>{
                                            if(activeEffect === transformation) return;
                                            setEnhancing(true);
                                            setActiveEffect(transformation);
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border transition disabled:cursor-not-allowed ${
                                            activeEffect === transformation
                                                ? "border-[#ff6f61] bg-[#ff6f61]/10 text-[#ff8a7d]"
                                                : "border-gray-700 text-gray-300 hover:border-gray-500"
                                        }`}>
                                            <WandSparkles size={15}/> {label}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-5 flex justify-end gap-3">
                                    <button
                                    type="button"
                                    onClick={()=>{setActiveEffect(null); setEnhancing(false);}}
                                    disabled={!activeEffect}
                                    className="px-4 py-2 rounded-lg text-sm text-slate-200 border border-slate-700 bg-white/[0.04] hover:bg-white/[0.08] transition disabled:opacity-50 disabled:cursor-not-allowed">
                                        Reset
                                    </button>
                                    <button
                                    type="button"
                                    onClick={handleApplyEnhancement}
                                    disabled={!activeEffect}
                                    className="px-4 py-2 rounded-md text-sm text-white bg-[#ff6f61] hover:bg-[#e05a4d] transition disabled:opacity-50 disabled:cursor-not-allowed">
                                        Apply Enhancement
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )
            }
            <div className="mt-6 flex justify-end gap-3">
                {isChanged && (
                    <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="rounded-lg border border-slate-700 bg-white/[0.04] px-5 py-2 text-slate-200 transition-colors hover:bg-white/[0.08]">
                        Save Draft
                    </button>
                )}
                <button
                type="submit"
                className="rounded-lg bg-[#ff6f61] px-6 py-2 font-medium text-white shadow-lg shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d] disabled:cursor-not-allowed disabled:opacity-60"
                disabled = {loading}>
                    {loading? "Creating..." : "Create"}
                </button>
            </div>

            
        </form>
    );
}

export default Page;