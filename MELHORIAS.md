# Melhorias do site — checklist e roadmap

Este documento registra o que já foi entregue e orienta as próximas evoluções
do site. A fonte dos resumos fica em `resumos-biblicos/`; o gerador e os
templates ficam em `scripts/gerar-site.js`; os arquivos publicados pelo GitHub
Pages ficam em `docs/`.

Após alterar o conteúdo ou os templates, execute:

```bash
node scripts/gerar-site.js
```

## Versículos citados clicáveis (bible-api.com) + Web Share API

- [x] Todas as referências bíblicas soltas no texto dos resumos (ex: "Sl
  22", "Rm 1:16-17") viram botões clicáveis, detectados em tempo de
  geração (`scripts/gerar-site.js`) a partir de uma tabela própria de
  apelido → nome canônico do livro — não depende do parser fuzzy da API,
  que erra abreviações padrão em português (`sl`, `rm`, `gn`, `mt`, `hb`
  não são reconhecidas; `jo` resolve errado, vira "Jó" em vez de "João").
  93 referências detectadas nos 66 livros, sem falso positivo (testado
  especificamente o caso "Os 150 salmos..." em Salmos, que colidiria com
  a abreviação de Oséias se não tivesse sido excluída de propósito).
- [x] Clicar numa referência abre um popover com o texto real do
  versículo (tradução Almeida), buscado na `bible-api.com` (gratuita, sem
  chave). Cacheado no `localStorage` — a mesma referência carrega
  instantâneo da segunda vez em diante, em qualquer página.
- [x] Botão "Ver capítulo inteiro" dentro do popover.
- [x] Erro de rede/API fora do ar mostra mensagem amigável sem quebrar a
  página — a busca de versículo é um extra, não uma dependência crítica.
- [x] Arquitetura pensada pra crescer: a busca+cache
  (`window.BibliaAPI.buscar`) fica separada da UI do popover, para
  reaproveitar em features futuras sem duplicar a parte de rede:
  - [x] Widget de "versículo do dia" na home — lista curada de 40
    versículos conhecidos (não a lista de referências detectadas nos
    resumos), escolhido de forma determinística pelo dia do ano (mesmo
    versículo o dia inteiro para todo mundo, sem precisar de servidor).
    Some silenciosamente se a API estiver fora do ar.
  - [x] Botão de dado ao lado do "Versículo do dia" sorteia outro
    versículo da mesma lista curada, sem repetir o que já estava na tela.
  - [ ] Selecionar outra tradução além da Almeida
- [x] Botão de compartilhar/copiar link de cada livro agora usa a **Web
  Share API** nativa (`navigator.share`) em celulares com suporte — abre o
  menu nativo (WhatsApp, Instagram etc.) em vez de só copiar o link;
  continua caindo pro clipboard em navegadores sem suporte, e trata
  cancelamento do usuário sem mostrar erro.
- [x] Pesquisa de mais APIs: `abibliadigital.com.br`, a alternativa óbvia
  em PT-BR, foi **desativada em 01/08/2026** — descartada antes de ser
  usada, confirmado por pesquisa em vez de suposição.

## Qualidade de código (revisão /simplify) e ícones SVG

Rodada a skill `/simplify` com 4 agentes em paralelo (reuso, simplificação,
eficiência, altitude) sobre o diff de `scripts/gerar-site.js` e
`docs/assets/*`. Achados aplicados na mesma passada em que os emojis e
setas do site foram trocados por ícones SVG embutidos (sem dependência
externa, sem CDN):

- [x] Conjunto de 21 ícones SVG (só formas primitivas — linha, polilinha,
  polígono, círculo, elipse — sem curvas Bézier escritas à mão) substitui
  todo emoji e seta de texto (←, →, ↑, ✓, ×, 🔗, 🎲, ☀, ☾, 🎉 etc.) no site
  inteiro, tanto no conteúdo gerado (`scripts/gerar-site.js`) quanto nos
  estados dinâmicos dos scripts do navegador. Uma única fonte de verdade
  (`ICONES` em `gerar-site.js`) também é exportada para
  `docs/assets/icones.js`, lido pelos scripts do navegador — sem duplicar
  os SVGs em cada arquivo `.js`.
- [x] Cores de gênero literário viraram variáveis CSS (`--genero-X-bg`/
  `--genero-X-fg`) em vez de 4 tabelas hexadecimais independentes
  (card claro, card escuro ×2 contextos, pontinho da legenda) — a
  duplicação que causava o bug de contraste da rodada anterior.
- [x] Ícone da Ficha Rápida agora é indexado pela posição fixa do campo no
  template (Autor, Data, Período...), não pelo texto do rótulo — mais
  robusto a variações de grafia.
- [x] Título e ícone de cada seção do livro vêm de uma tabela única
  (`SECTION_META`), eliminando duas listas mantidas à mão em paralelo
  (contagem de palavras e montagem dos blocos).
- [x] Cartões "livro anterior/próximo" gerados por uma função só
  (`navCard`), em vez de dois blocos de template copiados.
- [x] `localStorage` centralizado em dois helpers (`lerArmazenamento`/
  `salvarArmazenamento`, em `preferencias.js`, carregado em toda página),
  eliminando 11 blocos `try/catch` repetidos.
- [x] `.card` e `.ficha-rapida` (CSS) deixaram de ter regras duplicadas
  não-adjacentes para o mesmo seletor.
- [x] Busca não refaz `querySelectorAll` por grupo a cada tecla — conta os
  cards visíveis num único laço já existente.
- [x] Barra de progresso de leitura (scroll) passou a rodar dentro de
  `requestAnimationFrame`, em vez de recalcular layout a cada evento bruto
  de scroll.
- [x] Índice com destaque de seção atual deixou de percorrer todos os
  links a cada interseção — mantém uma referência do link ativo.

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
- [x] Links "anterior/próximo" do rodapé viraram cartões maiores, com
  rótulo + nome do livro em destaque — antes eram texto sublinhado discreto
  demais para o convite de "continue lendo" que deveriam passar.

**Hierarquia visual dentro da leitura**
- [x] Ficha Rápida com um ícone por campo (autor, data, período, gênero,
  local, conexão) em vez de só rótulo em negrito — fica mais rápido de
  escanear visualmente antes de começar a ler o texto corrido.
- [x] Índice fixo marca qual seção está em foco na tela no momento
  (via IntersectionObserver) — antes o índice era estático e não dava
  nenhuma pista de onde o leitor estava dentro do artigo.
- [x] Índice de seções vira uma faixa compacta com rolagem horizontal no
  mobile, em vez de quebrar em várias linhas — deixa de roubar espaço
  vertical da tela pequena.

**Descoberta e progresso na home**
- [x] Próximo livro não lido destacado na grade (borda + selo "Continue
  aqui"), complementando o card "Continuar leitura" do topo — antes não
  havia nenhuma pista visual, na grade inteira, de onde o leitor parou.
- [x] Confirmação visual (dispensável) na home quando um novo livro é
  concluído desde a última visita — antes a mudança de estado do card era
  silenciosa, sem nenhum feedback de "conquista".
- [x] Estado vazio da busca ganhou um botão "Limpar filtros" diretamente
  na mensagem, sem precisar procurar o botão lá em cima.

**Consistência e acessibilidade como parte do design**
- [x] Contraste dos selos de gênero no tema escuro corrigido — na
  auditoria, veio à tona que a classe CSS gerada para "Histórico",
  "Poético" e "Profético" mantinha o acento (`genero-histórico` em vez de
  `genero-historico`) e nunca batia com o seletor do CSS, deixando 35 dos
  66 livros sem a cor do gênero em ambos os temas. Corrigido na geração
  (função `normalizarClasse`) e adicionada uma paleta própria para o tema
  escuro, mais saturada, em vez de reusar o pastel do tema claro.
- [x] Foco visível consistente (anel ao redor do elemento) em qualquer
  link, botão ou campo ao navegar só por teclado, cobrindo também os
  elementos novos (cards, chips de gênero, cartões de navegação).
- [x] Tamanho mínimo de toque padronizado para 40-44px nos controles,
  chips de gênero, filtros e botão de limpar busca — vários estavam
  abaixo do recomendado para uso confortável no celular.

**Bug encontrado durante a implementação**
- [x] O layout do rodapé de navegação quebrava no mobile: o cartão
  "próximo livro" forçava `grid-column: 2` mesmo quando só havia 1 coluna
  definida para telas pequenas, criando uma coluna implícita extra em vez
  de empilhar os dois cartões corretamente. Corrigido restaurando
  `grid-column: auto` dentro do breakpoint mobile.

## Próxima etapa — alto impacto

- [x] PWA leve: `manifest.json`, ícone (SVG, sem dependência de gerador de
  imagem) e service worker para instalação e leitura offline. O service
  worker pré-armazena em cache a home e os 66 livros logo na primeira
  visita (estratégia stale-while-revalidate: responde do cache na hora e
  atualiza em segundo plano quando há rede) — testado desligando o
  servidor local depois da primeira visita e confirmando que a navegação
  entre livros continua funcionando offline. Limitação conhecida: o ícone
  em SVG funciona para instalar em Android/desktop (Chrome, Edge,
  Firefox), mas o Safari/iOS não usa SVG como `apple-touch-icon` — ícone
  em PNG fica para quando houver uma forma de gerar imagem sem depender de
  serviço externo.
- [ ] Salvar a posição exata de leitura de cada livro, não apenas o último livro aberto
- [ ] Adicionar favoritos e uma visualização “Meus livros”
- [ ] Acrescentar filtro combinado por gênero, testamento e progresso na URL para permitir compartilhar uma seleção
- [ ] Criar página “Sobre o projeto”, explicando metodologia, fontes, escopo e limitações históricas
- [ ] Melhorar compartilhamento com uma imagem Open Graph própria do projeto
- [x] Busca pelo conteúdo dos resumos, além do nome do livro — índice de
  texto normalizado (sem acento/markdown) gerado em build
  (`docs/assets/indice-busca.json`) e carregado à parte na home, sem
  atrasar a busca por nome (que continua instantânea desde o primeiro
  caractere digitado). Ex: buscar "cordeiro" encontra Êxodo e Apocalipse,
  que não têm a palavra no nome do livro.
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
- [x] Atalhos de teclado nas páginas de livro: ← / → para livro
  anterior/próximo, T para alternar tema, +/− para o tamanho da fonte —
  ignorados com Ctrl/Alt/Cmd (que já têm significado do navegador) e
  enquanto o foco está num campo de formulário. Dica discreta no rodapé de
  cada livro para quem não sabia que existiam.
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
