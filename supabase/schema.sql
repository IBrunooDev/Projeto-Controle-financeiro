-- Valtrix: esquema inicial do banco Supabase.
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- RLS garante que cada usuário só acesse os próprios registros.

create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  payment_source text not null check (payment_source in ('balance', 'reserve')),
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.reserve_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Reserva',
  description text not null default '',
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions(user_id, occurred_at desc);
create index if not exists purchases_user_date_idx on public.purchases(user_id, occurred_at desc);
create index if not exists reserve_movements_user_date_idx on public.reserve_movements(user_id, occurred_at desc);

alter table public.transactions enable row level security;
alter table public.purchases enable row level security;
alter table public.reserve_movements enable row level security;

drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions" on public.transactions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own purchases" on public.purchases;
create policy "Users manage own purchases" on public.purchases
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own reserve movements" on public.reserve_movements;
create policy "Users manage own reserve movements" on public.reserve_movements
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Não crie nem coloque a service_role key no Front-end.
