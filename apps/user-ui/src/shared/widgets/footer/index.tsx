import Link from 'next/link';
import { Container, InkSection, Kicker, Serif, TileGrid } from '@/shared/components/ui';

/*
  The storefront had no footer at all — every page simply ran out. This one is the
  theme's ink band: a full-bleed near-black section that closes the cream page,
  carries the one call to action the marketplace actually wants to make (become a
  seller), and gives every page a set of exits.

  It uses only static links and the year, so it stays a server component and costs
  the page nothing.
*/

const TILES = [
  { label: 'Products', href: '/products' },
  { label: 'Shops', href: '/shops' },
  { label: 'Offers', href: '/offers' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Cart', href: '/cart' },
  { label: 'Profile', href: '/profile' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const sellerUrl = `${process.env.NEXT_PUBLIC_SELLER_SERVER_URI ?? ''}/signup`;

  return (
    <InkSection className="mt-20 lg:mt-28">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-10 border-b border-ink-border pb-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Kicker>/sell · open to new shops</Kicker>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[0.95] tracking-tight text-on-ink md:text-5xl lg:text-6xl">
              Sell the things you
              <br />
              <Serif>make</Serif> to people who care.
            </h2>
          </div>

          <div className="flex flex-wrap items-end gap-3 lg:col-span-5 lg:justify-end">
            <a
              href={sellerUrl}
              className="group inline-flex items-center gap-2 rounded-full border border-paper bg-paper px-6 py-3 text-sm font-medium tracking-tight text-ink transition-all duration-200 hover:-translate-y-px hover:border-terra hover:bg-terra"
            >
              Become a seller
              <span
                className="font-mono text-xs transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </a>
            <Link
              href="/shops"
              className="group inline-flex items-center gap-2 rounded-full border border-ink-border px-6 py-3 text-sm font-medium tracking-tight text-on-ink transition-colors duration-200 hover:border-paper hover:bg-ink-soft"
            >
              Browse shops
              <span
                className="font-mono text-xs transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                ↗
              </span>
            </Link>
          </div>
        </div>

        {/*
          The `gap-px` grid: the gaps show the border colour underneath, so six
          tiles read as a ruled table without any of them drawing a border.
        */}
        <div className="mt-12">
          <TileGrid
            items={TILES}
            className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
            tone="ink"
          />
        </div>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-6">
          <p className="font-serif text-[clamp(2rem,5vw,3.75rem)] italic leading-none text-on-ink">
            — <span className="text-terra">Eshop</span>
          </p>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-on-ink-faint">
            fin.
          </span>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink-border pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-on-ink-faint">
          <span>© {year} · Eshop</span>
          <span className="hidden sm:inline">
            independent sellers · shipped with care
          </span>
          <Link
            href="/products"
            className="group inline-flex items-center gap-1.5 transition-colors hover:text-on-ink"
          >
            help
            <span
              className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              ↗
            </span>
          </Link>
        </div>
      </Container>
    </InkSection>
  );
}
