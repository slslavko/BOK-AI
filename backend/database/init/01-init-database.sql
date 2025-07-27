-- BOK-AI Multi-Tenant Database Initialization
-- This script sets up secure multi-tenant architecture with Row Level Security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create application role with limited permissions
CREATE ROLE bok_app_role;

-- ============================================================================
-- CORE TABLES - Shared across all tenants
-- ============================================================================

-- Users table (people who own BOK instances)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMP WITH TIME ZONE
);

-- Tenants table (BOK instances - each user can have one)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Business name
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    domain VARCHAR(255), -- Custom domain if any
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    -- Encryption key for this tenant (encrypted itself)
    encryption_key_encrypted TEXT NOT NULL
);

-- Create unique index to ensure one tenant per user
CREATE UNIQUE INDEX idx_tenants_user_id ON tenants(user_id);

-- ============================================================================
-- TENANT-SPECIFIC TABLES - Isolated by Row Level Security
-- ============================================================================

-- Bot configurations per tenant
CREATE TABLE bot_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bot_name VARCHAR(255) NOT NULL DEFAULT 'BOK',
    bot_personality TEXT,
    autonomy_level INTEGER NOT NULL DEFAULT 1 CHECK (autonomy_level BETWEEN 0 AND 2),
    response_tone VARCHAR(50) DEFAULT 'professional',
    escalation_rules TEXT,
    active_platforms TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base documents
CREATE TABLE knowledge_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    -- Encrypted content for sensitive data
    content_encrypted BYTEA,
    file_path TEXT, -- Path in MinIO if uploaded file
    file_type VARCHAR(50),
    file_size INTEGER,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Metadata for search and organization
    metadata JSONB DEFAULT '{}'
);

-- Vector embeddings for RAG (stored in Qdrant, referenced here)
CREATE TABLE knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    doc_id UUID NOT NULL REFERENCES knowledge_docs(id) ON DELETE CASCADE,
    qdrant_point_id UUID NOT NULL, -- ID in Qdrant vector DB
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations from various platforms
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id VARCHAR(255), -- ID from platform (Allegro, Facebook, etc.)
    platform VARCHAR(50) NOT NULL, -- 'allegro', 'facebook', 'olx', etc.
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'closed', 'escalated'
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Encrypted customer data
    customer_data_encrypted BYTEA,
    metadata JSONB DEFAULT '{}'
);

-- Individual messages within conversations
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('customer', 'bot', 'human')),
    content TEXT NOT NULL,
    -- Encrypted content for sensitive messages
    content_encrypted BYTEA,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_draft BOOLEAN DEFAULT false,
    confidence_score DECIMAL(3,2), -- AI confidence (0.00 to 1.00)
    -- Sources used for RAG response
    knowledge_sources UUID[] DEFAULT ARRAY[]::UUID[],
    metadata JSONB DEFAULT '{}'
);

-- Platform integrations and their credentials
CREATE TABLE platform_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    -- Encrypted credentials
    credentials_encrypted BYTEA NOT NULL,
    webhook_url VARCHAR(500),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'
);

-- Analytics and metrics
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID,
    user_agent TEXT,
    ip_address INET
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tenant-specific tables
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_bot_configs ON bot_configs
    FOR ALL TO bok_app_role
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_knowledge_docs ON knowledge_docs
    FOR ALL TO bok_app_role
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_knowledge_embeddings ON knowledge_embeddings
    FOR ALL TO bok_app_role
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_conversations ON conversations
    FOR ALL TO bok_app_role
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_messages ON messages
    FOR ALL TO bok_app_role
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_platform_integrations ON platform_integrations
    FOR ALL TO bok_app_role
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_analytics_events ON analytics_events
    FOR ALL TO bok_app_role
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Tenant-based indexes (critical for performance with RLS)
CREATE INDEX idx_bot_configs_tenant_id ON bot_configs(tenant_id);
CREATE INDEX idx_knowledge_docs_tenant_id ON knowledge_docs(tenant_id);
CREATE INDEX idx_knowledge_docs_tenant_active ON knowledge_docs(tenant_id, is_active);
CREATE INDEX idx_knowledge_embeddings_tenant_id ON knowledge_embeddings(tenant_id);
CREATE INDEX idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX idx_conversations_tenant_status ON conversations(tenant_id, status);
CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_platform_integrations_tenant_id ON platform_integrations(tenant_id);
CREATE INDEX idx_analytics_events_tenant_id ON analytics_events(tenant_id);

-- Search indexes
CREATE INDEX idx_knowledge_docs_search ON knowledge_docs USING gin(to_tsvector('polish', title || ' ' || content));
CREATE INDEX idx_messages_search ON messages USING gin(to_tsvector('polish', content));

-- Time-based indexes for analytics
CREATE INDEX idx_analytics_events_occurred_at ON analytics_events(tenant_id, occurred_at);
CREATE INDEX idx_conversations_created_at ON conversations(tenant_id, created_at);
CREATE INDEX idx_messages_sent_at ON messages(tenant_id, sent_at);

-- ============================================================================
-- FUNCTIONS FOR ENCRYPTION/DECRYPTION
-- ============================================================================

-- Function to encrypt sensitive data using tenant-specific key
CREATE OR REPLACE FUNCTION encrypt_for_tenant(data TEXT, tenant_key TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, tenant_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data using tenant-specific key
CREATE OR REPLACE FUNCTION decrypt_for_tenant(encrypted_data BYTEA, tenant_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, tenant_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_configs_updated_at BEFORE UPDATE ON bot_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_docs_updated_at BEFORE UPDATE ON knowledge_docs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_integrations_updated_at BEFORE UPDATE ON platform_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to application role
GRANT USAGE ON SCHEMA public TO bok_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bok_app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bok_app_role;

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ============================================================================

-- Insert sample user (password: 'password123' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, full_name, email_verified) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'demo@bok-ai.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo User', true);

-- Insert sample tenant
INSERT INTO tenants (id, user_id, name, slug, encryption_key_encrypted) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Demo Store', 'demo-store', 'encrypted_key_here');

-- Insert sample bot config
INSERT INTO bot_configs (tenant_id, bot_name, bot_personality, autonomy_level) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Rashid', 'Przyjazny asystent sprzedażowy', 1);

-- Insert sample knowledge doc
INSERT INTO knowledge_docs (tenant_id, title, content, category, tags) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 
 'Polityka zwrotów', 
 'Klienci mogą zwrócić produkty w ciągu 30 dni od zakupu. Produkt musi być w oryginalnym opakowaniu i nieużywany.',
 'Polityki',
 ARRAY['zwroty', 'reklamacje', 'polityka']);

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE 'BOK-AI database initialized successfully with multi-tenant architecture!';
    RAISE NOTICE 'Row Level Security enabled on all tenant tables.';
    RAISE NOTICE 'Sample data inserted for development.';
END $$; 