-- Campaign Chronicle Database Schema
-- MySQL/MariaDB compatible schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS campaign_chronicle;
USE campaign_chronicle;

-- Campaigns table
CREATE TABLE campaigns (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_campaigns_user (user_id),
    INDEX idx_campaigns_name (name),
    INDEX idx_campaigns_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Characters table
CREATE TABLE characters (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('PC', 'NPC', 'Villain', 'Ally') NOT NULL,
    race VARCHAR(100),
    class VARCHAR(100),
    location VARCHAR(36), -- Location ID
    description TEXT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_characters_campaign (campaign_id),
    INDEX idx_characters_name (name),
    INDEX idx_characters_type (type),
    FULLTEXT idx_characters_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Locations table
CREATE TABLE locations (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('Continent', 'Region', 'City', 'Town', 'Village', 'Building', 'Room', 'Dungeon') NOT NULL,
    parent_id VARCHAR(36) NULL,
    description TEXT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE SET NULL,
    INDEX idx_locations_campaign (campaign_id),
    INDEX idx_locations_name (name),
    INDEX idx_locations_type (type),
    INDEX idx_locations_parent (parent_id),
    FULLTEXT idx_locations_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items table
CREATE TABLE items (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('Weapon', 'Armor', 'Magic Item', 'Tool', 'Treasure', 'Document', 'Key Item') NOT NULL,
    owner VARCHAR(36), -- Character ID
    location VARCHAR(36), -- Location ID
    description TEXT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_items_campaign (campaign_id),
    INDEX idx_items_name (name),
    INDEX idx_items_type (type),
    INDEX idx_items_owner (owner),
    INDEX idx_items_location (location),
    FULLTEXT idx_items_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notes table
CREATE TABLE notes (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_notes_campaign (campaign_id),
    INDEX idx_notes_title (title),
    INDEX idx_notes_created (created_at),
    FULLTEXT idx_notes_search (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relationships table
CREATE TABLE relationships (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    from_character VARCHAR(36) NOT NULL,
    to_character VARCHAR(36) NOT NULL,
    type ENUM('ally', 'enemy', 'family', 'mentor', 'neutral') NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (from_character) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (to_character) REFERENCES characters(id) ON DELETE CASCADE,
    INDEX idx_relationships_campaign (campaign_id),
    INDEX idx_relationships_from (from_character),
    INDEX idx_relationships_to (to_character),
    INDEX idx_relationships_type (type),
    UNIQUE KEY unique_relationship (from_character, to_character)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Timeline Events table
CREATE TABLE timeline_events (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date VARCHAR(255) NOT NULL,
    session_number INT UNSIGNED NULL,
    type ENUM('session', 'story', 'character', 'location', 'combat', 'milestone') NOT NULL,
    tags JSON,
    related_characters JSON,
    related_locations JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_timeline_campaign (campaign_id),
    INDEX idx_timeline_date (date),
    INDEX idx_timeline_session (session_number),
    INDEX idx_timeline_type (type),
    INDEX idx_timeline_created (created_at),
    FULLTEXT idx_timeline_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table (for Auth0 authentication)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'dm') NOT NULL DEFAULT 'user',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    password_hash VARCHAR(255) NULL, -- Optional for Auth0 users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_auth0_id (auth0_id),
    INDEX idx_users_username (username),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Future: Campaign Users (for collaboration)
CREATE TABLE campaign_users (
    campaign_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('owner', 'dm', 'player', 'viewer') NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (campaign_id, user_id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;