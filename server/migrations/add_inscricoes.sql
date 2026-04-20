-- Tabelas para inscrições do Holywins

CREATE TABLE IF NOT EXISTS inscricoes_responsaveis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(12) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(40) NOT NULL,
  paroquia VARCHAR(255) DEFAULT NULL,
  endereco VARCHAR(500) DEFAULT NULL,
  como_soube VARCHAR(255) DEFAULT NULL,
  conhece_pagina TINYINT(1) NOT NULL DEFAULT 0,
  ip VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inscricoes_email (email),
  INDEX idx_inscricoes_codigo (codigo)
);

CREATE TABLE IF NOT EXISTS inscricoes_participantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  responsavel_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  idade INT DEFAULT NULL,
  paroquia VARCHAR(255) DEFAULT NULL,
  movimento VARCHAR(255) DEFAULT NULL,
  restricao_alimentar VARCHAR(255) DEFAULT NULL,
  santo_devocao VARCHAR(255) DEFAULT NULL,
  tamanho_camiseta VARCHAR(10) DEFAULT NULL,
  participa_desfile TINYINT(1) NOT NULL DEFAULT 0,
  autoriza_imagem TINYINT(1) NOT NULL DEFAULT 1,
  e_responsavel TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_participante_responsavel
    FOREIGN KEY (responsavel_id) REFERENCES inscricoes_responsaveis(id)
    ON DELETE CASCADE,
  INDEX idx_participantes_responsavel (responsavel_id)
);
