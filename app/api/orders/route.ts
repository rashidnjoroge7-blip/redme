import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (!cart) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  const { data: items, error: itemsError } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("cart_id", cart.id);
  if (itemsError || !items?.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  const productIds = items.map((item) => item.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, seller_id, name, price_kes, stock, status")
    .in("id", productIds);
  if (productsError || !products) return NextResponse.json({ error: "Unable to validate cart." }, { status: 500 });

  const byId = new Map(products.map((product) => [product.id, product]));
  let total = 0;
  const snapshots: Array<{ product_id: string; seller_id: string; product_name: string; unit_price_kes: number; quantity: number }> = [];

  for (const item of items) {
    const product = byId.get(item.product_id);
    if (!product || product.status !== "active" || product.stock < item.quantity) {
      return NextResponse.json({ error: `Product ${product?.name ?? item.product_id} is unavailable or has insufficient stock.` }, { status: 409 });
    }
    const unitPrice = Number(product.price_kes);
    total += unitPrice * item.quantity;
    snapshots.push({ product_id: product.id, seller_id: product.seller_id, product_name: product.name, unit_price_kes: unitPrice, quantity: item.quantity });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ buyer_id: userId, status: "pending", payment_status: "unpaid", total_kes: total })
    .select("id, buyer_id, status, payment_status, total_kes, created_at")
    .single();
  if (orderError || !order) return NextResponse.json({ error: "Unable to create order." }, { status: 500 });

  const { error: snapshotError } = await supabase.from("order_items").insert(snapshots.map((item) => ({ ...item, order_id: order.id })));
  if (snapshotError) {
    await supabase.from("orders").delete().eq("id", order.id).eq("buyer_id", userId);
    return NextResponse.json({ error: "Unable to create order items." }, { status: 500 });
  }

  return NextResponse.json({ order }, { status: 201 });
}
