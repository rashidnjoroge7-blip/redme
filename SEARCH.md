# RedNote Search

RedNote now supports stronger search across the feed and marketplace.

## Feed search

- Searches post title, description, category, and tags.
- Uses PostgreSQL full-text search when migration `0018_search_upgrade.sql` is applied.
- Falls back to safe `ILIKE` matching while the migration is being deployed.
- Ranks exact title matches above partial matches.
- Category filtering is case-insensitive.
- Search input is available on the homepage and feed page, including mobile layouts.

## Marketplace search

Searches active products by:

- Product name
- Description
- Category
- Seller

## Database migration

Apply the migration from the project directory with:

```powershell
npx supabase db push
```

If the CLI reports that the project is not linked, run:

```powershell
npx supabase link --project-ref nxuaufpgduowageizigx
npx supabase db push
```

The migration creates GIN-backed `tsvector` indexes and the `search_posts` / `search_products` RPC functions. It does not delete or modify existing content.
