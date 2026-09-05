-- RedNote demo content seed
-- Uses the dedicated rednote-demo@example.com Auth account.
-- Reuses the existing demo profile and never updates/deletes existing rows.
-- Idempotent deterministic IDs.

begin;

do $$
declare
  demo_user_id uuid;
  demo_profile_exists boolean;
begin
  select id into demo_user_id
  from auth.users
  where lower(email) = 'rednote-demo@example.com'
  limit 1;

  if demo_user_id is null then
    raise exception using message = 'RedNote demo seed requires an Auth user with email rednote-demo@example.com.';
  end if;

  select exists(select 1 from public.profiles where id = demo_user_id) into demo_profile_exists;
  if not demo_profile_exists then
    raise exception using message = 'RedNote demo seed requires an existing public.profiles row for rednote-demo@example.com.';
  end if;

  insert into public.posts (id, user_id, title, description, category, tags, image_url, likes_count) values
    ('00000000-0000-4000-8000-000000000101', demo_user_id, 'Saturday Brunch in Nairobi', 'A relaxed Nairobi weekend starts with good coffee, a generous breakfast and somewhere sunny to sit. Save this idea for your next slow Saturday.', 'Food', ARRAY['Nairobi','brunch','coffee'], null, 24),
    ('00000000-0000-4000-8000-000000000102', demo_user_id, 'Kitenge, Reimagined', 'Modern Kenyan style works beautifully when bold kitenge details meet simple everyday silhouettes. A little colour goes a long way.', 'Fashion', ARRAY['Kenya','kitenge','style'], null, 31),
    ('00000000-0000-4000-8000-000000000103', demo_user_id, 'A Nairobi Weekend Escape', 'Trade the usual weekend routine for a short drive, fresh air and a change of scenery. Kenya has plenty of easy escapes within reach of the city.', 'Travel', ARRAY['Nairobi','Kenya','weekend'], null, 19),
    ('00000000-0000-4000-8000-000000000104', demo_user_id, 'Small-Space Nairobi Home', 'Warm lighting, plants and a few carefully chosen pieces can make an apartment feel personal without filling every corner.', 'Home', ARRAY['home','interiors','Nairobi'], null, 27),
    ('00000000-0000-4000-8000-000000000105', demo_user_id, 'Green Nairobi', 'From garden corners to tree-lined streets, Nairobi has more everyday nature than you might notice on a busy commute.', 'Nature', ARRAY['Nairobi','nature','green spaces'], null, 22),
    ('00000000-0000-4000-8000-000000000106', demo_user_id, 'Pet-Friendly Weekend Ideas', 'A calm walk, fresh water and time outdoors can turn an ordinary weekend into a great one for both you and your four-legged companion.', 'Pets', ARRAY['pets','weekend','outdoors'], null, 16),
    ('00000000-0000-4000-8000-000000000107', demo_user_id, 'Three Books for a Quiet Evening', 'Put the phone down, make some tea and give yourself an hour with a good book. Slow evenings are underrated.', 'Books', ARRAY['books','reading','Nairobi'], null, 29),
    ('00000000-0000-4000-8000-000000000108', demo_user_id, 'Simple Kenyan Beauty Routine', 'A consistent routine does not need to be complicated: gentle cleansing, moisturising and daily sun protection are a solid foundation.', 'Beauty', ARRAY['beauty','routine','Kenya'], null, 34),
    ('00000000-0000-4000-8000-000000000109', demo_user_id, 'A Better Nairobi Morning', 'Try ten minutes of movement before the day gets busy: a brisk walk, mobility work or a short bodyweight session can be enough to get started.', 'Fitness', ARRAY['fitness','morning','Nairobi'], null, 26),
    ('00000000-0000-4000-8000-000000000110', demo_user_id, 'What Makes Nairobi Feel Like Home?', 'The food, the people, the energy, the green spaces and the small routines that become part of daily life. What part of Nairobi feels most like home to you?', 'Home', ARRAY['Nairobi','community','home'], null, 38)
  on conflict (id) do nothing;

  insert into public.products (
    id, name, description, price, original_price, category, seller,
    image_url, rating, reviews_count, sold_count, badge, is_active,
    seller_id, price_kes, stock, status
  ) values
    ('00000000-0000-4000-8000-000000000201', 'Nairobi Skyline Print', 'Minimal wall art inspired by Nairobi''s skyline, designed for a clean modern home.', 1800, 2200, 'Home', 'RedNote Nairobi', null, 4.8, 12, 4, 'Featured', true, demo_user_id, 1800.00, 12, 'active'),
    ('00000000-0000-4000-8000-000000000202', 'Kenyan Coffee Gift Set', 'A curated gift set for coffee lovers featuring locally inspired packaging and a Nairobi-focused story.', 2500, 3000, 'Food', 'RedNote Nairobi', null, 4.9, 18, 7, 'Popular', true, demo_user_id, 2500.00, 10, 'active'),
    ('00000000-0000-4000-8000-000000000203', 'Kitenge Everyday Tote', 'A practical everyday tote with a bold Kenyan-inspired textile pattern.', 1450, 1750, 'Fashion', 'RedNote Nairobi', null, 4.7, 9, 5, 'New', true, demo_user_id, 1450.00, 15, 'active'),
    ('00000000-0000-4000-8000-000000000204', 'Handcrafted Beaded Bracelet', 'A simple handcrafted accessory designed for everyday wear.', 850, 1000, 'Fashion', 'RedNote Nairobi', null, 4.6, 14, 9, null, true, demo_user_id, 850.00, 20, 'active'),
    ('00000000-0000-4000-8000-000000000205', 'Nairobi Notebook', 'A compact lined notebook for ideas, plans, sketches and everyday notes.', 650, 800, 'Books', 'RedNote Nairobi', null, 4.8, 11, 6, null, true, demo_user_id, 650.00, 30, 'active'),
    ('00000000-0000-4000-8000-000000000206', 'Woven Storage Basket', 'A versatile woven basket for organising a home while adding natural texture.', 2200, 2600, 'Home', 'RedNote Nairobi', null, 4.7, 8, 3, 'Featured', true, demo_user_id, 2200.00, 8, 'active'),
    ('00000000-0000-4000-8000-000000000207', 'Kenyan-Inspired Ceramic Mug', 'A durable everyday mug with a locally inspired design.', 1200, 1450, 'Home', 'RedNote Nairobi', null, 4.9, 16, 8, 'Popular', true, demo_user_id, 1200.00, 14, 'active'),
    ('00000000-0000-4000-8000-000000000208', 'Weekend Market Gift Box', 'A small curated gift box built around Nairobi market-inspired treats and keepsakes.', 3200, 3800, 'Gifts', 'RedNote Nairobi', null, 4.8, 7, 2, 'New', true, demo_user_id, 3200.00, 6, 'active')
  on conflict (id) do nothing;
end;
$$;

commit;
