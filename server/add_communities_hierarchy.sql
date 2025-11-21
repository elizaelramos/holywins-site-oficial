-- Renomear is_headquarters para is_main e headquarters_id para parent_id
-- Isso torna a hierarquia mais flexível

ALTER TABLE communities 
CHANGE COLUMN is_headquarters is_main BOOLEAN DEFAULT FALSE,
CHANGE COLUMN headquarters_id parent_id INT;

-- Atualizar a foreign key
ALTER TABLE communities 
DROP FOREIGN KEY communities_ibfk_1;

ALTER TABLE communities
ADD CONSTRAINT fk_parent_community 
FOREIGN KEY (parent_id) REFERENCES communities(id) ON DELETE SET NULL;
