-- Migration: Add content_light column to topic_sections
ALTER TABLE topic_sections ADD COLUMN content_light TEXT;

-- Optional: Backfill content_light with current content (or keep null)
-- UPDATE topic_sections SET content_light = content;
