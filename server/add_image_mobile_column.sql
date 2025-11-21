-- Migration: Adicionar coluna image_mobile para banners responsivos
-- Data: 15 de novembro de 2025

USE holywins;

-- Adicionar coluna image_mobile (pode ser NULL para banners antigos)
ALTER TABLE banners 
ADD COLUMN image_mobile VARCHAR(255) DEFAULT NULL AFTER image;

-- Atualizar banners existentes para usar a mesma imagem em ambas as versões temporariamente
-- UPDATE banners SET image_mobile = image WHERE image_mobile IS NULL;

SELECT 'Coluna image_mobile adicionada com sucesso!' as status;
