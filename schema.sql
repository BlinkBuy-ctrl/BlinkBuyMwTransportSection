-- ═══════════════════════════════════════════════════════════════
-- TransportMW — Supabase Schema
-- No-auth, anonymous operator identity system
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────────────────────────
-- LISTINGS (transport services posted by anonymous operators)
-- ───────────────────────────────────────────────────────────────
create table if not exists listings (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null,

  -- Anonymous operator identity
  operator_token     text not null,          -- UUID stored in operator's localStorage
  device_fingerprint text,                   -- Non-PII device hash for additional binding

  -- Listing content
  title              text not null,
  description        text,
  vehicle_type       text not null,          -- 'Taxi' | 'Motorcycle' | 'Minibus' | ...
  category           text default 'Transport & Delivery',
  location           text not null,          -- Primary city
  from_city          text,
  to_city            text,
  covers_other_routes boolean default false,

  -- Pricing
  price              numeric,
  price_type         text default 'fixed',   -- 'fixed' | 'hourly' | 'daily' | 'per km' | 'negotiable'
  price_display      text,                   -- Custom human-readable label

  -- Contact
  whatsapp           text,
  phone              text,

  -- State
  is_online          boolean default true,
  status             text default 'active',  -- 'active' | 'paused' | 'deleted'

  -- Tags & features
  tags               text[] default '{}',

  -- Stats
  rating             numeric(3,2) default 0,
  review_count       integer default 0,
  view_count         integer default 0
);

-- Indexes
create index if not exists listings_operator_token_idx  on listings(operator_token);
create index if not exists listings_status_idx          on listings(status);
create index if not exists listings_vehicle_type_idx    on listings(vehicle_type);
create index if not exists listings_location_idx        on listings(location);
create index if not exists listings_is_online_idx       on listings(is_online);
create index if not exists listings_created_at_idx      on listings(created_at desc);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on listings
  for each row execute function update_updated_at();

-- Enable Supabase Realtime replication
alter publication supabase_realtime add table listings;

-- ───────────────────────────────────────────────────────────────
-- BOOKINGS
-- ───────────────────────────────────────────────────────────────
create table if not exists bookings (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null,

  listing_id         uuid references listings(id) on delete cascade,

  -- Booker is also anonymous
  booker_token       text not null,           -- from booker's localStorage (same identity system)
  booker_name        text,
  booker_phone       text,

  -- Trip details
  from_location      text not null,
  to_location        text not null,
  trip_date          date,
  trip_time          time,
  trip_type          text default 'one-way',  -- 'one-way' | 'round-trip'
  passengers         integer default 1,

  -- Payment
  payment_method     text default 'cash',     -- 'airtel' | 'mpamba' | 'cash'

  -- State machine
  -- requesting → accepted → en_route → arrived → completed | cancelled
  status             text default 'requesting',

  notes              text,
  operator_notes     text
);

create index if not exists bookings_listing_id_idx   on bookings(listing_id);
create index if not exists bookings_booker_token_idx on bookings(booker_token);
create index if not exists bookings_status_idx       on bookings(status);
create index if not exists bookings_created_at_idx   on bookings(created_at desc);

create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at();

-- Enable Realtime for live booking status updates
alter publication supabase_realtime add table bookings;

-- ───────────────────────────────────────────────────────────────
-- REVIEWS
-- ───────────────────────────────────────────────────────────────
create table if not exists reviews (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz default now() not null,

  listing_id         uuid references listings(id) on delete cascade,
  booking_id         uuid references bookings(id) on delete set null,

  -- Reviewer is anonymous
  reviewer_token     text not null,
  reviewer_name      text default 'Anonymous',

  rating             integer not null check (rating between 1 and 5),
  comment            text,

  -- Prevent duplicate reviews from same token per listing
  unique(listing_id, reviewer_token)
);

create index if not exists reviews_listing_id_idx on reviews(listing_id);

-- After insert/update on reviews: update listing's aggregate rating
create or replace function update_listing_rating()
returns trigger language plpgsql as $$
begin
  update listings
  set
    rating       = (select avg(rating)::numeric(3,2) from reviews where listing_id = new.listing_id),
    review_count = (select count(*)               from reviews where listing_id = new.listing_id),
    updated_at   = now()
  where id = new.listing_id;
  return new;
end;
$$;

create trigger reviews_after_insert
  after insert or update on reviews
  for each row execute function update_listing_rating();

-- ───────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────────────────────────

-- Listings: anyone can read active listings; operators manage their own via token
alter table listings enable row level security;

create policy "listings_select_active"
  on listings for select
  using (status = 'active');

-- Allow anonymous inserts (operator_token comes from client)
create policy "listings_insert_anon"
  on listings for insert
  with check (operator_token is not null and length(operator_token) > 10);

-- Operators can update/delete their own listings by matching token
-- (RLS can't verify localStorage token server-side without custom auth,
-- so we use a Postgres function with the token passed as a header)
create policy "listings_update_own"
  on listings for update
  using (operator_token = current_setting('request.operator_token', true));

create policy "listings_delete_own"
  on listings for delete
  using (operator_token = current_setting('request.operator_token', true));

