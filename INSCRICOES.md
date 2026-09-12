# Inscricoes

O formulario publico em /inscricoes nao exige conta, login ou senha.
Nome e telefone sao obrigatorios. E-mail e paroquia sao opcionais.
O contato pode participar ou cadastrar apenas outras pessoas.
Cada pessoa adicionada conta individualmente no painel e no CSV.
A idade de todos os participantes e obrigatoria (0 para menores de 1 ano).
Criancas de ate 10 anos, inclusive, exigem pelo menos um acompanhante
adulto de 18 anos ou mais entre os participantes do mesmo cadastro.
O acompanhante pode ser o contato, marcando sua participacao, ou outra
pessoa adicionada. O contato sozinho nao conta como participante.
A regra e validada no formulario e na API, inclusive em envios diretos.
Um adulto pode acompanhar mais de uma crianca no mesmo cadastro.

A confirmacao na tela independe do e-mail. Quando preenchido, o e-mail
continua recebendo a confirmacao pelo SMTP existente. Todas as inscricoes
acionam o aviso no Telegram, incluindo total de pessoas e restricoes
alimentares informadas. E-mails compartilhados sao aceitos; o e-mail
nao e um identificador unico de familia.

O formulario simplificado nao coleta autorizacao de imagem e envia
autorizaImagem=false. Os registros antigos nao sao alterados.

## Publicacao e abertura

Publicar frontend e backend juntos: o formulario consulta
GET /api/inscricoes/status. Nao publicar apenas o frontend sobre uma
API antiga que ainda nao tenha essa rota.

O servidor le INSCRICOES_ABERTAS. Somente o valor true abre o envio;
ausencia ou false mantem fechado. VITE_INSCRICOES_ABERTAS e aceito
como fallback de ambiente do servidor para compatibilidade.
A flag de build do frontend, isoladamente, nao abre as inscricoes.

A abertura foi autorizada em 12/09/2026. O ecosystem.config.cjs define
INSCRICOES_ABERTAS=true para o processo holywins. Ao publicar, reiniciar
a API com o ambiente atualizado e conferir /api/inscricoes/status.
O destaque da pagina inicial anuncia a abertura e leva ao formulario
incorporado em /#inscricoes. A rota /inscricoes e os botoes Participar
tambem permitem acessar o formulario. Nao ha limite de vagas.

GET /api/inscricoes, GET /api/inscricoes/lookup e DELETE
/api/inscricoes/:id exigem a sessao da organizacao. POST /api/inscricoes
e GET /api/inscricoes/status permanecem publicos.

## Verificacao

- node --experimental-vm-modules --test server/inscricoes.test.mjs
- ./node_modules/.bin/tsc -p tsconfig.app.json --noEmit --incremental false

Os testes de servidor substituem banco, SMTP e Telegram por simulacoes;
nao criam inscricoes nem enviam mensagens reais.
