-- Drop existing indexes if they exist
DROP INDEX IF EXISTS public.idx_hourly_winners_timestamp;
DROP INDEX IF EXISTS public.idx_hourly_winners_player;
DROP INDEX IF EXISTS public.idx_daily_winners_timestamp;
DROP INDEX IF EXISTS public.idx_daily_winners_player;
DROP INDEX IF EXISTS public.idx_player_names_address;

-- Drop the old hourly_winners table if it exists
DROP TABLE IF EXISTS public.hourly_winners;
DROP TABLE IF EXISTS public.player_names;

-- Create the new daily_winners table
CREATE TABLE IF NOT EXISTS public.daily_winners (
    id SERIAL PRIMARY KEY,
    date_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    player_address VARCHAR(255) NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    score DECIMAL(20, 2) NOT NULL,
    rank INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create new indexes
CREATE INDEX idx_daily_winners_timestamp ON public.daily_winners(date_timestamp);
CREATE INDEX idx_daily_winners_player ON public.daily_winners(player_address);

-- Create player_names table
CREATE TABLE IF NOT EXISTS public.player_names (
    address TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_names_address ON public.player_names(address);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_names_updated_at
    BEFORE UPDATE ON public.player_names
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 