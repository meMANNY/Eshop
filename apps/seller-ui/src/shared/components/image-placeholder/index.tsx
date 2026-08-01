import { ImagePlus, Loader2, Pencil, WandSparkles, X } from 'lucide-react';
import React from 'react'
import Image from 'next/image';

export interface UploadedImage {
    fileId: string;
    file_url: string;
}

const ImagePlaceHolder = ({
    size,
    small,
    file = null,
    uploading = false,
    onImageChange,
    onRemove,
    defaultImage = null,
    index = null,
    setOpenImageModal
}:{
    size : string;
    small?: boolean;
    file?: UploadedImage | null;
    uploading?: boolean;
    onImageChange: (file: File | null, index: number) => void;
    onRemove?: (index: number) => void;
    defaultImage?: string | null;
    index?: any;
    setOpenImageModal: (openImageModal: boolean) => void;
}) => {
    // The parent owns the images array; we render the hosted ImageKit URL it
    // stores, so removing/replacing an image upstream is reflected immediately.
    const imagePreview = file?.file_url ?? defaultImage;

    const inputId = `image-upload-${index ?? 'main'}`;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0] ;
        if (selected) {
            onImageChange(selected,index!);
        }
    };

  return (
    <div
    className={`group relative ${
        small ? "h-[180px]" : "h-[450px]"
    } w-full overflow-hidden rounded-xl border border-slate-700/70 bg-[#141922] transition-colors duration-200`}>
        <input type="file"
        accept='image/*'
        className='hidden'
        id={inputId}
        onChange={handleFileChange}
        />

        {uploading && (
            <div className='absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm'>
                <Loader2 size={small ? 22 : 30} className='animate-spin text-[#ff6f61]'/>
            </div>
        )}

        {imagePreview ? (
            <>
                {/* Actions — revealed on hover so they never fight the image for attention */}
                <div className='absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100'>
                    <button type='button' onClick={() => setOpenImageModal(true)}
                        aria-label='Enhance image'
                        className='flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 text-slate-200 shadow-lg ring-1 ring-white/10 backdrop-blur-sm transition-colors duration-150 hover:bg-[#ff6f61] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f61]'>
                        <WandSparkles size={16}/>
                    </button>
                    <button type='button' onClick={() => onRemove?.(index!)}
                        aria-label='Remove image'
                        className='flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 text-slate-200 shadow-lg ring-1 ring-white/10 backdrop-blur-sm transition-colors duration-150 hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500'>
                        <X size={16}/>
                    </button>
                </div>

                <Image
                fill
                unoptimized
                sizes='(max-width: 768px) 100vw, 50vw'
                src={imagePreview}
                
                alt='Uploaded product image'
                className='object-cover'/>
            </>
        ):(
            // The whole empty area is the upload target — not just a corner button.
            <label htmlFor={inputId}
            className='absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-700 bg-transparent px-6 text-center transition-colors duration-200 group-hover:border-[#ff6f61]/60 group-hover:bg-[#ff6f61]/[0.04]'>
                <span className={`flex items-center justify-center rounded-full bg-[#ff6f61]/10 text-[#ff6f61] ring-1 ring-[#ff6f61]/20 transition-transform duration-200 group-hover:scale-105 ${
                    small ? "h-11 w-11" : "h-16 w-16"
                }`}>
                    <ImagePlus size={small ? 20 : 28} strokeWidth={1.75} />
                </span>

                <div className='space-y-1.5'>
                    <p className={`font-semibold tracking-tight text-slate-200 ${
                        small ? "text-base" : "text-2xl"
                    }`}>
                        <span className='text-[#ff8a7d]'>Click to upload</span> an image
                    </p>
                    <p className={`font-medium text-slate-500 ${
                        small ? "text-xs" : "text-sm"
                    }`}>
                        Recommended ratio <span className='text-slate-300'>{size}</span> · PNG or JPG
                    </p>
                </div>

                <span aria-hidden='true'
                className='pointer-events-none flex items-center gap-1.5 rounded-full bg-slate-800/60 px-3 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-white/5'>
                    <Pencil size={12} />
                    Browse files
                </span>
            </label>
        )}
    </div>

  )
}

export default ImagePlaceHolder
