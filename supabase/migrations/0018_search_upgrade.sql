-- RedNote search upgrade
-- Trigger-maintained tsvector columns + indexed search RPCs.
-- Safe to apply repeatedly.

-- ============================================================
-- POSTS SEARCH VECTOR
-- ============================================================

alter table public.posts
  add column if not exists search_vector tsvector;

create or replace function public.update_posts_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.category, '')), 'C') ||
    setweight(
      to_tsvector('simple', coalesce(array_to_string(new.tags, ' '), '')),
      'C'
    );

  return new;
end;
$$;

drop trigger if exists posts_search_vector_update on public.posts;

create trigger posts_search_vector_update
before insert or update of title, description, category, tags
on public.posts
for each row
execute function public.update_posts_search_vector();

update public.posts
set search_vector =
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(category, '')), 'C') ||
  setweight(
    to_tsvector('simple', coalesce(array_to_string(tags, ' '), '')),
    'C'
  );

create index if not exists posts_search_vector_idx
  on public.posts using gin (search_vector);


-- ============================================================
-- PRODUCTS SEARCH VECTOR
-- ============================================================

alter table public.products
  add column if not exists search_vector tsvector;

create or replace function public.update_products_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.seller, '')), 'C');

  return new;
end;
$$;

drop trigger if exists products_search_vector_update on public.products;

create trigger products_search_vector_update
before insert or update of name, description, category, seller
on public.products
for each row
execute function public.update_products_search_vector();

update public.products
set search_vector =
  setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(category, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(seller, '')), 'C');

create index if not exists products_search_vector_idx
  on public.products using gin (search_vector);


-- ============================================================
-- POSTS SEARCH RPC
-- ============================================================

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
      websearch_to_tsquery(
        'simple',
        trim(coalesce(search_text, ''))
      ) as query
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
      + case
          when lower(coalesce(p.title, '')) = lower(input.text)
          then 5
          else 0
        end
      + case
          when lower(coalesce(p.title, ''))
            like '%' || lower(input.text) || '%'
          then 1
          else 0
        end
    )::real as rank
  from public.posts p
  cross join input
  where
    (
      input.text = ''
      or p.search_vector @@ input.query
      or p.title ilike '%' || input.text || '%'
      or p.description ilike '%' || input.text || '%'
      or coalesce(array_to_string(p.tags, ' '), '')
        ilike '%' || input.text || '%'
    )
    and (
      category_filter is null
      or lower(p.category) = lower(category_filter)
    )
  order by rank desc, p.created_at desc
  limit least(greatest(coalesce(result_limit, 20), 1), 50);
$$;


-- ============================================================
-- PRODUCTS SEARCH RPC
-- ============================================================

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
      websearch_to_tsquery(
        'simple',
        trim(coalesce(search_text, ''))
      ) as query
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
      + case
          when lower(coalesce(p.name, '')) = lower(input.text)
          then 5
          else 0
        end
      + case
          when lower(coalesce(p.name, ''))
            like '%' || lower(input.text) || '%'
          then 1
          else 0
        end
    )::real as rank
  from public.products p
  cross join input
  where
    p.status = 'active'
    and (
      input.text = ''
      or p.search_vector @@ input.query
      or p.name ilike '%' || input.text || '%'
      or p.description ilike '%' || input.text || '%'
      or p.category ilike '%' || input.text || '%'
      or p.seller ilike '%' || input.text || '%'
    )
  order by rank desc, p.created_at desc
  limit least(greatest(coalesce(result_limit, 20), 1), 50);
$$;


-- ============================================================
-- PERMISSIONS
-- ============================================================

grant execute on function public.search_posts(text, text, integer)
  to anon, authenticated;

grant execute on function public.search_products(text, integer)
  to anon, authenticated;
