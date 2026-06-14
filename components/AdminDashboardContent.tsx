"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, BadgePercent, BarChart3, Boxes, FileText, ImagePlus, PackagePlus, Palette, Pencil, Share2, Trash2, UsersRound } from "lucide-react";
import type { DiscountCode, Order, Product } from "@/lib/data";
import { formatOmr, getProductPricing, isLowStock, isOutOfStock } from "@/lib/data";
import type { Collection } from "@/lib/data";
import { notifyCollectionsChanged, useStoredCollections } from "@/lib/useStoredCollections";
import { notifyProductsChanged, useStoredProducts } from "@/lib/useStoredProducts";
import { saveSiteSettings, useSiteSettings } from "@/lib/useSiteSettings";
import { notifyOrdersChanged, useStoredOrders } from "@/lib/useStoredOrders";
import { notifyDiscountCodesChanged, saveLocalDiscountCodes, useStoredDiscountCodes } from "@/lib/useStoredDiscountCodes";
import { useSupabaseProfiles } from "@/lib/useSupabaseProfiles";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { deleteCollection as deleteSupabaseCollection, deleteDiscountCode as deleteSupabaseDiscountCode, deleteProduct as deleteSupabaseProduct, fetchCurrentProfile, updateOrderPaymentStatus, updateOrderStatus, uploadStoreImage, upsertCollection, upsertDiscountCode, upsertProduct } from "@/lib/supabaseCatalog";

