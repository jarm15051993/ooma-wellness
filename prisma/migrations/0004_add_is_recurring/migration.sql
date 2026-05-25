ALTER TABLE "Package" ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT true;

-- Mark single-class (Clase Suelta) packages as one-time
UPDATE "Package" SET "isRecurring" = false WHERE name ILIKE '%clase suelta%' OR name ILIKE '%1 class%' OR name ILIKE '%1 clase%';
