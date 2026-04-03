export type Page =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'order-detail'
  | 'admin'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'profile'
  | 'addresses'
  | 'help';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  unit: string;
  categoryId: string;
  category?: Category;
  image: string;
  images: string;
  inStock: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  brand: string;
}

export interface CartItem {
  id?: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  addressId: string;
  items: OrderItem[];
  total: number;
  discount: number;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  deliverySlot: string;
  deliveryDate: string;
  notes: string;
  createdAt: string;
  address?: Address;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: string;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface DeliverySlot {
  id: string;
  label: string;
  date: string;
  time: string;
  available: boolean;
  fee: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'name';
  page?: number;
  limit?: number;
  featured?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Order[];
  topProducts: { name: string; image: string; revenue: number; qty: number; productId?: string }[];
  ordersByStatus: { status: string; count: number }[];
  dailyRevenue: { date: string; dateLabel: string; revenue: number; orders: number }[];
}

export const CATEGORY_ICONS: Record<string, string> = {
  'fruits': '🍎',
  'vegetables': '🥬',
  'dairy': '🥛',
  'snacks': '🍿',
  'dry-fruits': '🥜',
  'household': '🧹',
  'personal-care': '🧴',
  'staples': '🌾',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: 'Placed',
  pending: 'Pending',
  confirmed: 'Confirmed',
  packing: 'Packing',
  packed: 'Packed',
  shipped: 'Shipped',
  in_transit: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  returned: 'Returned',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  placed: 'bg-amber-100 text-amber-700',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-teal-100 text-teal-700',
  packing: 'bg-violet-100 text-violet-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  in_transit: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-rose-100 text-rose-700',
  returned: 'bg-orange-100 text-orange-700',
};

export const ORDER_STATUS_STEPS = ['placed', 'confirmed', 'packing', 'packed', 'shipped', 'in_transit', 'delivered'];

export const ORDER_FINAL_STATUSES = ['delivered', 'cancelled', 'rejected', 'returned'];

/** All valid order statuses for admin use */
export const ALL_ORDER_STATUSES = [
  'placed',
  'pending',
  'confirmed',
  'packing',
  'packed',
  'shipped',
  'in_transit',
  'delivered',
  'cancelled',
  'rejected',
  'returned',
] as const;

/**
 * Format a date string into: "1 April 2026, 06:30 PM"
 * Safely handles invalid / null / undefined inputs.
 */
export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const day = d.getDate();
    const month = d.toLocaleDateString('en-IN', { month: 'long' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    return `${day} ${month} ${year}, ${timeStr}`;
  } catch {
    return '—';
  }
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format date for chart labels: "1 Apr"
 */
export function formatChartDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}`;
  } catch {
    return dateStr;
  }
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  card: 'Credit/Debit Card',
  cod: 'Cash on Delivery',
  netbanking: 'Net Banking',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  pending: 'Pending',
  refunded: 'Refunded',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
  refunded: 'bg-orange-100 text-orange-700',
};

/**
 * Determine the auto payment status label for a given order status + payment method.
 * Used for UI preview tooltips.
 */
export function getAutoPaymentStatus(
  orderStatus: string,
  paymentMethod: string,
): string | null {
  switch (orderStatus) {
    case 'returned':
      return 'refunded';
    case 'cancelled':
    case 'rejected':
      return paymentMethod === 'cod' ? 'unpaid' : 'refunded';
    case 'delivered':
      return 'paid';
    default:
      return null;
  }
}
