-- Optional SQL Seed File for Campus360
-- Notice: Use database/migrator.js for dynamic cryptographic hashing seeds.

INSERT INTO users (uuid, email, username, password_hash, first_name, last_name, role, is_active, is_verified)
VALUES 
('a0000000-0000-0000-0000-000000000001', 'admin@campus360.internal', 'superadmin', '$2b$12$K8yR2u/x90oUjO0dG4z1ne7o32k4G5B.G6s9h8w.xY0aB1c2D3e4F', 'Campus', 'Admin', 'admin', 1, 1),
('a0000000-0000-0000-0000-000000000002', 'faculty@campus360.internal', 'faculty1', '$2b$12$K8yR2u/x90oUjO0dG4z1ne7o32k4G5B.G6s9h8w.xY0aB1c2D3e4F', 'John', 'Professor', 'faculty', 1, 1),
('a0000000-0000-0000-0000-000000000003', 'student@campus360.internal', 'student1', '$2b$12$K8yR2u/x90oUjO0dG4z1ne7o32k4G5B.G6s9h8w.xY0aB1c2D3e4F', 'Sanjay', 'Kumar', 'student', 1, 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
