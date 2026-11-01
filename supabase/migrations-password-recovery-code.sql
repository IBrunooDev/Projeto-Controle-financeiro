-- Recuperação de senha por código pessoal. Execute no SQL Editor do Supabase.
create table if not exists public.password_recovery_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  code_hash text not null,
  salt text not null,
  updated_at timestamptz not null default now()
);
alter table public.password_recovery_codes enable row level security;
-- Sem policies para anon/authenticated: somente a Edge Function com service role acessa os hashes.

create table if not exists public.password_recovery_attempts (
  email text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now()
);
alter table public.password_recovery_attempts enable row level security;

create or replace function public.check_password_recovery_attempt(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare current_attempts integer; started_at timestamptz;
begin
  insert into public.password_recovery_attempts(email, attempts, window_started_at)
  values (lower(trim(p_email)), 1, now())
  on conflict (email) do update
    set attempts = case when password_recovery_attempts.window_started_at < now() - interval '15 minutes' then 1 else password_recovery_attempts.attempts + 1 end,
        window_started_at = case when password_recovery_attempts.window_started_at < now() - interval '15 minutes' then now() else password_recovery_attempts.window_started_at end;
  select attempts, window_started_at into current_attempts, started_at
    from public.password_recovery_attempts where email = lower(trim(p_email));
  return current_attempts <= 5;
end;
$$;
revoke all on function public.check_password_recovery_attempt(text) from public, anon, authenticated;
grant execute on function public.check_password_recovery_attempt(text) to service_role;
