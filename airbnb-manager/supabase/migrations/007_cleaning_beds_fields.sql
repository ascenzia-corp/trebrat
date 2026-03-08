-- Add cleaning check-in/check-out and beds fields to reservations
ALTER TABLE reservations
  ADD COLUMN cleaning_checkin BOOLEAN DEFAULT false,
  ADD COLUMN cleaning_checkin_by TEXT,
  ADD COLUMN cleaning_checkout BOOLEAN DEFAULT false,
  ADD COLUMN cleaning_checkout_by TEXT,
  ADD COLUMN beds_to_make BOOLEAN DEFAULT false,
  ADD COLUMN beds_to_make_by TEXT;
