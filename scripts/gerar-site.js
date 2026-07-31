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
    .map(
      (item) =>
        `  <div class="ficha-item"><dt>${escapeHtml(item.label)}</dt><dd>${formatInline(item.value)}</dd></div>`
    )
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

  return {
    slug,
    numero,
    nome,
    testamento,
    genero: generoDoLivro(numero),
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
  const grupos = ["Antigo Testamento", "Novo Testamento"].map((testamento) => {
    const doGrupo = books.filter((b) => b.testamento === testamento);
    const cards = doGrupo
      .map(
        (b) => `      <a class="card genero-${b.genero.toLowerCase().replace("í", "i")}" href="livros/${b.slug}.html" data-slug="${b.slug}" data-nome="${escapeHtml(b.nome.toLowerCase())}" data-testamento="${escapeHtml(testamento)}">
        <span class="card-numero">${b.numero}</span>
        <span class="card-conteudo">
          <span class="card-nome">${escapeHtml(b.nome)}</span>
          <span class="genero">${b.genero}</span>
        </span>
        <span class="status-lido" aria-label="Livro lido" title="Livro lido">✓</span>
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

  const body = `  <header class="topo">
    <div class="preferencias">
      <button type="button" class="controle tema-toggle" aria-label="Alternar tema">◐ Tema</button>
    </div>
    <h1>${SITE_TITLE}</h1>
    <p class="intro">Resumos históricos dos 66 livros da Bíblia — contexto, autoria,
    cronologia e curiosidades, em linguagem simples para leitura rápida.</p>
    <input type="search" id="busca" class="busca" placeholder="Buscar um livro pelo nome..." aria-label="Buscar livro">
    <div class="filtros" role="group" aria-label="Filtrar por testamento">
      <button type="button" class="filtro-botao is-ativo" data-testamento="todos">Todos</button>
      <button type="button" class="filtro-botao" data-testamento="Antigo Testamento">Antigo Testamento</button>
      <button type="button" class="filtro-botao" data-testamento="Novo Testamento">Novo Testamento</button>
    </div>
    <button type="button" id="aleatorio" class="botao-secundario">🎲 Livro aleatório</button>
    <p id="busca-vazia" class="busca-vazia" hidden>Nenhum livro encontrado.</p>
  </header>
  <main>
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
    ? `<a class="nav-link nav-anterior" href="${prev.slug}.html">← ${escapeHtml(prev.nome)}</a>`
    : `<span class="nav-link nav-desabilitado"></span>`;
  const navProximo = next
    ? `<a class="nav-link nav-proximo" href="${next.slug}.html">${escapeHtml(next.nome)} →</a>`
    : `<span class="nav-link nav-desabilitado"></span>`;

  const url = `${BASE_URL}livros/${book.slug}.html`;

  const body = `  <header class="topo topo-livro">
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
    <p class="subtitulo">Livro ${book.numero} de 66 — ${book.testamento} · <span class="genero">${book.genero}</span></p>
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
  <nav class="navegacao-livros">
    ${navAnterior}
    ${navProximo}
  </nav>
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
