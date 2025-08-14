-- Drop view jika sudah ada
DROP VIEW IF EXISTS user_profiles_with_roles;

-- Membuat view user_profiles_with_roles yang menggabungkan data profiles dan user_roles
CREATE VIEW user_profiles_with_roles AS
SELECT 
    p.id,
    p.id as user_id,
    p.full_name,
    p.email,
    p.role,
    p.created_at,
    p.updated_at
FROM profiles p;

-- Grant permissions untuk anon dan authenticated roles
GRANT SELECT ON user_profiles_with_roles TO anon;
GRANT SELECT ON user_profiles_with_roles TO authenticated;