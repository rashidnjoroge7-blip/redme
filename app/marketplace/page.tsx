import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MarketplacePage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase.from("products").select("id, name, description, price_kes, image_url, stock").eq("status", "active").order("created_at", { ascending: false }).limit(100);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-[#ff2442]">← RedNote</Link>
        <div className="mt-6"><h1 className="text-4xl font-black">Marketplace</h1><p className="mt-2 text-neutral-500">Discover products from RedNote sellers.</p></div>
        {error ? <div className="mt-8 rounded-2xl bg-red-50 p-5 text-sm text-red-700">Unable to load marketplace.</div> : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(products ?? []).map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {product.image_url ? <img src={product.image_url} alt={product.name} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-neutral-100 text-4xl">🛍️</div>}
                <div className="p-4"><h2 className="font-bold">{product.name}</h2><p className="mt-1 text-sm text-neutral-500">{product.description}</p><p className="mt-3 text-lg font-black">KES {Number(product.price_kes).toLocaleString("en-KE")}</p><p className="mt-1 text-xs text-neutral-500">{product.stock} in stock</p></div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
