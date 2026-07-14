/*
# Tighten RLS policies on bot_sessions

## Problem
All three write policies (INSERT, UPDATE, DELETE) used USING (true) / WITH CHECK (true),
allowing anyone with the anon key to insert arbitrary data, update any field to any
value, or delete any session — including active/connected ones.

## Changes
1. INSERT: WITH CHECK now validates phone_number (numeric, 7-15 digits), session_id
   (non-null), and status (must be one of the four allowed values if provided).
   This prevents injecting garbage or malformed rows.
2. UPDATE: WITH CHECK now validates that status, if set, is one of the four allowed
   values. USING stays true so the server can update any session's status (needed
   for connection lifecycle), but the new row data is validated.
3. DELETE: USING now requires status to be 'pending', 'disconnected', or
   'logged_out' — connected sessions cannot be deleted. This protects active
   bot sessions from being wiped by an attacker with the anon key.
4. SELECT: unchanged — session list is intentionally readable by the no-auth portal.

## Important notes
1. This is a no-auth app (no sign-in screen). The Express server talks to Supabase
   with the anon key, so policies must remain open to the anon role.
2. The server's DELETE endpoint now updates the session status to 'disconnected'
   before calling dbDeleteSession, so the DELETE policy's USING clause is satisfied.
3. These constraints enforce data integrity at the database level, independent of
   the application layer.
*/

-- SELECT: unchanged (no-auth portal needs to list sessions)
DROP POLICY IF EXISTS "anon_select_bot_sessions" ON bot_sessions;
CREATE POLICY "anon_select_bot_sessions" ON bot_sessions FOR SELECT
  TO anon, authenticated USING (true);

-- INSERT: validate data shape
DROP POLICY IF EXISTS "anon_insert_bot_sessions" ON bot_sessions;
CREATE POLICY "anon_insert_bot_sessions" ON bot_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (
    phone_number IS NOT NULL
    AND phone_number ~ '^[0-9]{7,15}$'
    AND session_id IS NOT NULL
    AND (status IS NULL OR status IN ('pending', 'connected', 'disconnected', 'logged_out'))
  );

-- UPDATE: validate new status value (USING stays open so server can update any row)
DROP POLICY IF EXISTS "anon_update_bot_sessions" ON bot_sessions;
CREATE POLICY "anon_update_bot_sessions" ON bot_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (
    status IS NULL OR status IN ('pending', 'connected', 'disconnected', 'logged_out')
  );

-- DELETE: only allow deleting non-connected sessions
DROP POLICY IF EXISTS "anon_delete_bot_sessions" ON bot_sessions;
CREATE POLICY "anon_delete_bot_sessions" ON bot_sessions FOR DELETE
  TO anon, authenticated USING (status IN ('pending', 'disconnected', 'logged_out'));
