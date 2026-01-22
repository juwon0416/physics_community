-- Migration: Add content column to topics table
ALTER TABLE topics ADD COLUMN IF NOT EXISTS content TEXT;

-- Verify it exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'topics';
