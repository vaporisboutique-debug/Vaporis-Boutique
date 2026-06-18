export type Product = {
  slug: string;
  name: string;
  notes: string;
  description: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  stock: number;
  volume: string;
  color: string;
  accent: string;
  imageUrl?: string;
  collectionId?: string;
  tags?: string[];
  isFeatured?: boolean;
  createdAt?: string;
  bestseller?: boolean;
};

export type Collection = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
};

export type Order = {
  id: string;
  userId?: string;
  customer: string;
  customerEmail?: string;
  status: "pending" | "preparing" | "shipped" | "delivered" | "cancelled";
  paymentStatus?: "unpaid" | "paid";
  total: number;
  paid: boolean;
  date: string;
  deliveryArea: string;
  discountCode?: string;
  discountAmount?: number;
  products?: Array<{ name: string; quantity: number }>;
};

export type Profile = {
  id: string;
  firstName: string;
  surname: string;
  email: string;
  avatarUrl?: string;
  isAdmin: boolean;
  createdAt?: string;
};

export type DiscountCode = {
  id: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  isActive: boolean;
  minimumOrderAmount?: number;
  expiresAt?: string;
  createdAt?: string;
};

export const deliveryFee = 2;
export const giftWrapFee = 3;
export const isAccountRequiredBeforeCheckout = true;
export const deliveryNotice = "Delivery is available within Muscat Governorate only. التوصيل متاح داخل محافظة مسقط فقط";
export const outsideMuscatMessage = "Delivery is available within Muscat Governorate only. التوصيل متاح داخل محافظة مسقط فقط";
export const activeDeliveryRegion = "Muscat Governorate, Oman";

export const socialAccounts = {
  email: "vaporisboutique@gmail.com",
  handle: "vaporisboutique",
  instagram: "https://instagram.com/vaporisboutique",
  tiktok: "https://www.tiktok.com/@vaporisboutique",
  snapchat: "https://www.snapchat.com/add/vaporisboutique",
  x: "https://x.com/vaporisboutique",
  facebook: "https://facebook.com/vaporisboutique"
};

export const products: Product[] = [];
export const collections: Collection[] = [];

export const orders: Order[] = [];
export const discountCodes: DiscountCode[] = [];

export function formatOmr(amount: number) {
  return `${amount.toFixed(3)} OMR`;
}

export function getProductPricing(product: Product) {
  const originalPrice = product.originalPrice && product.originalPrice > 0 ? product.originalPrice : product.price;
  const salePrice = product.salePrice && product.salePrice > 0 ? product.salePrice : undefined;
  const hasDiscount = Boolean(salePrice && salePrice < originalPrice);
  const currentPrice = hasDiscount && salePrice ? salePrice : originalPrice;
  const amountSaved = hasDiscount ? originalPrice - currentPrice : 0;
  const discountPercent = hasDiscount ? Math.round((amountSaved / originalPrice) * 100) : 0;

  return {
    originalPrice,
    salePrice,
    currentPrice,
    amountSaved,
    discountPercent,
    hasDiscount
  };
}

export function isOutOfStock(product: Product) {
  return product.stock <= 0;
}

export function isLowStock(product: Product) {
  return product.stock > 0 && product.stock < 5;
}
