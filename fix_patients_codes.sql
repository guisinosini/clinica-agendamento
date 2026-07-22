-- Script de Correção: Gerar códigos sequenciais retroativos para pacientes sem código
-- Garante que o código será gerado a partir do último número usado no ano do cadastro
WITH max_seq_per_year AS (
  SELECT 
    split_part(code, '/', 2) as year_suffix,
    MAX(NULLIF(regexp_replace(split_part(code, '/', 1), '\D', '', 'g'), '')::integer) as max_seq
  FROM patients
  WHERE code IS NOT NULL AND code LIKE '%/%'
  GROUP BY split_part(code, '/', 2)
),
patients_to_update AS (
  SELECT 
    p.id,
    to_char(p.created_at, 'YY') as p_year,
    ROW_NUMBER() OVER (
      PARTITION BY to_char(p.created_at, 'YY') 
      ORDER BY p.created_at ASC
    ) as row_num
  FROM patients p
  WHERE p.code IS NULL OR p.code = ''
)
UPDATE patients p
SET code = LPAD((COALESCE(m.max_seq, 0) + u.row_num)::text, 4, '0') || '/' || u.p_year
FROM patients_to_update u
LEFT JOIN max_seq_per_year m ON m.year_suffix = u.p_year
WHERE p.id = u.id;
