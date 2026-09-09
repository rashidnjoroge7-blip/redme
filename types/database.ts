export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };

  public: {
    Tables: {
      cart: {
        Row: {
          created_at: string | null;
          id: string;
          product_id: string;
          quantity: number;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          product_id: string;
          quantity?: number;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          product_id?: string;
          quantity?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      cart_items: {
        Row: {
          cart_id: string;
          created_at: string;
          product_id: string;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          cart_id: string;
          created_at?: string;
          product_id: string;
          quantity: number;
          updated_at?: string;
        };
        Update: {
          cart_id?: string;
          created_at?: string;
          product_id?: string;
          quantity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };

      carts: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      comments: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          text: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id: string;
          text: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          text?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      conversation_participants: {
        Row: {
          conversation_id: string;
          joined_at: string;
          last_read_at: string | null;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          joined_at?: string;
          last_read_at?: string | null;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          joined_at?: string;
          last_read_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      conversations: {
        Row: {
          created_at: string | null;
          id: string;
          participant_1: string;
          participant_2: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          participant_1: string;
          participant_2: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          participant_1?: string;
          participant_2?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_fkey";
            columns: ["participant_1"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_participant_2_fkey";
            columns: ["participant_2"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      follows: {
        Row: {
          created_at: string | null;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      likes: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message: string | null;
          title: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string | null;
          title: string;
          type?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string | null;
          title?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      order_items: {
        Row: {
          created_at: string | null;
          id: string;
          order_id: string;
          product_id: string;
          product_name: string | null;
          quantity: number;
          seller_id: string | null;
          unit_price: number;
          unit_price_kes: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          order_id: string;
          product_id: string;
          product_name?: string | null;
          quantity: number;
          seller_id?: string | null;
          unit_price: number;
          unit_price_kes?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          order_id?: string;
          product_id?: string;
          product_name?: string | null;
          quantity?: number;
          seller_id?: string | null;
          unit_price?: number;
          unit_price_kes?: number | null;
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
          {
            foreignKeyName: "order_items_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      orders: {
        Row: {
          buyer_id: string | null;
          created_at: string | null;
          id: string;
          payment_method: string | null;
          payment_reference: string | null;
          payment_status: string | null;
          reservation_expires_at: string | null;
          shipping_address: string | null;
          status: string | null;
          total_amount: number;
          total_kes: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          buyer_id?: string | null;
          created_at?: string | null;
          id?: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string | null;
          reservation_expires_at?: string | null;
          shipping_address?: string | null;
          status?: string | null;
          total_amount: number;
          total_kes?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          buyer_id?: string | null;
          created_at?: string | null;
          id?: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string | null;
          reservation_expires_at?: string | null;
          shipping_address?: string | null;
          status?: string | null;
          total_amount?: number;
          total_kes?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      payments: {
        Row: {
          amount_kes: number;
          checkout_request_id: string | null;
          created_at: string;
          id: string;
          merchant_request_id: string | null;
          mpesa_receipt: string | null;
          order_id: string;
          phone: string | null;
          provider: string;
          result_code: number | null;
          result_description: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount_kes: number;
          checkout_request_id?: string | null;
          created_at?: string;
          id?: string;
          merchant_request_id?: string | null;
          mpesa_receipt?: string | null;
          order_id: string;
          phone?: string | null;
          provider?: string;
          result_code?: number | null;
          result_description?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount_kes?: number;
          checkout_request_id?: string | null;
          created_at?: string;
          id?: string;
          merchant_request_id?: string | null;
          mpesa_receipt?: string | null;
          order_id?: string;
          phone?: string | null;
          provider?: string;
          result_code?: number | null;
          result_description?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };

      posts: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          likes_count: number | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          likes_count?: number | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          likes_count?: number | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      products: {
        Row: {
          badge: string | null;
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          original_price: number | null;
          price: number;
          price_kes: number | null;
          rating: number | null;
          reviews_count: number | null;
          seller: string;
          seller_id: string | null;
          sold_count: number | null;
          status: string | null;
          stock: number | null;
          updated_at: string | null;
        };
        Insert: {
          badge?: string | null;
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          original_price?: number | null;
          price: number;
          price_kes?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          seller: string;
          seller_id?: string | null;
          sold_count?: number | null;
          status?: string | null;
          stock?: number | null;
          updated_at?: string | null;
        };
        Update: {
          badge?: string | null;
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          original_price?: number | null;
          price?: number;
          price_kes?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          seller?: string;
          seller_id?: string | null;
          sold_count?: number | null;
          status?: string | null;
          stock?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      profiles: {
        Row: {
          avatar: string | null;
          avatar_color1: string | null;
          avatar_color2: string | null;
          bio: string | null;
          created_at: string | null;
          email: string;
          followers_count: number | null;
          following_count: number | null;
          id: string;
          location: string | null;
          name: string;
          role: string | null;
          status: string | null;
          total_likes: number | null;
          updated_at: string | null;
        };
        Insert: {
          avatar?: string | null;
          avatar_color1?: string | null;
          avatar_color2?: string | null;
          bio?: string | null;
          created_at?: string | null;
          email: string;
          followers_count?: number | null;
          following_count?: number | null;
          id: string;
          location?: string | null;
          name: string;
          role?: string | null;
          status?: string | null;
          total_likes?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avatar?: string | null;
          avatar_color1?: string | null;
          avatar_color2?: string | null;
          bio?: string | null;
          created_at?: string | null;
          email?: string;
          followers_count?: number | null;
          following_count?: number | null;
          id?: string;
          location?: string | null;
          name?: string;
          role?: string | null;
          status?: string | null;
          total_likes?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      saves: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          save_type: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          save_type?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          save_type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      user_roles: {
        Row: {
          created_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };



    Functions: {
      is_admin_user: {
        Args: never;
        Returns: boolean;
      };
      search_posts: {
        Args: {
          search_text: string;
          category_filter?: string | null;
          result_limit?: number;
        };
        Returns: {
          id: string;
          user_id: string | null;
          title: string;
          description: string | null;
          category: string;
          tags: string[];
          image_url: string | null;
          likes_count: number | null;
          created_at: string | null;
          rank: number;
        }[];
      };

      checkout_cart: {
        Args: never;
        Returns: string;
      };

      create_direct_conversation: {
        Args: {
          other_user_id: string;
        };
        Returns: string;
      };

      has_rednote_role: {
        Args: {
          requested_role: string;
        };
        Returns: boolean;
      };

      reconcile_mpesa_payment: {
        Args: {
          p_callback_amount: number;
          p_callback_phone: string;
          p_checkout_request_id: string;
          p_receipt: string;
          p_result_code: number;
          p_result_description: string;
        };
        Returns: string;
      };

      release_expired_reservations: {
        Args: never;
        Returns: number;
      };
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
