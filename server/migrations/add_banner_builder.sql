-- Migration: Add Banner Builder Support
-- Adds support for customizable banners with components and draft mode

USE holywins;

-- Add new columns to banners table
ALTER TABLE banners
ADD COLUMN background_image VARCHAR(255) DEFAULT NULL COMMENT 'Background image (1351x750px recommended)',
ADD COLUMN components JSON DEFAULT NULL COMMENT 'Array of banner components (text, images, etc)',
ADD COLUMN is_draft BOOLEAN DEFAULT FALSE COMMENT 'Whether banner is in draft mode',
ADD COLUMN is_published BOOLEAN DEFAULT TRUE COMMENT 'Whether banner is published to frontend',
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update existing banners to use new structure
-- Convert old banners to new format (keeping backward compatibility)
UPDATE banners
SET background_image = image,
    is_published = TRUE,
    is_draft = FALSE
WHERE background_image IS NULL;

-- Note: The 'image' and 'imageMobile' columns are kept for backward compatibility
-- but new banners will use 'background_image' and 'components'
