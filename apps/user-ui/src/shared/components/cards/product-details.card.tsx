import Image from 'next/image'
import React from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Ratings } from '../ratings/index'

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
            <div className = "w-full flex flex-col md:flex-row gap-6">
                <div className = "w-full md:w-1/2 flex flex-col items-center animate-fadeUp">
                    <Image
                    src={data?.images?.[activeImage]?.url}
                    alt={data?.images?.[activeImage]?.url}
                        width={400}
                        height={400}
                        className = "rounded-lg object-contain h-[400px] w-[400px] transition-transform duration-300 hover:scale-105 animate-float"
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
                <div>
                    <div>
                        <div className="flex items-start gap-3">
                            <Image
                            src={
                                data?.Shop?.avatar || "https://images.unsplash.com/photo-1728577740843-5f29c7586afe?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YXZhdGFyfGVufDB8fDB8fHww"
                                
                            }
                            alt="Shop Logo"
                            width={60}
                            height={60}
                            className="rounded-full w-[60px] h-[60px] object-cover animate-float"
                            />
                            <div className="flex flex-col gap-1 items-start">
                                <Link
                                    href={`/shop/${data?.Shop?.id}`}
                                    className="text-lg font-medium"
                                >
                                    {data?.Shop?.name}
                                </Link>
                                <span>
                                    <Ratings rating={data?.Shop?.ratings}  />
                                </span>
                                
                                    <p className="text-gray-600 flex items-center gap-2">
                                        <MapPin size={18} />{" "}
                                        {data?.Shop?.address || "Location Not Available"}
                                    </p>
                            </div>
                        </div>
                
                    </div>
                </div>

            </div>
        </div>
    </div>
    
  )
}

export default ProductDetailsCard

