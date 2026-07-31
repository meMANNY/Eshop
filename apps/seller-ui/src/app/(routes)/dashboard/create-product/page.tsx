'use client'
import ImagePlaceHolder from "@/shared/components/image-placeholder";
import { ChevronRight } from "lucide-react";
import React, {useState} from "react";
import {useForm} from "react-hook-form"
import Input from "../../../../../../../packages/components/input";
import ColorSelector from "../../../../../../../packages/components/color-selector";
import CustomSpecifications from "../../../../../../../packages/components/custom-specifications";
import CustomProperties from "../../../../../../../packages/components/custom-properties";

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
    const [isChanged,setIsChanged] = useState(false);
    const [images,setImages] = useState<(File | null)[]>([null]);
    const [loading, setLoading] = useState(false);


    const handleImageChange = (file: File | null, index: number) =>{

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
            return updatedImages;
        });

        setValue("images",images);
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
                            hi
                        </div>
                    </div>
                </div>
            </div>

            
        </form>
    );
}

export default Page;