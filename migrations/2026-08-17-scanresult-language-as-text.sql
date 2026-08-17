-- CBOMkit migration: store ScanResult.language as text instead of an enum ordinal
--
-- See https://github.com/cbomkit/cbomkit/issues/345
--
-- `language` used to be mapped as an unannotated Java enum, so Hibernate stored it as an ordinal
-- and generated a check constraint listing the languages that existed when the table was created.
-- `quarkus.hibernate-orm.schema-management.strategy=update` never rewrites a check constraint, so
-- databases created while only JAVA and PYTHON existed reject every scan that reports a GO result.
--
-- Run this once against every database created before this change. Databases created afterwards
-- already have a `varchar` column and no check constraint, and do not need it.
--
--   psql -U cbomkit -d postgres -f 2026-08-17-scanresult-language-as-text.sql
--
-- The CASE below maps the ordinals that were actually persisted. GO (2) is listed for completeness
-- only: it never committed, since the constraint that this migration removes rejected it.

BEGIN;

ALTER TABLE scanresult DROP CONSTRAINT IF EXISTS scanresult_language_check;

ALTER TABLE scanresult
    ALTER COLUMN language TYPE varchar(255)
        USING CASE language
                  WHEN 0 THEN 'JAVA'
                  WHEN 1 THEN 'PYTHON'
                  WHEN 2 THEN 'GO'
              END;

COMMIT;
