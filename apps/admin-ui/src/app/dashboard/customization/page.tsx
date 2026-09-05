"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ImageIcon, Layers, Tag, UploadCloud } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import {
  Button,
  Crumbs,
  EmptyState,
  Figure,
  PageShell,
  PageTitle,
  Panel,
  PanelHead,
  Select,
  TextField,
} from "@/shared/components/ui";

type Tab = "categories" | "logo" | "banner";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "categories", label: "Categories", icon: <Tag size={15} /> },
  { id: "logo", label: "Logo", icon: <Layers size={15} /> },
  { id: "banner", label: "Banner", icon: <ImageIcon size={15} /> },
];

export default function CustomizationPage() {
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>({});
  const [newCategory, setNewCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [logo, setLogo] = useState("");
  const [banner, setBanner] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/admin/api/get-site-config")
      .then((res) => {
        const data = res.data.data ?? res.data;
        setCategories(data.categories || []);
        setSubCategories(data.subCategories || {});
        setLogo(data.logo || "");
        setBanner(data.banner || "");
      })
      // Without this the request failing threw an unhandled rejection and the
      // page just sat there empty with no indication anything had gone wrong.
      .catch(() => toast.error("Couldn't load the site configuration."));
  }, []);

  const saveChanges = async (
    cats: string[],
    subs: Record<string, string[]>
  ) => {
    try {
      await axiosInstance.put("/admin/api/update-categories", {
        categories: cats,
        subCategories: subs,
      });
      setCategories(cats);
      setSubCategories(subs);
      toast.success("Categories updated");
    } catch {
      toast.error("Couldn't update categories. Try again.");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await saveChanges([...categories, newCategory.trim()], subCategories);
    setNewCategory("");
  };

  const handleAddSubCategory = async () => {
    if (!selectedCategory || !newSubCategory.trim()) return;
    await saveChanges(categories, {
      ...subCategories,
      [selectedCategory]: [
        ...(subCategories[selectedCategory] || []),
        newSubCategory.trim(),
      ],
    });
    setNewSubCategory("");
  };

  const convertFileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleUpload = async (file: File | null, type: "logo" | "banner") => {
    if (!file) return;
    setUploading(true);
    try {
      const fileName = await convertFileToBase64(file);
      const res = await axiosInstance.post(`/admin/api/upload-${type}`, {
        fileName,
      });
      const uploadedUrl = res.data.file_url;
      if (type === "logo") setLogo(uploadedUrl);
      else setBanner(uploadedUrl);
      toast.success(`${type === "logo" ? "Logo" : "Banner"} uploaded`);
    } catch {
      toast.error(`Couldn't upload the ${type}. Try again.`);
    } finally {
      setUploading(false);
    }
  };

  const renderUploadBox = (type: "logo" | "banner") => {
    const currentImage = type === "logo" ? logo : banner;
    const copy =
      type === "logo"
        ? { label: "Upload a site logo", hint: "150 × 150px, PNG or JPG" }
        : { label: "Upload a banner", hint: "1920 × 500px, JPG or WebP" };

    return (
      <Panel>
        <PanelHead
          title={type === "logo" ? "Site logo" : "Storefront banner"}
          note={
            currentImage
              ? "Replacing this takes effect on the storefront immediately."
              : "Nothing uploaded yet."
          }
        />
        <div className="space-y-5 p-5">
          {currentImage ? (
            <div className="border border-ink-border bg-ink p-4">
              <img
                src={currentImage}
                alt={`Current ${type}`}
                className={
                  type === "logo"
                    ? "h-28 w-28 object-contain"
                    : "h-48 w-full object-contain"
                }
              />
            </div>
          ) : null}

          <label
            htmlFor={`${type}-upload`}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-border px-6 py-10 text-center transition-colors hover:border-terra/50 hover:bg-white/[0.02]"
          >
            <UploadCloud size={26} className="text-on-ink-faint" aria-hidden="true" />
            <span className="text-sm font-medium text-on-ink">
              {copy.label}
            </span>
            <Figure className="text-xs text-on-ink-muted">{copy.hint}</Figure>
            <span className="mt-2 bg-terra px-3.5 py-2 text-sm font-medium text-ink">
              {uploading ? "Uploading…" : "Choose file"}
            </span>
            <input
              id={`${type}-upload`}
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files?.[0] || null, type)}
              className="hidden"
            />
          </label>
        </div>
      </Panel>
    );
  };

  return (
    <PageShell>
      <Crumbs trail={["Customization"]} />
      <PageTitle
        title="Customization"
        meta="What buyers see on the storefront: the category tree, the logo and the banner."
      />

      {/* Tabs. `role="tablist"` plus the pressed state is what makes these read
          as one control rather than three unrelated buttons. */}
      <div role="tablist" className="mb-6 flex gap-1 border-b border-ink-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm transition-colors ${
              tab === t.id
                ? "border-terra font-medium text-terra"
                : "border-transparent text-on-ink-muted hover:text-on-ink"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Panel>
            <PanelHead
              title="Category tree"
              note={
                <>
                  <Figure>{categories.length}</Figure> categor
                  {categories.length === 1 ? "y" : "ies"}
                </>
              }
            />
            {categories.length === 0 ? (
              <EmptyState
                icon={<Tag size={26} />}
                title="No categories yet"
                hint="Add your first category on the right. Buyers browse the storefront by these."
              />
            ) : (
              <ul className="divide-y divide-ink-border">
                {categories.map((cat) => (
                  <li key={cat} className="px-5 py-4">
                    <p className="text-sm font-medium text-on-ink">{cat}</p>
                    {(subCategories[cat] || []).length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {subCategories[cat].map((sub) => (
                          <span
                            key={sub}
                            className="rounded-full bg-ink-raised px-2.5 py-0.5 text-xs text-on-ink-muted"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-on-ink-faint">
                        No subcategories
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="space-y-5">
            <Panel>
              <PanelHead title="Add a category" />
              <div className="space-y-3 p-5">
                <TextField
                  label="Category name"
                  placeholder="Footwear"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button
                  variant="primary"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim()}
                  className="w-full"
                >
                  Add category
                </Button>
              </div>
            </Panel>

            <Panel>
              <PanelHead title="Add a subcategory" />
              <div className="space-y-3 p-5">
                <div>
                  <span className="mb-1.5 block text-label font-semibold uppercase text-on-ink-muted">
                    Parent category
                  </span>
                  <Select
                    label="Parent category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full"
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
                <TextField
                  label="Subcategory name"
                  placeholder="Running shoes"
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                />
                <Button
                  variant="primary"
                  onClick={handleAddSubCategory}
                  disabled={!selectedCategory || !newSubCategory.trim()}
                  className="w-full"
                >
                  Add subcategory
                </Button>
              </div>
            </Panel>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl">{renderUploadBox(tab)}</div>
      )}
    </PageShell>
  );
}
