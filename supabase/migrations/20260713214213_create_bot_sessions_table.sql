/*
# Create bot_sessions table for WhatsApp bot session management

1. New Tables
- `bot_sessions`
  - `id` (uuid, primary key)
  - `phone_number` (text, the WhatsApp number being paired)
  - `pairing_code` (text, the pairing code generated)
  - `session_id` (text, unique identifier for the auth session folder)
  - `status` (text: 'pending', 'connected', 'disconnected', 'logged_out')
  - `bot_name` (text, name of the bot)
  - `connected_at` (timestamp, when bot connected)
  - `last_active` (timestamp, last activity)
  - `created_at` (timestamp, record creation)

2. Security
- Enable RLS on `bot_sessions`.
- Single-tenant no-auth app: allow anon + authenticated full CRUD (the pairing portal
  needs to create/read/update/delete sessions without user sign-in).
*/

CREATE TABLE IF NOT EXISTS bot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  pairing_code text,
  session_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  bot_name text DEFAULT 'TYLER-BOT',
  connected_at timestamptz,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bot_sessions" ON bot_sessions;
CREATE POLICY "anon_select_bot_sessions" ON bot_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bot_sessions" ON bot_sessions;
CREATE POLICY "anon_insert_bot_sessions" ON bot_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bot_sessions" ON bot_sessions;
CREATE POLICY "anon_update_bot_sessions" ON bot_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bot_sessions" ON bot_sessions;
CREATE POLICY "anon_delete_bot_sessions" ON bot_sessions FOR DELETE
  TO anon, authenticated USING (true);
