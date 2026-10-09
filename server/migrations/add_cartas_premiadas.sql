-- Concurso Carta Premiada: cartas enviadas pelo site

CREATE TABLE IF NOT EXISTS cartas_premiadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  protocolo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  idade INT DEFAULT NULL,
  telefone VARCHAR(40) NOT NULL,
  paroquia VARCHAR(255) NOT NULL,
  santo VARCHAR(255) DEFAULT NULL,
  lida TINYINT(1) NOT NULL DEFAULT 0,
  ip VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cartas_protocolo (protocolo)
);

CREATE TABLE IF NOT EXISTS cartas_premiadas_arquivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  carta_id INT NOT NULL,
  arquivo VARCHAR(255) NOT NULL,
  nome_original VARCHAR(255) DEFAULT NULL,
  mime VARCHAR(60) NOT NULL,
  tamanho INT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carta_arquivo
    FOREIGN KEY (carta_id) REFERENCES cartas_premiadas(id)
    ON DELETE CASCADE,
  INDEX idx_cartas_arquivos_carta (carta_id)
);
