-- Campaign Chronicle dice tables. Run once after the base schema and before
-- enabling the dice routes. Runtime controllers must never mutate schema.
CREATE TABLE IF NOT EXISTS dice_rolls (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    player_id VARCHAR(36) NULL,
    player_name VARCHAR(255) NULL,
    expression VARCHAR(255) NOT NULL,
    result INT NOT NULL,
    individual_rolls JSON NOT NULL,
    modifier INT NOT NULL DEFAULT 0,
    context VARCHAR(255) NULL,
    advantage BOOLEAN NOT NULL DEFAULT FALSE,
    disadvantage BOOLEAN NOT NULL DEFAULT FALSE,
    critical BOOLEAN NOT NULL DEFAULT FALSE,
    tags JSON NULL,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dice_rolls_campaign_created (campaign_id, created_at),
    INDEX idx_dice_rolls_player (player_id),
    CONSTRAINT fk_dice_rolls_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dice_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    expression VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category ENUM('attack', 'damage', 'save', 'skill', 'custom') NOT NULL,
    tags JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dice_templates_campaign_category (campaign_id, category),
    CONSTRAINT fk_dice_templates_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
