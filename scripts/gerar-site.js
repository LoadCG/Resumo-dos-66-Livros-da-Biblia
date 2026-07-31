// Gera o site estatico em docs/ a partir dos arquivos .md em resumos-biblicos/.
//
// Como usar: sempre que voce editar ou adicionar um resumo em
// resumos-biblicos/antigo-testamento/ ou resumos-biblicos/novo-testamento/,
// rode `node scripts/gerar-site.js` na raiz do repositorio e comite o
// conteudo atualizado de docs/ junto com o .md alterado.
//
// Nao usa nenhuma dependencia externa (so os modulos nativos do Node).

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_DIRS = [
  { dir: path.join(REPO_ROOT, "resumos-biblicos", "antigo-testamento"), testamento: "Antigo Testamento" },
  { dir: path.join(REPO_ROOT, "resumos-biblicos", "novo-testamento"), testamento: "Novo Testamento" },
];
const OUT_DIR = path.join(REPO_ROOT, "docs");
const SITE_TITLE = "Resumo dos 66 Livros da Bíblia";
const BASE_URL = "https://loadcg.github.io/Resumo-dos-66-Livros-da-Biblia/";

function generoDoLivro(numero) {
  if (numero <= 5) return "Lei";
  if (numero <= 17) return "Histórico";
  if (numero <= 22) return "Poético";
  if (numero <= 39) return "Profético";
  if (numero <= 43) return "Evangelho";
  if (numero === 44) return "Histórico";
  if (numero <= 65) return "Carta";
  return "Apocalíptico";
}

const SECTION_KEYS = [
  "fichaRapida",
  "panoDeFundo",
  "linhaDoTempo",
  "autorPropósito",
  "resumoConteudo",
  "curiosidades",
  "porQueImporta",
];

const SECTION_IDS = {
  panoDeFundo: "pano-de-fundo",
  linhaDoTempo: "linha-do-tempo",
  autorPropósito: "autor-proposito",
  resumoConteudo: "resumo-conteudo",
  curiosidades: "curiosidades",
  porQueImporta: "por-que-importa",
};

function normalizarClasse(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function contarPalavras(texto) {
  const matches = texto.replace(/[#*_>-]/g, " ").trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatInline(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function parseProse(body) {
  return body
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((par) => `<p>${formatInline(par.replace(/\s+/g, " ").trim())}</p>`)
    .join("\n");
}

function parseBulletList(body) {
  const items = body
    .trim()
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.trim().replace(/^-\s*/, ""));
  return `<ul>\n${items.map((item) => `  <li>${formatInline(item)}</li>`).join("\n")}\n</ul>`;
}

const ICONES_FICHA = {
  "Autor": "✍️",
  "Data provável de escrita": "🗓️",
  "Período histórico narrado": "🏛️",
  "Gênero literário": "📚",
  "Local/contexto de origem": "📍",
  "Conexão com o livro anterior": "🔗",
};

function parseFichaRapida(body) {
  const items = body
    .trim()
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => {
      const match = line.trim().match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/);
      if (!match) return null;
      return { label: match[1], value: match[2] };
    })
    .filter(Boolean);

  return `<dl class="ficha-rapida">\n${items
    .map((item) => {
      const icone = ICONES_FICHA[item.label] || "•";
      return `  <div class="ficha-item"><dt><span class="ficha-icone" aria-hidden="true">${icone}</span>${escapeHtml(item.label)}</dt><dd>${formatInline(item.value)}</dd></div>`;
    })
    .join("\n")}\n</dl>`;
}

