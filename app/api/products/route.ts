import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function validProductMediaUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.pathname.includes("/storage/v1/object/public/product-media/")
    );
  } catch {
    return false;
  }
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, seller_id, seller, category, name, description, price, price_kes, image_url, stock, status, created_at",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Unable to load products", error);

    return NextResponse.json(
      { error: "Unable to load products." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    products: data ?? [],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const sellerId = claimsData?.claims?.sub;

  if (!sellerId) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const input = body as Record<string, unknown>;

  const name = text(input.name, 160);

  const description = text(input.description, 5000);

  const category = text(input.category, 100);

  const sellerInput = text(input.seller, 160);

  const seller = sellerInput || "RedNote Seller";

  const priceInput =
    typeof input.price_kes === "number"
      ? input.price_kes
      : Number(input.price_kes);

  const stockInput =
    typeof input.stock === "number" ? input.stock : Number(input.stock);

  const imageUrl = text(input.image_url, 2048);

  if (
    !name ||
    !category ||
    !Number.isFinite(priceInput) ||
    priceInput < 0 ||
    !Number.isInteger(stockInput) ||
    stockInput < 0
  ) {
    return NextResponse.json(
      {
        error: "Valid name, category, price and stock are required.",
      },
      { status: 400 },
    );
  }

  if (!validProductMediaUrl(imageUrl)) {
    return NextResponse.json(
      {
        error: "Product image must be uploaded to RedNote storage.",
      },
      { status: 400 },
    );
  }

  const productPayload = {
    seller_id: sellerId,
    seller,
    category,
    name,
    description: description || null,
    price: priceInput,
    price_kes: priceInput,
    stock: stockInput,
    image_url: imageUrl || null,
    status: stockInput > 0 ? "active" : "sold_out",
  };

  const { data, error } = await supabase
    .from("products")
    .insert(productPayload)
    .select(
      "id, seller_id, seller, category, name, description, price, price_kes, image_url, stock, status, created_at",
    )
    .single();

  if (error) {
    console.error("Unable to create product", error);

    return NextResponse.json(
      { error: "Unable to create product." },
      { status: 400 },
    );
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
