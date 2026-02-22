create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create table if not exists public.dealers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  city text not null,
  state text not null,
  profile_photo_url text,
  cover_image_url text,
  badge text not null check (badge in ('Basic', 'Pro', 'Premium')) default 'Basic',
  rating numeric(3,2) not null default 0,
  total_listings integer not null default 0,
  sold_ratio numeric(5,2) not null default 0,
  response_time_minutes integer not null default 0,
  is_verified boolean not null default false,
  kyc_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  title text not null,
  description text not null,
  make text not null,
  model text not null,
  year integer,
  city text not null,
  state text not null,
  price integer,
  km integer,
  fuel_type text not null check (fuel_type in ('Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid')),
  transmission text not null check (transmission in ('Manual', 'Automatic')) default 'Manual',
  owner_type text not null check (owner_type in ('1st', '2nd', '3rd+')),
  insurance_type text not null,
  registration_number text not null,
  media_urls text[] not null default '{}',
  video_url text,
  is_hot_deal boolean not null default false,
  hot_deal_expires_at timestamptz,
  status text not null check (status in ('active', 'sold', 'blocked')) default 'active',
  sold_at timestamptz,
  views integer not null default 0,
  chat_count integer not null default 0,
  call_clicks integer not null default 0,
  created_at timestamptz not null default now(),
  unique (registration_number)
);

create table if not exists public.listing_media_hashes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  hash text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlists (
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (dealer_id, listing_id)
);

create table if not exists public.recently_viewed (
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (dealer_id, listing_id)
);

create table if not exists public.chat_initiations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_wallets (
  dealer_id uuid primary key references public.dealers(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.push_notifications (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  title text not null,
  body text not null,
  sent_at timestamptz not null default now(),
  is_read boolean not null default false
);

create table if not exists public.dealer_credits (
  dealer_id uuid primary key references public.dealers(id) on delete cascade,
  successful_deals integer not null default 0,
  future_ads_credits integer not null default 0,
  future_ads_valid_until timestamptz,
  hot_deal_credits integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.api_rate_limits (
  user_id uuid not null references public.dealers(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  reset_at timestamptz not null,
  count integer not null default 0,
  primary key (user_id, action, window_start)
);

create table if not exists public.system_logs (
  id uuid primary key default uuid_generate_v4(),
  level text not null check (level in ('INFO', 'WARN', 'ERROR', 'SECURITY')),
  type text not null check (type in ('RATE_LIMIT', 'OCR_FAILURE', 'AUTH_FAILURE', 'DUPLICATE_ATTEMPT', 'SYSTEM_ERROR')),
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.consume_api_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, current_count integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_reset_at timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  insert into public.api_rate_limits(user_id, action, window_start, reset_at, count)
  values (p_user_id, p_action, v_window_start, v_reset_at, 1)
  on conflict (user_id, action, window_start)
  do update set
    count = case
      when public.api_rate_limits.count < p_limit then public.api_rate_limits.count + 1
      else public.api_rate_limits.count
    end
  returning public.api_rate_limits.count, public.api_rate_limits.reset_at
  into v_count, reset_at;

  allowed := v_count <= p_limit;
  current_count := v_count;
  return next;
end;
$$;

revoke all on function public.consume_api_rate_limit(uuid, text, integer, integer) from public;
grant execute on function public.consume_api_rate_limit(uuid, text, integer, integer) to service_role;

alter table public.dealers enable row level security;
alter table public.listings enable row level security;
alter table public.listing_media_hashes enable row level security;
alter table public.wishlists enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.chat_initiations enable row level security;
alter table public.referral_wallets enable row level security;
alter table public.push_notifications enable row level security;
alter table public.dealer_credits enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.system_logs enable row level security;

create policy "dealers_select_self"
on public.dealers for select
using (auth.uid() = id);

create policy "dealers_update_self"
on public.dealers for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "listings_public_select_active"
on public.listings for select
using (status = 'active' or dealer_id = auth.uid());

create policy "listings_insert_verified_only"
on public.listings for insert
with check (
  auth.uid() = dealer_id
  and exists (
    select 1
    from public.dealers d
    where d.id = auth.uid()
      and d.is_verified = true
  )
);

create policy "listings_update_owner"
on public.listings for update
using (dealer_id = auth.uid())
with check (dealer_id = auth.uid());

create policy "hashes_owner_manage"
on public.listing_media_hashes for all
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_media_hashes.listing_id
      and l.dealer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_media_hashes.listing_id
      and l.dealer_id = auth.uid()
  )
);

create policy "wishlist_owner_only"
on public.wishlists for all
using (dealer_id = auth.uid())
with check (dealer_id = auth.uid());

create policy "recently_viewed_owner_only"
on public.recently_viewed for all
using (dealer_id = auth.uid())
with check (dealer_id = auth.uid());

create policy "chat_insert_authenticated"
on public.chat_initiations for insert
with check (auth.uid() is not null);

create policy "chat_select_participants"
on public.chat_initiations for select
using (
  dealer_id = auth.uid()
  or exists (
    select 1 from public.listings l
    where l.id = chat_initiations.listing_id
      and l.dealer_id = auth.uid()
  )
);

create policy "wallet_owner_only"
on public.referral_wallets for all
using (dealer_id = auth.uid())
with check (dealer_id = auth.uid());

create policy "push_owner_only"
on public.push_notifications for all
using (dealer_id = auth.uid())
with check (dealer_id = auth.uid());

create policy "credits_owner_only"
on public.dealer_credits for all
using (dealer_id = auth.uid())
with check (dealer_id = auth.uid());

create policy "api_rate_limits_owner_select"
on public.api_rate_limits for select
using (user_id = auth.uid());

create policy "system_logs_insert_service_role"
on public.system_logs for insert
with check (auth.role() = 'service_role');

create policy "system_logs_select_admin_only"
on public.system_logs for select
using (
  auth.uid() is not null
  and coalesce(auth.jwt() ->> 'role', '') = 'admin'
);