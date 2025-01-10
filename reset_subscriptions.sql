DROP TABLE IF EXISTS "Subscriptions" CASCADE;
DROP TYPE IF EXISTS "enum_Subscriptions_billingCycle" CASCADE;
DROP TYPE IF EXISTS "enum_Subscriptions_status" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 