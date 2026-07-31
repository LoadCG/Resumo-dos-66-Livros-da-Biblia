# Melhorias do site — checklist e roadmap

Este documento registra o que já foi entregue e orienta as próximas evoluções
do site. A fonte dos resumos fica em `resumos-biblicos/`; o gerador e os
templates ficam em `scripts/gerar-site.js`; os arquivos publicados pelo GitHub
Pages ficam em `docs/`.

Após alterar o conteúdo ou os templates, execute:

```bash
node scripts/gerar-site.js
```

## Usabilidade e design de UI — elaborado

Ideias detalhadas focadas especificamente em interface e ergonomia de uso,
não só em funcionalidade nova. Cada item explica o problema que resolve.

**Fim de leitura como um momento de decisão**
- [x] Botão "Marcar como lido" também no rodapé de cada livro, sincronizado
  com o do topo — antes só existia no topo, obrigando rolar a página toda
  de volta para registrar a leitura.
- [x] Ao marcar como lido no rodapé, mostrar de imediato um cartão com o
  link direto para o próximo livro (ou mensagem de conclusão no Apocalipse)
  — reduz a fricção de "o que eu faço agora" e incentiva continuar a
  sequência de leitura.
- [x] Tempo estimado de leitura (calculado por contagem de palavras) ao
  lado do gênero no subtítulo — ajuda a decidir se dá para ler agora ou
  depois, antes mesmo de rolar a página.
- [ ] Transformar os links "anterior/próximo" do rodapé em cartões maiores
  (com número e nome em destaque, não só texto sublinhado) — hoje são
  discretos demais para o convite visual de "continue lendo" que deveriam
  passar.

**Hierarquia visual dentro da leitura**
- [ ] Redesenhar a Ficha Rápida com um ícone por campo (autor, data,
  gênero, local) em vez de só rótulo em negrito — fica mais rápido de
  escanear visualmente antes de começar a ler o texto corrido.
- [ ] Marcar no índice fixo qual seção está em foco na tela no momento
  (usando IntersectionObserver) — hoje o índice é estático e não dá
  nenhuma pista de onde o leitor está dentro do artigo.
- [ ] Recolher o índice de seções em uma faixa mais compacta no mobile
  (hoje ele ocupa uma faixa fixa inteira no topo, roubando espaço de tela
  pequena) — por exemplo, um botão "Índice ☰" que abre a lista por cima.

**Descoberta e progresso na home**
- [ ] Destacar visualmente o próximo livro não lido na grade (borda ou
  selo "Continue aqui"), complementando o card "Continuar leitura" do
  topo — no scroll da grade inteira, hoje não há nenhuma pista visual de
  onde o leitor parou.
- [ ] Pequena confirmação visual (não intrusiva) na home quando um livro é
  marcado como lido pela primeira vez — hoje a mudança de estado do card é
  silenciosa, sem nenhum feedback de "conquista".
- [ ] Estado vazio da busca mais útil: além do texto "nenhum livro
  encontrado", oferecer um botão "Limpar filtros" diretamente ali, sem
  precisar procurar o botão lá em cima.

**Consistência e acessibilidade como parte do design**
- [ ] Auditar o contraste dos selos de gênero no tema escuro — as cores
  foram calibradas para o card no tema claro; vale conferir se continuam
  legíveis com o fundo escuro.
- [ ] Garantir que todo elemento clicável novo (cards, chips de gênero,
  botões de controle) tenha um estado de foco visível e consistente ao
  navegar só por teclado, não só ao passar o mouse.
- [ ] Padronizar o tamanho mínimo de toque (44px) em todos os botões
  pequenos novos (chips de gênero, botão de limpar busca) — alguns hoje
  ficam abaixo desse mínimo recomendado para uso confortável no celular.

## Próxima etapa — alto impacto

