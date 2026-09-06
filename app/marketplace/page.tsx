import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MarketplacePageProps = { searchParams: Promise<{ q?: string }> };

function escapeIlike(value: string) {
  return value.replace(/[\\%_(),]/g, (character) => `\\${character}`).slice(0, 100);
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;
  const search = params.q?.trim().slice(0, 100) ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, name, description, price_kes, image_url, stock, category, seller")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) {
    const safe = escapeIlike(search);
    query = query.or(
      `name.ilike.%${safe}%,description.ilike.%${safe}%,category.ilike.%${safe}%,seller.ilike.%${safe}%`,
    );
  }

  const { data: products, error } = await query;

  return (
    <main className="min-h-screen bg-[#fafafa] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="inline-flex items-center rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm font-bold text-[#ff2442] shadow-sm backdrop-blur-xl transition-all hover:bg-[#fff0f0] hover:shadow-md">← RedNote</Link>
          <form action="/marketplace" method="get" className="flex min-w-[280px] flex-1 gap-2 sm:max-w-xl">
            <label className="flex min-w-0 flex-1 items-center rounded-full bg-white/80 px-4 shadow-sm ring-[#ff2442] focus-within:ring-2">
              <span aria-hidden="true" className="mr-2 text-neutral-400">⌕</span>
              <input name="q" type="search" defaultValue={search} placeholder="Search products, categories, sellers…" aria-label="Search marketplace" autoComplete="off" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" />
            </label>
            <button type="submit" className="rounded-full bg-[#ff2442] px-4 py-2 text-sm font-bold text-white">Search</button>
            {search && <Link href="/marketplace" className="hidden items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 sm:flex">Clear</Link>}
          </form>
        </div>

        <div className="mt-8">
          <div className="inline-block rounded-2xl border border-[#ff2442]/10 bg-[#fff0f0]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#ff2442] backdrop-blur-md">RedNote Market</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#1a1a1a]">Marketplace</h1>
          <p className="mt-2 max-w-xl text-neutral-500">Discover products from RedNote sellers.</p>
          {search && <p className="mt-3 text-sm text-neutral-500"><span className="font-semibold text-neutral-800">{(products ?? []).length}</span> {(products ?? []).length === 1 ? "result" : "results"} for <span className="font-semibold text-neutral-800">“{search}”</span></p>}
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-[#ff2442]/10 bg-[#fff0f0]/70 p-5 text-sm font-medium text-[#ff2442] shadow-sm backdrop-blur-xl">Unable to load marketplace.</div>
        ) : (products ?? []).length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/70 bg-white/65 p-10 text-center shadow-sm backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f0] text-2xl">🛍️</div>
            <h2 className="mt-4 font-bold text-[#1a1a1a]">{search ? "No products found" : "No products yet"}</h2>
            <p className="mt-1 text-sm text-neutral-500">{search ? "Try a broader product name, category or seller." : "Check back soon for products from RedNote sellers."}</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(products ?? []).map((product) => (
              <article key={product.id} className="group overflow-hidden rounded-3xl border border-white/70 bg-white/65 shadow-[0_10px_35px_rgb(26_26_26/7%)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#ff2442]/15 hover:shadow-[0_18px_45px_rgb(26_26_26/11%)]">
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#fff0f0] via-white to-[#fff0f0]">
                  {product.image_url ? <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" /> : <div className="flex h-full w-full items-center justify-center text-4xl">🛍️</div>}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/10 via-transparent to-white/20" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff2442]">{product.category}</p>
                  <h2 className="mt-1 font-bold leading-snug text-[#1a1a1a]">{product.name}</h2>
                  {product.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">{product.description}</p>}
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-[#1a1a1a]">KES {Number(product.price_kes).toLocaleString("en-KE")}</p>
                      <p className="mt-1 text-xs font-medium text-neutral-500">{product.stock} in stock</p>
                    </div>
                    <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#ff2442]">Available</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
