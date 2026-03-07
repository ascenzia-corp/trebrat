-- Create the inspection-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload inspection photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'inspection-photos');

-- Allow anyone to read inspection photos (public bucket)
CREATE POLICY "Anyone can read inspection photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'inspection-photos');

-- Allow authenticated users to update their photos
CREATE POLICY "Authenticated users can update inspection photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'inspection-photos');

-- Allow authenticated users to delete their photos
CREATE POLICY "Authenticated users can delete inspection photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'inspection-photos');
