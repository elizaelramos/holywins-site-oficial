# Configuração do Domínio holywins.projetoestrategico.app

## ✅ Etapas Concluídas

1. ✅ DNS configurado e apontando para o servidor (72.61.46.19)
2. ✅ Build do projeto concluído (pasta `dist/` criada)
3. ✅ Arquivo de configuração do Nginx criado
4. ✅ Backend rodando na porta 4000

## 📋 Próximos Passos (Execute Manualmente)

### Passo 1: Configurar o Nginx

Execute o script de configuração:

```bash
cd /var/www/holywins
./setup-nginx.sh
```

Este script irá:
- Copiar a configuração para `/etc/nginx/sites-available/`
- Criar link simbólico em `/etc/nginx/sites-enabled/`
- Testar a configuração
- Recarregar o Nginx

### Passo 2: Configurar SSL (HTTPS) com Let's Encrypt

Depois que o Nginx estiver configurado, instale o certificado SSL:

```bash
sudo certbot --nginx -d holywins.projetoestrategico.app
```

O Certbot irá:
- Obter certificado SSL gratuito
- Configurar HTTPS automaticamente
- Configurar renovação automática

### Passo 3: Atualizar Variáveis de Ambiente

Atualize o arquivo `.env` com as URLs de produção:

```bash
# Edite o arquivo .env
nano /var/www/holywins/.env
```

Adicione/atualize estas linhas:

```env
# URLs de produção
VITE_API_URL=https://holywins.projetoestrategico.app/api
CLIENT_ORIGIN=https://holywins.projetoestrategico.app,http://localhost:5173,http://127.0.0.1:5173
```

### Passo 4: Reiniciar o Backend

Depois de atualizar o `.env`, reinicie o servidor backend:

```bash
# Encontre o processo
ps aux | grep "node server/index.js" | grep -v grep

# Mate o processo (substitua XXXXX pelo PID)
kill XXXXX

# Ou use o PID do arquivo
kill $(cat /var/www/holywins/server.pid)

# Inicie novamente
cd /var/www/holywins
nohup npm run server > server.log 2>&1 & echo $! > server.pid
```

### Passo 5: Testar o Site

Acesse no navegador:
- **HTTP**: http://holywins.projetoestrategico.app (será redirecionado para HTTPS)
- **HTTPS**: https://holywins.projetoestrategico.app

## 🔍 Verificações

### Verificar status do Nginx:
```bash
sudo systemctl status nginx
```

### Verificar logs do Nginx:
```bash
sudo tail -f /var/log/nginx/holywins_error.log
sudo tail -f /var/log/nginx/holywins_access.log
```

### Verificar backend:
```bash
curl http://localhost:4000/api
```

### Verificar certificado SSL:
```bash
sudo certbot certificates
```

## 📝 Configuração do Nginx

O arquivo de configuração está em:
- **Configuração**: `/etc/nginx/sites-available/holywins_app`
- **Link ativo**: `/etc/nginx/sites-enabled/holywins_app`

### Características da configuração:

1. **Proxy reverso para API**: Requisições `/api/*` são encaminhadas para `localhost:4000`
2. **Servir arquivos estáticos**: Arquivos da pasta `dist/` são servidos diretamente
3. **React Router**: Todas as rotas retornam `index.html` para SPA funcionar
4. **Cache**: Arquivos estáticos têm cache de 1 ano
5. **Uploads**: Pasta `server/uploads/` é servida em `/uploads`

## ⚠️ Troubleshooting

### Erro 502 Bad Gateway
- Verifique se o backend está rodando: `ps aux | grep "node server/index.js"`
- Verifique os logs: `tail -f /var/www/holywins/server.log`

### Erro 403 Forbidden
- Verifique permissões: `ls -la /var/www/holywins/dist/`
- Deve estar acessível pelo usuário do Nginx (geralmente www-data)

### Erro de CORS
- Verifique se `CLIENT_ORIGIN` no `.env` inclui o domínio de produção
- Reinicie o backend após alterar `.env`

### DNS não resolve
- Verifique: `dig +short holywins.projetoestrategico.app`
- Deve retornar: `72.61.46.19`

## 🔄 Renovação Automática do SSL

O Certbot configura renovação automática. Para testar:

```bash
sudo certbot renew --dry-run
```

## 📞 Suporte

Em caso de problemas, verifique:
1. Logs do Nginx: `/var/log/nginx/holywins_error.log`
2. Logs do backend: `/var/www/holywins/server.log`
3. Status dos serviços: `sudo systemctl status nginx`
