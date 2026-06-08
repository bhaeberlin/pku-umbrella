-- Add 10 new campus stations + their starting umbrellas.
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Each station needs (a) a stations row and (b) real `umbrellas` rows equal to
-- its starting `available` count, because borrow_umbrella() pulls an actual
-- umbrella row. The matching map coordinates + Chinese names live in code
-- (lib/stationCoords.ts, lib/i18n/stations.ts) and are deployed separately.
--
-- Safe to re-run: stations use ON CONFLICT DO NOTHING and umbrellas are only
-- seeded for stations that don't have any yet.

begin;

-- 1. Stations (id, English name, English description, capacity, starting umbrellas)
insert into stations (id, name, description, capacity, available) values
  ('PKU-WGATE-01',  'Historic West Gate',       'Inside the gate, to the left',        9, 7),
  ('PKU-SWGATE-01', 'Southwest Gate',           'Inside the gate, to the left',        9, 6),
  ('PKU-4FC-01',    'Four-storey cantine',      'First floor, next to the escalator',  9, 7),
  ('PKU-FMART-01',  'Family Mart at the dorms', 'Next to the cashier',                 9, 5),
  ('PKU-FACH-01',   'Faculty House',            'Inside, at the cashier',              9, 6),
  ('PKU-GUA2-01',   'Guanghua Building 2',      'Next to the main entrance',           9, 7),
  ('PKU-SGATE-01',  'South Gate',               'Inside the gate, to the right',       9, 4),
  ('PKU-DORM35-01', 'Student Dorms Building 35','Outside the Main Entrance',           9, 7),
  ('PKU-HOLLY-01',  'Former Cafe Hollywood',    'First floor next to the entrance',    9, 3),
  ('PKU-LUCKIN-01', 'Luckin Coffee',            'Next to the entrance',                9, 5)
on conflict (id) do nothing;

-- 2. Umbrellas — one available umbrella per starting count, only for stations
--    that don't already have umbrellas (keeps a re-run from duplicating them).
insert into umbrellas (id, station_id, color, status)
select gen_random_uuid(), s.id, 'black', 'available'
from (values
  ('PKU-WGATE-01',  7),
  ('PKU-SWGATE-01', 6),
  ('PKU-4FC-01',    7),
  ('PKU-FMART-01',  5),
  ('PKU-FACH-01',   6),
  ('PKU-GUA2-01',   7),
  ('PKU-SGATE-01',  4),
  ('PKU-DORM35-01', 7),
  ('PKU-HOLLY-01',  3),
  ('PKU-LUCKIN-01', 5)
) as s(id, n)
cross join lateral generate_series(1, s.n)
where not exists (select 1 from umbrellas u where u.station_id = s.id);

commit;

-- Sanity check (optional): each new station's available count should equal its
-- umbrella row count.
-- select s.id, s.available, count(u.*) as umbrellas
--   from stations s left join umbrellas u on u.station_id = s.id
--  where s.id like 'PKU-%' group by s.id, s.available order by s.id;
