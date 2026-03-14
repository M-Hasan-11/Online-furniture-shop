/**
 * TypeScript types for the Supabase database schema.
 *
 * These are hand-authored to match the schema in supabase/schema.sql.
 * Once you have a live Supabase project you can regenerate with:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > client/src/lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          role: "customer" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          role?: "customer" | "admin";
          created_at?: string;
        };
        Update: {
          name?: string | null;
          role?: "customer" | "admin";
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: number;
          name: string;
          category: string;
          price: number;
          image: string;
          description: string | null;
          rating: number;
          review_count: number;
          stock: number;
          is_featured: boolean;
          material: string | null;
          dimensions: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          category: string;
          price: number;
          image: string;
          description?: string | null;
          rating?: number;
          review_count?: number;
          stock?: number;
          is_featured?: boolean;
          material?: string | null;
          dimensions?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          category?: string;
          price?: number;
          image?: string;
          description?: string | null;
          rating?: number;
          review_count?: number;
          stock?: number;
          is_featured?: boolean;
          material?: string | null;
          dimensions?: string | null;
          color?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: number;
          user_id: string;
          subtotal: number;
          shipping_fee: number;
          discount_amount: number;
          coupon_code: string | null;
          total: number;
          status: string;
          shipping_address: string;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          subtotal: number;
          shipping_fee: number;
          discount_amount?: number;
          coupon_code?: string | null;
          total: number;
          status?: string;
          shipping_address: string;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          shipping_address?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: number;
          order_id: number;
          product_id: number;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          order_id: number;
          product_id: number;
          quantity: number;
          unit_price: number;
        };
        Update: {
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: number;
          product_id: number;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          product_id: number;
          user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      wishlist_items: {
        Row: {
          id: number;
          user_id: string;
          product_id: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          product_id: number;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          product_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          id: number;
          code: string;
          description: string | null;
          discount_type: "percent" | "fixed";
          discount_value: number;
          min_order_amount: number;
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          code: string;
          description?: string | null;
          discount_type: "percent" | "fixed";
          discount_value: number;
          min_order_amount?: number;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          description?: string | null;
          discount_type?: "percent" | "fixed";
          discount_value?: number;
          min_order_amount?: number;
          is_active?: boolean;
          expires_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      admin_order_details: {
        Row: {
          id: number;
          user_id: string;
          customer_name: string | null;
          customer_email: string | null;
          subtotal: number;
          shipping_fee: number;
          discount_amount: number;
          coupon_code: string | null;
          total: number;
          status: string;
          shipping_address: string;
          created_at: string;
          item_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      validate_coupon: {
        Args: { coupon_code: string; order_subtotal: number };
        Returns: {
          valid: boolean;
          discount_amount: number;
          coupon_id: number | null;
          message: string;
        };
      };
      decrement_stock: {
        Args: { p_product_id: number; p_quantity: number };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}

/** Convenience row types */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DbProduct = Database["public"]["Tables"]["products"]["Row"];
export type DbOrder = Database["public"]["Tables"]["orders"]["Row"];
export type DbOrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type DbReview = Database["public"]["Tables"]["reviews"]["Row"];
export type DbWishlistItem = Database["public"]["Tables"]["wishlist_items"]["Row"];
export type DbCoupon = Database["public"]["Tables"]["coupons"]["Row"];
