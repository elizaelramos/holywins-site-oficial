# Holywins — Site oficial do evento

Aplicação em React + TypeScript criada para divulgar o Holywins, evento católico que celebra a vitória da santidade. O site inclui página inicial com carrossel, galeria de fotos, formulário de contato e um painel administrativo conectado a uma API Node.js com banco MySQL para salvar todas as alterações.

## ✨ Principais recursos

- **Landing page responsiva** com visual moderno em tons de azul e elementos em glassmorphism.
- **Carrossel interativo** destacando momentos do evento.
- **Faixa de banners hero** com autoplay e CTA configurável direto do admin.
- **Galeria filtrável** por categoria (Celebração, Juventude e Ação Social).
- **Página de contato** com informações oficiais e formulário com feedback imediato.
- **Painel administrativo** com persistência real em MySQL para hero, contatos, galeria e patrocinadores.
- **Barra de patrocinadores** animada, com logos rolando continuamente e gerenciamento direto no painel admin.

## 🛠️ Stack

- [React 19](https://react.dev/) com TypeScript
- [Vite](https://vite.dev/) (rolldown) para desenvolvimento rápido
- [React Router DOM](https://reactrouter.com/) para navegação SPA
- API Node.js com [Express 5](https://expressjs.com/), [mysql2](https://github.com/sidorares/node-mysql2) e [cors](https://github.com/expressjs/cors)

## 🚀 Como executar

### Desenvolvimento (frontend)

```powershell
npm install
npm run dev
```

O servidor sobe em `http://localhost:5173/`. Use `npm run dev -- --host` para testar em rede local.

### API + Banco de Dados

1. Copie o arquivo de variáveis:

	```powershell
	Copy-Item .env.example .env
	```

2. Ajuste `VITE_API_URL`, `CLIENT_ORIGIN` e as credenciais do MySQL conforme o ambiente.
3. Crie o schema e dados base executando `server/schema.sql` no seu MySQL:

	```powershell
	mysql -u elizaelramos -p holywins < server/schema.sql
	```

4. Inicie a API (porta padrão 4000):

	```powershell
	npm run server
	```

	Garanta que o frontend use o mesmo `.env` para apontar `VITE_API_URL` para `http://localhost:4000/api`.

### Build de produção

```powershell
npm run build
npm run preview
```

O primeiro comando gera a pasta `dist/` e o segundo roda um servidor apenas para validação local.

## 🧭 Estrutura rápida

- `src/context/SiteDataContext.tsx` – estado global com dados do hero, contato, carrossel e galeria.
- `src/pages/*` – páginas Home, Galeria, Contato e Admin.
- `src/components/Carousel.tsx` – carrossel com autoplay e controles manuais.
- `src/components/SponsorsBar.tsx` – barra animada que lista os patrocinadores oficiais.
- `public/images` – artes vetoriais usadas no carrossel e na galeria (substitua por fotos oficiais quando desejar).
- `public/images/logo.png` – logotipo oficial exibido no cabeçalho; use o arquivo enviado pela equipe de comunicação.
- `server/index.js` – API Express conectada ao MySQL com rotas REST.
- `server/schema.sql` – script para criar o banco e inserir os registros iniciais.
- `src/services/api.ts` – camada de comunicação do frontend com a API (fetch + tratamento básico de erros).

## 🔐 Painel Admin

Tudo que é editado no painel (`/admin`) agora dispara chamadas para a API Express, que grava os dados diretamente nas tabelas `hero_content`, `contact_info`, `gallery_items`, `sponsors` e `banners`. Caso a API esteja offline, o site continua exibindo os dados locais e mostra um alerta no topo do painel.

Para cadastrar novos patrocinadores ou fotos, basta informar o nome e o caminho da imagem dentro de `public/` (ou uma URL completa acessível pelo navegador). No caso dos banners, utilize a nova aba **Banners** para fazer upload das artes (indicamos 1920x640px) — os arquivos são armazenados automaticamente em `public/images/banners/`, com título, link e ordem salvos no banco. As alterações aparecem em tempo real na home.

### Login padrão

- URL: `/admin`
- Senha inicial: `holywins2025`

As credenciais ficam apenas no cliente por enquanto. Atualize a lógica em `SiteDataContext` quando integrar com um sistema de autenticação real.

## 📄 Licença

Projeto de uso interno da comunidade Holywins. Adapte conforme necessário para a sua paróquia/pastoral.
