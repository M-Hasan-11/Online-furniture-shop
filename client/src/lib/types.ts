export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured: number;
  material?: string;
  dimensions?: string;
  color?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer";
  createdAt: string;
}

export interface Order {
  id: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  itemCount: number;
}

export interface AdminSummary {
  userCount: number;
  productCount: number;
  couponCount: number;
  activeCoupons: number;
  orderCount: number;
  processingOrders: number;
  lowStockProducts: number;
  totalRevenue: number;
}

export interface AdminOrder {
  id: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  isActive: number | boolean;
  expiresAt: string | null;
  createdAt?: string;
}

export interface CouponValidation {
  coupon: Coupon;
  discountAmount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
