import { Container, Kicker, Serif, SysStrip, TileGrid } from "@/shared/components/ui";

/*
  There was no not-found page, so a bad URL fell through to Next's stock black
  "404 | This page could not be found" screen — a different product entirely,
  with no way back into the shop.

  This lives in `app/` rather than in `(routes)/`, which means it renders without
  the storefront header and footer. That is deliberate: a 404 is a dead end, and
  the tile grid below is a better set of exits than a nav bar the visitor has
  already failed to use.
*/
export const metadata = {
  title: "Not found · Eshop",
};

const SITEMAP = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Shops", href: "/shops" },
  { label: "Offers", href: "/offers" },
  { label: "Cart", href: "/cart" },
  { label: "Profile", href: "/profile" },
];

export default function NotFound() {
  return (
    <Container className="py-16 lg:py-24">
      <SysStrip
        className="mb-14"
        items={[
          { key: "~/404", value: "status: not_found" },
          { value: "code: 0x194", trailing: true },
        ]}
      />

      <h1 className="marquee-title text-[clamp(5rem,22vw,15rem)]" aria-label="404">
        4<span className="text-terra">0</span>4
        <span className="text-terra-2">.</span>
      </h1>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Kicker>wrong turn · nothing here</Kicker>
          <h2 className="mt-5 font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-4xl">
            This page is <Serif>not in the catalogue</Serif>.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-[1.55] text-ink-500">
            The link may be old, the product may have sold out, or the shop may
            have closed. Everything else is still where you left it.
          </p>
        </div>
      </div>

      <div className="mt-14">
        <TileGrid items={SITEMAP} />
      </div>
    </Container>
  );
}
