-- Migration: Automate Orphan Pruning (Auto-Cleanup)
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION prune_orphan_concepts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  ok boolean;
  n_orphans int;
BEGIN
  -- 1. Check Permissions
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid AND role IN ('admin', 'editor')
  ) INTO ok;
  
  -- IF NOT ok THEN RAISE EXCEPTION 'not authorized'; END IF;

  -- 2. Delete Orphan Concepts
  -- Delete concepts that have NO incoming edges (are not linked by any Topic/Field)
  DELETE FROM graph_nodes 
  WHERE type = 'concept' 
  AND NOT EXISTS (
    SELECT 1 FROM graph_edges WHERE target = graph_nodes.id
  );
  
  GET DIAGNOSTICS n_orphans = ROW_COUNT;

  RETURN jsonb_build_object(
    'deleted_orphans', n_orphans
  );
END $$;

-- Refresh permissions
REVOKE ALL ON FUNCTION prune_orphan_concepts() FROM public;
GRANT EXECUTE ON FUNCTION prune_orphan_concepts() TO authenticated;
