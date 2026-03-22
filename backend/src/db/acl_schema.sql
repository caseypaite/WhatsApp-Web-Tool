-- Create Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial roles
INSERT INTO roles (name, description) VALUES 
('SuperAdmin', 'Unrestricted administrative access to all systems.'),
('Admin', 'Full access to the system, including user management and CMS.'),
('Editor', 'Access to CMS and content updates.'),
('User', 'Standard user access to application features.')
ON CONFLICT (name) DO NOTHING;

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
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

-- Create Message Templates table
CREATE TABLE IF NOT EXISTS message_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(50), -- image, document, audio
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Scheduled Messages table
CREATE TABLE IF NOT EXISTS scheduled_messages (
    id SERIAL PRIMARY KEY,
    targets JSONB NOT NULL, -- [{id, type}]
    message TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(50),
    scheduled_for TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SENT, FAILED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Auto Responders table
CREATE TABLE IF NOT EXISTS auto_responders (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(255) UNIQUE NOT NULL,
    response TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    match_type VARCHAR(20) DEFAULT 'EXACT', -- EXACT, CONTAINS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Poll Results table
CREATE TABLE IF NOT EXISTS poll_results (
    id SERIAL PRIMARY KEY,
    poll_id VARCHAR(255) UNIQUE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- {option_text: vote_count}
    chat_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advanced Poll System
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id), -- Null if public
    type VARCHAR(20) DEFAULT 'GENERAL', -- GENERAL, ELECTION
    access_type VARCHAR(20) DEFAULT 'PUBLIC', -- PUBLIC, CLOSED
    title VARCHAR(255) NOT NULL,
    description TEXT,
    options JSONB, -- For general polls: ["Option A", "Option B"]
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CLOSED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS poll_candidates (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    manifesto TEXT,
    biography TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    option_selected TEXT, -- For general
    candidate_id INTEGER REFERENCES poll_candidates(id), -- For election
    voter_user_id INTEGER REFERENCES users(id), -- For closed polls tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, phone_number)
);

-- Create System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_polls_creator ON polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_phone ON poll_votes(phone_number);
CREATE INDEX IF NOT EXISTS idx_message_history_phone ON message_history(phone_number);
CREATE INDEX IF NOT EXISTS idx_message_history_user ON message_history(user_id);

-- Seed default settings
INSERT INTO system_settings (key, value) VALUES 
('website_domain', 'localhost:3000'),
('otp_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
