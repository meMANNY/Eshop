"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Mail, RotateCcw, Smartphone, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import DeleteShopModal from "../../components/modals/DeleteShopModal";
import RestoreShopModal from "../../components/modals/RestoreShopModal";
import axiosInstance from "@/utils/axiosInstance";
import {
  Button,
  Figure,
  Label,
  Panel,
  PanelHead,
} from "@/shared/components/ui";

type GeneralSettings = {
  lowStockThreshold: number;
  notifications: { email: boolean; web: boolean; app: boolean };
};

export default function GeneralTab() {
  const qc = useQueryClient();
  const [openDelete, setOpenDelete] = useState(false);
  const [openRestore, setOpenRestore] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings", "general"],
    queryFn: async (): Promise<GeneralSettings> => {
      const res = await axiosInstance.get("/seller/api/get-shop-settings");
      const s = res?.data?.settings ?? {};
      return {
        lowStockThreshold: Number(s.lowStockThreshold ?? 10),
        notifications: {
          email: Boolean(s.notifications?.email ?? true),
          web: Boolean(s.notifications?.web ?? true),
          app: Boolean(s.notifications?.app ?? false),
        },
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: deletionState } = useQuery({
    queryKey: ["shop-deletion-state"],
    queryFn: async (): Promise<{
      isDeleted: boolean;
      deletedAt?: string | null;
    }> => {
      const res = await axiosInstance.get("/seller/api/get-shop-deletion-state");
      return res?.data ?? { isDeleted: false, deletedAt: null };
    },
    staleTime: 1000 * 30,
  });

  const isDeleted = !!deletionState?.isDeleted;
  const restoreDeadline = deletionState?.deletedAt
    ? new Date(deletionState.deletedAt)
    : null;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<GeneralSettings>({
    defaultValues: {
      lowStockThreshold: 10,
      notifications: { email: true, web: true, app: false },
    },
  });

  useEffect(() => {
    if (settings) {
      setValue("lowStockThreshold", settings.lowStockThreshold);
      setValue("notifications.email", settings.notifications.email);
      setValue("notifications.web", settings.notifications.web);
      setValue("notifications.app", settings.notifications.app);
    }
  }, [settings, setValue]);

  const updateMutation = useMutation({
    mutationFn: async (payload: GeneralSettings) =>
      axiosInstance.put("/seller/api/update-shop-settings", payload),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["settings", "general"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Couldn't save your settings");
    },
  });

  const deleteShopMutation = useMutation({
    mutationFn: async () => axiosInstance.delete("/seller/api/delete-shop"),
    onSuccess: () => {
      toast.success("Shop scheduled for deletion");
      setOpenDelete(false);
      qc.invalidateQueries({ queryKey: ["shop-deletion-state"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Couldn't delete your shop"),
  });

  const restoreShopMutation = useMutation({
    mutationFn: async () => axiosInstance.put("/seller/api/restore-shop"),
    onSuccess: () => {
      toast.success("Shop restored");
      setOpenRestore(false);
      qc.invalidateQueries({ queryKey: ["shop-deletion-state"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Couldn't restore your shop"),
  });

  const onSubmit = (formData: GeneralSettings) =>
    updateMutation.mutate(formData);

  return (
    <div className="max-w-3xl space-y-5">
      {/*
        Both settings were behind accordions that started closed, so the page
        opened showing nothing you could actually change — two rows for two
        settings. They're just visible now, and the two duplicate "Save changes"
        buttons (one per accordion, both submitting this same form) collapse into
        one save bar at the foot of the form.
      */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Panel>
          <PanelHead
            title="Shop preferences"
            note="How your shop warns you and how it reaches you."
          />

          <div className="space-y-6 p-5">
            <div>
              <Label htmlFor="lowStockThreshold">Low stock alert</Label>
              <p className="mb-2 text-sm text-[var(--muted)]">
                Warn me when a product drops to this many units or fewer.
              </p>
              <Controller
                name="lowStockThreshold"
                control={control}
                rules={{
                  required: "Enter a threshold",
                  validate: (v) =>
                    Number.isFinite(Number(v)) &&
                    Number(v) >= 0 &&
                    Number(v) <= 1_000_000
                      ? true
                      : "Enter a number between 0 and 1,000,000",
                }}
                render={({ field }) => (
                  <input
                    id="lowStockThreshold"
                    type="number"
                    min={0}
                    aria-invalid={errors.lowStockThreshold ? "true" : undefined}
                    className={`w-40 rounded-lg border bg-raised px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors ${
                      errors.lowStockThreshold
                        ? "border-neg/60"
                        : "border-rule focus:border-coral/60"
                    }`}
                    {...field}
                  />
                )}
              />
              {errors.lowStockThreshold ? (
                <p className="mt-1.5 text-xs text-neg">
                  {String(errors.lowStockThreshold.message)}
                </p>
              ) : null}
            </div>

            <div className="border-t border-rule pt-5">
              <Label>Order notifications</Label>
              <p className="mb-3 text-sm text-[var(--muted)]">
                Where to tell you when an order comes in.
              </p>
              <div className="flex flex-wrap gap-2">
                <Toggle
                  label="Email"
                  icon={<Mail size={14} />}
                  checked={watch("notifications.email")}
                  onChange={(v) =>
                    setValue("notifications.email", v, { shouldDirty: true })
                  }
                />
                <Toggle
                  label="Web"
                  icon={<Globe size={14} />}
                  checked={watch("notifications.web")}
                  onChange={(v) =>
                    setValue("notifications.web", v, { shouldDirty: true })
                  }
                />
                <Toggle
                  label="App"
                  icon={<Smartphone size={14} />}
                  checked={watch("notifications.app")}
                  onChange={(v) =>
                    setValue("notifications.app", v, { shouldDirty: true })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-rule px-5 py-4">
            <p className="text-xs text-[var(--faint)]">
              {isDirty ? "You have unsaved changes." : "Everything is saved."}
            </p>
            <Button
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending || !isDirty}
            >
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </Panel>
      </form>

      {/* ===== Danger zone ===== */}
      <Panel className="border-neg/30">
        <PanelHead
          title="Danger zone"
          note={
            isDeleted
              ? "Your shop is currently offline."
              : "Actions here affect your whole shop."
          }
        />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          {!isDeleted ? (
            <>
              <div className="flex items-start gap-3">
                <Trash2 className="mt-0.5 shrink-0 text-neg" size={18} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">
                    Delete this shop
                  </p>
                  {/*
                    The old copy said deletion was "irreversible" directly above a
                    restore path that gives you 28 days — one of the two had to be
                    wrong, and it was the scarier one.
                  */}
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    Comes off the storefront now. You have 28 days to change your
                    mind before it's permanent.
                  </p>
                </div>
              </div>
              {/* Was a small chevron-in-a-circle, which read as "go to a page"
                  rather than "destroy your shop". */}
              <Button variant="danger" onClick={() => setOpenDelete(true)}>
                <Trash2 size={16} aria-hidden="true" />
                Delete shop
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <RotateCcw className="mt-0.5 shrink-0 text-pos" size={18} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">
                    Restore this shop
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    {restoreDeadline ? (
                      <>
                        Restore before{" "}
                        <Figure className="text-[var(--text)]">
                          {restoreDeadline.toLocaleString()}
                        </Figure>
                        .
                      </>
                    ) : (
                      "You have 28 days from deletion to restore it."
                    )}
                  </p>
                </div>
              </div>
              <Button variant="primary" onClick={() => setOpenRestore(true)}>
                <RotateCcw size={16} aria-hidden="true" />
                Restore shop
              </Button>
            </>
          )}
        </div>
      </Panel>

      <DeleteShopModal
        open={openDelete}
        loading={deleteShopMutation.isPending}
        onClose={() => setOpenDelete(false)}
        onConfirm={() => deleteShopMutation.mutate()}
      />
      <RestoreShopModal
        open={openRestore}
        loading={restoreShopMutation.isPending}
        purgeAt={restoreDeadline}
        onClose={() => setOpenRestore(false)}
        onConfirm={() => restoreShopMutation.mutate()}
      />
    </div>
  );
}

function Toggle({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      /*
        These were plain buttons whose only state cue was their colour, so a
        screen reader announced "Email, button" whether it was on or off.
        `role="switch"` plus `aria-checked` is what actually carries the state.
      */
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        checked
          ? "border-coral/40 bg-coral-soft text-coral"
          : "border-rule bg-raised text-[var(--muted)] hover:text-[var(--text)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