function parseBook(filePath, testamento) {
  const raw = fs.readFileSync(filePath, "utf8");

  const titleMatch = raw.match(/^# (.+?) — Livro (\d+) de 66\s*$/m);
  if (!titleMatch) {
    throw new Error(`Título não encontrado em ${filePath}`);
  }
  const nome = titleMatch[1].trim();
  const numero = parseInt(titleMatch[2], 10);

  const firstSectionIndex = raw.indexOf("\n## ");
  const sectionsRaw = raw
    .slice(firstSectionIndex + 1)
    .split(/\n(?=## )/)
    .map((chunk) => chunk.trim());

  if (sectionsRaw.length !== SECTION_KEYS.length) {
    throw new Error(`Esperava ${SECTION_KEYS.length} seções em ${filePath}, encontrei ${sectionsRaw.length}`);
  }

  const sections = {};
  sectionsRaw.forEach((chunk, i) => {
    const newlineIndex = chunk.indexOf("\n");
    const headerLine = (newlineIndex === -1 ? chunk : chunk.slice(0, newlineIndex)).replace(/^##\s*/, "").trim();
    const body = newlineIndex === -1 ? "" : chunk.slice(newlineIndex + 1);
    sections[SECTION_KEYS[i]] = { header: headerLine, body };
  });

  const slug = path.basename(filePath, ".md");

  const totalPalavras = [
    sections.panoDeFundo.body,
    sections.linhaDoTempo.body,
    sections.autorPropósito.body,
    sections.resumoConteudo.body,
    sections.curiosidades.body,
    sections.porQueImporta.body,
  ].reduce((soma, texto) => soma + contarPalavras(texto), 0);
  const tempoLeituraMin = Math.max(1, Math.round(totalPalavras / 200));

  return {
    slug,
    numero,
    nome,
    testamento,
    genero: generoDoLivro(numero),
    tempoLeituraMin,
    fichaRapidaHtml: parseFichaRapida(sections.fichaRapida.body),
    blocos: [
      { id: SECTION_IDS.panoDeFundo, titulo: sections.panoDeFundo.header, html: parseProse(sections.panoDeFundo.body) },
      { id: SECTION_IDS.linhaDoTempo, titulo: sections.linhaDoTempo.header, html: parseProse(sections.linhaDoTempo.body) },
      { id: SECTION_IDS.autorPropósito, titulo: sections.autorPropósito.header, html: parseProse(sections.autorPropósito.body) },
      { id: SECTION_IDS.resumoConteudo, titulo: sections.resumoConteudo.header, html: parseProse(sections.resumoConteudo.body) },
      { id: SECTION_IDS.curiosidades, titulo: sections.curiosidades.header, html: parseBulletList(sections.curiosidades.body) },
      { id: SECTION_IDS.porQueImporta, titulo: sections.porQueImporta.header, html: parseProse(sections.porQueImporta.body) },
    ],
  };
}

function loadAllBooks() {
  const books = [];
  for (const { dir, testamento } of CONTENT_DIRS) {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort();
    for (const file of files) {
      books.push(parseBook(path.join(dir, file), testamento));
    }
  }
  books.sort((a, b) => a.numero - b.numero);
  return books;
}

function pageShell({ title, basePath, bodyHtml, description, url, ogType }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ogType || "website"}">
<meta property="og:site_name" content="${escapeHtml(SITE_TITLE)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<script>
try {
  var temaSalvo = localStorage.getItem("biblia-tema");
  if (temaSalvo) document.documentElement.dataset.tema = temaSalvo;
} catch (e) {}
</script>
<link rel="stylesheet" href="${basePath}assets/style.css">
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

function renderIndex(books) {
  const generos = ["Lei", "Histórico", "Poético", "Profético", "Evangelho", "Carta", "Apocalíptico"];
  const grupos = ["Antigo Testamento", "Novo Testamento"].map((testamento) => {
    const doGrupo = books.filter((b) => b.testamento === testamento);
    const cards = doGrupo
      .map(
        (b) => `      <a class="card genero-${normalizarClasse(b.genero)}" href="livros/${b.slug}.html" data-slug="${b.slug}" data-nome="${escapeHtml(b.nome.toLowerCase())}" data-testamento="${escapeHtml(testamento)}" data-genero="${b.genero}">
        <span class="card-numero">${b.numero}</span>
        <span class="card-conteudo">
          <span class="card-nome">${escapeHtml(b.nome)}</span>
          <span class="genero">${b.genero}</span>
        </span>
        <span class="status-lido" aria-label="Livro lido" title="Livro lido">✓</span>
        <span class="badge-continuar" aria-hidden="true">Continue aqui</span>
      </a>`
      )
      .join("\n");
    return `    <section class="grupo" data-testamento="${escapeHtml(testamento)}">
      <h2>${testamento} <span class="contagem">(${doGrupo.length} livros)</span></h2>
      <div class="grade">
${cards}
      </div>
    </section>`;
  });

  const legenda = generos
    .map(
      (genero) => `      <button type="button" class="legenda-item genero-${normalizarClasse(genero)}" data-genero="${genero}">
        <span class="legenda-cor" aria-hidden="true"></span>${genero}
      </button>`
    )
    .join("\n");

  const body = `  <header class="home-cabecalho">
    <div class="home-barra">
      <a class="marca" href="index.html" aria-label="Página inicial">
        <span class="marca-simbolo" aria-hidden="true">66</span>
        <span>Resumos Bíblicos</span>
      </a>
      <button type="button" class="controle tema-toggle" aria-label="Alternar tema">◐ Tema</button>
    </div>
    <div class="home-hero">
      <div class="hero-copy">
        <p class="hero-sobretitulo">Uma biblioteca para estudar e compreender</p>
        <h1>${SITE_TITLE}</h1>
        <p class="intro">Contexto, autoria, cronologia e curiosidades em resumos claros,
        organizados para você explorar no seu ritmo.</p>
      </div>
      <section class="painel-progresso" aria-label="Seu progresso de leitura">
        <div class="progresso-topo">
          <span>Seu progresso</span>
          <strong id="progresso-porcentagem">0%</strong>
        </div>
        <strong id="progresso-texto">0 de 66 livros lidos</strong>
        <div class="trilho-progresso" role="progressbar" aria-label="Livros lidos" aria-valuemin="0" aria-valuemax="66" aria-valuenow="0">
          <span id="progresso-preenchimento"></span>
        </div>
        <a id="continuar-leitura" class="continuar-leitura" href="livros/01-genesis.html">Começar leitura →</a>
      </section>
    </div>
  </header>
  <main class="home-conteudo">
    <p id="confirmacao-lido" class="confirmacao-lido" hidden role="status">
      <span id="confirmacao-lido-texto"></span>
      <button type="button" class="fechar-confirmacao" aria-label="Fechar aviso">×</button>
    </p>
    <section class="explorador" aria-labelledby="titulo-explorador">
      <div class="explorador-topo">
        <div>
          <p class="secao-rotulo">Biblioteca</p>
          <h2 id="titulo-explorador">Explore os 66 livros</h2>
        </div>
        <button type="button" id="aleatorio" class="botao-aleatorio">🎲 Surpreenda-me</button>
      </div>
      <div class="busca-container">
        <span class="busca-icone" aria-hidden="true">⌕</span>
        <input type="search" id="busca" class="busca" placeholder="Busque por Gênesis, Salmos, Romanos..." aria-label="Buscar livro">
        <button type="button" id="limpar-busca" class="limpar-busca" aria-label="Limpar busca" hidden>×</button>
      </div>
      <div class="barra-filtros">
        <div class="filtro-grupo">
          <span class="filtro-label">Testamento</span>
          <div class="filtros" role="group" aria-label="Filtrar por testamento">
            <button type="button" class="filtro-botao is-ativo" data-testamento="todos">Todos</button>
            <button type="button" class="filtro-botao" data-testamento="Antigo Testamento">Antigo</button>
            <button type="button" class="filtro-botao" data-testamento="Novo Testamento">Novo</button>
          </div>
        </div>
        <div class="filtro-grupo">
          <span class="filtro-label">Progresso</span>
          <div class="filtros filtros-status" role="group" aria-label="Filtrar por progresso">
            <button type="button" class="filtro-status is-ativo" data-status="todos">Todos</button>
            <button type="button" class="filtro-status" data-status="nao-lidos">Não lidos</button>
            <button type="button" class="filtro-status" data-status="lidos">Lidos</button>
          </div>
        </div>
        <button type="button" id="limpar-filtros" class="limpar-filtros">Limpar</button>
      </div>
      <details class="legenda">
        <summary id="titulo-legenda">Filtrar por gênero literário <span>As cores dos números representam os gêneros</span></summary>
        <div class="legenda-itens">
${legenda}
        </div>
      </details>
      <p id="busca-vazia" class="busca-vazia" hidden>Nenhum livro corresponde aos filtros. <button type="button" id="limpar-busca-vazia" class="link-botao">Limpar filtros</button></p>
    </section>
${grupos.join("\n")}
  </main>
  <footer class="rodape">
    <p>Resumos históricos dos 66 livros da Bíblia.</p>
  </footer>
  <script src="assets/preferencias.js"></script>
  <script src="assets/busca.js"></script>`;

  return pageShell({
    title: SITE_TITLE,
    basePath: "",
    bodyHtml: body,
    description: "Resumos históricos dos 66 livros da Bíblia, organizados por Antigo e Novo Testamento.",
    url: BASE_URL,
  });
}

function renderLivro(book, prev, next) {
  const blocosHtml = book.blocos
    .map(
      (bloco) => `    <section class="bloco" id="${bloco.id}">
      <h2>${escapeHtml(bloco.titulo)}</h2>
${bloco.html}
    </section>`
    )
    .join("\n");

  const indiceHtml = [{ id: "ficha-rapida", titulo: "Ficha Rápida" }, ...book.blocos]
    .map((item) => `      <a href="#${item.id}">${escapeHtml(item.titulo)}</a>`)
    .join("\n");

  const navAnterior = prev
    ? `<a class="nav-card nav-anterior" href="${prev.slug}.html">
        <span class="nav-card-rotulo">← Livro anterior</span>
        <span class="nav-card-nome">${escapeHtml(prev.nome)}</span>
      </a>`
    : `<span class="nav-card nav-vazio" aria-hidden="true"></span>`;
  const navProximo = next
    ? `<a class="nav-card nav-proximo" href="${next.slug}.html">
        <span class="nav-card-rotulo">Próximo livro →</span>
        <span class="nav-card-nome">${escapeHtml(next.nome)}</span>
      </a>`
    : `<span class="nav-card nav-vazio" aria-hidden="true"></span>`;

  const url = `${BASE_URL}livros/${book.slug}.html`;

  const sugestaoHtml = next
    ? `Marcado como lido! <a href="${next.slug}.html">Continuar para ${escapeHtml(next.nome)} →</a>`
    : `Marcado como lido! Você concluiu os 66 livros 🎉 <a href="../index.html">Ver seu progresso →</a>`;

  const body = `  <header class="topo topo-livro">
    <div class="progresso-pagina" aria-hidden="true"><span></span></div>
    <div class="topo-acoes">
      <a class="voltar" href="../index.html">← Todos os livros</a>
      <div class="acoes-livro">
        <button type="button" class="controle tema-toggle" aria-label="Alternar tema">◐ Tema</button>
        <button type="button" class="controle fonte-menos" aria-label="Diminuir texto">A−</button>
        <button type="button" class="controle fonte-mais" aria-label="Aumentar texto">A+</button>
        <button type="button" class="controle marcar-lido" data-slug="${book.slug}" aria-pressed="false">✓ Marcar como lido</button>
        <button type="button" class="copiar-link" data-url="${url}">🔗 Copiar link</button>
      </div>
    </div>
    <h1>${escapeHtml(book.nome)}</h1>
    <p class="subtitulo">Livro ${book.numero} de 66 — ${book.testamento} · <span class="genero">${book.genero}</span> · ${book.tempoLeituraMin} min de leitura</p>
  </header>
  <nav class="indice" aria-label="Índice do livro">
${indiceHtml}
  </nav>
  <main>
    <section class="bloco" id="ficha-rapida">
      <h2>Ficha Rápida</h2>
${book.fichaRapidaHtml}
    </section>
${blocosHtml}
  </main>
  <div class="acoes-fim-livro">
    <p class="acoes-fim-rotulo">Terminou de ler ${escapeHtml(book.nome)}?</p>
    <button type="button" class="controle marcar-lido" data-slug="${book.slug}" aria-pressed="false">✓ Marcar como lido</button>
    <p id="sugestao-proximo" class="sugestao-proximo" hidden>${sugestaoHtml}</p>
  </div>
  <nav class="navegacao-livros">
    ${navAnterior}
    ${navProximo}
  </nav>
  <button type="button" class="voltar-topo" aria-label="Voltar ao início" title="Voltar ao início">↑</button>
  <footer class="rodape">
    <p><a href="../index.html">← Voltar para todos os livros</a></p>
  </footer>
  <script src="../assets/preferencias.js"></script>
  <script src="../assets/livro.js"></script>`;

  return pageShell({
    title: `${book.nome} — ${SITE_TITLE}`,
    basePath: "../",
    bodyHtml: body,
    description: `Resumo histórico de ${book.nome}: contexto, autoria, cronologia e conteúdo.`,
    url,
    ogType: "article",
  });
}

function renderSitemap(urls) {
  const items = urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

function main() {
  const books = loadAllBooks();
  if (books.length !== 66) {
    throw new Error(`Esperava 66 livros, encontrei ${books.length}`);
  }

  fs.mkdirSync(path.join(OUT_DIR, "livros"), { recursive: true });

  fs.writeFileSync(path.join(OUT_DIR, "index.html"), renderIndex(books), "utf8");

  books.forEach((book, i) => {
    const prev = i > 0 ? books[i - 1] : null;
    const next = i < books.length - 1 ? books[i + 1] : null;
    fs.writeFileSync(path.join(OUT_DIR, "livros", `${book.slug}.html`), renderLivro(book, prev, next), "utf8");
  });

  const urls = [BASE_URL, ...books.map((b) => `${BASE_URL}livros/${b.slug}.html`)];
  fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), renderSitemap(urls), "utf8");

  console.log(`Gerado: docs/index.html + ${books.length} páginas em docs/livros/ + sitemap.xml`);
}

main();
