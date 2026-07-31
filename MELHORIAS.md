# Melhorias do site — checklist

Backlog de melhorias aprovadas para o site de leitura dos resumos.
Organizado por dificuldade (mais fácil → mais trabalhoso). Marque `[x]`
conforme for implementado. A maioria das mudanças fica nos templates de
`scripts/gerar-site.js` e nos arquivos em `docs/assets/` — depois de mudar
qualquer coisa, rode `node scripts/gerar-site.js` de novo para regenerar as
66 páginas.

## Fáceis
(todas concluídas — ver seção "Concluído")

## Médias
- [ ] Toggle manual de tema claro/escuro (com persistência em localStorage)
- [ ] Botões A-/A+ para ajustar tamanho da fonte de leitura
- [ ] Progresso de leitura: marcar livro como lido (localStorage) + indicador nos cards da home
- [ ] Selo/cor por gênero literário nos cards (Lei, Histórico, Poético, Profético, Evangelho, Carta, Apocalíptico)

## Mais trabalhosas
- [ ] PWA leve: manifest.json + service worker para funcionar offline/instalar no celular
- [ ] Página de linha do tempo visual com os 66 livros posicionados cronologicamente

## Concluído
- [x] Botão "livro aleatório" na home
- [x] Botão "copiar link" na página de cada livro
- [x] Filtro por Antigo/Novo Testamento (botões, além da busca por texto)
- [x] Meta tags Open Graph (título/descrição bonitos ao compartilhar) + `sitemap.xml`
- [x] Índice de seções (âncoras) dentro da página do livro
