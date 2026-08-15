import { ArrowUpRight, MapPin, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Figure, Rating, StatusPill } from "../ui";

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string;
    /*
      `shops.avatar` is an `images[]` relation, so the API hands back an array of
      image rows — never a URL string. It was typed as `string` here, which meant
      the empty-array case (`[]`, a shop with no avatar) passed the truthy guard
      below and reached next/image as `src={[]}`.
    */
    avatar?: { url: string }[];
    coverBanner?: string;
    address?: string;
    followers?: [];
    ratings?: number;
    category?: string;
  };
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const avatarUrl = shop?.avatar?.[0]?.url;

  return (
    /*
      The whole card is the link now. It already carried `cursor-pointer`, which
      promised the card was clickable while only the small "Visit shop" line
      actually navigated.
    */
    <Link
      href={`/shop/${shop.id}`}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-card border border-rule bg-surface shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-coral/40 hover:shadow-lift"
    >
      <div className="relative h-[120px] w-full bg-sunken">
        {shop?.coverBanner ? (
          <Image
            src={shop.coverBanner}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, 260px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          /* Was a hotlinked Unsplash photo — an unrelated stock image standing in
             for a shop's own banner, and a third-party request per card. */
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-coral/15 to-coral/5">
            <Store size={26} className="text-coral-ink/50" aria-hidden="true" />
          </div>
        )}

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full border-4 border-surface bg-sunken shadow-card">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span className="font-jost text-xl font-semibold text-ink-muted">
                {shop.name?.[0]?.toUpperCase() ?? "S"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 pb-4 pt-11 text-center">
        <h3 className="clamp-1 font-jost text-base font-semibold text-ink transition-colors group-hover:text-coral-ink">
          {shop.name}
        </h3>

        <p className="mt-1 text-xs text-ink-faint">
          <Figure>{shop?.followers?.length ?? 0}</Figure> followers
        </p>

        <div className="mt-2.5">
          <Rating value={shop?.ratings ?? 0} />
        </div>

        {shop?.address ? (
          <span className="mt-2 flex max-w-full items-center gap-1 text-xs text-ink-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-coral-ink" aria-hidden="true" />
            <span className="truncate">{shop.address}</span>
          </span>
        ) : null}

        {shop?.category ? (
          <span className="mt-3 capitalize">
            <StatusPill tone="coral">{shop.category}</StatusPill>
          </span>
        ) : null}

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-coral-ink">
          Visit shop
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
};

export default ShopCard;
