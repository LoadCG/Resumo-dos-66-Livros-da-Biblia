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

const SECTION_KEYS = [
  "fichaRapida",
  "panoDeFundo",
  "linhaDoTempo",
  "autorPropósito",
  "resumoConteudo",
  "curiosidades",
  "porQueImporta",
];

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
    fichaRapidaHtml: parseFichaRapida(sections.fichaRapida.body),
    blocos: [
      { titulo: sections.panoDeFundo.header, html: parseProse(sections.panoDeFundo.body) },
      { titulo: sections.linhaDoTempo.header, html: parseProse(sections.linhaDoTempo.body) },
      { titulo: sections.autorPropósito.header, html: parseProse(sections.autorPropósito.body) },
      { titulo: sections.resumoConteudo.header, html: parseProse(sections.resumoConteudo.body) },
      { titulo: sections.curiosidades.header, html: parseBulletList(sections.curiosidades.body) },
      { titulo: sections.porQueImporta.header, html: parseProse(sections.porQueImporta.body) },
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

function pageShell({ title, basePath, bodyHtml, description }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
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
        (b) => `      <a class="card" href="livros/${b.slug}.html" data-nome="${escapeHtml(b.nome.toLowerCase())}">
        <span class="card-numero">${b.numero}</span>
        <span class="card-nome">${escapeHtml(b.nome)}</span>
      </a>`
      )
      .join("\n");
    return `    <section class="grupo">
      <h2>${testamento} <span class="contagem">(${doGrupo.length} livros)</span></h2>
      <div class="grade">
${cards}
      </div>
    </section>`;
  });

  const body = `  <header class="topo">
    <h1>${SITE_TITLE}</h1>
    <p class="intro">Resumos históricos dos 66 livros da Bíblia — contexto, autoria,
    cronologia e curiosidades, em linguagem simples para leitura rápida.</p>
    <input type="search" id="busca" class="busca" placeholder="Buscar um livro pelo nome..." aria-label="Buscar livro">
    <p id="busca-vazia" class="busca-vazia" hidden>Nenhum livro encontrado.</p>
  </header>
  <main>
${grupos.join("\n")}
  </main>
  <footer class="rodape">
    <p>Resumos históricos dos 66 livros da Bíblia.</p>
  </footer>
  <script src="assets/busca.js"></script>`;

  return pageShell({
    title: SITE_TITLE,
    basePath: "",
    bodyHtml: body,
    description: "Resumos históricos dos 66 livros da Bíblia, organizados por Antigo e Novo Testamento.",
  });
}

function renderLivro(book, prev, next) {
  const blocosHtml = book.blocos
    .map(
      (bloco) => `    <section class="bloco">
      <h2>${escapeHtml(bloco.titulo)}</h2>
${bloco.html}
    </section>`
    )
    .join("\n");

  const navAnterior = prev
    ? `<a class="nav-link nav-anterior" href="${prev.slug}.html">← ${escapeHtml(prev.nome)}</a>`
    : `<span class="nav-link nav-desabilitado"></span>`;
  const navProximo = next
    ? `<a class="nav-link nav-proximo" href="${next.slug}.html">${escapeHtml(next.nome)} →</a>`
    : `<span class="nav-link nav-desabilitado"></span>`;

  const body = `  <header class="topo topo-livro">
    <a class="voltar" href="../index.html">← Todos os livros</a>
    <h1>${escapeHtml(book.nome)}</h1>
    <p class="subtitulo">Livro ${book.numero} de 66 — ${book.testamento}</p>
  </header>
  <main>
    <section class="bloco">
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
  </footer>`;

  return pageShell({
    title: `${book.nome} — ${SITE_TITLE}`,
    basePath: "../",
    bodyHtml: body,
    description: `Resumo histórico de ${book.nome}: contexto, autoria, cronologia e conteúdo.`,
  });
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

  console.log(`Gerado: docs/index.html + ${books.length} páginas em docs/livros/`);
}

main();
