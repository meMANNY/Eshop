import Image from 'next/image'
import React from 'react'

const ProductDetailsCard = ({data,setOpen}: {data:any,setOpen:(open: boolean) => void}) => {

    const [activeImage, setActiveImage] = React.useState(0);
  return (
    
    <div
    className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 animate-fadeIn"
    onClick={() => setOpen(false)}
    >
        <div
            className="w-[90%] md:w-[70%] min-h-[70vh] h-max bg-white shadow-xl rounded-2xl flex items-center p-6 relative overflow-y-scroll animate-slideDown"
            onClick={(e) => e.stopPropagation()}
        >
            <div className = "w-full flex flex-col md:flex-row ">
                <div className = "w-full md:w-1/2 h-full">
                    <Image
                    src={data?.images?.[activeImage]?.url}
                    alt={data?.images?.[activeImage]?.url}
                        width={500}
                        height={500}
                        className = "w-full object-contain rounded-lg"
                    />
                    <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-[400px]">
                            {data?.images?.map((image: any, i: number) => (
                                <div
                                key={i}
                                className={`cursor-pointer border rounded-md transition-all duration-200 ${
                                    activeImage === i
                                    ? "border-blue-500 shadow-md scale-105"
                                    : "border-transparent opacity-70 hover:opacity-100"
                                }`}
                                onClick={() => setActiveImage(i)}
                                >
                                <Image
                                    src={image.url}
                                    alt={`Thumbnail ${i}`}
                                    width={75}
                                    height={75}
                                    className="rounded-md"
                                />
                                </div>
                            ))}
                    </div>
                </div>

                
            </div>
        </div>
    </div>
    
  )
}

export default ProductDetailsCard

