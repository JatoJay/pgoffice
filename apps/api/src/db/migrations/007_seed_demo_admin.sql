-- Add unique constraint on email if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Seed demo admin user
-- Email: demo@pgmonitor.io
-- Password: demo1234

INSERT INTO users (email, name, password_hash)
SELECT 'demo@pgmonitor.io', 'Demo Admin', '$2b$10$S1Wt2.Oj2MCkuopzQ9UQL.W/YXJjTp0ABlsjtx8f2X0seGv0TIca.'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@pgmonitor.io');
