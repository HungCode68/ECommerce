ALTER TABLE users
ADD COLUMN blocked_reason VARCHAR(255) NULL AFTER is_active;
