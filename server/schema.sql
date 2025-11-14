CREATE DATABASE IF NOT EXISTS holywins CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE holywins;

CREATE TABLE IF NOT EXISTS hero_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500) NOT NULL,
  date VARCHAR(120) NOT NULL,
  location VARCHAR(255) NOT NULL,
  call_to_action VARCHAR(255) NOT NULL,
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
  category ENUM('Celebração', 'Ação Social', 'Juventude') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sponsors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO hero_content (id, title, subtitle, date, location, call_to_action)
VALUES (
  1,
  'Holywins 2025',
  'Uma noite de luz, adoração e testemunho para toda a comunidade católica.',
  '31 de outubro · 19h',
  'Paróquia São Miguel Arcanjo, Centro',
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
  '(11) 4002-8922',
  'contato@holywins.com.br',
  'Rua da Esperança, 77 · São Paulo/SP',
  'Atendimento de terça a sábado · 14h às 21h',
  '(11) 98888-5566'
) ON DUPLICATE KEY UPDATE
  phone = VALUES(phone),
  email = VALUES(email),
  address = VALUES(address),
  office_hours = VALUES(office_hours),
  whatsapp = VALUES(whatsapp);