-- Bookings: anyone can insert; read/update filtered by token
alter table bookings enable row level security;

create policy "bookings_insert_anon"
  on bookings for insert
  with check (booker_token is not null);

create policy "bookings_select_own"
  on bookings for select
  using (
    booker_token = current_setting('request.operator_token', true)
    or listing_id in (
      select id from listings
      where operator_token = current_setting('request.operator_token', true)
    )
  );

-- Reviews: anyone can insert (unique constraint prevents duplicates)
alter table reviews enable row level security;

create policy "reviews_insert_anon"
  on reviews for insert
  with check (reviewer_token is not null);

create policy "reviews_select_all"
  on reviews for select
  using (true);

-- ───────────────────────────────────────────────────────────────
-- HELPER: upsert view tracking (reuse existing RPC pattern)
-- ───────────────────────────────────────────────────────────────
create or replace function increment_listing_views(p_listing_id uuid)
returns void language plpgsql security definer as $$
begin
  update listings set view_count = view_count + 1 where id = p_listing_id;
end;
$$;

-- ───────────────────────────────────────────────────────────────
-- REPORTS (trust & safety)
-- ───────────────────────────────────────────────────────────────
create table if not exists reports (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  listing_id      uuid references listings(id) on delete cascade,
  reporter_token  text not null,
  reason          text not null,
  detail          text,
  status          text default 'pending',   -- 'pending' | 'reviewed' | 'actioned'
  unique(listing_id, reporter_token)         -- one report per device per listing
);
alter table reports enable row level security;
create policy "reports_insert_anon" on reports for insert with check (reporter_token is not null);

-- ───────────────────────────────────────────────────────────────
-- PREMIUM & VERIFICATION columns on listings
-- ───────────────────────────────────────────────────────────────
alter table listings add column if not exists is_verified  boolean default false;
alter table listings add column if not exists is_premium   boolean default false;
alter table listings add column if not exists is_featured  boolean default false;
alter table listings add column if not exists premium_until timestamptz;

-- ───────────────────────────────────────────────────────────────
-- PREMIUM LISTINGS purchase log
-- ───────────────────────────────────────────────────────────────
create table if not exists premium_listings (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  listing_id      uuid references listings(id) on delete cascade,
  operator_token  text not null,
  plan            text default 'monthly',   -- 'monthly' | 'quarterly' | 'yearly'
  amount_mk       integer,
  payment_method  text,
  payment_ref     text,
  expires_at      timestamptz,
  status          text default 'pending'    -- 'pending' | 'active' | 'expired'
);
alter table premium_listings enable row level security;
create policy "premium_insert_anon" on premium_listings for insert with check (operator_token is not null);
create policy "premium_select_own"  on premium_listings for select
  using (operator_token = current_setting('request.operator_token', true));

-- ───────────────────────────────────────────────────────────────
-- OPERATOR NOTIFICATIONS (no-auth, by token)
-- ───────────────────────────────────────────────────────────────
create table if not exists operator_notifications (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  operator_token  text not null,
  type            text not null default 'system',
  title           text not null,
  message         text,
  read            boolean default false,
  link            text
);
create index if not exists op_notif_token_idx on operator_notifications(operator_token);
alter table operator_notifications enable row level security;
create policy "opnotif_select_own" on operator_notifications for select
  using (operator_token = current_setting('request.operator_token', true));
create policy "opnotif_update_own" on operator_notifications for update
  using (operator_token = current_setting('request.operator_token', true));
-- Allow server-side insert (from triggers/functions)
create policy "opnotif_insert_service" on operator_notifications for insert
  with check (true);

-- Trigger: notify operator when a booking is made on their listing
create or replace function notify_operator_on_booking()
returns trigger language plpgsql security definer as $$
declare
  op_token text;
  l_title  text;
begin
  select operator_token, title into op_token, l_title
  from listings where id = new.listing_id;

  if op_token is not null then
    insert into operator_notifications(operator_token, type, title, message, link)
    values (
      op_token,
      'booking_update',
      '📅 New Booking Request',
      'Someone wants to book "' || l_title || '" from ' || new.from_location || ' to ' || new.to_location,
      '/dashboard'
    );
  end if;
  return new;
end;
$$;

create trigger bookings_notify_operator
  after insert on bookings
  for each row execute function notify_operator_on_booking();

-- Trigger: notify operator when a review is posted
create or replace function notify_operator_on_review()
returns trigger language plpgsql security definer as $$
declare
  op_token text;
  l_title  text;
begin
  select operator_token, title into op_token, l_title
  from listings where id = new.listing_id;

  if op_token is not null then
    insert into operator_notifications(operator_token, type, title, message, link)
    values (
      op_token,
      'new_review',
      '⭐ New Review: ' || new.rating || '/5 stars',
      coalesce(new.comment, 'A passenger rated your listing "' || l_title || '"'),
      '/transport/' || new.listing_id
    );
  end if;
  return new;
end;
$$;

create trigger reviews_notify_operator
  after insert on reviews
  for each row execute function notify_operator_on_review();
