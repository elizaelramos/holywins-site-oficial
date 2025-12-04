# Configuração do Domínio holywinscorumba.com

## ✅ Passos Concluídos

1. ✅ Configuração do NGINX criada em `/etc/nginx/sites-available/holywinscorumba`
2. ✅ Link simbólico criado em `/etc/nginx/sites-enabled/holywinscorumba`
3. ✅ NGINX recarregado com sucesso
4. ✅ Arquivo `.env.production` atualizado com novo domínio
5. ✅ CORS configurado no backend para aceitar novo domínio
6. ✅ Build de produção criado com novo domínio
7. ✅ Backend reiniciado via PM2

## ⚠️ Ação Necessária - CONFIGURAR DNS

### Problema Atual:
- `holywinscorumba.com` → **198.49.23.145** ❌ (INCORRETO)
- `www.holywinscorumba.com` → **72.61.46.19** ✅ (CORRETO)

### IP do Servidor:
- **72.61.46.19**

### Configurações DNS Necessárias:

No painel de controle do seu provedor de domínio, configure:

| Tipo | Nome/Host | Valor | TTL |
|------|-----------|-------|-----|
| **A** | `@` ou vazio | `72.61.46.19` | 3600 |
| **A** | `www` | `72.61.46.19` | 3600 |

**Observação:** O registro `@` (domínio raiz) precisa ser alterado de **198.49.23.145** para **72.61.46.19**.

## 📝 Próximos Passos (Após Corrigir DNS)

### 1. Aguardar Propagação DNS
Após fazer a alteração no painel DNS, aguarde de **5 a 60 minutos** para a propagação mundial.

### 2. Verificar Propagação
Execute no terminal:
```bash
nslookup holywinscorumba.com
nslookup www.holywinscorumba.com
```

Ambos devem retornar: **72.61.46.19**

### 3. Obter Certificado SSL (HTTPS)
Quando ambos os domínios estiverem apontando corretamente, execute:

```bash
sudo certbot --nginx -d holywinscorumba.com -d www.holywinscorumba.com --non-interactive --agree-tos --redirect
```

Este comando irá:
- Obter certificado SSL gratuito do Let's Encrypt
- Configurar HTTPS automaticamente
- Redirecionar HTTP → HTTPS automaticamente

### 4. Verificar Funcionamento
Acesse:
- ✅ https://www.holywinscorumba.com
- ✅ https://holywinscorumba.com

## 🔄 Redirecionamento Opcional

Se você quiser que o domínio antigo (`holywins.projetoestrategico.app`) redirecione automaticamente para o novo, edite o arquivo:

```bash
sudo nano /etc/nginx/sites-available/holywins_app
```

E adicione no topo do arquivo:
```nginx
server {
    listen 443 ssl http2;
    server_name holywins.projetoestrategico.app;
    
    ssl_certificate /etc/letsencrypt/live/projetoestrategico.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/projetoestrategico.app/privkey.pem;
    
    return 301 https://www.holywinscorumba.com$request_uri;
}
```

Depois execute:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 📞 Suporte

Se tiver problemas com DNS, entre em contato com o provedor do domínio.

### Comandos Úteis:

**Verificar logs do NGINX:**
```bash
sudo tail -f /var/log/nginx/holywinscorumba_error.log
```

**Verificar status da API:**
```bash
curl http://localhost:4001/api/site-data
```

**Reiniciar serviços:**
```bash
pm2 restart holywins
sudo systemctl reload nginx
```

## 🎉 Status Final

- **Site em produção:** http://www.holywinscorumba.com (HTTP - funcionando)
- **Aguardando:** Correção DNS para habilitar HTTPS

**Data da Configuração:** 03/12/2025
