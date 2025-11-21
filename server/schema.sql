CREATE DATABASE IF NOT EXISTS holywins CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE holywins;

CREATE TABLE IF NOT EXISTS hero_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500) NOT NULL,
  date VARCHAR(120) NOT NULL,
  location VARCHAR(255) NOT NULL,
  call_to_action VARCHAR(255) NOT NULL,
  instagram_post_url VARCHAR(500) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  office_hours VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) NOT NULL,
  -- category switched to free text to support edition years (ex: '2022')
  category VARCHAR(255) NOT NULL,
  -- optional share link to reference another gallery or URL
  share_link VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sponsors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) NOT NULL,
  accent VARCHAR(7) NOT NULL DEFAULT '#6ac8ff',
  link VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  message TEXT NOT NULL,
  ip VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(512) DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (is_read),
  INDEX (created_at)
);

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(255) NOT NULL,
  image_mobile VARCHAR(255) DEFAULT NULL,
  link VARCHAR(255) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  background_image VARCHAR(255) DEFAULT NULL,
  components JSON DEFAULT NULL,
  is_draft BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO hero_content (id, title, subtitle, date, location, call_to_action)
VALUES (
  1,
  'Holywins 2025',
  'Uma noite de luz, adoração e testemunho para toda a comunidade católica. Uma Festa da Santidade que ilumina a escuridão do mundo.',
  '01 de novembro · 19h',
  'Paróquia São João Bosco · Corumbá - MS',
  'Quero participar'
) ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  subtitle = VALUES(subtitle),
  date = VALUES(date),
  location = VALUES(location),
  call_to_action = VALUES(call_to_action);

INSERT INTO contact_info (id, phone, email, address, office_hours, whatsapp)
VALUES (
  1,
  '(67) 3231-8922',
  'contato@holywinscorumba.com.br',
  'Rua Dom Aquino, 1077 · Corumbá - MS',
  'Atendimento de segunda a sexta · 07h-11h e 13h-17h',
  '(67) 98888-5566'
) ON DUPLICATE KEY UPDATE
  phone = VALUES(phone),
  email = VALUES(email),
  address = VALUES(address),
  office_hours = VALUES(office_hours),
  whatsapp = VALUES(whatsapp);

INSERT INTO slides (id, title, description, image, accent, link)
VALUES
(1, 'Procissão luminosa', 'Traga sua vela e participe de um ato público de fé pelas ruas do bairro.', '/images/slide-1.svg', '#6ac8ff', '#inscricoes'),
(2, 'Adoração jovem', 'Momento de louvor conduzido pelo ministério de música Holywins.', '/images/slide-2.svg', '#8ab5ff', '/galeria'),
(3, 'Festival de santos', 'Apresentações criativas contando histórias de santidade para toda a família.', '/images/slide-3.svg', '#b0d4ff', '/contato')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  image = VALUES(image),
  accent = VALUES(accent),
  link = VALUES(link);
