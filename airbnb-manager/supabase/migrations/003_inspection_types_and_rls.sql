-- Add inspection type (checkin vs checkout) to inspection_items
ALTER TABLE inspection_items
  ADD COLUMN IF NOT EXISTS inspection_type TEXT DEFAULT 'checkout'
  CHECK (inspection_type IN ('checkin', 'checkout'));

-- Make reservations writable by all authenticated users (not just owner)
-- This fixes deletion and creation for cleaning/maintenance roles
DROP POLICY IF EXISTS "Owner can insert reservations" ON reservations;
DROP POLICY IF EXISTS "Owner can update reservations" ON reservations;
DROP POLICY IF EXISTS "Owner can delete reservations" ON reservations;
DROP POLICY IF EXISTS "Cleaning can update reservation flags" ON reservations;

CREATE POLICY "Authenticated can insert reservations" ON reservations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update reservations" ON reservations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete reservations" ON reservations
  FOR DELETE TO authenticated USING (true);

-- Also allow all roles to manage tasks
DROP POLICY IF EXISTS "Owner can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Cleaning can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Owner can delete tasks" ON tasks;

CREATE POLICY "Authenticated can insert tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update tasks" ON tasks
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete tasks" ON tasks
  FOR DELETE TO authenticated USING (true);
