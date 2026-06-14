# Supabase Setup for Vaporis Boutique

This creates the Supabase schema and storage buckets needed by the Vaporis Boutique app.

## What This Schema Covers

- `profiles` linked to Supabase Auth users
- `collections`
- `products`
- `delivery_regions`
- `delivery_areas`
- `orders`
- `order_items`
- `site_settings`
- `policies`
- Storage buckets:
  - `product-images`
  - `collection-images`
  - `site-assets`
  - `profile-photos`

## Exact Supabase Setup Steps

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Open the new project dashboard.
3. Go to **SQL Editor**.
4. Create a new query.
5. Open [supabase/schema.sql](../supabase/schema.sql) in this project.
6. Copy the full SQL file.
7. Paste it into Supabase SQL Editor.
8. Click **Run**.
9. Go to **Table Editor** and confirm these tables exist:
   - `profiles`
   - `collections`
   - `products`
   - `delivery_regions`
   - `delivery_areas`
   - `orders`
   - `order_items`
   - `site_settings`
   - `policies`
10. Go to **Storage** and confirm these buckets exist:
    - `product-images`
    - `collection-images`
    - `site-assets`
    - `profile-photos`
11. Go to **Authentication > Users** and create your admin user with the email and password you want to use.
12. Go to **Table Editor > profiles**.
13. Find the profile row for that admin user.
14. Set `profiles.is_admin` to `true`.
15. Keep only `Muscat, Oman` active for delivery until you want to enable more regions.

## Admin Login Setup

1. Create your admin user in **Supabase Dashboard > Authentication > Users**.
2. Open **Table Editor > profiles** and set that user's `is_admin` field to `true`.
3. Log in at `/admin-login` using the admin email and password you chose.

Old hardcoded admin credentials are no longer used. Admin access is controlled by Supabase Auth plus the `profiles.is_admin = true` flag.

## Project Environment Variables

After the schema is ready, copy these values from Supabase:

1. Go to **Project Settings > API**.
2. Copy the project URL.
3. Copy the anon public key.
4. Copy `.env.example` to `.env.local` in the project root:

```bash
cp .env.example .env.local
```

5. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Do not put the service role key in the browser app.

## Important Notes

- Stripe is not included yet.
- The current Next.js pages and design are unchanged.
- Products, collections, product images, collection images, site assets, site settings, Auth profiles, customer account data, and orders are wired for Supabase.
- Admin writes require a Supabase authenticated user whose `profiles.is_admin` is `true`.

## Official Supabase References

- Supabase projects include a full Postgres database and can be managed in the Dashboard SQL Editor.
- Supabase recommends using RLS before exposing database tables to a client app.
- Supabase Auth user data should be mirrored into a public `profiles` table for app use.
- Supabase Storage buckets can be public or private; public buckets are useful for public media such as product images and profile pictures.
