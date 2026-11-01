-- Valtrix V5: novas estruturas de planejamento financeiro.
-- Execute no SQL Editor do Supabase. Seguro para executar mais de uma vez.
create extension if not exists pgcrypto;

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  amount numeric(12,2) not null check (amount > 0),
  saved_amount numeric(12,2) not null default 0 check (saved_amount >= 0),
  target_date date not null,
  category text not null default 'Outros',
  created_at timestamptz not null default now()
);
create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  created_at timestamptz not null default now(),
  unique(user_id, category, month)
);
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Outros',
  frequency text not null check (frequency in ('weekly','monthly','yearly')),
  next_due date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists financial_goals_user_idx on public.financial_goals(user_id, created_at desc);
create index if not exists monthly_budgets_user_month_idx on public.monthly_budgets(user_id, month);
create index if not exists recurring_expenses_user_due_idx on public.recurring_expenses(user_id, next_due);

alter table public.financial_goals enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.recurring_expenses enable row level security;

drop policy if exists "Users manage own financial goals" on public.financial_goals;
create policy "Users manage own financial goals" on public.financial_goals for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own monthly budgets" on public.monthly_budgets;
create policy "Users manage own monthly budgets" on public.monthly_budgets for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own recurring expenses" on public.recurring_expenses;
create policy "Users manage own recurring expenses" on public.recurring_expenses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
