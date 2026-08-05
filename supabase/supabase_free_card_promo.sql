-- Free Card Promo Claims Table
-- Tracks which users have claimed their free card (limit 100 total)
-- Also tracks IP to prevent incognito abuse (max 3 per IP)

CREATE TABLE IF NOT EXISTS free_card_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_free_card_claims_email ON free_card_claims(email);
CREATE INDEX IF NOT EXISTS idx_free_card_claims_ip ON free_card_claims(ip_address);

-- RLS Policy: Only service role can insert/read
ALTER TABLE free_card_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON free_card_claims
  FOR ALL USING (auth.role() = 'service_role');
