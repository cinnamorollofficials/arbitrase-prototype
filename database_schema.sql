-- Database Schema DDL for Chains, Tokens, and Attributes
-- Designed for PostgreSQL (highly adaptable to MySQL/others)

-- 1. Chains Table
-- Represents blockchain networks (e.g., Ethereum, BNB Chain, Solana)
CREATE TABLE IF NOT EXISTS chains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    chain_identifier VARCHAR(100) NOT NULL UNIQUE, -- e.g., '1' (Ethereum Mainnet), '56' (BSC), 'solana' (Solana Mainnet)
    native_symbol VARCHAR(20) NOT NULL,           -- e.g., 'ETH', 'BNB', 'SOL'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chain Attributes Table (EAV Pattern for dynamic chain configurations)
-- Stores dynamic attributes such as RPC URLs, explorer URLs, block times, gas metrics, type (EVM/non-EVM)
CREATE TABLE IF NOT EXISTS chain_attributes (
    id SERIAL PRIMARY KEY,
    chain_id INT NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
    attribute_key VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_chain_attribute_key UNIQUE (chain_id, attribute_key)
);

-- 3. Tokens Table
-- Represents abstract assets (e.g., Tether, Solana, Pepe)
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL UNIQUE,           -- e.g., 'USDT', 'SOL', 'PEPE'
    name VARCHAR(150) NOT NULL,
    coingecko_id VARCHAR(100),                     -- CoinGecko mapping ID
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Token Attributes Table (EAV Pattern for dynamic and chain-specific token configurations)
-- If chain_id IS NULL: represents global token attributes (e.g., website_url, description, logo_url)
-- If chain_id IS NOT NULL: represents chain-specific token attributes (e.g., contract_address, decimals, transfer_fee)
CREATE TABLE IF NOT EXISTS token_attributes (
    id SERIAL PRIMARY KEY,
    token_id INT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    chain_id INT REFERENCES chains(id) ON DELETE CASCADE, -- Nullable (NULL = global, NOT NULL = chain-specific)
    attribute_key VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'string',      -- 'string', 'number', 'boolean', 'json'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE AND DATA INTEGRITY

-- In SQL standard, UNIQUE constraints treat NULL values as distinct. 
-- To enforce unique attributes per token, we create two partial unique indexes:
-- 1. Enforce unique keys for global token attributes (chain_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_token_global_attribute_key 
ON token_attributes (token_id, attribute_key) 
WHERE chain_id IS NULL;

-- 2. Enforce unique keys for chain-specific token attributes (chain_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_token_chain_attribute_key 
ON token_attributes (token_id, chain_id, attribute_key) 
WHERE chain_id IS NOT NULL;

-- Search performance indexes
CREATE INDEX IF NOT EXISTS idx_chains_active ON chains(is_active);
CREATE INDEX IF NOT EXISTS idx_tokens_active ON tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_token_attributes_lookup ON token_attributes(token_id, chain_id);

-- TRIGGER FOR AUTOMATIC UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_chains_timestamp BEFORE UPDATE ON chains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_chain_attributes_timestamp BEFORE UPDATE ON chain_attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_tokens_timestamp BEFORE UPDATE ON tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_token_attributes_timestamp BEFORE UPDATE ON token_attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
