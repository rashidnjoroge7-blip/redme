/* eslint-disable @typescript-eslint/no-explicit-any */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// These commerce/messaging tables are still being reconciled against the
// production Supabase schema. Keep their shape permissive until generated
// Supabase types can replace this provisional contract.
type GenericTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

type ReconcileMpesaPaymentArgs = {
  p_checkout_request_id: string;
  p_result_code: number;
  p_result_description: string;
  p_receipt: string | null;
  p_callback_amount: number | null;
  p_callback_phone: string | null;
};

type GenericFunction = { Args: Record<string, any>; Returns: Json };

export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; full_name: string | null; username: string | null; avatar_url: string | null; bio: string | null; location: string | null; created_at: string; updated_at: string }; Insert: Partial<Omit<Database["public"]["Tables"]["profiles"]["Row"], "id">> & { id: string }; Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>; Relationships: [] };
      posts: { Row: { id: string; user_id: string; title: string; description: string | null; category: string; image_url: string | null; likes_count: number; comments_count: number; created_at: string; updated_at: string }; Insert: Partial<Omit<Database["public"]["Tables"]["posts"]["Row"], "id" | "created_at" | "updated_at" | "likes_count" | "comments_count">> & { user_id: string; title: string }; Update: Partial<Database["public"]["Tables"]["posts"]["Row"]>; Relationships: [] };
      comments: { Row: { id: string; post_id: string; user_id: string; content: string; created_at: string; updated_at: string }; Insert: { post_id: string; user_id: string; content: string }; Update: Partial<Database["public"]["Tables"]["comments"]["Row"]>; Relationships: [] };
      likes: { Row: { user_id: string; post_id: string; created_at: string }; Insert: { user_id: string; post_id: string }; Update: never; Relationships: [] };
      saves: { Row: { user_id: string; post_id: string; created_at: string }; Insert: { user_id: string; post_id: string }; Update: never; Relationships: [] };
      follows: { Row: { follower_id: string; following_id: string; created_at: string }; Insert: { follower_id: string; following_id: string }; Update: never; Relationships: [] };
      conversations: GenericTable;
      conversation_participants: GenericTable;
      messages: GenericTable;
      notifications: GenericTable;
      products: GenericTable;
      carts: GenericTable;
      cart_items: GenericTable;
      orders: GenericTable;
      order_items: GenericTable;
      payments: GenericTable;
    };
    Views: Record<string, never>;
    Functions: {
      checkout_cart: { Args: Record<string, never>; Returns: string };
      release_expired_reservations: { Args: Record<string, never>; Returns: number };
      reconcile_mpesa_payment: { Args: ReconcileMpesaPaymentArgs; Returns: string };
      [key: string]: GenericFunction;
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
