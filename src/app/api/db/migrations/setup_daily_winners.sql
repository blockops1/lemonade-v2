-- Create the daily_winners table
CREATE TABLE IF NOT EXISTS public.daily_winners (
    id SERIAL PRIMARY KEY,
    date_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    player_address VARCHAR(255) NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    score DECIMAL(20, 2) NOT NULL,
    rank INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_daily_winners_timestamp ON public.daily_winners(date_timestamp);
CREATE INDEX idx_daily_winners_player ON public.daily_winners(player_address); 