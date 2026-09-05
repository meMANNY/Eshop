"use client";

import { Suspense, useEffect, useState } from "react";
import { loadStripe, Appearance, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import { XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import axiosInstance from "@/utils/axiosInstance";
import CheckoutForm from "@/shared/components/checkout/CheckoutForm";

type Coupon = null | {
  discountAmount?: number | string;
  discountPercent?: number | string;
  discountProductId?: string;
  code?: string;
};

function CheckoutContent() {
  const [clientSecret, setClientSecret] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [coupon, setCoupon] = useState<Coupon>(null);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    const fetchSessionAndClientSecret = async () => {
      if (!sessionId) {
        setError("Invalid Session. Please try again!");
        setLoading(false);
        return;
      }
      try {
        const verifyRes = await axiosInstance.get(
          `/order/api/verifying-payment-session?sessionId=${sessionId}`
        );
        const { totalAmount, sellers, cart, coupon } =
          verifyRes.data.session || {};
        if (
          !Array.isArray(sellers) ||
          sellers.length === 0 ||
          totalAmount == null
        )
          throw new Error("Invalid session");

        setCartItems(cart || []);
        setCoupon(coupon ?? null);

        const sellerStripeAccountId = sellers[0]?.stripeAccountId;
        if (!sellerStripeAccountId)
          throw new Error("Seller Stripe account is missing");

        /*
          The amount and the destination account used to be computed here and
          posted to the server, which charged whatever arrived. Both now come
          from the session the server priced, so this only names the session.
        */
        const intentRes = await axiosInstance.post(
          "order/api/create-payment-intent",
          { sessionId }
        );

        setClientSecret(intentRes.data.clientSecret);

        const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
        if (!pk) {
          throw new Error(
            "NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not set. Add it to apps/user-ui/.env and restart the dev server."
          );
        }

        // Stripe.js has to run in the same account context the PaymentIntent was
        // created in, which createPaymentIntent reports back as `scope`:
        //   "connected" → direct charge on the seller's account  → pass stripeAccount
        //   "platform"  → destination charge on the platform     → omit it
        setStripePromise(
          intentRes.data.scope === "connected"
            ? loadStripe(pk, {
                stripeAccount:
                  intentRes.data.stripeAccountId ?? sellerStripeAccountId,
              })
            : loadStripe(pk)
        );
      } catch (err) {
        console.error(err);
        setError("Something went wrong while processing your payment!");
      } finally {
        setLoading(false);
      }
    };
    fetchSessionAndClientSecret();
  }, [sessionId]);

  /*
    Stripe renders the card fields inside its own iframe, so they cannot inherit
    a single class from this app. `theme: "flat"` drops Stripe's default rounded,
    shadowed inputs, and these variables hand it the theme's actual tokens — most
    importantly `borderRadius: "0px"`, without which the one rounded rectangle on
    the whole storefront would be the payment form.
  */
  const appearance: Appearance = {
    theme: "flat",
    variables: {
      colorPrimary: "#C24A1B",
      colorBackground: "#F2EDE0",
      colorText: "#1A1A1A",
      colorDanger: "#A6321E",
      borderRadius: "0px",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": { border: "1px solid #D8D2C2", boxShadow: "none" },
      ".Input:focus": { border: "1px solid #FF6B35", boxShadow: "none" },
      ".Label": {
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        color: "#4D4639",
      },
    },
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-coral border-t-transparent" />
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <div className="w-full text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="text-neg w-10 h-10" />
          </div>
          <h2 className="text-xl font-semibold text-neg mb-2">
            Payment Failed
          </h2>
          <p className="text-sm text-ink-muted mb-6">
            {error}
            <br className="hidden sm:block" />
            Please go back and try again
          </p>
          <button
            onClick={() => router.push("/cart")}
            className="bg-coral text-[#2b0f0a] px-5 py-2 rounded-lg font-medium hover:bg-coral-dim hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );

  return (
    clientSecret &&
    stripePromise && (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <CheckoutForm
          clientSecret={clientSecret}
          cartItems={cartItems}
          coupon={coupon}
          sessionId={sessionId}
        />
      </Elements>
    )
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}