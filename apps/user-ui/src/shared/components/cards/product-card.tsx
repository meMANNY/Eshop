import React,{useState,useEffect} from 'react'
import Link from 'next/link'
import { Ratings } from '../ratings'
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import ProductDetailsCard from './product-details.card';
import { useStore } from '@/store';
import useUser from '@/hooks/useUser';
import useLocationTracking from '@/hooks/useLocationTracking';
import useDeviceTracking from '@/hooks/useDeviceTracking';


// Inline SVG placeholder — renders instantly, never hotlink-blocked, no network needed.


const ProductCard = ({product,isEvent}: {product:any,isEvent?:boolean}) => {

    const [timeLeft, setTimeLeft] = useState("");
    const {user} = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    const [open, setOpen] = useState(false);
    const addToWishlist = useStore((state) => state.addToWishlist);
    const removeFromWishlist = useStore((state) => state.removeFromWishlist);
    const addToCart = useStore((state) => state.addToCart);
    const wishlist = useStore((state) => state.wishlist);
    const isWishlisted = wishlist.some((item: any) => item.id === product.id);
    const cart = useStore((state) => state.cart);
    const isInCart = cart.some((item: any) => item.id === product.id);

    useEffect(() => {
    if (isEvent && product?.ending_date) {
      const interval = setInterval(() => {
        const endTime = new Date(product.ending_date).getTime();
        const now = Date.now();
        const diff = endTime - now;
        if (diff <= 0) {
          setTimeLeft("Expired");
          clearInterval(interval);
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m left with this price`);
      }, 60000);
      return clearInterval(interval);
    }
  }, [isEvent, product?.ending_date]);


  return (
    <div className='w-full min-h-[350px] h-max bg-white rounded-lg relative overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group py-2'>
        {
            isEvent && (
                <div className='absolute top-2 left-2 bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded-sm shadow-md '>
                    OFFER
                </div>
            )
        }
        {product?.stock <= 5 && (
            <div className = "absolute top-2 right-2 bg-yellow-400 text-slate-700 text-[10px] font-semibold px-2 py-1 rounded-sm shadow-md">
                Limited Stock
            </div>
        )}
        <Link href={`/product/${product?.slug}`}>
        <img src={product.images[0]?.url || 'https://images.unsplash.com/photo-1749716491521-af90e3b6feb6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGhvbmV8ZW58MHx8MHx8fDA%3D'} alt={product?.title} width={300} height={200} className='w-full h-[200px] object-cover rounded-t-md transition-transform duration-500 group-hover:scale-105'/>
        </Link>
        <Link href = {`/shop/${product?.Shop?.slug}`} className = "absolute top-2 left-2 bg-[#ff6f61] text-white text-[10px] font-semibold px-2 py-1 rounded-sm shadow-md hover:bg-[#e05a4d] transition-all duration-200">
            {product?.Shop?.name}
        </Link>
        <Link href={`/product/${product?.slug}`}>
            
                <h3 className='text-base text-gray-800 font-semibold px-3 line-clamp-1 group-hover:text-black transition'>{product?.title}</h3>
            
        </Link>
        <div className = "px-3 mt-2">
            <Ratings rating={product?.ratings} />
        </div>
              <div className="mt-3 flex justify-between items-center px-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-gray-900">
              ${product?.sale_price}
            </span>

            {product?.regular_price &&
              product?.regular_price > product?.sale_price && (
                <>
                  <span className="text-sm line-through text-gray-400">
                    ${product?.regular_price}
                  </span>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    -
                    {Math.round(
                      (100 * (product?.regular_price - product?.sale_price)) /
                        product?.regular_price
                    )}
                    %
                  </span>
                </>
              )}
          </div>
          <span className="text-[11px] text-gray-500 mt-1">
            {product?.totalSales} sold ✅
          </span>
        </div>
      </div>


        {isEvent && timeLeft && (
        <div className="mt-2 px-3">
          <span className="inline-block text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
            {timeLeft}
          </span>
        </div>
      )}
    
    <div className="absolute flex flex-col gap-3 right-3 top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-3 group-hover:translate-x-0">
        <div className="bg-white rounded-full p-[6px] shadow-lg hover:shadow-xl transition-all hover:scale-110">
          <Heart 
            onClick={() =>
              isWishlisted
                ? removeFromWishlist(product.id, user, location, deviceInfo)
                : addToWishlist(
                    { ...product, quantity: 1 },
                    user,
                    location,
                    deviceInfo
                  )
            }
            className="cursor-pointer"
            size={22}
            fill={isWishlisted ? "red" : "transparent"}
            stroke={isWishlisted ? "red" : "#4B5563"}
          />
        </div>
        <div className="bg-white rounded-full p-[6px] shadow-lg hover:shadow-xl transition-all hover:scale-110">
          <Eye
            className="cursor-pointer text-[#4b5563]"
            size={22}
            onClick={() => setOpen(!open)}
          />
        </div>

         <div className="bg-white rounded-full p-[6px] shadow-lg hover:shadow-xl transition-all hover:scale-110">
          <ShoppingBag
            onClick={() =>
              !isInCart &&
              addToCart({ ...product, quantity: 1 }, user, location, deviceInfo)
            }
            className="cursor-pointer text-[#4b5563]"
            size={22}
          />
        </div>
    

        
        </div>
        {open && <ProductDetailsCard data={product} setOpen={setOpen} />}
    </div>
)
}


export default ProductCard
