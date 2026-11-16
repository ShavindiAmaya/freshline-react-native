-- FreshLine MVP database. Run ONCE in the Supabase SQL Editor.
-- Uses authenticated-user RLS for every user-owned table.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'FreshLine User',
  created_at timestamptz not null default now()
);

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  category text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  purchase_date date not null,
  expiry_date date not null,
  storage_location text not null default 'Fridge'
    check (storage_location in ('Fridge', 'Freezer', 'Pantry')),
  created_at timestamptz not null default now(),
  constraint valid_food_dates check (purchase_date <= expiry_date)
);

create table if not exists public.waste_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_item_id uuid references public.food_items(id) on delete set null,
  food_name text not null,
  category text not null,
  outcome text not null check (outcome in ('Consumed', 'Wasted')),
  quantity numeric not null check (quantity > 0),
  unit text not null,
  recorded_at timestamptz not null default now()
);

create index if not exists food_items_user_id_idx on public.food_items(user_id);
create index if not exists waste_records_user_id_recorded_idx
  on public.waste_records(user_id, recorded_at desc);

alter table public.profiles enable row level security;
alter table public.food_items enable row level security;
alter table public.waste_records enable row level security;

-- This file can be rerun without creating duplicate policies.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "food_select_own" on public.food_items;
create policy "food_select_own" on public.food_items
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "food_insert_own" on public.food_items;
create policy "food_insert_own" on public.food_items
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "food_update_own" on public.food_items;
create policy "food_update_own" on public.food_items
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "food_delete_own" on public.food_items;
create policy "food_delete_own" on public.food_items
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "waste_select_own" on public.waste_records;
create policy "waste_select_own" on public.waste_records
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "waste_insert_own" on public.waste_records;
create policy "waste_insert_own" on public.waste_records
  for insert to authenticated with check (user_id = (select auth.uid()));
-- Outcome history is intentionally immutable in the MVP: no update/delete policies.

-- Create one profile automatically when Supabase Auth creates a user.
create or replace function public.handle_new_freshline_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'FreshLine User'))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_freshline on auth.users;
create trigger on_auth_user_created_freshline
  after insert on auth.users for each row
  execute procedure public.handle_new_freshline_user();

-- Single atomic action: record outcome AND remove food in one transaction.
-- This avoids a 'waste saved but food not deleted' partial failure.
create or replace function public.finish_food_item(
  p_food_item_id uuid,
  p_outcome text
) returns void
language plpgsql security invoker set search_path = '' as $$
declare v_item public.food_items%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;
  if p_outcome not in ('Consumed', 'Wasted') then
    raise exception 'Invalid outcome';
  end if;
  select * into v_item from public.food_items
    where id = p_food_item_id and user_id = (select auth.uid())
    for update;
  if not found then
    raise exception 'Food item not found or already finished';
  end if;
  insert into public.waste_records
    (user_id, food_item_id, food_name, category, outcome, quantity, unit)
  values
    (v_item.user_id, v_item.id, v_item.name, v_item.category,
     p_outcome, v_item.quantity, v_item.unit);
  delete from public.food_items where id = v_item.id and user_id = (select auth.uid());
end;
$$;
revoke all on function public.finish_food_item(uuid, text) from public;
grant execute on function public.finish_food_item(uuid, text) to authenticated;
