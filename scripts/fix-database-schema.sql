-- Fix the foreign key constraint issue
-- First, drop the foreign key constraint that's causing the error
ALTER TABLE generations DROP CONSTRAINT IF EXISTS generations_user_email_fkey;

-- Make user_email nullable since we're using anonymous users
ALTER TABLE generations ALTER COLUMN user_email DROP NOT NULL;

-- Add some sample data to test
INSERT INTO generations (
  user_email, input_type, input_content, tone, 
  generated_title, generated_description
) VALUES (
  'test@mediaforge.com', 'tiktok', 'https://tiktok.com/test', 'video', 
  'Test TikTok Video', 'Test User'
) ON CONFLICT DO NOTHING;
