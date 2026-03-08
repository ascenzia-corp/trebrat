-- Fix: purchases.reservation_id missing ON DELETE CASCADE
-- This was preventing deletion of reservations that have linked purchases
ALTER TABLE purchases
  DROP CONSTRAINT IF EXISTS purchases_reservation_id_fkey,
  ADD CONSTRAINT purchases_reservation_id_fkey
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
