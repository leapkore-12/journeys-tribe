-- Add is_primary column to vehicle_images for primary photo selection
ALTER TABLE vehicle_images ADD COLUMN is_primary boolean DEFAULT false;