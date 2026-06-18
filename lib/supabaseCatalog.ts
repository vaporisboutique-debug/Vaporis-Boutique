"use client";

import type { Collection, DiscountCode, Order, Product, Profile } from "@/lib/data";
import { collections as initialCollections, discountCodes as initialDiscountCodes, orders as initialOrders, products as initialProducts } from "@/lib/data";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { SiteSettings } from "@/lib/useSiteSettings";

type ProductRow = {
  id: string;
  collection_id: string | null;
  name: string;
  slug: string;
  notes: string | null;
  description: string | null;
  original_price: number;
  sale_price: number | null;
  stock: number;
  volume: string | null;
  color: string | null;
  accent: string | null;
  image_url: string | null;
  tags: string[];
  is_featured: boolean;
  created_at: string;
};

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_featured: boolean;
};

type DiscountCodeRow = {
  id: string;
  code: string;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  is_active: boolean;
  minimum_order_amount: number | null;
  expires_at: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  surname: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_deactivated: boolean | null;
  created_at: string;
};

type OrderItemRow = {
  product_name: string;
  quantity: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  delivery_area_name: string;
  total: number;
  status: Order["status"];
  payment_status: "unpaid" | "paid" | null;
  paid: boolean;
  discount_code: string | null;
  discount_amount: number | null;
  created_at: string;
  order_items?: OrderItemRow[];
};

export type DeliveryArea = {
  id: string;
  name: string;
  regionName?: string;
};

type DeliveryAreaRow = {
  id: string;
  name: string;
  delivery_regions?: {
    name: string | null;
  } | Array<{ name: string | null }> | null;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function productFromRow(row: ProductRow): Product {
  const originalPrice = Number(row.original_price || 0);
  const salePrice = row.sale_price ? Number(row.sale_price) : undefined;
  return {
    slug: row.slug,
    name: row.name,
    notes: row.notes || "",
    description: row.description || "",
    price: salePrice && salePrice < originalPrice ? salePrice : originalPrice,
    originalPrice,
    salePrice,
    stock: row.stock,
    volume: row.volume || "Boutique item",
    color: row.color || "#151413",
    accent: row.accent || "#faf9f6",
    imageUrl: row.image_url || undefined,
    collectionId: row.collection_id || undefined,
    tags: row.tags || [],
    isFeatured: row.is_featured,
    createdAt: row.created_at
  };
}

export function collectionFromRow(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    imageUrl: row.image_url || undefined
  };
}

export function discountCodeFromRow(row: DiscountCodeRow): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    type: row.discount_type,
    value: Number(row.discount_value || 0),
    isActive: row.is_active,
    minimumOrderAmount: row.minimum_order_amount === null ? undefined : Number(row.minimum_order_amount),
    expiresAt: row.expires_at || undefined,
    createdAt: row.created_at
  };
}

export function profileFromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    firstName: row.first_name || "",
    surname: row.surname || "",
    email: row.email || "",
    avatarUrl: row.avatar_url || undefined,
    isAdmin: row.is_admin,
    createdAt: row.created_at
  };
}

export function orderFromRow(row: OrderRow): Order {
  return {
    id: row.order_number || row.id,
    userId: row.user_id || undefined,
    customer: row.customer_name || row.customer_email || "Customer",
    customerEmail: row.customer_email || undefined,
    status: row.status,
    paymentStatus: row.payment_status || (row.paid ? "paid" : "unpaid"),
    total: Number(row.total || 0),
    paid: row.paid,
    date: new Date(row.created_at).toLocaleDateString("en-OM"),
    deliveryArea: row.delivery_area_name,
    discountCode: row.discount_code || undefined,
    discountAmount: row.discount_amount ? Number(row.discount_amount) : undefined,
    products: row.order_items?.map((item) => ({ name: item.product_name, quantity: item.quantity })) || []
  };
}

export async function fetchProducts() {
  if (!supabase) {
    return initialProducts;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => productFromRow(row as ProductRow));
}

export async function fetchCollections() {
  if (!supabase) {
    return initialCollections;
  }

  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => collectionFromRow(row as CollectionRow));
}

export async function fetchActiveDeliveryAreas(): Promise<DeliveryArea[]> {
  if (!supabase) {
    throw new Error("Supabase is not connected.");
  }

  const { data, error } = await supabase
    .from("delivery_areas")
    .select("id, name, delivery_regions(name)")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => {
    const area = row as DeliveryAreaRow;
    const region = Array.isArray(area.delivery_regions) ? area.delivery_regions[0] : area.delivery_regions;
    return {
      id: area.id,
      name: area.name,
      regionName: region?.name || undefined
    };
  });
}

