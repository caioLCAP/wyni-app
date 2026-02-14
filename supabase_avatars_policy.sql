-- 1. Create the bucket 'avatars' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policy to avoid conflicts (optional, safe to run)
DROP POLICY IF EXISTS "Avatars Public Access" ON storage.objects;

-- 3. Create the policy giving full access to everyone
-- This allows anyone to Read, Upload, and Update files in the avatars bucket.
CREATE POLICY "Avatars Public Access"
ON storage.objects FOR ALL
USING ( bucket_id = 'avatars' )
WITH CHECK ( bucket_id = 'avatars' );