export function AdminDashboardContent() {
  const router = useRouter();
  const productList = useStoredProducts();
  const collectionList = useStoredCollections();
  const discountCodeList = useStoredDiscountCodes();
  const orderList = useStoredOrders();
  const profileList = useSupabaseProfiles();
  const siteSettings = useSiteSettings();
  const [editingSlug, setEditingSlug] = useState("");
  const [editingCollectionId, setEditingCollectionId] = useState("");
  const [editingDiscountId, setEditingDiscountId] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadWarning, setUploadWarning] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const metricCards = useMemo(() => {
    const today = new Date().toLocaleDateString("en-OM");
    const paidOrders = orderList.filter((order) => order.paid);
    const productCounts = new Map<string, number>();

    orderList.forEach((order) => {
      order.products?.forEach((product) => {
        productCounts.set(product.name, (productCounts.get(product.name) || 0) + product.quantity);
      });
    });

    const bestSelling = Array.from(productCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "No best-sellers yet";

    return [
      ["Total revenue", formatOmr(paidOrders.reduce((total, order) => total + order.total, 0))],
      ["Today's revenue", formatOmr(paidOrders.filter((order) => order.date === today).reduce((total, order) => total + order.total, 0))],
      ["Total orders", orderList.length],
      ["Pending orders", orderList.filter((order) => order.status === "pending").length],
      ["Preparing orders", orderList.filter((order) => order.status === "preparing").length],
      ["Delivered orders", orderList.filter((order) => order.status === "delivered").length],
      ["Cancelled orders", orderList.filter((order) => order.status === "cancelled").length],
      ["Customers", profileList.filter((profile) => !profile.isAdmin).length],
      ["Best-selling", bestSelling]
    ];
  }, [orderList, profileList]);

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      if (!supabase || !isSupabaseConfigured) {
        setIsAdmin(false);
        router.replace("/admin-login");
        return;
      }

      const profile = await fetchCurrentProfile().catch(() => null);
      if (!active) {
        return;
      }

      setIsAdmin(Boolean(profile?.isAdmin));
      if (!profile?.isAdmin) {
        router.replace("/admin-login");
      }
    }

    void verifyAdmin();
    const { data } = supabase?.auth.onAuthStateChange(() => {
      void verifyAdmin();
    }) || { data: { subscription: null } };

    return () => {
      active = false;
      data.subscription?.unsubscribe();
    };
  }, [router]);

  function selectedProduct() {
    return productList.find((product) => product.slug === editingSlug);
  }

  function selectedCollection() {
    return collectionList.find((collection) => collection.id === editingCollectionId);
  }

  function selectedDiscountCode() {
    return discountCodeList.find((code) => code.id === editingDiscountId);
  }

  function warnIfLargeImage(file?: File) {
    if (file && file.size > 1024 * 1024) {
      setUploadWarning("For faster loading, compress product and site images before upload. This file is over 1MB.");
      return;
    }

    setUploadWarning("");
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const originalPrice = Number(formData.get("originalPrice") || 0);
    const salePrice = Number(formData.get("salePrice") || 0);
    const price = salePrice > 0 && salePrice < originalPrice ? salePrice : originalPrice;
    const stock = Number(formData.get("stock") || 0);
    const notes = String(formData.get("notes") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const collectionId = String(formData.get("collectionId") || "");
    const tags = String(formData.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const isFeatured = formData.get("isFeatured") === "on";
    const file = formData.get("photo");

    if (!name) {
      return;
    }

    const current = selectedProduct();
    const uploadedPhoto = file instanceof File && file.size > 0 ? await uploadStoreImage("product-images", file, "products") : "";
    const slug = current?.slug || `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
    const product: Product = {
      slug,
      name,
      price,
      originalPrice,
      salePrice: salePrice || undefined,
      stock,
      notes,
      description,
      volume: "Boutique item",
      color: current?.color || "#151413",
      accent: current?.accent || "#faf9f6",
      collectionId: collectionId || undefined,
      tags,
      isFeatured,
      createdAt: current?.createdAt || new Date().toISOString(),
      imageUrl: uploadedPhoto || photoPreview || current?.imageUrl
    };

    await upsertProduct(product);
    notifyProductsChanged();
    setEditingSlug("");
    setPhotoPreview("");
    form.reset();
  }

  async function removeProduct(slug: string) {
    await deleteSupabaseProduct(slug);
    notifyProductsChanged();
    if (editingSlug === slug) {
      setEditingSlug("");
      setPhotoPreview("");
    }
  }

  const editingProduct = selectedProduct();
  const editingCollection = selectedCollection();
  const editingDiscountCode = selectedDiscountCode();

  async function submitCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("collectionName") || "").trim();
    const description = String(formData.get("collectionDescription") || "").trim();
    const file = formData.get("collectionImage");

    if (!name) {
      return;
    }

    const current = selectedCollection();
    const uploadedImage = file instanceof File && file.size > 0 ? await uploadStoreImage("collection-images", file, "collections") : "";
    const collection: Collection = {
      id: current?.id || crypto.randomUUID(),
      name,
      description,
      imageUrl: uploadedImage || current?.imageUrl
    };

    await upsertCollection(collection, current ? collectionList.findIndex((item) => item.id === current.id) : collectionList.length);
    notifyCollectionsChanged();
    setEditingCollectionId("");
    form.reset();
  }

  async function removeCollection(id: string) {
    await deleteSupabaseCollection(id);
    notifyCollectionsChanged();
    notifyProductsChanged();
    if (editingCollectionId === id) {
      setEditingCollectionId("");
    }
  }

  async function moveCollection(id: string, direction: "up" | "down") {
    const index = collectionList.findIndex((collection) => collection.id === id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= collectionList.length) {
      return;
    }
    const nextCollections = [...collectionList];
    const [collection] = nextCollections.splice(index, 1);
    nextCollections.splice(targetIndex, 0, collection);
    await Promise.all(nextCollections.map((item, sortOrder) => upsertCollection(item, sortOrder)));
    notifyCollectionsChanged();
  }

  async function submitDiscountCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const code = String(formData.get("discountCode") || "").trim().toUpperCase();
    const type = String(formData.get("discountType") || "fixed") === "percentage" ? "percentage" : "fixed";
    const value = Number(formData.get("discountValue") || 0);
    const minimumOrderAmount = Number(formData.get("minimumOrderAmount") || 0);
    const expiresAt = String(formData.get("expiresAt") || "");
    const current = selectedDiscountCode();

    if (!code || value <= 0) {
      return;
    }

    const discountCode: DiscountCode = {
      id: current?.id || crypto.randomUUID(),
      code,
      type,
      value,
      isActive: formData.get("isActive") === "on",
      minimumOrderAmount: minimumOrderAmount > 0 ? minimumOrderAmount : undefined,
      expiresAt: expiresAt || undefined,
      createdAt: current?.createdAt || new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      await upsertDiscountCode(discountCode);
      notifyDiscountCodesChanged();
    } else {
      saveLocalDiscountCodes([discountCode, ...discountCodeList.filter((item) => item.id !== discountCode.id)]);
    }

    setEditingDiscountId("");
    form.reset();
  }

  async function removeDiscountCode(id: string) {
    if (isSupabaseConfigured) {
      await deleteSupabaseDiscountCode(id);
      notifyDiscountCodesChanged();
    } else {
      saveLocalDiscountCodes(discountCodeList.filter((code) => code.id !== id));
    }

    if (editingDiscountId === id) {
      setEditingDiscountId("");
    }
  }

  async function changeOrderStatus(orderId: string, status: Order["status"]) {
    await updateOrderStatus(orderId, status);
    notifyOrdersChanged();
  }

  async function changeOrderPaymentStatus(orderId: string, paymentStatus: NonNullable<Order["paymentStatus"]>) {
    await updateOrderPaymentStatus(orderId, paymentStatus);
    notifyOrdersChanged();
  }

  async function submitSiteSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const logo = formData.get("logo");
    const hero = formData.get("hero");
    const brandStoryImage = formData.get("brandStoryImage");
    const loginImage = formData.get("loginImage");
    const logoUrl = logo instanceof File && logo.size > 0 ? await uploadStoreImage("site-assets", logo, "logos") : siteSettings.logoUrl;
    const heroImageUrl = hero instanceof File && hero.size > 0 ? await uploadStoreImage("site-assets", hero, "hero") : siteSettings.heroImageUrl;
    const brandStoryImageUrl = brandStoryImage instanceof File && brandStoryImage.size > 0 ? await uploadStoreImage("site-assets", brandStoryImage, "brand-story") : siteSettings.brandStoryImageUrl;
    const loginImageUrl = loginImage instanceof File && loginImage.size > 0 ? await uploadStoreImage("site-assets", loginImage, "login") : siteSettings.loginImageUrl;

    await saveSiteSettings({
      ...siteSettings,
      logoUrl,
      heroImageUrl,
      brandStoryImageUrl,
      loginImageUrl,
      heroTitle: String(formData.get("heroTitle") || ""),
      heroSubtitle: String(formData.get("heroSubtitle") || ""),
      newestProductsTitle: String(formData.get("newestProductsTitle") || ""),
      newestProductsSubtitle: String(formData.get("newestProductsSubtitle") || ""),
      featuredCollectionsTitle: String(formData.get("featuredCollectionsTitle") || ""),
      featuredCollectionsSubtitle: String(formData.get("featuredCollectionsSubtitle") || ""),
      brandStoryVisible: formData.get("brandStoryVisible") === "on",
      brandStoryTitle: String(formData.get("brandStoryTitle") || ""),
      brandStorySubtitle: String(formData.get("brandStorySubtitle") || ""),
      brandText: String(formData.get("brandText") || ""),
      brandStoryButtonText: String(formData.get("brandStoryButtonText") || ""),
      brandStoryButtonLink: String(formData.get("brandStoryButtonLink") || ""),
      loginTitle: String(formData.get("loginTitle") || ""),
      loginSubtitle: String(formData.get("loginSubtitle") || ""),
      createAccountTitle: String(formData.get("createAccountTitle") || ""),
      createAccountSubtitle: String(formData.get("createAccountSubtitle") || ""),
      verificationMessage: String(formData.get("verificationMessage") || ""),
      instagram: String(formData.get("instagram") || ""),
      tiktok: String(formData.get("tiktok") || ""),
      snapchat: String(formData.get("snapchat") || ""),
      x: String(formData.get("x") || ""),
      facebook: String(formData.get("facebook") || ""),
      email: String(formData.get("email") || ""),
      accentColor: String(formData.get("accentColor") || ""),
      footerText: String(formData.get("footerText") || ""),
      enabledRegions: ["Muscat, Oman"]
    });
  }

  if (!isAdmin) {
    return (
      <section className="container-pad py-16">
        <p className="text-sm text-ink/62">Checking admin access...</p>
      </section>
    );
  }

  return (
    <section className="container-pad py-12">
      <div className="mb-10 flex flex-col gap-4 border-b border-ink/12 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-brass">Private admin area</p>
          <h1 className="mt-4 font-serif text-6xl">Vaporis Dashboard</h1>
        </div>
        <button
          onClick={async () => {
            await supabase?.auth.signOut();
            router.push("/admin-login");
          }}
          className="w-fit border border-ink px-5 py-3 text-xs uppercase tracking-[0.18em]"
        >
          Sign out
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metricCards.map(([label, value]) => (
          <div key={label} className="border border-ink/12 bg-paper p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-ink/48">{label}</p>
            <p className="mt-3 font-serif text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <section className="border border-ink/12 bg-paper p-6">
          <div className="mb-10 border-b border-ink/10 pb-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-3xl">Collections</h2>
              <button type="button" className="inline-flex items-center gap-2 bg-ink px-4 py-3 text-xs uppercase tracking-[0.18em] text-paper"><Boxes size={16} /> Add</button>
            </div>
            <form className="grid gap-4 border border-ink/10 bg-porcelain p-5" onSubmit={submitCollection}>
              <input key={`collection-name-${editingCollectionId}`} name="collectionName" className="border border-ink/15 bg-paper px-4 py-3" placeholder="Collection name" defaultValue={editingCollection?.name} required />
              <textarea key={`collection-description-${editingCollectionId}`} name="collectionDescription" className="min-h-20 border border-ink/15 bg-paper px-4 py-3" placeholder="Collection description" defaultValue={editingCollection?.description} />
              <input name="collectionImage" className="border border-ink/15 bg-paper px-4 py-3" type="file" accept="image/*" aria-label="Upload collection image" onChange={(event) => warnIfLargeImage(event.target.files?.[0])} />
              <div className="flex gap-3">
                <button className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.18em] text-paper">{editingCollection ? "Update collection" : "Save collection"}</button>
                <button type="button" onClick={() => setEditingCollectionId("")} className="border border-ink px-5 py-3 text-xs uppercase tracking-[0.18em]">Clear</button>
              </div>
            </form>
            <div className="mt-5 grid gap-3">
              {collectionList.length > 0 ? collectionList.map((collection) => (
                <article key={collection.id} className="grid gap-3 border border-ink/10 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <strong>{collection.name}</strong>
                    {collection.description ? <p className="mt-1 text-sm text-ink/60">{collection.description}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => moveCollection(collection.id, "up")} className="grid size-10 place-items-center rounded-full border border-ink/15" aria-label={`Move ${collection.name} up`}><ArrowUp size={15} /></button>
                    <button type="button" onClick={() => moveCollection(collection.id, "down")} className="grid size-10 place-items-center rounded-full border border-ink/15" aria-label={`Move ${collection.name} down`}><ArrowDown size={15} /></button>
                    <button type="button" onClick={() => setEditingCollectionId(collection.id)} className="grid size-10 place-items-center rounded-full border border-ink/15" aria-label={`Edit ${collection.name}`}><Pencil size={15} /></button>
                    <button type="button" onClick={() => removeCollection(collection.id)} className="grid size-10 place-items-center rounded-full border border-ink/15" aria-label={`Delete ${collection.name}`}><Trash2 size={15} /></button>
                  </div>
                </article>
              )) : (
                <div className="border border-ink/10 px-5 py-8 text-center text-sm text-ink/62">No collections yet.</div>
              )}
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-3xl">Products</h2>
            <button type="button" className="inline-flex items-center gap-2 bg-ink px-4 py-3 text-xs uppercase tracking-[0.18em] text-paper"><PackagePlus size={16} /> Add</button>
          </div>

          <form className="grid gap-5 border border-ink/10 bg-porcelain p-5" onSubmit={submitProduct}>
            <div className="grid gap-4 md:grid-cols-2">
              <input key={`name-${editingSlug}`} name="name" className="border border-ink/15 bg-paper px-4 py-3" placeholder="Product name" defaultValue={editingProduct?.name} required />
              <input key={`original-price-${editingSlug}`} name="originalPrice" className="border border-ink/15 bg-paper px-4 py-3" placeholder="Original Price in OMR" defaultValue={editingProduct?.originalPrice || editingProduct?.price} type="number" min="0" step="0.001" />
              <input key={`sale-price-${editingSlug}`} name="salePrice" className="border border-ink/15 bg-paper px-4 py-3" placeholder="Sale Price in OMR" defaultValue={editingProduct?.salePrice} type="number" min="0" step="0.001" />
              <input key={`stock-${editingSlug}`} name="stock" className="border border-ink/15 bg-paper px-4 py-3" placeholder="Stock" defaultValue={editingProduct?.stock} type="number" min="0" />
              <input key={`notes-${editingSlug}`} name="notes" className="border border-ink/15 bg-paper px-4 py-3" placeholder="Category / short note" defaultValue={editingProduct?.notes} />
              <input key={`tags-${editingSlug}`} name="tags" className="border border-ink/15 bg-paper px-4 py-3 md:col-span-2" placeholder="Search tags, separated by commas" defaultValue={editingProduct?.tags?.join(", ")} />
              <select key={`collection-${editingSlug}`} name="collectionId" className="border border-ink/15 bg-paper px-4 py-3 md:col-span-2" defaultValue={editingProduct?.collectionId || ""}>
                <option value="">No collection</option>
                {collectionList.map((collection) => (
                  <option key={collection.id} value={collection.id}>{collection.name}</option>
                ))}
              </select>
              <input
                name="photo"
                className="border border-ink/15 bg-paper px-4 py-3 md:col-span-2"
                type="file"
                accept="image/*"
                aria-label="Upload product photo"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    warnIfLargeImage(file);
                    setPhotoPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
            <textarea key={`description-${editingSlug}`} name="description" className="min-h-24 border border-ink/15 bg-paper px-4 py-3" placeholder="Description" defaultValue={editingProduct?.description} />
            <label className="flex items-center gap-3 text-sm">
              <input key={`featured-${editingSlug}`} name="isFeatured" type="checkbox" defaultChecked={editingProduct?.isFeatured} />
              Featured product
            </label>
            <div className="flex gap-3">
              <button className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.18em] text-paper">{editingProduct ? "Update product" : "Save product"}</button>
              <button
                type="button"
                onClick={() => {
                  setEditingSlug("");
                  setPhotoPreview("");
                }}
                className="border border-ink px-5 py-3 text-xs uppercase tracking-[0.18em]"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="mt-6 grid gap-3">
            {productList.length > 0 ? productList.map((product) => (
              <article key={product.slug} className="grid gap-3 border border-ink/10 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <strong>{product.name}</strong>
                  <p className="mt-1 text-sm text-ink/60">
                    {formatOmr(getProductPricing(product).currentPrice)} · Stock {product.stock}
                    {getProductPricing(product).hasDiscount ? ` · ${getProductPricing(product).discountPercent}% off` : ""}
                  </p>
                  {isOutOfStock(product) ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-rosewood">Out of Stock</p>
                  ) : isLowStock(product) ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-rosewood">Low stock warning</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingSlug(product.slug)} className="grid size-10 place-items-center rounded-full border border-ink/15" aria-label={`Edit ${product.name}`}><Pencil size={15} /></button>
                  <button type="button" onClick={() => removeProduct(product.slug)} className="grid size-10 place-items-center rounded-full border border-ink/15" aria-label={`Delete ${product.name}`}><Trash2 size={15} /></button>
                </div>
              </article>
            )) : (
              <div className="border border-ink/10 px-5 py-8 text-center text-sm text-ink/62">No products yet.</div>
            )}
          </div>

          <div className="mt-10 border-t border-ink/10 pt-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-3xl">Discount Codes</h2>
              <BadgePercent size={20} />
            </div>
            <form className="grid gap-5 border border-ink/10 bg-porcelain p-5" onSubmit={submitDiscountCode}>
              <div className="grid gap-4 md:grid-cols-2">
                <input key={`discount-code-${editingDiscountId}`} name="discountCode" className="border border-ink/15 bg-paper px-4 py-3 uppercase" placeholder="Code name, e.g. HVUGH" defaultValue={editingDiscountCode?.code} required />
                <select key={`discount-type-${editingDiscountId}`} name="discountType" className="border border-ink/15 bg-paper px-4 py-3" defaultValue={editingDiscountCode?.type || "fixed"}>
                  <option value="fixed">Fixed amount</option>
                  <option value="percentage">Percentage</option>
                </select>
                <input key={`discount-value-${editingDiscountId}`} name="discountValue" className="border border-ink/15 bg-paper px-4 py-3" placeholder="Discount value" defaultValue={editingDiscountCode?.value} type="number" min="0" step="0.001" required />
                <input key={`discount-minimum-${editingDiscountId}`} name="minimumOrderAmount" className="border border-ink/15 bg-paper px-4 py-3" placeholder="Minimum order amount" defaultValue={editingDiscountCode?.minimumOrderAmount} type="number" min="0" step="0.001" />
                <input key={`discount-expiry-${editingDiscountId}`} name="expiresAt" className="border border-ink/15 bg-paper px-4 py-3" type="date" defaultValue={editingDiscountCode?.expiresAt?.slice(0, 10)} aria-label="Expiry date" />
                <label className="flex items-center gap-3 border border-ink/15 bg-paper px-4 py-3 text-sm">
                  <input key={`discount-active-${editingDiscountId}`} name="isActive" type="checkbox" defaultChecked={editingDiscountCode ? editingDiscountCode.isActive : true} />
                  Active
                </label>
              </div>
              <div className="flex gap-3">
                <button className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.18em] text-paper">{editingDiscountCode ? "Update code" : "Save code"}</button>
                <button type="button" onClick={() => setEditingDiscountId("")} className="border border-ink px-5 py-3 text-xs uppercase tracking-[0.18em]">Clear</button>
              </div>
            </form>

            <div className="mt-6 grid gap-3">
              {discountCodeList.length > 0 ? discountCodeList.map((discountCode) => (
                <article key={discountCode.id} className="grid gap-3 border border-ink/10 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <strong>{discountCode.code}</strong>
                    <p className="mt-1 text-sm text-ink/60">
                      {discountCode.type === "fixed" ? formatOmr(discountCode.value) : `${discountCode.value}%`} off · {discountCode.isActive ? "Active" : "Inactive"}
                      {discountCode.minimumOrderAmount ? ` · Minimum ${formatOmr(discountCode.minimumOrderAmount)}` : ""}
                      {discountCode.expiresAt ? ` · Expires ${new Date(discountCode.expiresAt).toLocaleDateString("en-OM")}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingDiscountId(discountCode.id)} className="grid size-10 place-items-center rounded-full border border-ink/15" aria-label={`Edit ${discountCode.code}`}><Pencil size={15} /></button>
                    <button type="button" onClick={() => removeDiscountCode(discountCode.id)} className="grid size-10 place-items-center rounded-full border border-ink/15" aria-label={`Delete ${discountCode.code}`}><Trash2 size={15} /></button>
                  </div>
                </article>
              )) : (
                <div className="border border-ink/10 px-5 py-8 text-center text-sm text-ink/62">No discount codes yet.</div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <form className="grid gap-4 border border-ink/12 bg-paper p-5" onSubmit={submitSiteSettings}>
            <div className="flex items-center gap-3">
              <Palette size={20} />
              <h3 className="font-serif text-2xl">Website Design</h3>
            </div>
            <input name="logo" className="border border-ink/15 px-4 py-3" type="file" accept="image/*" aria-label="Upload logo" onChange={(event) => warnIfLargeImage(event.target.files?.[0])} />
            <input name="hero" className="border border-ink/15 px-4 py-3" type="file" accept="image/*" aria-label="Upload homepage hero image" onChange={(event) => warnIfLargeImage(event.target.files?.[0])} />
            {uploadWarning ? <p className="border border-brass/25 bg-brass/5 px-4 py-3 text-sm text-ink/70">{uploadWarning}</p> : null}
            <input name="heroTitle" className="border border-ink/15 px-4 py-3" placeholder="Homepage hero title" defaultValue={siteSettings.heroTitle} />
            <textarea name="heroSubtitle" className="min-h-20 border border-ink/15 px-4 py-3" placeholder="Homepage hero subtitle" defaultValue={siteSettings.heroSubtitle} />
            <div className="border border-ink/10 bg-porcelain p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/48">Homepage sections</p>
              <div className="mt-4 grid gap-3">
                <input name="featuredCollectionsTitle" className="border border-ink/15 px-4 py-3" placeholder="Featured collections title" defaultValue={siteSettings.featuredCollectionsTitle} />
                <textarea name="featuredCollectionsSubtitle" className="min-h-16 border border-ink/15 px-4 py-3" placeholder="Featured collections subtitle" defaultValue={siteSettings.featuredCollectionsSubtitle} />
                <input name="newestProductsTitle" className="border border-ink/15 px-4 py-3" placeholder="Newest products title" defaultValue={siteSettings.newestProductsTitle} />
                <textarea name="newestProductsSubtitle" className="min-h-16 border border-ink/15 px-4 py-3" placeholder="Newest products subtitle" defaultValue={siteSettings.newestProductsSubtitle} />
              </div>
            </div>
            <div className="border border-ink/10 bg-porcelain p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/48">Brand Story</p>
              <div className="mt-4 grid gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input name="brandStoryVisible" type="checkbox" defaultChecked={siteSettings.brandStoryVisible ?? true} />
                  Show Brand Story section
                </label>
                <input name="brandStoryImage" className="border border-ink/15 px-4 py-3" type="file" accept="image/*" aria-label="Upload brand story image" onChange={(event) => warnIfLargeImage(event.target.files?.[0])} />
                <input name="brandStoryTitle" className="border border-ink/15 px-4 py-3" placeholder="Brand story title" defaultValue={siteSettings.brandStoryTitle} />
                <input name="brandStorySubtitle" className="border border-ink/15 px-4 py-3" placeholder="Brand story subtitle" defaultValue={siteSettings.brandStorySubtitle} />
                <textarea name="brandText" className="min-h-20 border border-ink/15 px-4 py-3" placeholder="Brand story body text" defaultValue={siteSettings.brandText} />
                <input name="brandStoryButtonText" className="border border-ink/15 px-4 py-3" placeholder="Brand story button text" defaultValue={siteSettings.brandStoryButtonText} />
                <input name="brandStoryButtonLink" className="border border-ink/15 px-4 py-3" placeholder="Brand story button link" defaultValue={siteSettings.brandStoryButtonLink} />
              </div>
            </div>
            <div className="border border-ink/10 bg-porcelain p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/48">Login / Create Account</p>
              <div className="mt-4 grid gap-3">
                <input name="loginImage" className="border border-ink/15 px-4 py-3" type="file" accept="image/*" aria-label="Upload login page image" onChange={(event) => warnIfLargeImage(event.target.files?.[0])} />
                <input name="loginTitle" className="border border-ink/15 px-4 py-3" placeholder="Login page title" defaultValue={siteSettings.loginTitle} />
                <textarea name="loginSubtitle" className="min-h-16 border border-ink/15 px-4 py-3" placeholder="Login page subtitle" defaultValue={siteSettings.loginSubtitle} />
                <input name="createAccountTitle" className="border border-ink/15 px-4 py-3" placeholder="Create account page title" defaultValue={siteSettings.createAccountTitle} />
                <textarea name="createAccountSubtitle" className="min-h-16 border border-ink/15 px-4 py-3" placeholder="Create account page subtitle" defaultValue={siteSettings.createAccountSubtitle} />
                <textarea name="verificationMessage" className="min-h-16 border border-ink/15 px-4 py-3" placeholder="Verification email message" defaultValue={siteSettings.verificationMessage} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="accentColor" className="border border-ink/15 px-4 py-3" placeholder="Accent color hex" defaultValue={siteSettings.accentColor} />
              <input name="footerText" className="border border-ink/15 px-4 py-3" placeholder="Footer text" defaultValue={siteSettings.footerText} />
            </div>
            <div className="border border-ink/10 bg-porcelain p-4 text-sm text-ink/68">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/48">Delivery regions</p>
              <label className="mt-3 flex items-center gap-2">
                <input type="checkbox" checked readOnly />
                Muscat, Oman
              </label>
              <p className="mt-3 text-xs leading-5 text-ink/52">Additional regions can be enabled later. By default, only Muscat is active.</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Share2 size={18} />
              <p className="text-xs uppercase tracking-[0.18em] text-ink/48">Social media</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="instagram" className="border border-ink/15 px-4 py-3" placeholder="Instagram" defaultValue={siteSettings.instagram} />
              <input name="tiktok" className="border border-ink/15 px-4 py-3" placeholder="TikTok" defaultValue={siteSettings.tiktok} />
              <input name="snapchat" className="border border-ink/15 px-4 py-3" placeholder="Snapchat" defaultValue={siteSettings.snapchat} />
              <input name="x" className="border border-ink/15 px-4 py-3" placeholder="X" defaultValue={siteSettings.x} />
              <input name="facebook" className="border border-ink/15 px-4 py-3" placeholder="Facebook" defaultValue={siteSettings.facebook} />
              <input name="email" className="border border-ink/15 px-4 py-3" placeholder="Email" defaultValue={siteSettings.email} />
            </div>
            <button className="bg-ink px-5 py-3 text-xs uppercase tracking-[0.18em] text-paper">Save website settings</button>
          </form>
          {[
            ["Homepage hero photo", "Upload, change, or delete the homepage hero photo", ImagePlus],
            ["Newest products", "Choose which products appear on the homepage", Boxes],
            ["Brand/about section", "Edit brand story text and image", Pencil],
            ["Policies", "Edit terms, privacy, and cookies", FileText],
            ["Social and footer", "Update accounts, links, and contact", UsersRound],
            ["Analytics", "Visits, page views, and best-selling products", BarChart3]
          ].map(([title, desc, Icon]) => (
            <div key={title as string} className="border border-ink/12 bg-paper p-5">
              <div className="flex items-center gap-3">
                <Icon size={20} />
                <h3 className="font-serif text-2xl">{title as string}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/64">{desc as string}</p>
            </div>
          ))}
        </section>
      </div>

      <section className="mt-10 border border-ink/12 bg-paper p-6">
        <h2 className="font-serif text-3xl">Orders</h2>
        {orderList.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="border-b border-ink/12 text-xs uppercase tracking-[0.18em] text-ink/48">
                <tr><th className="py-3">Order</th><th>Customer</th><th>Delivery area</th><th>Status</th><th>Total</th><th>Payment</th><th>Update status</th><th>Update payment</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {orderList.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4 font-medium">{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.deliveryArea}</td>
                    <td className="capitalize">{order.status}</td>
                    <td>{formatOmr(order.total)}</td>
                    <td className="capitalize">{order.paymentStatus || (order.paid ? "paid" : "unpaid")}</td>
                    <td>
                      <select
                        className="border border-ink/15 bg-paper px-3 py-2"
                        value={order.status}
                        onChange={(event) => changeOrderStatus(order.id, event.target.value as Order["status"])}
                      >
                        {["pending", "preparing", "shipped", "delivered", "cancelled"].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="border border-ink/15 bg-paper px-3 py-2"
                        value={order.paymentStatus || (order.paid ? "paid" : "unpaid")}
                        onChange={(event) => changeOrderPaymentStatus(order.id, event.target.value as NonNullable<Order["paymentStatus"]>)}
                      >
                        {["unpaid", "paid"].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 border border-ink/10 px-5 py-8 text-center text-sm text-ink/62">No orders yet.</div>
        )}
      </section>

      <section className="mt-10 border border-ink/12 bg-paper p-6">
        <h2 className="font-serif text-3xl">Users</h2>
        {profileList.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="border-b border-ink/12 text-xs uppercase tracking-[0.18em] text-ink/48">
                <tr><th className="py-3">Name</th><th>Email</th><th>Role</th><th>Created</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {profileList.map((profile) => (
                  <tr key={profile.id}>
                    <td className="py-4 font-medium">{[profile.firstName, profile.surname].filter(Boolean).join(" ") || "Customer"}</td>
                    <td>{profile.email}</td>
                    <td>{profile.isAdmin ? "Admin" : "Customer"}</td>
                    <td>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-OM") : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 border border-ink/10 px-5 py-8 text-center text-sm text-ink/62">No registered users yet.</div>
        )}
      </section>
    </section>
  );
}
