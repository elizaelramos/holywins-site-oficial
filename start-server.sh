#!/bin/bash
cd /var/www/holywins

# Carregar variáveis do .env
export $(cat .env | grep -v '^#' | xargs)

# Iniciar servidor
npm run server
