import Image from 'next/image'
import { useRouter } from 'next/navigation'
import ImageMagnifier from '../image-magnifier'
import React, { useState } from 'react'
import { Heart, X } from 'lucide-react'
import { CartIcon } from '../../../assets/svgs/cart-icon'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Ratings } from '../ratings/index'
import { useStore } from '@/store'
import useDeviceTracking from '@/hooks/useDeviceTracking'
import useLocationTracking from '@/hooks/useLocationTracking'
import useUser from '@/hooks/useUser'
import axiosInstance from '@/utils/axiosInstance'
import { isProtected } from '@/utils/protected'

const ProductDetailsCard = ({data,setOpen}: {data:any,setOpen:(open: boolean) => void}) => {
    const router = useRouter();

    const [activeImage, setActiveImage] = useState(0);
    const [isSelected, setIsSelected] = useState(data?.colors?.[0] || "");
    const [isSizeSelected, setIsSizeSelected] = useState(
    data?.sizes?.[0] || ""
  );
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const {user} = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();

    const addToCart = useStore((state: any) => state.addToCart);

    const addToWishlist = useStore((state: any) => state.addToWishlist);
    const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);

    const wishlist = useStore((state: any) => state.wishlist);
    const cart = useStore((state: any) => state.cart);

    const isWishlisted = wishlist.some((item: any) => item.id === data.id);
    const isInCart = cart.some((item: any) => item.id === data.id);

    const handleChat = async () => {

        if(isLoading)  return;
        setIsLoading(true);

        try{
            const res = await axiosInstance.post("/chatting/api/create-user-conversationGroup",{
                sellerId: data?.Shop?.sellerId
            },isProtected);
            // `newConversation` responds with { conversation, isNew } — there is no
            // top-level `conversationId`. Reading one produced the string "undefined"
            // in the URL, which reached Prisma as an ObjectID and threw P2023.
            router.push(`/inbox?conversationId=${res.data.conversation.id}`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }


  return (
    
    <div
    className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 animate-fadeIn"
    onClick={() => setOpen(false)}
    >
        <div
            className="w-[90%] md:w-[70%] min-h-[70vh] h-max bg-surface shadow-xl rounded-2xl flex items-center p-6 relative overflow-y-scroll animate-slideDown"
            onClick={(e) => e.stopPropagation()}
        >
                <button
            onClick={() => setOpen(false)}
            className="absolute top-[1px] right-[2px] bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-sm transition-all hover:scale-110"
            >
            <X size={20} />
            {""}
        </button>
            <div className = "w-full flex flex-col md:flex-row gap-6">
                <div className = "w-full md:w-1/2 flex flex-col items-center animate-fadeUp">
                    
                    <ImageMagnifier
                        src={data?.images?.[activeImage]?.url}
                        alt={data?.title}
                        width={400}
                        height={400}
                    />
                    <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-[400px]">
                            {data?.images?.map((image: any, i: number) => (
                                <div
                                key={i}
                                className={`cursor-pointer border rounded-md transition-all duration-200 ${
                                    activeImage === i
                                    ? "border-coral shadow-md scale-105"
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
                                // `Shop.avatar` is an `images[]` relation, so the raw value is
                                // an array of rows. `[]` is truthy, so passing it straight
                                // through meant the fallback never fired and next/image got an
                                // array as `src`.
                                data?.Shop?.avatar?.[0]?.url || "https://cdn-icons-png.flaticon.com/512/847/847969.png"
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
                                
                                    <p className="text-ink-muted flex items-center gap-2">
                                        <MapPin size={18} />{" "}
                                        {data?.Shop?.address || "Location Not Available"}
                                    </p>
                            </div>
                                <button
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 rounded-md text-white bg-blue-700 hover:bg-blue-600 font-medium transition"
                                onClick={() => handleChat()}
                            >
                                💬 Chat with Seller
                            </button>
                        </div>
                
                    </div>

                    <h3 className="text-xl font-semibold">{data?.title}</h3>
                    <p className="text-ink-muted">{data?.short_description}</p>
                    {data?.brand && (
                        <p className="text-ink-muted">
                            <strong>Brand:</strong> {data?.brand}
                        </p>
                    )}
                    
                     <div className="flex flex-col md:flex-row items-start gap-5 mt-2">
                        {data?.colors?.length > 0 && (
                            <div>
                            <strong>Color:</strong>
                            <div className="flex gap-2 mt-1">
                                {data.colors.map((color: string, i: number) => (
                                <button
                                    key={i}
                                    className={`w-8 h-8 rounded-full transition-all ${
                                    isSelected === color
                                        ? "scale-110 border-gray-600 shadow-md"
                                        : "border border-rule shadow-sm"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setIsSelected(color)}
                                />
                                ))}
                            </div>
                            </div>
                        )}

                        {data?.sizes?.length > 0 && (
                            <div>
                            <strong>Size:</strong>
                            <div className="flex gap-2 mt-1">
                                {data.sizes.map((size: string, i: number) => (
                                <button
                                    key={i}
                                    className={`px-4 py-2 rounded-md transition ${
                                    isSizeSelected === size
                                        ? "bg-gray-800 text-white"
                                        : "bg-gray-300 text-black"
                                    }`}
                                    onClick={() => setIsSizeSelected(size)}
                                >
                                    {size}
                                </button>
                                ))}
                            </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-2xl font-bold">${data?.sale_price}</span>
                        {data?.regular_price && (
                            <span className="text-lg text-neg line-through">
                            ${data?.regular_price}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            className={`px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded-md ${
                            quantity <= 1 ? "animate-shake" : ""
                            }`}
                            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        >
                            -
                        </button>
                        <span className="px-4 py-1 bg-gray-100 rounded-md">
                            {quantity}
                        </span>
                        <button
                            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded-md"
                            onClick={() => setQuantity((prev) => prev + 1)}
                        >
                            +
                        </button>
                    
                            <button
                                disabled={isInCart}
                                onClick={() =>
                                !isInCart &&
                                addToCart(
                                    { ...data, quantity: 1 },
                                    user,
                                    location,
                                    deviceInfo
                                )
                                }
                                className={`flex items-center gap-2 px-5 py-2 bg-[#ff5722] hover:bg-[#e64a19] text-white rounded-lg font-medium transition relative overflow-hidden "
                                }`}
                            >
                                <span className="absolute inset-0 bg-surface/20 animate-shine" />
                                <CartIcon size={18} /> Add to Cart
                            </button>
                        <Heart
                            onClick={() =>
                            isWishlisted
                                ? removeFromWishlist(data.id, user, location, deviceInfo)
                                : addToWishlist(
                                    { ...data, quantity: 1 },
                                    user,
                                    location,
                                    deviceInfo
                                )
                            }
                            className="opacity-[.7] cursor-pointer"
                            size={30}
                            fill={isWishlisted ? "red" : "transparent"}
                            stroke={isWishlisted ? "red" : "#4B5563"}
                        />
                    </div>
                    <span
                    className={data?.stock > 0 ? "text-green-600" : "text-neg"}
                    >
                    {data?.stock > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                    <div className="mt-4">
                        <span className="text-ink-muted text-sm">
                            Estimated Delivery:{" "}
                            <strong>{estimatedDelivery.toDateString()}</strong>
                        </span>
                    </div>
                    

                </div>

            </div>
        </div>
    </div>
    
  )
}

export default ProductDetailsCard

