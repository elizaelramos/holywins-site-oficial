CREATE TABLE IF NOT EXISTS communities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_headquarters BOOLEAN DEFAULT FALSE,
  headquarters_id INT,
  priest_name VARCHAR(255),
  priest_photo_url VARCHAR(255),
  mass_schedule TEXT,
  address TEXT,
  phone VARCHAR(50),
  instagram_url VARCHAR(255),
  facebook_url VARCHAR(255),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (headquarters_id) REFERENCES communities(id)
);

-- Inserir a Sede
INSERT INTO communities (name, is_headquarters, priest_name, priest_photo_url, mass_schedule, address, phone, instagram_url, facebook_url, image_url, latitude, longitude)
VALUES 
('Paróquia São João Bosco', TRUE, 'Padre Valdecir', '/images/padre_valdecir.jpg', 'Seg-Sex: 19h, Sáb: 18h, Dom: 07h, 10h, 19h', 'Rua Dom Aquino, 1077 · Corumbá - MS', '(67) 3231-8922', 'https://www.instagram.com/psjbcorumba/', 'https://www.facebook.com/psjbcorumba', '/images/comunidades/sao_joao_bosco.jpg', -19.0051327, -57.6676477);

-- Inserir as filiais, referenciando o ID da Sede (que é 1)
INSERT INTO communities (name, headquarters_id, priest_name, priest_photo_url, mass_schedule, address, phone, instagram_url, facebook_url, image_url)
VALUES
('Comunidade Nossa Senhora de Fátima', 1, 'Padre Valdecir', '/images/padre_valdecir.jpg', 'Dom: 08h30', 'Rua C, 123, Bairro Universitário', '(67) 99999-1111', 'https://www.instagram.com/comunidadefatima/', 'https://www.facebook.com/comunidadefatima', '/images/comunidades/fatima.jpg'),
('Comunidade Sagrado Coração de Jesus', 1, 'Padre Valdecir', '/images/padre_valdecir.jpg', 'Dom: 17h', 'Rua D, 456, Bairro Cristo Redentor', '(67) 99999-2222', 'https://www.instagram.com/comunidadesagrado/', 'https://www.facebook.com/comunidadesagrado', '/images/comunidades/sagrado_coracao.jpg'),
('Comunidade São Francisco de Assis', 1, 'Padre Valdecir', '/images/padre_valdecir.jpg', 'Sáb: 19h30', 'Rua E, 789, Bairro Aeroporto', '(67) 99999-3333', 'https://www.instagram.com/comunidadesaofrancisco/', 'https://www.facebook.com/comunidadesaofrancisco', '/images/comunidades/sao_francisco.jpg');

-- Example coordinates (if available) - update before running seed
UPDATE communities SET latitude = -19.0083651, longitude = -57.6428384 WHERE name LIKE '%Fátima%';
UPDATE communities SET latitude = -19.01, longitude = -57.655 WHERE name LIKE '%Sagrado Cora%';
UPDATE communities SET latitude = -18.995, longitude = -57.68 WHERE name LIKE '%São Francisco%';
