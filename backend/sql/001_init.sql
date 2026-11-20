-- Schema from prompts/specs/02-backend.md §3. Applied once with `pnpm migrate` (src/scripts/migrate.ts).

create extension if not exists pgcrypto;

create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,          -- stored lower-cased
  password_hash text not null,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);

create table symbols (
  symbol     text primary key,
  name       text not null,
  sector     text,
  exchange   text,
  status     text not null default 'pending',  -- pending | ready | failed
  bars       integer not null default 0,
  first_date date,
  last_date  date,
  fetched_at timestamptz
);

create table daily_closes (
  symbol text not null references symbols(symbol) on delete cascade,
  d      date not null,
  close  numeric(18,6) not null check (close > 0),
  primary key (symbol, d)
);

create table rounds (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  symbol         text not null references symbols(symbol),
  cutoff_date    date not null,
  forward_return numeric(9,6) not null,        -- frozen at creation
  decision       text check (decision in ('buy','pass')),   -- null = open
  created_at     timestamptz not null default now(),
  decided_at     timestamptz
);

-- No rerolls: at most one open round per user, enforced by the database.
create unique index one_open_round_per_user on rounds(user_id) where decision is null;
create index rounds_user_decided on rounds(user_id, decided_at) where decision is not null;

create table api_usage (
  day     date primary key,                    -- UTC day
  credits integer not null default 0
);

-- Supabase exposure: RLS on with no policies, so the Data API's roles read nothing.
alter table users        enable row level security;
alter table symbols      enable row level security;
alter table daily_closes enable row level security;
alter table rounds       enable row level security;
alter table api_usage    enable row level security;
