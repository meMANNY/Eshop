import Header from '@/shared/widgets/header';
import Footer from '@/shared/widgets/footer';

/*
  The storefront chrome. It lives here rather than in the root layout so the
  auth screens in `(auth)` genuinely do not have it — sign-in, sign-up and
  password reset are a doorway, not a page of the shop, and the search bar and
  cart on a login screen offer you things you cannot do until you are through it.

  A route group changes nothing about the URLs: `(routes)/cart` is still /cart.

  `flex-1` on the main region is what keeps the footer at the bottom of a short
  page rather than floating halfway up it — the body is a flex column, set in the
  root layout.
*/
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
