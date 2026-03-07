-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'cleaning', 'maintenance')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER,
  floor TEXT
);

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_count INTEGER,
  checkin_date DATE NOT NULL,
  checkin_time TIME DEFAULT '16:00',
  checkout_date DATE NOT NULL,
  checkout_time TIME DEFAULT '11:00',
  key_hidden BOOLEAN DEFAULT false,
  cleaning_done BOOLEAN DEFAULT false,
  inspection_done BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  notes TEXT,
  google_event_id TEXT
);

-- Inspection items
CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  comment TEXT,
  status TEXT DEFAULT 'ok' CHECK (status IN ('ok', 'issue', 'needs_purchase')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Inspection photos
CREATE TABLE inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_item_id UUID REFERENCES inspection_items(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cleaning', 'inspection', 'purchase', 'maintenance')),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_role TEXT CHECK (assigned_role IN ('owner', 'cleaning', 'maintenance')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id),
  task_id UUID REFERENCES tasks(id),
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  purchased BOOLEAN DEFAULT false,
  receipt_photo TEXT,
  cost DECIMAL(10,2),
  purchased_by UUID REFERENCES auth.users(id),
  purchased_at TIMESTAMPTZ,
  notes TEXT
);

-- Settings (for Google Calendar)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_calendar_id TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- SEED ROOMS
-- =====================
INSERT INTO rooms (name, display_order, floor) VALUES
  ('Jardin', 1, 'Extérieur'),
  ('Terrasse', 2, 'Extérieur'),
  ('Cuisine', 3, 'RDC'),
  ('Séjour', 4, 'RDC'),
  ('Billard', 5, 'RDC'),
  ('Entrée', 6, 'RDC'),
  ('WC bas', 7, 'RDC'),
  ('Sous-sol', 8, 'Sous-sol'),
  ('Escalier Palier 1', 9, 'Étage 1'),
  ('Chambre Kaki', 10, 'Étage 1'),
  ('Salle de bains', 11, 'Étage 1'),
  ('Suite Parentale', 12, 'Étage 1'),
  ('Chambre filles', 13, 'Étage 1'),
  ('Escalier Palier 2', 14, 'Étage 2'),
  ('Salle de bains 2', 15, 'Étage 2'),
  ('Chambre grise', 16, 'Étage 2'),
  ('Chambre marron', 17, 'Étage 2'),
  ('Chambre bleue', 18, 'Étage 2'),
  ('Autres', 19, 'Autre');

-- =====================
-- RLS POLICIES
-- =====================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- User profiles: everyone can read, only own profile can update
CREATE POLICY "Users can read all profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Owner can insert profiles" ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'owner' OR id = auth.uid());
CREATE POLICY "Owner can delete profiles" ON user_profiles FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) = 'owner');

-- Rooms: everyone can read
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT TO authenticated USING (true);

-- Reservations: everyone reads, only owner can write
CREATE POLICY "Anyone can read reservations" ON reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert reservations" ON reservations FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'owner');
CREATE POLICY "Owner can update reservations" ON reservations FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) = 'owner');
CREATE POLICY "Cleaning can update reservation flags" ON reservations FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) = 'cleaning');
CREATE POLICY "Owner can delete reservations" ON reservations FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) = 'owner');

-- Inspection items: anyone reads, cleaning + owner write
CREATE POLICY "Anyone can read inspections" ON inspection_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cleaning and owner can insert inspections" ON inspection_items FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner', 'cleaning'));
CREATE POLICY "Cleaning and owner can update inspections" ON inspection_items FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner', 'cleaning'));

-- Inspection photos
CREATE POLICY "Anyone can read inspection photos" ON inspection_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cleaning and owner can insert photos" ON inspection_photos FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('owner', 'cleaning'));

-- Tasks
CREATE POLICY "Anyone can read tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert tasks" ON tasks FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'owner');
CREATE POLICY "Cleaning can insert tasks" ON tasks FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'cleaning');
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR get_user_role(auth.uid()) = 'owner');
CREATE POLICY "Owner can delete tasks" ON tasks FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) = 'owner');

-- Purchases
CREATE POLICY "Anyone can read purchases" ON purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert purchases" ON purchases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Maintenance and owner can update purchases" ON purchases FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('owner', 'maintenance'));
CREATE POLICY "Owner can delete purchases" ON purchases FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) = 'owner');

-- Settings: only owner
CREATE POLICY "Owner can read settings" ON settings FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) = 'owner');
CREATE POLICY "Owner can update settings" ON settings FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'owner');
