'use client'
import ImagePlaceHolder from "@/shared/components/image-placeholder";
import { ChevronRight } from "lucide-react";
import React, {useState} from "react";
import {useForm} from "react-hook-form"
import Input from "../../../../../../../packages/components/input";

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
                                label="Product Title"
                                {...register("title",{required: "Title is required"})}
                                placeholder="Enter Product Title"
                            />
                            {errors.title && (<p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>)}
                        </div>
                    </div>
                 </div>
            </div>

            
        </form>
    );
}

export default Page;