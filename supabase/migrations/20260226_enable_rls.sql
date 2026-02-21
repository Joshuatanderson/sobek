-- Enable RLS on all public tables.
-- Reads stay open to everyone (anon + authenticated).
-- Writes restricted: only authenticated users can mutate their own data.
-- Service-role key (supabaseAdmin) bypasses RLS entirely.

-- ============================================================
-- users
-- ============================================================
alter table public.users enable row level security;

create policy "Anyone can read users"
  on public.users for select
  using (true);

create policy "Authenticated users can insert own row"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update own row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Hide telegram_link_token from anon + authenticated roles.
-- Only supabaseAdmin (service_role) reads this column (in the webhook route).
-- No client-side code selects it.
revoke select (telegram_link_token) on public.users from anon, authenticated;

-- Prevent authenticated users from directly manipulating protected columns
-- via the PostgREST REST API. Only service_role (supabaseAdmin) can change these.
create or replace function protect_users_columns()
returns trigger as $$
begin
  -- Allow service_role to change anything
  if current_setting('role') = 'service_role' then
    return new;
  end if;

  -- Block changes to protected columns
  if new.reputation_sum is distinct from old.reputation_sum then
    raise exception 'Cannot directly modify reputation_sum';
  end if;
  if new.erc8004_agent_id is distinct from old.erc8004_agent_id then
    raise exception 'Cannot directly modify erc8004_agent_id';
  end if;
  if new.telegram_chat_id is distinct from old.telegram_chat_id then
    raise exception 'Cannot directly modify telegram_chat_id';
  end if;
  if new.telegram_link_token is distinct from old.telegram_link_token then
    raise exception 'Cannot directly modify telegram_link_token';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger users_protect_columns
  before update on public.users
  for each row
  execute function protect_users_columns();

-- ============================================================
-- products
-- ============================================================
alter table public.products enable row level security;

create policy "Anyone can read products"
  on public.products for select
  using (true);

create policy "Authenticated users can create products"
  on public.products for insert
  with check (auth.uid() = agent_id);

-- Enforce price validation at the DB level so direct REST API calls
-- can't bypass server action validation.
alter table public.products
  add constraint products_price_positive check (price_usdc > 0);

-- ============================================================
-- transactions
-- ============================================================
alter table public.transactions enable row level security;

create policy "Anyone can read transactions"
  on public.transactions for select
  using (true);

-- No anon insert/update/delete — all writes go through supabaseAdmin.

-- ============================================================
-- reputation_events
-- ============================================================
alter table public.reputation_events enable row level security;

create policy "Anyone can read reputation events"
  on public.reputation_events for select
  using (true);

-- No anon insert/update/delete — all writes go through supabaseAdmin.
