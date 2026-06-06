-- Usage pricing + full-station return guard.
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Pricing: first 10 minutes free, then ¥0.2 per started minute.
-- The ¥99 deposit is separate and unchanged.

alter table rentals
  add column if not exists usage_fee numeric not null default 0,
  add column if not exists fee_paid  boolean not null default false;

-- Return type changes (void -> numeric), so drop the old function first.
drop function if exists return_umbrella(uuid, text, boolean);

create function return_umbrella(
  p_rental_id    uuid,
  p_station_id   text,
  p_keep_deposit boolean
) returns numeric as $$
declare
  v_umbrella uuid;
  v_borrowed timestamptz;
  v_user     uuid;
  v_avail    int;
  v_cap      int;
  v_minutes  int;
  v_fee      numeric;
begin
  -- Lock the destination station and require a free dock.
  select available, capacity into v_avail, v_cap
    from stations where id = p_station_id for update;
  if v_avail is null then raise exception 'station_not_found'; end if;
  if v_avail >= v_cap then raise exception 'station_full'; end if;

  -- Load the active rental.
  select umbrella_id, borrowed_at, user_id
    into v_umbrella, v_borrowed, v_user
    from rentals where id = p_rental_id and status = 'active';
  if not found then raise exception 'rental_not_active'; end if;

  -- Usage fee: first 10 min free, then ¥0.2 per started minute.
  v_minutes := ceil(extract(epoch from (now() - v_borrowed)) / 60.0);
  v_fee := greatest(0, v_minutes - 10) * 0.2;

  update umbrellas set status = 'available', station_id = p_station_id where id = v_umbrella;
  update stations  set available = available + 1 where id = p_station_id;
  update rentals set
      status            = 'returned',
      returned_at       = now(),
      return_station_id = p_station_id,
      usage_fee         = v_fee,
      fee_paid          = true,
      deposit_status    = case when p_keep_deposit then 'kept' else 'refunded' end
    where id = p_rental_id;
  update profiles set active_rental_id = null where id = v_user;

  return v_fee;
end;
$$ language plpgsql security definer;
