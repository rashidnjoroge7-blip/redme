-- RedNote search upgrade
-- Adds indexed full-text search vectors and RPC search functions.
-- Safe to apply repeatedly.

alter table public.posts
  add column if not exists search_vector tsvector
generated always as (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(category, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '), '')), 'C')
) stored;

create index if not exists posts_search_vector_idx
  on public.posts using gin (search_vector);

alter table public.products
  add column if not exists search_vector tsvector
generated always as (
  setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(category, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(seller, '')), 'C')
) stored;

create index if not exists products_search_vector_idx
  on public.products using gin (search_vector);

create or replace function public.search_posts(
  search_text text,
  category_filter text default null,
  result_limit integer default 20
)
returns table (
  id uuid,
  user_id uuid,
  title text,
  description text,
  category text,
  tags text[],
  image_url text,
  likes_count integer,
  created_at timestamptz,
  rank real
)
language sql
stable
as $$
  with input as (
    select
      trim(coalesce(search_text, '')) as text,
      websearch_to_tsquery('simple', trim(coalesce(search_text, ''))) as query
  )
  select
    p.id,
    p.user_id,
    p.title,
    p.description,
    p.category,
    p.tags,
    p.image_url,
    p.likes_count,
    p.created_at,
    (
      case
        when input.text = '' then 0::real
        else ts_rank_cd(p.search_vector, input.query)
      end
      + case when lower(coalesce(p.title, '')) = lower(input.text) then 5 else 0 end
      + case when lower(coalesce(p.title, '')) like '%' || lower(input.text) || '%' then 1 else 0 end
    )::real as rank
  from public.posts p
  cross join input
  where
    (input.text = '' or p.search_vector @@ input.query
      or p.title ilike '%' || input.text || '%'
      or p.description ilike '%' || input.text || '%'
      or coalesce(array_to_string(p.tags, ' '), '') ilike '%' || input.text || '%')
    and (category_filter is null or lower(p.category) = lower(category_filter))
  order by rank desc, p.created_at desc
  limit least(greatest(coalesce(result_limit, 20), 1), 50);
$$;

create or replace function public.search_products(
  search_text text,
  result_limit integer default 20
)
returns table (
  id uuid,
  name text,
  description text,
  price_kes numeric,
  image_url text,
  category text,
  seller text,
  rating numeric,
  reviews_count integer,
  stock integer,
  rank real
)
language sql
stable
as $$
  with input as (
    select
      trim(coalesce(search_text, '')) as text,
      websearch_to_tsquery('simple', trim(coalesce(search_text, ''))) as query
  )
  select
    p.id,
    p.name,
    p.description,
    p.price_kes,
    p.image_url,
    p.category,
    p.seller,
    p.rating,
    p.reviews_count,
    p.stock,
    (
      case
        when input.text = '' then 0::real
        else ts_rank_cd(p.search_vector, input.query)
      end
      + case when lower(coalesce(p.name, '')) = lower(input.text) then 5 else 0 end
      + case when lower(coalesce(p.name, '')) like '%' || lower(input.text) || '%' then 1 else 0 end
    )::real as rank
  from public.products p
  cross join input
  where
    p.status = 'active'
    and (input.text = '' or p.search_vector @@ input.query
      or p.name ilike '%' || input.text || '%'
      or p.description ilike '%' || input.text || '%'
      or p.category ilike '%' || input.text || '%'
      or p.seller ilike '%' || input.text || '%')
  order by rank desc, p.created_at desc
  limit least(greatest(coalesce(result_limit, 20), 1), 50);
$$;

grant execute on function public.search_posts(text, text, integer) to anon, authenticated;
grant execute on function public.search_products(text, integer) to anon, authenticated;
