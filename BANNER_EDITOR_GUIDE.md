# 📝 Guia do Editor de Banners Customizável

## 🎨 Visão Geral

O novo sistema de banners permite criar banners totalmente customizáveis com:
- ✅ Imagem de fundo fixa (1351x750px recomendado)
- ✅ Componentes de texto com fontes, cores e tamanhos personalizados
- ✅ Imagens com ou sem links
- ✅ Efeitos de animação de entrada
- ✅ Preview em tempo real
- ✅ Sistema de rascunhos

## 🚀 Instalação

### 1. Executar a Migração do Banco de Dados

```powershell
cd server
.\run-banner-migration.ps1
```

Ou manualmente:

```sql
mysql -u root -p holywins < migrations/add_banner_builder.sql
```

### 2. Reiniciar o Servidor

```bash
npm run dev
```

## 📖 Como Usar

### Acessando o Editor

1. Acesse `/admin` no navegador
2. Faça login com a senha de administrador
3. Clique na aba **"Banners"**
4. Clique em **"✨ Criar Novo Banner"**

### Criando um Banner

#### 1. Escolher Background

- Clique em **"📷 Escolher Background"**
- Selecione uma imagem de 1351x750px
- A imagem será exibida no canvas

#### 2. Adicionar Componentes

##### Texto
1. Clique em **"📝 Adicionar Texto"**
2. Um novo texto aparecerá no canvas
3. Clique no texto para selecioná-lo
4. No painel de propriedades à direita, você pode:
   - Editar o conteúdo
   - Alterar tamanho da fonte (px)
   - Escolher cor
   - Definir peso (thin, normal, bold, etc.)
   - Escolher estilo (normal, itálico)
   - Selecionar fonte (Arial, Times New Roman, etc.)
   - Definir alinhamento (esquerda, centro, direita)
   - Definir largura máxima (opcional)

##### Imagem
1. Clique em **"🖼️ Adicionar Imagem"**
2. Selecione uma imagem do seu computador
3. Clique na imagem para selecioná-la
4. No painel de propriedades:
   - Ajustar largura e altura
   - Definir arredondamento das bordas
   - Ajustar opacidade (0-1)
   - ✅ Marque "Esta imagem tem link" para adicionar URL

#### 3. Posicionar Componentes

- **Arrastar**: Clique e arraste qualquer componente no canvas
- **Precisão**: Use os campos X e Y no painel de propriedades

#### 4. Adicionar Animações

Para cada componente, você pode definir:

- **Efeito**: Escolha entre:
  - Fade In (aparecer gradualmente)
  - Fade In Up/Down/Left/Right (aparecer com movimento)
  - Slide In Up/Down/Left/Right (deslizar)
  - Zoom In (aumentar)
  - Bounce (quicar)
  - Nenhum

- **Atraso**: Tempo em ms antes da animação iniciar (ex: 500 = 0.5s)
- **Duração**: Tempo em ms da animação (ex: 1000 = 1s)

#### 5. Salvar

- **Salvar Rascunho**: Salva sem publicar (apenas você verá)
- **Publicar**: Torna o banner visível no site

### Editando um Banner Existente

1. Na lista de banners, clique em **"✏️ Editar"**
2. Faça as alterações desejadas
3. Clique em **"Publicar"** ou **"Salvar Rascunho"**

### Visualizando Preview

Para banners com componentes:
1. Clique em **"👁️ Preview"**
2. Veja o banner com todas as animações
3. Clique em **"✕ Fechar"** para voltar

### Removendo um Banner

1. Clique em **"🗑️ Remover"**
2. Confirme a remoção

## 🎯 Dicas e Boas Práticas

### Dimensões Recomendadas

- **Background**: 1351x750px
- **Textos**: Use tamanhos entre 24px e 72px
- **Imagens**: Dimensione proporcionalmente ao background

### Animações

- Use atrasos (delay) para criar sequências
  - Exemplo: Título com delay 0ms, subtítulo com delay 300ms
- Durações recomendadas: 800-1200ms
- Evite muitas animações simultâneas

### Organização

- **Rascunhos**: Use para testar antes de publicar
- **Títulos descritivos**: Facilita identificar banners
- **Componentes**: Menos é mais - não sobrecarregue o banner

### Acessibilidade

- Contraste: Use cores que contrastem bem com o fundo
- Tamanho de texto: Mínimo de 18px para leitura confortável
- Sombras: Adicione sombra em textos sobre imagens complexas

## 🔧 Estrutura Técnica

### Tipos de Componentes

```typescript
type BannerComponent =
  | BannerTextComponent      // Texto
  | BannerImageComponent     // Imagem simples
  | BannerImageWithLinkComponent  // Imagem com link
```

### Campos do Banner

```typescript
{
  id: string
  title: string
  backgroundImage: string
  components: BannerComponent[]
  isDraft: boolean
  isPublished: boolean
  sortOrder: number
}
```

### Compatibilidade

O sistema mantém compatibilidade com banners antigos:
- Banners sem `components` são exibidos no formato legado
- Campos `image` e `imageMobile` continuam funcionando

## 🐛 Solução de Problemas

### Banner não aparece no site

- ✅ Verifique se `isPublished` está marcado
- ✅ Certifique-se que não é um rascunho
- ✅ Reinicie o servidor

### Animações não funcionam

- ✅ Verifique se escolheu um efeito diferente de "Nenhum"
- ✅ Confirme que a duração é maior que 0
- ✅ Limpe o cache do navegador

### Componentes não aparecem

- ✅ Verifique se o background foi definido
- ✅ Confirme que os componentes não estão fora do canvas
- ✅ Verifique a opacidade (deve ser > 0)

### Imagens não carregam

- ✅ Use formatos suportados (JPG, PNG, GIF, WebP)
- ✅ Verifique o tamanho do arquivo (máx 5MB recomendado)
- ✅ Certifique-se que o caminho está correto

## 📚 Exemplos

### Banner Simples com Título

```
Background: imagem_fundo.jpg (1351x750)
Componentes:
  - Texto: "Holywins 2025"
    - Posição: X=100, Y=300
    - Fonte: Arial, 72px, Bold
    - Cor: #ffffff
    - Animação: Fade In Up, 0ms delay, 1000ms duração
```

### Banner com Call-to-Action

```
Background: evento.jpg
Componentes:
  - Texto: "Participe do Evento!"
    - Posição: X=200, Y=200
    - Animação: Fade In Down, 0ms

  - Texto: "31 de Outubro · 19h"
    - Posição: X=200, Y=300
    - Animação: Fade In Up, 300ms

  - Imagem com Link: botao_inscricao.png
    - Posição: X=200, Y=400
    - Link: https://inscricoes.holywins.com
    - Animação: Zoom In, 600ms
```

## 🎓 Recursos Adicionais

- [Documentação de Animações CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/animation)
- [Guia de Cores Web](https://htmlcolorcodes.com/)
- [Google Fonts](https://fonts.google.com/)

---

💡 **Precisa de ajuda?** Entre em contato com o suporte técnico.
