-- Add inspector_name to inspection_items so we know who performed the inspection
ALTER TABLE inspection_items ADD COLUMN inspector_name TEXT;
