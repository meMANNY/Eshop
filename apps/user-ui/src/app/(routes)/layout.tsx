import Header from '@/shared/widgets/header';

/*
  The storefront chrome. It lives here rather than in the root layout so the
  auth screens in `(auth)` genuinely do not have it — sign-in, sign-up and
  password reset are a doorway, not a page of the shop, and the search bar and
  cart on a login screen offer you things you cannot do until you are through it.

  A route group changes nothing about the URLs: `(routes)/cart` is still /cart.
*/
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
