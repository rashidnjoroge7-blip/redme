import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getCart() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { supabase, userId: null, cart: null };
  const { data: cart } = await supabase.from("carts").select("id, user_id, updated_at").eq("user_id", userId).maybeSingle();
  return { supabase, userId, cart };
}

export async function GET() {
  const { supabase, userId, cart } = await getCart();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!cart) return NextResponse.json({ cart: null, items: [] });
  const { data: items, error } = await supabase.from("cart_items").select("cart_id, product_id, quantity, products(id, name, price_kes, image_url, stock, status)").eq("cart_id", cart.id);
  if (error) return NextResponse.json({ error: "Unable to load cart." }, { status: 500 });
  return NextResponse.json({ cart, items: items ?? [] });
}

export async function POST(request: Request) {
  const { supabase, userId, cart: existingCart } = await getCart();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  const productId = typeof input.productId === "string" ? input.productId : "";
  const quantity = Number(input.quantity);
  if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) return NextResponse.json({ error: "Invalid product or quantity." }, { status: 400 });

  let cartId = existingCart?.id;
  if (!cartId) {
    const { data: cart, error } = await supabase.from("carts").insert({ user_id: userId }).select("id, user_id, updated_at").single();
    if (error || !cart) return NextResponse.json({ error: "Unable to create cart." }, { status: 500 });
    cartId = cart.id;
  }

  const { data: product } = await supabase.from("products").select("id, stock, status").eq("id", productId).maybeSingle();
  if (
  !product ||
  product.status !== "active" ||
  product.stock === null ||
  product.stock < quantity
) {
  return NextResponse.json(
    { error: "Product is unavailable or has insufficient stock." },
    { status: 400 },
  );
}
  const { data, error } = await supabase.from("cart_items").upsert({ cart_id: cartId, product_id: productId, quantity }, { onConflict: "cart_id,product_id" }).select("cart_id, product_id, quantity").single();
  if (error) return NextResponse.json({ error: "Unable to update cart." }, { status: 400 });
  return NextResponse.json({ item: data }, { status: 201 });
}
