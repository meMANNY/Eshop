"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {countries} from "../../../configs/constants";
import { MapPin, Plus, Trash, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Loader from "../Loader";
import axiosInstance from "@/utils/axiosInstance";
export default function ShippingAddressSection() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: "Home",
      name: "",
      street: "",
      city: "",
      zip: "",
      country: "Egypt",
      isDefault: "false",
    },
  });

  const { mutate: addAddress, isPending } = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.post("/api/add-address", payload); 
      return res.data.address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      reset();
      setShowModal(false);
    },
  });

  const { mutate: deleteAddress, isPending: idDeleting } = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/delete-address/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
    },
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/shipping-addresses");
      return res.data.addresses;
    },
    staleTime: 3 * 60 * 60,
  });

  const onSubmit = async (data: any) => {
    addAddress({ ...data, isDefault: data?.isDefault === "true" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium tracking-tight text-ink">
          Saved Addresses
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-ink text-paper px-3 py-1.5 text-sm font-medium hover:bg-terra hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/40"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {/* Addresses */}
      <div>
        {addressesLoading ? (
          <p className="text-sm text-ink-500 text-center py-4">
            Loading addresses...
          </p>
        ) : !addresses || addresses.length === 0 ? (
          <p className="text-sm text-ink-500 text-center py-4">
            No saved addresses found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {addresses.map((address: any) => (
              <div
                key={address.id}
                className="relative border border-line p-5 bg-paper hover:border-terra/40 hover:shadow-lift hover:-translate-y-1 transition-all duration-300"
              >
                {address?.isDefault && (
                  <span className="absolute top-3 right-3 bg-terra-soft text-terra-2 text-label font-semibold uppercase px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}

                <div className="flex items-start gap-3 text-ink-500">
                  <div className="mt-0.5 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-terra-2" />
                  </div>
                  <div className="text-sm leading-relaxed">
                    <p className="font-semibold text-ink">
                      {address?.label} — {address?.name}
                    </p>
                    <p className="text-ink-500">
                      {address?.street}, {address?.city}, {address?.zip},{" "}
                      {address?.country}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    className="flex items-center gap-1 text-xs text-neg hover:text-neg/80 hover:underline transition"
                    onClick={() => deleteAddress(address.id)}
                    disabled={idDeleting}
                  >
                    <Trash className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-paper w-full max-w-md p-6 shadow-pop relative animate-fadeIn border border-line">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-500 transition"
            >
              <X className="w-5 h-5" />
              {""}
            </button>

            {/* Header */}
            <h3 className="mb-5 text-center font-display text-xl font-medium tracking-tight text-ink">
              Add New Address
            </h3>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Address Type */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  Address Type
                </label>
                <select
                  {...register("label")}
                  className="w-full border border-line px-3 py-2 text-sm focus:border-terra focus:ring-2 focus:ring-terra/25 focus:outline-none transition-colors"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <input
                  placeholder="Full Name"
                  {...register("name", { required: "Name is required!" })}
                  className="w-full border border-line px-3 py-2 text-sm focus:border-terra focus:ring-2 focus:ring-terra/25 focus:outline-none transition-colors"
                />
                {errors.name && (
                  <p className="text-neg text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Street */}
              <div>
                <input
                  placeholder="Street Address"
                  {...register("street", { required: "Street is required!" })}
                  className="w-full border border-line px-3 py-2 text-sm focus:border-terra focus:ring-2 focus:ring-terra/25 focus:outline-none transition-colors"
                />
                {errors.street && (
                  <p className="text-neg text-xs mt-1">
                    {errors.street.message}
                  </p>
                )}
              </div>

              {/* City */}
              <div>
                <input
                  placeholder="City"
                  {...register("city", { required: "City is required!" })}
                  className="w-full border border-line px-3 py-2 text-sm focus:border-terra focus:ring-2 focus:ring-terra/25 focus:outline-none transition-colors"
                />
                {errors.city && (
                  <p className="text-neg text-xs mt-1">
                    {errors.city.message}
                  </p>
                )}
              </div>

              {/* ZIP Code */}
              <div>
                <input
                  placeholder="ZIP / Postal Code"
                  {...register("zip", { required: "ZIP Code is required!" })}
                  className="w-full border border-line px-3 py-2 text-sm focus:border-terra focus:ring-2 focus:ring-terra/25 focus:outline-none transition-colors"
                />
                {errors.zip && (
                  <p className="text-neg text-xs mt-1">
                    {errors.zip.message}
                  </p>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  Country
                </label>
                <select
                  {...register("country")}
                  className="w-full border border-line px-3 py-2 text-sm focus:border-terra focus:ring-2 focus:ring-terra/25 focus:outline-none transition-colors"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Option */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  Default Setting
                </label>
                <select
                  {...register("isDefault")}
                  className="w-full border border-line px-3 py-2 text-sm focus:border-terra focus:ring-2 focus:ring-terra/25 focus:outline-none transition-colors"
                >
                  <option value="true">Set as Default</option>
                  <option value="false">Not Default</option>
                </select>
              </div>

              {/* Submit */}
              <button
                className="w-full bg-ink text-paper font-medium text-sm py-2.5 hover:bg-terra hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/40 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader color="text-white" size={20} />
                    Saving...
                  </div>
                ) : (
                  "Save Address"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}