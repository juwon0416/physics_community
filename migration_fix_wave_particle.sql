-- Fix missing year for Wave-Particle Duality to ensure it enters the chronological backbone
UPDATE topics 
SET year = '1924' 
WHERE (title = 'Wave-Particle Duality' OR slug = 'wave-particle-duality') 
  AND (year IS NULL OR year = '');

-- Ensure correct field assignment just in case
UPDATE topics
SET field_id = 'quantum'
WHERE (title = 'Wave-Particle Duality' OR slug = 'wave-particle-duality');
