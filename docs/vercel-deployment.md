# Vercel Deployment Guide for Vaporis Boutique

Use these steps to deploy the store for free on Vercel.

## 1. Push Project to GitHub

1. Create a GitHub account if you do not already have one.
2. Create a new GitHub repository, for example `vaporis-boutique`.
3. In the project folder on your Mac, run:

```bash
git init
git add .
git commit -m "Initial Vaporis Boutique store"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/vaporis-boutique.git
git push -u origin main
```

Do not commit `.env.local`. It contains private project settings.

## 2. Import Project Into Vercel

1. Go to [vercel.com](https://vercel.com/).
2. Sign in with GitHub.
3. Click **Add New... > Project**.
4. Choose the `vaporis-boutique` GitHub repository.
5. Keep the framework preset as **Next.js**.

## 3. Add Environment Variables

In Vercel, open the project import settings and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Use the same values from your local `.env.local`.

Important:

- Use the Supabase project URL only, for example `https://your-project.supabase.co`.
- Do not use a URL ending in `/rest/v1`.
- Do not add the Supabase service role key to Vercel.

## 4. Deploy

1. Click **Deploy**.
2. Wait for Vercel to install dependencies and build the Next.js app.
3. When deployment finishes, Vercel will give you a live website URL.

## 5. Test Live Site

Open the live Vercel URL and test:

1. Homepage loads.
2. Products load from Supabase.
3. Uploaded logo and images display.
4. Admin login works at `/admin-login`.
5. Adding a product in admin appears on `/products`.
6. Add to Cart works.
7. Checkout creates an order with Cash on Delivery.
8. Admin dashboard shows the order and can update order/payment status.

## If Images Do Not Load

The project allows Supabase image hosts in `next.config.ts` and disables Next image optimization. If you change Supabase projects, redeploy after updating environment variables.

## If Admin Login Fails

Confirm:

1. The admin user exists in **Supabase > Authentication > Users**.
2. The matching row in `profiles` has `is_admin = true`.
3. Vercel has the correct Supabase URL and anon key.
4. You redeployed after changing environment variables.
