ALTER TABLE communities
ADD COLUMN category ENUM('Catedral', 'Santuário', 'Paróquia', 'Capela', 'Comunidade') DEFAULT 'Comunidade' AFTER name;