- [ ] PWA leve: `manifest.json`, ícones e service worker para instalação e leitura offline
- [ ] Salvar a posição exata de leitura de cada livro, não apenas o último livro aberto
- [ ] Adicionar favoritos e uma visualização “Meus livros”
- [ ] Acrescentar filtro combinado por gênero, testamento e progresso na URL para permitir compartilhar uma seleção
- [ ] Criar página “Sobre o projeto”, explicando metodologia, fontes, escopo e limitações históricas
- [ ] Melhorar compartilhamento com uma imagem Open Graph própria do projeto
- [ ] Adicionar busca pelo conteúdo dos resumos, além do nome do livro
- [ ] Criar testes automatizados para validar links, quantidade de livros e geração do HTML

## Conteúdo e descoberta

- [ ] Página de linha do tempo visual e responsiva com os 66 livros
- [ ] Visão por ordem cronológica, além da ordem canônica
- [ ] Mapa ou painel geográfico com os principais lugares bíblicos
- [ ] Relações entre livros: referências, continuidade narrativa e temas em comum
- [ ] Cards de “Você também pode gostar” ao final de cada livro
- [ ] Glossário pesquisável de pessoas, povos, lugares e termos históricos
- [ ] Comparação visual entre cânon, período narrado e provável data de escrita

## Experiência de leitura

- [ ] Modo foco, ocultando navegação e controles durante a leitura
- [ ] Estimativa de tempo de leitura em cada livro
- [ ] Destaque automático da seção atual no índice fixo
- [ ] Atalhos de teclado para livro anterior/próximo, tema e tamanho da fonte
- [ ] Opção de fonte serifada para leitura longa
- [ ] Notas pessoais locais por livro, com exportação e importação
- [ ] Sequência/plano de leitura personalizável
- [ ] Conquistas discretas de progresso, sem transformar a leitura em competição

## Qualidade, acessibilidade e desempenho

- [ ] Auditoria completa com Lighthouse e correção de contrastes, desempenho e SEO
- [ ] Garantir navegação completa somente por teclado e foco sempre visível
- [ ] Testar leitores de tela e revisar nomes/estados acessíveis dos controles
- [ ] Gerar CSS e JavaScript minificados para produção
- [ ] Automatizar a geração e validação do site com GitHub Actions
- [ ] Criar página 404 útil, com busca e retorno à lista de livros
- [ ] Adicionar política clara de armazenamento local e botão para apagar preferências
- [ ] Testar layout em celulares pequenos, tablets e telas ultrawide

## Concluído

- [x] Site estático gerado em `docs/` a partir dos 66 arquivos Markdown
- [x] Busca de livros pelo nome
- [x] Filtro por Antigo e Novo Testamento
- [x] Livro aleatório, respeitando os filtros atualmente selecionados
- [x] Botão para copiar o link de cada livro
- [x] Meta tags Open Graph, canonical e `sitemap.xml`
- [x] Índice de seções em cada página de livro
- [x] Tema claro/escuro persistente
- [x] Controles A−/A+ para ajustar o tamanho da leitura
- [x] Marcação de livros como lidos, persistida no navegador
- [x] Indicador visual de livro lido nos cards
- [x] Classificação dos livros por gênero literário
- [x] Cores por gênero com legenda explicativa e interativa
- [x] Filtro clicável por gênero literário
- [x] Filtro por livros lidos e não lidos
- [x] Painel com total e porcentagem de leitura
- [x] Ação “continuar leitura” usando o último livro aberto
- [x] Botão para limpar busca e filtros
- [x] Barra de progresso da página durante a leitura
- [x] Botão flutuante para voltar ao início do livro
- [x] Respeito à preferência de movimento reduzido do sistema
- [x] Redesign profissional da página inicial com hero, navegação compacta e hierarquia visual
- [x] Filtros reorganizados para reduzir ruído e priorizar a biblioteca de livros
- [x] Legenda de gêneros recolhível para manter a função sem sobrecarregar a página
