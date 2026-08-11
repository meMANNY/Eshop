"use client";

import useSeller from "@/hooks/useSeller";
import axiosInstance from "@/utils/axiosInstance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Input from "../../../../../../packages/components/input";

type FormValues = {
  name: string;
  phone_number: string;
  country: string;
  address: string;
  shopName: string;
  bio: string;
  category: string;
  shopAddress: string;
  opening_hours: string;
  closing_hours: string;
  website: string;
  shopPhone: string;
  coverBanner: string;
};

export default function EditProfilePage() {
  const { seller, isLoading } = useSeller();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>();

  // The seller arrives after the first render, so the form is populated on
  // arrival rather than through defaultValues.
  useEffect(() => {
    if (!seller) return;
    reset({
      name: seller.name ?? "",
      phone_number: seller.phone_number ?? "",
      country: seller.country ?? "",
      address: seller.address ?? "",
      shopName: seller.shop?.name ?? "",
      bio: seller.shop?.bio ?? "",
      category: seller.shop?.category ?? "",
      shopAddress: seller.shop?.address ?? "",
      opening_hours: seller.shop?.opening_hours ?? "",
      closing_hours: seller.shop?.closing_hours ?? "",
      website: seller.shop?.website ?? "",
      shopPhone: seller.shop?.phone_number ?? "",
      coverBanner: seller.shop?.coverBanner ?? "",
    });
  }, [seller, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) =>
      axiosInstance.put("/api/update-seller-profile", {
        seller: {
          name: values.name,
          phone_number: values.phone_number,
          country: values.country,
          address: values.address,
        },
        shop: {
          name: values.shopName,
          bio: values.bio,
          category: values.category,
          address: values.shopAddress,
          opening_hours: values.opening_hours,
          closing_hours: values.closing_hours,
          website: values.website,
          phone_number: values.shopPhone,
          coverBanner: values.coverBanner,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller"] });
      toast.success("Profile updated");
      router.push("/");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? "Couldn't save your changes"
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-[#ff6f61]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black p-8">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}
        <div className="mb-1 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-7 w-[3px] rounded-full bg-[#ff6f61] shadow-[0_0_10px_rgba(255,111,97,0.6)]"
          />
          <h2 className="text-2xl font-semibold text-white">Edit profile</h2>
        </div>

        <div className="mt-1 flex items-center text-sm">
          <Link
            href="/"
            className="text-slate-400 transition-colors hover:text-[#ff8a7d]"
          >
            Shop
          </Link>
          <ChevronRight size={16} className="mx-1 text-slate-600" />
          <span className="text-slate-200">Edit profile</span>
        </div>

        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-[#ff8a7d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
        >
          <ArrowLeft size={16} />
          Back to your shop
        </Link>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="mt-8 space-y-6"
        >
          {/* SHOP PROFILE */}
          <Card
            title="Shop profile"
            description="What buyers see on your storefront."
          >
            <Field label="Shop name" error={errors.shopName?.message}>
              <Input
                {...register("shopName", {
                  required: "Shop name is required",
                })}
              />
            </Field>

            <Field label="Category" error={errors.category?.message}>
              <Input
                {...register("category", { required: "Category is required" })}
                placeholder="e.g. Electronics"
              />
            </Field>

            <Field
              label="Bio"
              error={errors.bio?.message}
              hint="A short description of what you sell."
              full
            >
              <Input type="textarea" rows={4} {...register("bio")} />
            </Field>

            <Field label="Opening hours" error={errors.opening_hours?.message}>
              <Input {...register("opening_hours")} placeholder="9:00 AM" />
            </Field>

            <Field label="Closing hours" error={errors.closing_hours?.message}>
              <Input {...register("closing_hours")} placeholder="6:00 PM" />
            </Field>

            <Field label="Shop address" error={errors.shopAddress?.message} full>
              <Input {...register("shopAddress")} />
            </Field>

            <Field label="Shop phone" error={errors.shopPhone?.message}>
              <Input {...register("shopPhone")} />
            </Field>

            <Field
              label="Website"
              error={errors.website?.message}
              hint="Include https://"
            >
              <Input
                {...register("website", {
                  pattern: {
                    value: /^https?:\/\/.+/i,
                    message: "Must start with http:// or https://",
                  },
                })}
                placeholder="https://example.com"
              />
            </Field>

            <Field
              label="Cover banner URL"
              error={errors.coverBanner?.message}
              hint="Shown behind your shop name."
              full
            >
              <Input {...register("coverBanner")} />
            </Field>
          </Card>

          {/* ACCOUNT */}
          <Card
            title="Your details"
            description="Used for payouts and contact. Not shown to buyers."
          >
            <Field label="Full name" error={errors.name?.message}>
              <Input
                {...register("name", { required: "Name is required" })}
              />
            </Field>

            <Field label="Phone" error={errors.phone_number?.message}>
              <Input {...register("phone_number")} />
            </Field>

            <Field label="Country" error={errors.country?.message}>
              <Input {...register("country")} />
            </Field>

            <Field label="Address" error={errors.address?.message}>
              <Input {...register("address")} />
            </Field>

            <Field label="Email" hint="Email can't be changed here." full>
              <input
                value={seller?.email ?? ""}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-md border border-gray-700 bg-white/[0.02] p-2 text-slate-500 outline-none"
              />
            </Field>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/"
              className="rounded-lg border border-slate-700 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending || !isDirty}
              className="inline-flex items-center gap-2 rounded-lg bg-[#ff6f61] px-5 py-2 text-sm font-medium text-white shadow-lg shadow-[#ff6f61]/20 transition-colors hover:bg-[#e05a4d] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6f61]"
            >
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              )}
              {mutation.isPending ? "Saving" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Card = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-slate-800 bg-[#141922] p-6 shadow-md">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="mt-1 text-sm text-slate-400">{description}</p>
    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
  </div>
);

const Field = ({
  label,
  error,
  hint,
  full,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) => (
  <label className={`block ${full ? "sm:col-span-2" : ""}`}>
    <span className="mb-1 block text-sm font-medium text-slate-300">
      {label}
    </span>
    {children}
    {error ? (
      <span className="mt-1 block text-xs text-red-400">{error}</span>
    ) : hint ? (
      <span className="mt-1 block text-xs text-slate-500">{hint}</span>
    ) : null}
  </label>
);
