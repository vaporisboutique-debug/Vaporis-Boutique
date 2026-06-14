-- Vaporis Boutique Supabase schema
-- Run this in Supabase SQL Editor before connecting the Next.js app.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.order_status as enum ('pending', 'preparing', 'shipped', 'delivered', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  surname text,
  email text,
  avatar_url text,
  is_admin boolean not null default false,
  is_deactivated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_deactivated boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select profiles.is_admin from public.profiles where profiles.id = auth.uid()),
    false
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, surname, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'surname',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete set null,
  name text not null,
  slug text not null unique,
  notes text,
  description text,
  original_price numeric(10, 3) not null default 0 check (original_price >= 0),
  sale_price numeric(10, 3) check (sale_price is null or sale_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  volume text,
  color text default '#151413',
  accent text default '#faf9f6',
  image_url text,
  tags text[] not null default '{}',
  search_vector tsvector not null default ''::tsvector,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sale_price_less_than_original check (sale_price is null or sale_price < original_price)
);

alter table public.products
  add column if not exists search_vector tsvector not null default ''::tsvector;

create or replace function public.set_product_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    to_tsvector(
      'english',
      concat_ws(
        ' ',
        new.name,
        new.notes,
        new.description,
        array_to_string(new.tags, ' ')
      )
    );
  return new;
end;
$$;

drop trigger if exists set_product_search_vector on public.products;
create trigger set_product_search_vector
  before insert or update of name, notes, description, tags
  on public.products
  for each row execute procedure public.set_product_search_vector();

update public.products
set search_vector = to_tsvector(
  'english',
  concat_ws(' ', name, notes, description, array_to_string(tags, ' '))
);

create index if not exists products_collection_id_idx on public.products(collection_id);
create index if not exists products_tags_idx on public.products using gin(tags);
create index if not exists products_search_idx on public.products using gin(search_vector);

do $$ begin
  create type public.discount_type as enum ('fixed', 'percentage');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.discount_type not null default 'fixed',
  discount_value numeric(10, 3) not null check (discount_value > 0),
  is_active boolean not null default true,
  minimum_order_amount numeric(10, 3) check (minimum_order_amount is null or minimum_order_amount >= 0),
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text not null default 'Oman',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_areas (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.delivery_regions(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (region_id, name)
);

insert into public.delivery_regions (name, country, is_active)
values ('Muscat', 'Oman', true)
on conflict (name) do update set is_active = excluded.is_active;

with muscat as (
  select id from public.delivery_regions where name = 'Muscat' and country = 'Oman'
)
insert into public.delivery_areas (region_id, name, is_active)
select muscat.id, area.name, true
from muscat
cross join (values
  ('Al Khuwair'),
  ('Al Ghubrah'),
  ('Bausher'),
  ('Qurum'),
  ('Madinat Al Sultan Qaboos'),
  ('Ruwi'),
  ('Muttrah'),
  ('Azaiba'),
  ('Seeb'),
  ('Al Hail'),
  ('Mawaleh'),
  ('Muscat Hills')
) as area(name)
on conflict (region_id, name) do update set is_active = excluded.is_active;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_email text,
  delivery_region_id uuid references public.delivery_regions(id),
  delivery_area_id uuid references public.delivery_areas(id),
  delivery_area_name text not null,
  delivery_address text,
  gift_wrapping boolean not null default false,
  gift_message text,
  discount_code text,
  discount_amount numeric(10, 3) not null default 0,
  product_total numeric(10, 3) not null default 0,
  gift_fee numeric(10, 3) not null default 0,
  delivery_fee numeric(10, 3) not null default 2,
  total numeric(10, 3) not null default 0,
  status public.order_status not null default 'pending',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  paid boolean not null default false,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

alter table public.orders
  add column if not exists discount_code text,
  add column if not exists discount_amount numeric(10, 3) not null default 0,
  add column if not exists payment_status text not null default 'unpaid';

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check check (payment_status in ('unpaid', 'paid'));

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 3) not null default 0,
  line_total numeric(10, 3) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);

