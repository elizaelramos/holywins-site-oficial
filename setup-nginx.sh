#!/bin/bash

# Script para configurar o Nginx para o site Holywins

echo "=== Configurando Nginx para holywins.projetoestrategico.app ==="

# 1. Copiar configuração para sites-available
echo "1. Copiando configuração..."
sudo cp /tmp/holywins_app.conf /etc/nginx/sites-available/holywins_app

# 2. Criar link simbólico em sites-enabled
echo "2. Habilitando site..."
sudo ln -sf /etc/nginx/sites-available/holywins_app /etc/nginx/sites-enabled/holywins_app

# 3. Testar configuração do Nginx
echo "3. Testando configuração do Nginx..."
sudo nginx -t

# 4. Recarregar Nginx
if [ $? -eq 0 ]; then
    echo "4. Recarregando Nginx..."
    sudo systemctl reload nginx
    echo ""
    echo "✅ Nginx configurado com sucesso!"
    echo ""
    echo "Próximo passo: configurar SSL com Let's Encrypt"
    echo "Execute: sudo certbot --nginx -d holywins.projetoestrategico.app"
else
    echo "❌ Erro na configuração do Nginx"
    exit 1
fi
