-- Create Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial roles
INSERT INTO roles (name, description) VALUES 
('Admin', 'Full access to the system, including user management and CMS.'),
('Editor', 'Access to CMS and content updates.'),
('User', 'Standard user access to application features.')
ON CONFLICT (name) DO NOTHING;

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth0_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    phone_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION', -- PENDING_VERIFICATION, PENDING_APPROVAL, ACTIVE, INACTIVE
    address TEXT,
    country VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    pincode VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create UserRoles association table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Create LandingPage content table
CREATE TABLE IF NOT EXISTS landing_page_config (
    id SERIAL PRIMARY KEY,
    hero_text TEXT NOT NULL,
    cta_text VARCHAR(255) NOT NULL,
    image_url TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Groups table
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create GroupMembers association table
CREATE TABLE IF NOT EXISTS group_members (
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MEMBER', -- MEMBER, ADMIN
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

-- Create Message History table
CREATE TABLE IF NOT EXISTS message_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'SUCCESS', -- SUCCESS, FAILED
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create OTP table
CREATE TABLE IF NOT EXISTS otp_verification (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    retry_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING' -- PENDING, VERIFIED, EXPIRED, FAILED
);

-- Create System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT INTO system_settings (key, value) VALUES 
('website_domain', 'localhost:3000'),
('otp_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
