-- ============================================================
-- Atelier Furnish — Supabase Schema
-- Run this in your Supabase project SQL Editor
-- ============================================================

-- ── Profiles (extends auth.users) ──────────────────────────
create table if not exists profiles (
  id   uuid references auth.users primary key,
  name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Products ────────────────────────────────────────────────
create table if not exists products (
  id           bigint generated always as identity primary key,
  name         text           not null,
  category     text           not null,
  price        numeric(10,2)  not null check (price > 0),
  image        text           not null,
  description  text,
  rating       numeric(3,2)   not null default 0 check (rating between 0 and 5),
  review_count integer        not null default 0,
  stock        integer        not null default 0 check (stock >= 0),
  is_featured  boolean        not null default false,
  material     text,
  dimensions   text,
  color        text,
  created_at   timestamptz    not null default now()
);

-- ── Orders ──────────────────────────────────────────────────
create table if not exists orders (
  id               bigint generated always as identity primary key,
  user_id          uuid          not null references auth.users,
  subtotal         numeric(10,2) not null,
  shipping_fee     numeric(10,2) not null default 49,
  discount_amount  numeric(10,2) not null default 0,
  coupon_code      text,
  total            numeric(10,2) not null,
  status           text          not null default 'processing'
                     check (status in ('processing','shipped','delivered','cancelled','payment_failed')),
  shipping_address text          not null,
  created_at       timestamptz   not null default now()
);

-- ── Order Items ─────────────────────────────────────────────
create table if not exists order_items (
  id         bigint generated always as identity primary key,
  order_id   bigint        not null references orders on delete cascade,
  product_id bigint        references products,
  quantity   integer       not null check (quantity > 0),
  unit_price numeric(10,2) not null
);

-- ── Reviews ─────────────────────────────────────────────────
create table if not exists reviews (
  id         bigint generated always as identity primary key,
  product_id bigint        not null references products on delete cascade,
  user_id    uuid          not null references auth.users,
  rating     integer       not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz   not null default now(),
  unique (product_id, user_id)
);

-- Auto-update product rating + review_count when a review changes
create or replace function update_product_rating()
returns trigger language plpgsql security definer as $$
begin
  update products
  set
    rating       = (select coalesce(avg(rating), 0) from reviews where product_id = coalesce(new.product_id, old.product_id)),
    review_count = (select count(*)                  from reviews where product_id = coalesce(new.product_id, old.product_id))
  where id = coalesce(new.product_id, old.product_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_review_change on reviews;
create trigger on_review_change
  after insert or update or delete on reviews
  for each row execute procedure update_product_rating();

-- ── Wishlist Items ───────────────────────────────────────────
create table if not exists wishlist_items (
  id         bigint      generated always as identity primary key,
  user_id    uuid        not null references auth.users,
  product_id bigint      not null references products on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ── Coupons ─────────────────────────────────────────────────
create table if not exists coupons (
  id                bigint         generated always as identity primary key,
  code              text           not null unique,
  description       text,
  discount_type     text           not null check (discount_type in ('percent','fixed')),
  discount_value    numeric(10,2)  not null check (discount_value > 0),
  min_order_amount  numeric(10,2)  not null default 0,
  is_active         boolean        not null default true,
  expires_at        timestamptz,
  created_at        timestamptz    not null default now()
);

-- ── Coupon validation RPC ────────────────────────────────────
create or replace function validate_coupon(coupon_code text, order_subtotal numeric)
returns table (
  valid           boolean,
  discount_amount numeric,
  coupon_id       bigint,
  message         text
) language plpgsql security definer as $$
declare
  c coupons%rowtype;
  calc_discount numeric := 0;
begin
  select * into c from coupons
  where code = upper(coupon_code) and is_active = true
    and (expires_at is null or expires_at > now())
  limit 1;

  if not found then
    return query select false, 0::numeric, null::bigint, 'Coupon not found or expired.';
    return;
  end if;

  if order_subtotal < c.min_order_amount then
    return query select false, 0::numeric, c.id, format('Minimum order of $%s required.', c.min_order_amount);
    return;
  end if;

  if c.discount_type = 'percent' then
    calc_discount := round(order_subtotal * (c.discount_value / 100), 2);
  else
    calc_discount := least(c.discount_value, order_subtotal);
  end if;

  return query select true, calc_discount, c.id, format('Applied %s: -$%s', c.code, calc_discount);
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles      enable row level security;
alter table products      enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table reviews       enable row level security;
alter table wishlist_items enable row level security;
alter table coupons       enable row level security;

-- Profiles
create policy "Users view own profile"   on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins manage profiles"   on profiles for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Products: public read, admin write
create policy "Anyone reads products" on products for select using (true);
create policy "Admins manage products" on products for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Orders: users see own, admins see all
create policy "Users view own orders"   on orders for select using (auth.uid() = user_id);
create policy "Users create own orders" on orders for insert with check (auth.uid() = user_id);
create policy "Admins manage orders"    on orders for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Order items: users see items for their orders
create policy "Users view own order items" on order_items for select
  using (exists (select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
create policy "Users insert own order items" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
create policy "Admins manage order items" on order_items for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Reviews: public read, auth write own
create policy "Anyone reads reviews" on reviews for select using (true);
create policy "Users write own reviews" on reviews for insert with check (auth.uid() = user_id);
create policy "Users update own reviews" on reviews for update using (auth.uid() = user_id);

-- Wishlist: users manage own
create policy "Users manage own wishlist" on wishlist_items for all using (auth.uid() = user_id);

-- Coupons: public read active, admin manage all
create policy "Anyone reads active coupons" on coupons for select using (is_active = true);
create policy "Admins manage coupons" on coupons for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- Admin dashboard helper view
-- ============================================================
create or replace view admin_order_details as
  select
    o.id,
    o.user_id,
    p.name  as customer_name,
    u.email as customer_email,
    o.subtotal,
    o.shipping_fee,
    o.discount_amount,
    o.coupon_code,
    o.total,
    o.status,
    o.shipping_address,
    o.created_at,
    (select count(*) from order_items oi where oi.order_id = o.id) as item_count
  from orders o
  join profiles p on p.id = o.user_id
  join auth.users u on u.id = o.user_id;
