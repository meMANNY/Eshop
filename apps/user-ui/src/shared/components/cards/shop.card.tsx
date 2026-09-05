import { MapPin, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Chip, Figure, Rating } from "../ui";

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

/*
  The card is left-aligned rather than centred. Centred text is what the old card
  used to compensate for its circular avatar; with a square avatar and a ruled
  footer the content reads as a catalogue entry, and a column of them lines up
  down a shared left edge instead of wandering.
*/
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
      className="card-hover group relative flex h-full w-full flex-col border border-line bg-paper"
    >
      <div className="relative h-[120px] w-full border-b border-line bg-surface">
        {shop?.coverBanner ? (
          <Image
            src={shop.coverBanner}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, 260px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          /* Was a hotlinked Unsplash photo — an unrelated stock image standing in
             for a shop's own banner, and a third-party request per card. The
             replacement is a labelled blank, not a decorative gradient: it says
             what is missing rather than dressing it up. */
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface">
            <Store size={22} className="text-ink-300" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-300">
              no banner
            </span>
          </div>
        )}

        {/* Square, overlapping the rule — the same frame device the figures use. */}
        <div className="absolute -bottom-8 left-5">
          <div className="relative grid h-16 w-16 place-items-center overflow-hidden border border-ink-line bg-paper">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill unoptimized className="object-cover" />
            ) : (
              <span className="font-display text-xl font-medium text-ink-500">
                {shop.name?.[0]?.toUpperCase() ?? "S"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-11">
        <h3 className="clamp-1 font-display text-base font-medium tracking-tight text-ink transition-colors group-hover:text-terra lg:text-lg">
          {shop.name}
        </h3>

        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
          <Figure>{shop?.followers?.length ?? 0}</Figure> followers
        </p>

        <div className="mt-3">
          <Rating value={shop?.ratings ?? 0} />
        </div>

        {shop?.address ? (
          <span className="mt-3 flex max-w-full items-center gap-1.5 text-xs text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-terra-2" aria-hidden="true" />
            <span className="truncate">{shop.address}</span>
          </span>
        ) : null}

        {shop?.category ? (
          <span className="mt-3.5 capitalize">
            <Chip>{shop.category}</Chip>
          </span>
        ) : null}

        <span className="link-underline mt-auto inline-flex items-center gap-1.5 pt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors group-hover:text-terra-2">
          visit shop
          <span
            className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            ↗
          </span>
        </span>
      </div>
    </Link>
  );
};

export default ShopCard;
