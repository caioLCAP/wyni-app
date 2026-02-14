-- Create the storage bucket for wines if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('wines', 'wines', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone (authenticated or anonymous) to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'wines' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated Users can Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'wines' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy to allow authenticated users to update their own images
CREATE POLICY "Authenticated Users can Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'wines' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy to allow authenticated users to delete their own images
CREATE POLICY "Authenticated Users can Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'wines' AND auth.uid()::text = (storage.foldername(name))[1] );