export async function fetchDiscountCodes() {
  if (!supabase) {
    return initialDiscountCodes;
  }

  const { data, error } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => discountCodeFromRow(row as DiscountCodeRow));
}

export async function uploadStoreImage(bucket: "product-images" | "collection-images" | "site-assets" | "profile-photos", file: File, prefix: string) {
  if (!supabase || !isSupabaseConfigured) {
    return "";
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${prefix}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function upsertCollection(collection: Collection, sortOrder: number) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("collections").upsert(
    {
      id: collection.id || undefined,
      name: collection.name,
      slug: slugify(collection.name),
      description: collection.description || null,
      image_url: collection.imageUrl || null,
      sort_order: sortOrder,
      is_active: true
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

export async function deleteCollection(id: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("collections").update({ is_active: false }).eq("id", id);
  if (error) {
    throw error;
  }
}

export async function upsertProduct(product: Product) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("products").upsert(
    {
      name: product.name,
      slug: product.slug,
      collection_id: product.collectionId || null,
      notes: product.notes || null,
      description: product.description || null,
      original_price: product.originalPrice || product.price,
      sale_price: product.salePrice || null,
      stock: product.stock,
      volume: product.volume,
      color: product.color,
      accent: product.accent,
      image_url: product.imageUrl || null,
      tags: product.tags || [],
      is_featured: Boolean(product.isFeatured),
      is_active: true
    },
    { onConflict: "slug" }
  );

  if (error) {
    throw error;
  }
}

export async function deleteProduct(slug: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("products").update({ is_active: false }).eq("slug", slug);
  if (error) {
    throw error;
  }
}

export async function upsertDiscountCode(code: DiscountCode) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("discount_codes").upsert(
    {
      id: code.id || undefined,
      code: code.code.toUpperCase(),
      discount_type: code.type,
      discount_value: code.value,
      is_active: code.isActive,
      minimum_order_amount: code.minimumOrderAmount || null,
      expires_at: code.expiresAt || null
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

export async function deleteDiscountCode(id: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) {
    throw error;
  }
}

export async function fetchProfiles() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) {
    throw error;
  }

  return (data || []).map((row) => profileFromRow(row as ProfileRow));
}

export async function fetchCurrentProfile() {
  if (!supabase) {
    return null;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }

  const userId = sessionData.session?.user.id;
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) {
    throw error;
  }

  return profileFromRow(data as ProfileRow);
}

export async function updateCurrentProfile(profile: Pick<Profile, "firstName" | "surname" | "email" | "avatarUrl">) {
  if (!supabase) {
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }

  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error("You must be logged in to update your profile.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: profile.firstName,
      surname: profile.surname,
      email: profile.email,
      avatar_url: profile.avatarUrl || null
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function deactivateCurrentProfile() {
  if (!supabase) {
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }

  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error("You must be logged in to deactivate your profile.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: "",
      surname: "",
      avatar_url: null,
      is_deactivated: true
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  await supabase.auth.signOut();
}

export async function fetchOrders() {
  if (!supabase) {
    return initialOrders;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(product_name, quantity)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => orderFromRow(row as OrderRow));
}

export async function createSupabaseOrder(order: {
  customerName: string;
  customerEmail: string;
  deliveryArea: string;
  deliveryAddress: string;
  giftWrapping: boolean;
  giftMessage?: string;
  productTotal: number;
  giftFee: number;
  deliveryFee: number;
  discountCode?: string;
  discountAmount: number;
  total: number;
  items?: Array<{ slug: string; name: string; quantity: number; unitPrice: number; lineTotal: number }>;
}) {
  if (!supabase) {
    return null;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }

  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error("You must be logged in before checkout.");
  }

  const { data, error } = await supabase.rpc("create_order_with_stock", {
    p_customer_name: order.customerName,
    p_customer_email: order.customerEmail,
    p_delivery_area_name: order.deliveryArea,
    p_delivery_address: order.deliveryAddress,
    p_gift_wrapping: order.giftWrapping,
    p_gift_message: order.giftMessage || "",
    p_product_total: order.productTotal,
    p_gift_fee: order.giftFee,
    p_delivery_fee: order.deliveryFee,
    p_discount_code: order.discountCode || "",
    p_discount_amount: order.discountAmount,
    p_total: order.total,
    p_items: order.items?.map((item) => ({
      slug: item.slug,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal
    })) || []
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0]?.order_number : null;
}

export async function updateOrderStatus(orderNumber: string, status: Order["status"]) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("orders").update({ status }).eq("order_number", orderNumber);
  if (error) {
    throw error;
  }
}

export async function cancelOwnPendingOrder(orderNumber: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("order_number", orderNumber)
    .eq("status", "pending");

  if (error) {
    throw error;
  }
}

export async function updateOrderPaymentStatus(orderNumber: string, paymentStatus: NonNullable<Order["paymentStatus"]>) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: paymentStatus, paid: paymentStatus === "paid" })
    .eq("order_number", orderNumber);
  if (error) {
    throw error;
  }
}

