# Setup do Sistema de Gerenciamento de Usuários

Este documento descreve como configurar e usar o sistema de autenticação e gerenciamento de usuários do Holywins.

## 1. Executar a Migração do Banco de Dados

Execute o script PowerShell para criar as tabelas de usuários e logs:

```powershell
cd server
.\run-users-migration.ps1
```

Isso irá criar:
- Tabela `users` (usuários do sistema)
- Tabela `activity_logs` (registro de atividades)
- Usuário admin padrão com credenciais:
  - **Usuário:** `admin`
  - **Senha:** `admin123`

⚠️ **IMPORTANTE:** Altere a senha do admin após o primeiro login!

## 2. Estrutura de Permissões

### Tipos de Usuários

1. **Admin (Administrador)**
   - Acesso total ao sistema
   - Pode criar e gerenciar usuários
   - Pode visualizar logs de atividade
   - Pode alterar sua própria senha
   - Pode editar todo o conteúdo do site

2. **Editor**
   - Pode editar todo o conteúdo do site (página /admin)
   - Pode alterar sua própria senha
   - NÃO pode criar outros usuários
   - NÃO pode acessar logs do sistema

## 3. Rotas e Funcionalidades

### Rotas Públicas
- `/login` - Página de login

### Rotas Protegidas (Requer Autenticação)
- `/admin` - Painel de conteúdo (Admin e Editor)
- `/admin/profile` - Perfil e alteração de senha (Admin e Editor)

### Rotas Restritas (Apenas Admin)
- `/admin/users` - Gerenciamento de usuários
- `/admin/logs` - Visualização de logs de atividade

## 4. Funcionalidades Implementadas

### Autenticação
- ✅ Login com usuário/email e senha
- ✅ Logout
- ✅ Sessões com cookie HttpOnly
- ✅ Proteção de rotas com middleware
- ✅ Verificação automática de sessão

### Gerenciamento de Usuários (Admin)
- ✅ Listar todos os usuários
- ✅ Criar novo usuário (admin ou editor)
- ✅ Resetar senha de qualquer usuário
- ✅ Ativar/desativar usuários
- ✅ Deletar usuários
- ✅ Proteção: não pode deletar ou desativar a própria conta

### Perfil do Usuário (Todos)
- ✅ Visualizar informações da conta
- ✅ Alterar própria senha

### Logs de Atividade (Admin)
- ✅ Visualização paginada de logs
- ✅ Filtro por usuário
- ✅ Filtro por tipo de ação
- ✅ Registro automático de todas as ações importantes:
  - Login/Logout
  - Criação/edição/exclusão de usuários
  - Alteração de senhas
  - Modificações de conteúdo

## 5. API Endpoints

### Autenticação
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/logout` - Fazer logout
- `GET /api/auth/me` - Obter usuário atual
- `POST /api/auth/change-password` - Alterar própria senha

### Usuários (Apenas Admin)
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `POST /api/users/:id/reset-password` - Resetar senha
- `PATCH /api/users/:id/toggle-status` - Ativar/desativar
- `DELETE /api/users/:id` - Deletar usuário

### Logs (Apenas Admin)
- `GET /api/logs` - Listar logs (com paginação e filtros)
- `GET /api/logs/actions` - Listar tipos de ações disponíveis

## 6. Segurança

### Implementado
- ✅ Senhas com hash bcrypt (salt rounds: 10)
- ✅ Sessões seguras com express-session
- ✅ Cookies HttpOnly (não acessíveis via JavaScript)
- ✅ CORS configurado com credentials
- ✅ Validação de entrada em todas as rotas
- ✅ Proteção contra auto-exclusão de admin
- ✅ Verificação de permissões em cada rota

### Recomendações para Produção
- [ ] Configurar `SESSION_SECRET` forte no `.env`
- [ ] Habilitar HTTPS (cookies secure)
- [ ] Configurar rate limiting para rotas de login
- [ ] Adicionar verificação de força de senha
- [ ] Implementar recuperação de senha por email
- [ ] Adicionar autenticação de dois fatores (2FA)

## 7. Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
SESSION_SECRET=sua-chave-secreta-muito-forte-aqui
NODE_ENV=production  # para ambiente de produção
```

## 8. Navegação no Admin

Após fazer login, você verá uma barra de navegação no topo com:

**Para Editores:**
- Conteúdo (painel principal)
- Perfil (alterar senha)
- Sair (logout)

**Para Administradores:**
- Conteúdo (painel principal)
- Usuários (gerenciar usuários)
- Logs (visualizar atividades)
- Perfil (alterar senha)
- Sair (logout)

## 9. Primeiros Passos

1. Execute a migração conforme item 1
2. Acesse `http://localhost:5173/login`
3. Faça login com credenciais padrão (admin/admin123)
4. **Altere a senha do admin imediatamente** em Perfil
5. Crie usuários adicionais conforme necessário em Usuários

## 10. Troubleshooting

### "Credenciais inválidas" ao tentar login
- Verifique se a migração foi executada corretamente
- Verifique se o banco de dados tem o usuário admin
- Execute: `SELECT * FROM users;` no MySQL

### "Não autenticado" após fazer login
- Verifique se as configurações de CORS incluem `credentials: true`
- Verifique se o frontend está enviando cookies (`credentials: 'include'`)
- Verifique se SESSION_SECRET está configurado

### Sessão expira muito rápido
- A sessão padrão dura 24 horas
- Para alterar, modifique `maxAge` em `server/index.js`

## Conclusão

O sistema de gerenciamento de usuários está completo e pronto para uso. Todos os usuários (admin e editores) devem fazer login para acessar o painel administrativo.