create or replace function public.create_order_with_stock(
  p_customer_name text,
  p_customer_email text,
  p_delivery_area_name text,
  p_delivery_address text,
  p_gift_wrapping boolean,
  p_gift_message text,
  p_product_total numeric,
  p_gift_fee numeric,
  p_delivery_fee numeric,
  p_discount_code text,
  p_discount_amount numeric,
  p_total numeric,
  p_items jsonb
)
returns table(order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  created_order_id uuid;
  generated_order_number text;
  item jsonb;
  product_record public.products%rowtype;
  requested_qty integer;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in before checkout.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty.';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    requested_qty := coalesce((item ->> 'quantity')::integer, 0);

    if requested_qty <= 0 then
      raise exception 'Invalid quantity.';
    end if;

    select *
    into product_record
    from public.products
    where slug = item ->> 'slug'
    and is_active = true
    for update;

    if not found then
      raise exception 'Product is no longer available.';
    end if;

    if product_record.stock < requested_qty then
      raise exception 'Only % of % is available.', product_record.stock, product_record.name;
    end if;
  end loop;

  generated_order_number := 'VB-' || right(extract(epoch from now())::bigint::text, 6) || '-' || upper(substr(gen_random_uuid()::text, 1, 4));

  insert into public.orders (
    order_number,
    user_id,
    customer_name,
    customer_email,
    delivery_area_name,
    delivery_address,
    gift_wrapping,
    gift_message,
    product_total,
    gift_fee,
    delivery_fee,
    discount_code,
    discount_amount,
    total,
    status,
    payment_status,
    paid
  )
  values (
    generated_order_number,
    auth.uid(),
    p_customer_name,
    p_customer_email,
    p_delivery_area_name,
    p_delivery_address,
    p_gift_wrapping,
    nullif(p_gift_message, ''),
    p_product_total,
    p_gift_fee,
    p_delivery_fee,
    nullif(p_discount_code, ''),
    p_discount_amount,
    p_total,
    'pending',
    'unpaid',
    false
  )
  returning id into created_order_id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    requested_qty := (item ->> 'quantity')::integer;

    select *
    into product_record
    from public.products
    where slug = item ->> 'slug'
    for update;

    update public.products
    set stock = stock - requested_qty
    where id = product_record.id;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      line_total
    )
    values (
      created_order_id,
      product_record.id,
      product_record.name,
      requested_qty,
      coalesce((item ->> 'unit_price')::numeric, product_record.original_price),
      coalesce((item ->> 'line_total')::numeric, 0)
    );
  end loop;

  return query select generated_order_number;
end;
$$;

grant execute on function public.create_order_with_stock(
  text,
  text,
  text,
  text,
  boolean,
  text,
  numeric,
  numeric,
  numeric,
  text,
  numeric,
  numeric,
  jsonb
) to authenticated;

create table if not exists public.site_settings (
  id boolean primary key default true,
  logo_url text,
  hero_image_url text,
  hero_title text,
  hero_subtitle text,
  newest_products_title text,
  newest_products_subtitle text,
  featured_collections_title text,
  featured_collections_subtitle text,
  brand_story_visible boolean not null default true,
  brand_story_image_url text,
  brand_story_title text,
  brand_story_subtitle text,
  brand_text text,
  brand_story_button_text text,
  brand_story_button_link text,
  login_image_url text,
  login_title text,
  login_subtitle text,
  create_account_title text,
  create_account_subtitle text,
  verification_message text,
  accent_color text,
  footer_text text,
  email text,
  instagram text,
  tiktok text,
  snapchat text,
  x text,
  facebook text,
  enabled_regions text[] not null default array['Muscat, Oman'],
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = true)
);

alter table public.site_settings
  add column if not exists newest_products_title text,
  add column if not exists newest_products_subtitle text,
  add column if not exists featured_collections_title text,
  add column if not exists featured_collections_subtitle text,
  add column if not exists brand_story_visible boolean not null default true,
  add column if not exists brand_story_image_url text,
  add column if not exists brand_story_title text,
  add column if not exists brand_story_subtitle text,
  add column if not exists brand_story_button_text text,
  add column if not exists brand_story_button_link text,
  add column if not exists login_image_url text,
  add column if not exists login_title text,
  add column if not exists login_subtitle text,
  add column if not exists create_account_title text,
  add column if not exists create_account_subtitle text,
  add column if not exists verification_message text;

insert into public.site_settings (id, enabled_regions)
values (true, array['Muscat, Oman'])
on conflict (id) do nothing;

