import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("id, seller_id, name, description, price_kes, image_url, stock, status, created_at").eq("status", "active").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Unable to load products." }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const sellerId = claimsData?.claims?.sub;
  if (!sellerId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 160) : "";
  const description = typeof input.description === "string" ? input.description.trim().slice(0, 5000) : "";
  const price = typeof input.price_kes === "number" ? input.price_kes : Number(input.price_kes);
  const stock = typeof input.stock === "number" ? input.stock : Number(input.stock);
  const imageUrl = typeof input.image_url === "string" ? input.image_url.trim().slice(0, 2048) : "";
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "Valid name, price and stock are required." }, { status: 400 });
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) return NextResponse.json({ error: "Image URL must use HTTPS." }, { status: 400 });
  const { data, error } = await supabase.from("products").insert({ seller_id: sellerId, name, description: description || null, price_kes: price, stock, image_url: imageUrl || null, status: stock > 0 ? "active" : "sold_out" }).select("id, seller_id, name, description, price_kes, image_url, stock, status, created_at").single();
  if (error) return NextResponse.json({ error: "Unable to create product." }, { status: 400 });
  return NextResponse.json({ product: data }, { status: 201 });
}
