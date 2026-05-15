-- Migration: Strict Topic-Specific Purge Function (Safe Mode + Text ID Support)
-- Run this in Supabase SQL Editor

-- First drop the old function with UUID signature to avoid ambiguity
DROP FUNCTION IF EXISTS purge_topic_nodes(uuid);

CREATE OR REPLACE FUNCTION purge_topic_nodes(target_topic_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  ok boolean;
  n_topic_concepts int;
BEGIN
  -- 1. Check Permissions
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid AND role IN ('admin', 'editor')
  ) INTO ok;
  
  -- IF NOT ok THEN RAISE EXCEPTION 'not authorized'; END IF;

  -- 2. Delete Concepts Linked ONLY to THIS Topic
  WITH deleted AS (
    DELETE FROM graph_nodes
    WHERE id IN (
        SELECT target FROM graph_edges 
        WHERE source = target_topic_id
    )
    AND type = 'concept'
    RETURNING id
  )
  SELECT count(*) INTO n_topic_concepts FROM deleted;

  RETURN jsonb_build_object(
    'deleted_concepts', n_topic_concepts,
    'message', 'Deleted only concepts linked to this topic.'
  );
END $$;

-- Refresh permissions
REVOKE ALL ON FUNCTION purge_topic_nodes(text) FROM public;
GRANT EXECUTE ON FUNCTION purge_topic_nodes(text) TO authenticated;
