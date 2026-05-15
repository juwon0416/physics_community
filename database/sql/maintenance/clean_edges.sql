-- 1. Remove Orphan Edges (where source or target does not exist)
delete from graph_edges e
where not exists (select 1 from graph_nodes n where n.id = e.source)
   or not exists (select 1 from graph_nodes n where n.id = e.target);

-- 2. Clean up invalid labels (optional)
update graph_edges set label = 'related_to' where label is null;
alter table graph_edges alter column label set default 'related_to';

-- 3. Remove Duplicate Edges (keep latest)
delete from graph_edges a
using graph_edges b
where a.ctid < b.ctid
  and a.source=b.source and a.target=b.target and a.label=b.label;

-- 4. Add Constraint to prevent future duplicates
-- Failure here implies duplicates typically, but step 3 removed them.
alter table graph_edges
  add constraint graph_edges_unique unique (source, target, label);
