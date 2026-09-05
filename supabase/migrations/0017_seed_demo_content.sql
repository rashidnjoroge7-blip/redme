-- RedNote demo content seed
--
-- Purpose: provide deterministic Nairobi-focused content for development/demo
-- environments without attaching records to an arbitrary real account.
--
-- Safety:
--   * Uses a dedicated marker profile (username = rednote_demo).
--   * Creates that profile only when a matching auth.users row already exists.
--   * Never creates an auth user or guesses a real user's UUID.
--   * Existing rows are never updated or deleted.
--   * Re-running this migration is idempotent.
--
-- IMPORTANT: Create/confirm a Supabase Auth user whose email is
-- rednote-demo@example.com before applying this migration. The profile is
-- intentionally linked to that Auth user so posts/products satisfy the
-- existing foreign-key constraints.

begin;

do $$
declare
  demo_user_id uuid;
begin
  select id into demo_user_id
  from auth.users
  where lower(email) = 'rednote-demo@example.com'
  limit 1;

  if demo_user_id is null then
    raise exception using
      message = 'RedNote demo seed requires an Auth user with email rednote-demo@example.com. Create the dedicated demo Auth user first; no seed rows were created.';
  end if;

  insert into public.profiles (
    id, full_name, username, avatar_url, bio, location
  ) values (
    demo_user_id,
    'RedNote Nairobi',
    'rednote_demo',
    null,
    'Curated Nairobi life, local discoveries, creators, food, style and everyday inspiration.',
    'Nairobi, Kenya'
  )
  on conflict (id) do nothing;

  -- Feed seed: supported RedNote categories only.
  insert into public.posts (
    id, user_id, title, description, category, image_url
  ) values
    ('00000000-0000-4000-8000-000000000101', demo_user_id,
      'Saturday Brunch in Nairobi',
      'A relaxed Nairobi weekend starts with good coffee, a generous breakfast and somewhere sunny to sit. Save this idea for your next slow Saturday.',
      'Food', null),
    ('00000000-0000-4000-8000-000000000102', demo_user_id,
      'Kitenge, Reimagined',
      'Modern Kenyan style works beautifully when bold kitenge details meet simple everyday silhouettes. A little colour goes a long way.',
      'Fashion', null),
    ('00000000-0000-4000-8000-000000000103', demo_user_id,
      'A Nairobi Weekend Escape',
      'Trade the usual weekend routine for a short drive, fresh air and a change of scenery. Kenya has plenty of easy escapes within reach of the city.',
      'Travel', null),
    ('00000000-0000-4000-8000-000000000104', demo_user_id,
      'Small-Space Nairobi Home',
      'Warm lighting, plants and a few carefully chosen pieces can make an apartment feel personal without filling every corner.',
      'Home', null),
    ('00000000-0000-4000-8000-000000000105', demo_user_id,
      'Green Nairobi',
      'From garden corners to tree-lined streets, Nairobi has more everyday nature than you might notice on a busy commute.',
      'Nature', null),
    ('00000000-0000-4000-8000-000000000106', demo_user_id,
      'Pet-Friendly Weekend Ideas',
      'A calm walk, fresh water and time outdoors can turn an ordinary weekend into a great one for both you and your four-legged companion.',
      'Pets', null),
    ('00000000-0000-4000-8000-000000000107', demo_user_id,
      'Three Books for a Quiet Evening',
      'Put the phone down, make some tea and give yourself an hour with a good book. Slow evenings are underrated.',
      'Books', null),
    ('00000000-0000-4000-8000-000000000108', demo_user_id,
      'Simple Kenyan Beauty Routine',
      'A consistent routine does not need to be complicated: gentle cleansing, moisturising and daily sun protection are a solid foundation.',
      'Beauty', null),
    ('00000000-0000-4000-8000-000000000109', demo_user_id,
      'A Better Nairobi Morning',
      'Try ten minutes of movement before the day gets busy: a brisk walk, mobility work or a short bodyweight session can be enough to get started.',
      'Fitness', null),
    ('00000000-0000-4000-8000-000000000110', demo_user_id,
      'What Makes Nairobi Feel Like Home?',
      'The food, the people, the energy, the green spaces and the small routines that become part of daily life. What part of Nairobi feels most like home to you?',
      'Home', null)
  on conflict (id) do nothing;

  -- Marketplace seed: active products with conservative demo inventory.
  insert into public.products (
    id, seller_id, name, description, price_kes, image_url, stock, status
  ) values
    ('00000000-0000-4000-8000-000000000201', demo_user_id,
      'Nairobi Skyline Print',
      'Minimal wall art inspired by Nairobi''s skyline, designed for a clean modern home.',
      1800.00, null, 12, 'active'),
    ('00000000-0000-4000-8000-000000000202', demo_user_id,
      'Kenyan Coffee Gift Set',
      'A curated gift set for coffee lovers featuring locally inspired packaging and a Nairobi-focused story.',
      2500.00, null, 10, 'active'),
    ('00000000-0000-4000-8000-000000000203', demo_user_id,
      'Kitenge Everyday Tote',
      'A practical everyday tote with a bold Kenyan-inspired textile pattern.',
      1450.00, null, 15, 'active'),
    ('00000000-0000-4000-8000-000000000204', demo_user_id,
      'Handcrafted Beaded Bracelet',
      'A simple handcrafted accessory designed for everyday wear.',
      850.00, null, 20, 'active'),
    ('00000000-0000-4000-8000-000000000205', demo_user_id,
      'Nairobi Notebook',
      'A compact lined notebook for ideas, plans, sketches and everyday notes.',
      650.00, null, 30, 'active'),
    ('00000000-0000-4000-8000-000000000206', demo_user_id,
      'Woven Storage Basket',
      'A versatile woven basket for organising a home while adding natural texture.',
      2200.00, null, 8, 'active'),
    ('00000000-0000-4000-8000-000000000207', demo_user_id,
      'Kenyan-Inspired Ceramic Mug',
      'A durable everyday mug with a locally inspired design.',
      1200.00, null, 14, 'active'),
    ('00000000-0000-4000-8000-000000000208', demo_user_id,
      'Weekend Market Gift Box',
      'A small curated gift box built around Nairobi market-inspired treats and keepsakes.',
      3200.00, null, 6, 'active')
  on conflict (id) do nothing;
end;
$$;

commit;
