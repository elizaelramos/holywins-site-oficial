USE holywins;

ALTER TABLE communities
ADD COLUMN diocese_url VARCHAR(500) DEFAULT '' AFTER facebook_url;
