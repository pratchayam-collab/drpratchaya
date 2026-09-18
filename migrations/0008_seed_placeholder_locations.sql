-- Production ships with no seeded practice locations.
-- Dev fixtures (slots + external booking modes) live in scripts/seed-dev-booking-fixtures.sql
-- and are applied locally via `npm run db:seed:dev` after migrations.

PRAGMA foreign_keys = ON;

-- intentional no-op: owner adds real locations through admin before go-live
