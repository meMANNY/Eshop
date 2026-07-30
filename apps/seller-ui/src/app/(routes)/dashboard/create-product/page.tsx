'use client'
import ImagePlaceHolder from "@/shared/components/image-placeholder";
import { ChevronRight } from "lucide-react";
import React, {useState} from "react";
import {useForm} from "react-hook-form"

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
                    <ImagePlaceHolder
                    size="760*850"
                    setOpenImageModal={setOpenImageModal}
                    index={0}
                    onImageChange = {handleImageChange}
                    onRemove={handleRemoveImage}
                    />

                </div>
            </div>
        </form>
    );
}

export default Page;