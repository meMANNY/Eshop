import { ArrowUpRight, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string;
    avatar: string;
    coverBanner?: string;
    address?: string;
    followers?: [];
    ratings?: number;
    category?: string;
  };
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <div className="group relative w-full rounded-xl cursor-pointer bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#ff6f61]/40 transition-all duration-300 overflow-hidden">
      {/* COVER IMAGE */}
      <div className="h-[130px] w-full relative bg-slate-100">
        <Image
          src={
            shop?.coverBanner ||
            "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=500&auto=format&fit=crop&q=80"
          }
          alt="Cover"
          fill
          className="object-cover w-full h-full brightness-90 group-hover:brightness-100 transition-all duration-300"
        />

        {/* SMALL AVATAR centered at bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="relative w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white group-hover:scale-105 transition-transform duration-300">
            <Image
              src={
                shop?.avatar
                  ? shop?.avatar
                  : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
              }
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* SHOP NAME / INFO */}
      <div className="mt-10 text-center px-4 pb-4">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#ff6f61] transition-colors duration-300">
          {shop.name}
        </h3>

        <p className="text-xs text-slate-500 mt-1">
          {shop?.followers?.length ?? 0} followers
        </p>

        {/* ADDRESS AND RATINGS */}
        <div className="flex items-center justify-center text-xs text-slate-500 mt-2 gap-4 flex-wrap">
          {shop?.address && (
            <span className="flex items-center gap-1 max-w-[130px]">
              <MapPin className="w-4 h-4 shrink-0 text-[#ff6f61]" />
              <span className="truncate">{shop?.address}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            {shop?.ratings ?? "N/A"}
          </span>
        </div>

        {/* CATEGORY BADGE */}
        {shop?.category && (
          <div className="mt-3">
            <span className="inline-block bg-[#ff6f61]/10 text-[#ff6f61] px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
              {shop?.category}
            </span>
          </div>
        )}

        {/* BUTTON LINK */}
        <div className="mt-4">
          <Link
            href={`/shop/${shop.id}`}
            className="inline-flex items-center text-sm font-medium text-[#ff6f61] hover:text-[#e05a4d] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
          >
            Visit shop
            <ArrowUpRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;
