-- Drop indexes first
DROP INDEX IF EXISTS public.idx_hourly_winners_timestamp;
DROP INDEX IF EXISTS public.idx_hourly_winners_player;
DROP INDEX IF EXISTS public.idx_player_names_address;

-- Drop the tables
DROP TABLE IF EXISTS public.hourly_winners;
DROP TABLE IF EXISTS public.player_names; 