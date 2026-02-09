export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  rating: number;
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
  total: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  itemCount: number;
}

export interface AdminSummary {
  userCount: number;
  productCount: number;
  orderCount: number;
  processingOrders: number;
  lowStockProducts: number;
  totalRevenue: number;
}

export interface AdminOrder {
  id: number;
  total: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
