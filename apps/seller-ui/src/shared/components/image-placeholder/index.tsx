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
    onEnhance,
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
    onEnhance?: () => void;
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

    /*
      Both hover fills are light, so the glyph goes dark on hover rather than
      white. White on coral is about 2.8:1 and white on this red about 2.6:1 —
      both below the 3:1 floor for a graphical control. The dark ink reads at
      roughly 7:1 on either. Same reasoning as the primary Button.
    */
    const actionBtn =
        'flex h-9 w-9 items-center justify-center border border-ink-border bg-ink/85 text-on-ink backdrop-blur-sm transition-colors duration-150 focus-visible:outline-none';

  return (
    <div
    className={`group relative ${
        small ? "h-[180px]" : "h-[450px]"
    } w-full overflow-hidden border border-ink-border bg-ink-soft transition-colors duration-200 ${
        imagePreview ? "crosshairs" : ""
    }`}>
        <input type="file"
        accept='image/*'
        className='hidden'
        id={inputId}
        onChange={handleFileChange}
        />

        {uploading && (
            <div className='absolute inset-0 z-20 flex items-center justify-center bg-ink/70 backdrop-blur-sm'>
                <Loader2 size={small ? 22 : 30} className='animate-spin text-terra'/>
            </div>
        )}

        {imagePreview ? (
            <>
                {/* Actions — revealed on hover so they never fight the image for attention */}
                <div className='absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100'>
                    <button type='button' onClick={() => onEnhance ? onEnhance() : setOpenImageModal(true)}
                        aria-label='Enhance image'
                        className={`${actionBtn} hover:bg-terra hover:text-ink focus-visible:ring-2 focus-visible:ring-terra`}>
                        <WandSparkles size={16}/>
                    </button>
                    <button type='button' onClick={() => onRemove?.(index!)}
                        aria-label='Remove image'
                        className={`${actionBtn} hover:bg-neg hover:text-ink focus-visible:ring-2 focus-visible:ring-neg`}>
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

                {/* The lower pair of registration marks; one element only has
                    two pseudo-elements. */}
                <span className='xh-b' aria-hidden='true' />

                <span className='absolute inset-x-0 bottom-0 z-10 flex items-center justify-between border-t border-ink-border bg-ink/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-on-ink-muted backdrop-blur-sm'>
                    <span>fig.{String((index ?? 0) + 1).padStart(2, '0')} / product</span>
                    <span className='text-terra'>{size}</span>
                </span>
            </>
        ):(
            // The whole empty area is the upload target — not just a corner button.
            <label htmlFor={inputId}
            className='absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-4  border border-dashed border-ink-border bg-transparent px-6 text-center transition-colors duration-200 group-hover:border-terra/60 group-hover:bg-terra-soft'>
                <span className={`relative flex items-center justify-center border border-ink-border bg-ink text-terra transition-colors duration-200 group-hover:border-terra ${
                    small ? "h-11 w-11" : "h-14 w-14"
                }`}>
                    <ImagePlus size={small ? 18 : 24} strokeWidth={1.75} />
                    <span className='absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-terra-2' aria-hidden='true' />
                </span>

                <div className='space-y-1.5'>
                    <p className={`font-display font-medium tracking-tight text-on-ink ${
                        small ? "text-base" : "text-xl"
                    }`}>
                        <span className='text-terra'>Click to upload</span> an image
                    </p>
                    <p className='font-mono text-[10px] uppercase tracking-[0.14em] text-on-ink-muted'>
                        ratio <span className='figure text-on-ink'>{size}</span> · png or jpg
                    </p>
                </div>

                <span aria-hidden='true'
                className='pointer-events-none flex items-center gap-1.5 border border-ink-border bg-ink-raised px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-on-ink-muted'>
                    <Pencil size={11} />
                    browse files
                </span>
            </label>
        )}
    </div>

  )
}

export default ImagePlaceHolder