create table if not exists public.policies (
  key text primary key check (key in ('terms', 'privacy', 'cookies')),
  title text not null,
  content text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.policies (key, title, content)
values
  ('terms', 'Terms and Conditions', ''),
  ('privacy', 'Privacy Policy', ''),
  ('cookies', 'Cookie Policy', '')
on conflict (key) do nothing;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at before update on public.collections for each row execute procedure public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute procedure public.set_updated_at();

drop trigger if exists discount_codes_set_updated_at on public.discount_codes;
create trigger discount_codes_set_updated_at before update on public.discount_codes for each row execute procedure public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute procedure public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings for each row execute procedure public.set_updated_at();

drop trigger if exists policies_set_updated_at on public.policies;
create trigger policies_set_updated_at before update on public.policies for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.discount_codes enable row level security;
alter table public.delivery_regions enable row level security;
alter table public.delivery_areas enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.policies enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

drop policy if exists "public_read_active_collections" on public.collections;
create policy "public_read_active_collections" on public.collections for select using (is_active = true);

drop policy if exists "admin_manage_collections" on public.collections;
create policy "admin_manage_collections" on public.collections for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_active_products" on public.products;
create policy "public_read_active_products" on public.products for select using (is_active = true);

drop policy if exists "admin_manage_products" on public.products;
create policy "admin_manage_products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_discount_codes" on public.discount_codes;
drop policy if exists "public_read_active_discount_codes" on public.discount_codes;
create policy "public_read_discount_codes" on public.discount_codes for select using (true);

drop policy if exists "admin_manage_discount_codes" on public.discount_codes;
create policy "admin_manage_discount_codes" on public.discount_codes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_active_regions" on public.delivery_regions;
create policy "public_read_active_regions" on public.delivery_regions for select using (is_active = true);

drop policy if exists "admin_manage_regions" on public.delivery_regions;
create policy "admin_manage_regions" on public.delivery_regions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_active_areas" on public.delivery_areas;
create policy "public_read_active_areas" on public.delivery_areas for select using (is_active = true);

drop policy if exists "admin_manage_areas" on public.delivery_areas;
create policy "admin_manage_areas" on public.delivery_areas for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers_read_own_orders" on public.orders;
create policy "customers_read_own_orders" on public.orders for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "customers_create_own_orders" on public.orders;
create policy "customers_create_own_orders" on public.orders for insert with check (auth.uid() = user_id);

drop policy if exists "customers_cancel_pending_orders" on public.orders;
create policy "customers_cancel_pending_orders" on public.orders for update using (auth.uid() = user_id and status = 'pending') with check (auth.uid() = user_id and status = 'cancelled');

drop policy if exists "admin_manage_orders" on public.orders;
create policy "admin_manage_orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers_read_own_order_items" on public.order_items;
create policy "customers_read_own_order_items" on public.order_items for select using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and (orders.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "customers_create_own_order_items" on public.order_items;
create policy "customers_create_own_order_items" on public.order_items for insert with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);

drop policy if exists "admin_manage_order_items" on public.order_items;
create policy "admin_manage_order_items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_site_settings" on public.site_settings;
create policy "public_read_site_settings" on public.site_settings for select using (true);

drop policy if exists "admin_manage_site_settings" on public.site_settings;
create policy "admin_manage_site_settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_policies" on public.policies;
create policy "public_read_policies" on public.policies for select using (true);

drop policy if exists "admin_manage_policies" on public.policies;
create policy "admin_manage_policies" on public.policies for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('collection-images', 'collection-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('site-assets', 'site-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('profile-photos', 'profile-photos', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "public_read_public_bucket_objects" on storage.objects;
create policy "public_read_public_bucket_objects" on storage.objects for select using (
  bucket_id in ('product-images', 'collection-images', 'site-assets', 'profile-photos')
);

drop policy if exists "admin_manage_store_media" on storage.objects;
create policy "admin_manage_store_media" on storage.objects for all using (
  bucket_id in ('product-images', 'collection-images', 'site-assets') and public.is_admin()
) with check (
  bucket_id in ('product-images', 'collection-images', 'site-assets') and public.is_admin()
);

drop policy if exists "users_manage_own_profile_photos" on storage.objects;
create policy "users_manage_own_profile_photos" on storage.objects for all using (
  bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