export async function fetchSiteSettings() {
  if (!supabase) {
    return {};
  }

  const { data, error } = await supabase.from("site_settings").select("*").eq("id", true).single();
  if (error) {
    throw error;
  }

  return {
    logoUrl: data.logo_url || undefined,
    heroImageUrl: data.hero_image_url || undefined,
    heroTitle: data.hero_title || undefined,
    heroSubtitle: data.hero_subtitle || undefined,
    newestProductsTitle: data.newest_products_title || undefined,
    newestProductsSubtitle: data.newest_products_subtitle || undefined,
    featuredCollectionsTitle: data.featured_collections_title || undefined,
    featuredCollectionsSubtitle: data.featured_collections_subtitle || undefined,
    brandStoryVisible: data.brand_story_visible ?? true,
    brandStoryImageUrl: data.brand_story_image_url || undefined,
    brandStoryTitle: data.brand_story_title || undefined,
    brandStorySubtitle: data.brand_story_subtitle || undefined,
    brandText: data.brand_text || undefined,
    brandStoryButtonText: data.brand_story_button_text || undefined,
    brandStoryButtonLink: data.brand_story_button_link || undefined,
    loginImageUrl: data.login_image_url || undefined,
    loginTitle: data.login_title || undefined,
    loginSubtitle: data.login_subtitle || undefined,
    createAccountTitle: data.create_account_title || undefined,
    createAccountSubtitle: data.create_account_subtitle || undefined,
    verificationMessage: data.verification_message || undefined,
    accentColor: data.accent_color || undefined,
    footerText: data.footer_text || undefined,
    email: data.email || undefined,
    instagram: data.instagram || undefined,
    tiktok: data.tiktok || undefined,
    snapchat: data.snapchat || undefined,
    x: data.x || undefined,
    facebook: data.facebook || undefined,
    enabledRegions: data.enabled_regions || ["Muscat Governorate, Oman"]
  } satisfies SiteSettings;
}

export async function upsertSiteSettings(settings: SiteSettings) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("site_settings").upsert(
    {
      id: true,
      logo_url: settings.logoUrl || null,
      hero_image_url: settings.heroImageUrl || null,
      hero_title: settings.heroTitle || null,
      hero_subtitle: settings.heroSubtitle || null,
      newest_products_title: settings.newestProductsTitle || null,
      newest_products_subtitle: settings.newestProductsSubtitle || null,
      featured_collections_title: settings.featuredCollectionsTitle || null,
      featured_collections_subtitle: settings.featuredCollectionsSubtitle || null,
      brand_story_visible: settings.brandStoryVisible ?? true,
      brand_story_image_url: settings.brandStoryImageUrl || null,
      brand_story_title: settings.brandStoryTitle || null,
      brand_story_subtitle: settings.brandStorySubtitle || null,
      brand_text: settings.brandText || null,
      brand_story_button_text: settings.brandStoryButtonText || null,
      brand_story_button_link: settings.brandStoryButtonLink || null,
      login_image_url: settings.loginImageUrl || null,
      login_title: settings.loginTitle || null,
      login_subtitle: settings.loginSubtitle || null,
      create_account_title: settings.createAccountTitle || null,
      create_account_subtitle: settings.createAccountSubtitle || null,
      verification_message: settings.verificationMessage || null,
      accent_color: settings.accentColor || null,
      footer_text: settings.footerText || null,
      email: settings.email || null,
      instagram: settings.instagram || null,
      tiktok: settings.tiktok || null,
      snapchat: settings.snapchat || null,
      x: settings.x || null,
      facebook: settings.facebook || null,
      enabled_regions: settings.enabledRegions || ["Muscat Governorate, Oman"]
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}
