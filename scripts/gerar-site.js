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

// Ordem fixa das 7 seções de cada resumo, conforme o template do CLAUDE.md.
const SECTION_KEYS = [
  "fichaRapida",
  "panoDeFundo",
  "linhaDoTempo",
  "autorPropósito",
  "resumoConteudo",
  "curiosidades",
  "porQueImporta",
];

// Metadados de exibição (id da âncora, título fixo, ícone e tipo de corpo)
// para cada seção de conteúdo, na mesma ordem de SECTION_KEYS (exceto a
// Ficha Rápida, tratada à parte por ter formato de lista rótulo/valor).
const SECTION_META = {
  panoDeFundo: { id: "pano-de-fundo", titulo: "Pano de Fundo Histórico", icone: "globe", lista: false },
  linhaDoTempo: { id: "linha-do-tempo", titulo: "Linha do Tempo e Cronologia", icone: "clock", lista: false },
  autorPropósito: { id: "autor-proposito", titulo: "Autor e Propósito", icone: "pencil", lista: false },
  resumoConteudo: { id: "resumo-conteudo", titulo: "Resumo do Conteúdo", icone: "book", lista: false },
  curiosidades: { id: "curiosidades", titulo: "Curiosidades e Conexões", icone: "lightbulb", lista: true },
  porQueImporta: { id: "por-que-importa", titulo: "Por Que Isso Importa Hoje", icone: "target", lista: false },
};
const CORPO_SECOES = Object.keys(SECTION_META);

// Ícone de cada campo da Ficha Rápida, na ordem fixa em que sempre aparecem
// no template (Autor, Data, Período, Gênero, Local, Conexão) — indexado por
// posição, não pelo texto do rótulo, para não depender de variações de
// grafia no markdown.
const ICONES_FICHA_ORDEM = ["pencil", "calendar", "landmark", "book", "map-pin", "link"];

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

// Apelido/abreviação -> nome canônico do livro (o mesmo `nome` que os 66
// livros já têm), usado para detectar referências bíblicas soltas no texto
// e virar botões clicáveis. Cobre as abreviações padrão em português.
// "Os" (Oséias) e "Na" (Naum) foram deixadas de fora de propósito: são
// palavras comuns do português ("os", "na") e geravam falso positivo real
// no nosso próprio conteúdo (ex: "Os 150 salmos..." em 19-salmos.md) — para
// esses dois livros, só o nome por extenso é detectado.
const ALIASES_LIVRO = {
  Gênesis: "Gênesis", Gn: "Gênesis",
  Êxodo: "Êxodo", Êx: "Êxodo",
  Levítico: "Levítico", Lv: "Levítico",
  Números: "Números", Nm: "Números",
  Deuteronômio: "Deuteronômio", Dt: "Deuteronômio",
  Josué: "Josué", Js: "Josué",
  Juízes: "Juízes", Jz: "Juízes",
  Rute: "Rute", Rt: "Rute",
  "1 Samuel": "1 Samuel", "1Sm": "1 Samuel", "1 Sm": "1 Samuel",
  "2 Samuel": "2 Samuel", "2Sm": "2 Samuel", "2 Sm": "2 Samuel",
  "1 Reis": "1 Reis", "1Rs": "1 Reis", "1 Rs": "1 Reis",
  "2 Reis": "2 Reis", "2Rs": "2 Reis", "2 Rs": "2 Reis",
  "1 Crônicas": "1 Crônicas", "1Cr": "1 Crônicas", "1 Cr": "1 Crônicas",
  "2 Crônicas": "2 Crônicas", "2Cr": "2 Crônicas", "2 Cr": "2 Crônicas",
  Esdras: "Esdras", Ed: "Esdras",
  Neemias: "Neemias", Ne: "Neemias",
  Ester: "Ester", Et: "Ester",
  Jó: "Jó",
  Salmos: "Salmos", Sl: "Salmos", Salmo: "Salmos",
  Provérbios: "Provérbios", Pv: "Provérbios",
  Eclesiastes: "Eclesiastes", Ec: "Eclesiastes",
  Cantares: "Cantares", Ct: "Cantares",
  Isaías: "Isaías", Is: "Isaías",
  Jeremias: "Jeremias", Jr: "Jeremias",
  Lamentações: "Lamentações", Lm: "Lamentações",
  Ezequiel: "Ezequiel", Ez: "Ezequiel",
  Daniel: "Daniel", Dn: "Daniel",
  Oséias: "Oséias",
  Joel: "Joel", Jl: "Joel",
  Amós: "Amós", Am: "Amós",
  Obadias: "Obadias", Ob: "Obadias",
  Jonas: "Jonas", Jn: "Jonas",
  Miquéias: "Miquéias", Mq: "Miquéias",
  Naum: "Naum",
  Habacuque: "Habacuque", Hc: "Habacuque",
  Sofonias: "Sofonias", Sf: "Sofonias",
  Ageu: "Ageu", Ag: "Ageu",
  Zacarias: "Zacarias", Zc: "Zacarias",
  Malaquias: "Malaquias", Ml: "Malaquias",
  Mateus: "Mateus", Mt: "Mateus",
  Marcos: "Marcos", Mc: "Marcos",
  Lucas: "Lucas", Lc: "Lucas",
  João: "João",
  Atos: "Atos", At: "Atos",
  Romanos: "Romanos", Rm: "Romanos",
  "1 Coríntios": "1 Coríntios", "1Co": "1 Coríntios", "1 Co": "1 Coríntios",
  "2 Coríntios": "2 Coríntios", "2Co": "2 Coríntios", "2 Co": "2 Coríntios",
  Gálatas: "Gálatas", Gl: "Gálatas",
  Efésios: "Efésios", Ef: "Efésios",
  Filipenses: "Filipenses", Fp: "Filipenses",
  Colossenses: "Colossenses", Cl: "Colossenses",
  "1 Tessalonicenses": "1 Tessalonicenses", "1Ts": "1 Tessalonicenses", "1 Ts": "1 Tessalonicenses",
  "2 Tessalonicenses": "2 Tessalonicenses", "2Ts": "2 Tessalonicenses", "2 Ts": "2 Tessalonicenses",
  "1 Timóteo": "1 Timóteo", "1Tm": "1 Timóteo", "1 Tm": "1 Timóteo",
  "2 Timóteo": "2 Timóteo", "2Tm": "2 Timóteo", "2 Tm": "2 Timóteo",
  Tito: "Tito", Tt: "Tito",
  Filemom: "Filemom", Fm: "Filemom",
  Hebreus: "Hebreus", Hb: "Hebreus",
  Tiago: "Tiago", Tg: "Tiago",
  "1 Pedro": "1 Pedro", "1Pe": "1 Pedro", "1 Pe": "1 Pedro",
  "2 Pedro": "2 Pedro", "2Pe": "2 Pedro", "2 Pe": "2 Pedro",
  "1 João": "1 João", "1Jo": "1 João", "1 Jo": "1 João",
  "2 João": "2 João", "2Jo": "2 João", "2 Jo": "2 João",
  "3 João": "3 João", "3Jo": "3 João", "3 Jo": "3 João",
  Judas: "Judas", Jd: "Judas",
  Apocalipse: "Apocalipse", Ap: "Apocalipse",
};

const LETRA = "A-Za-zÀ-ÖØ-öø-ÿ";
const REGEX_REFERENCIA = (function construirRegex() {
  const apelidos = Object.keys(ALIASES_LIVRO).sort((a, b) => b.length - a.length);
  const alternativas = apelidos.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return new RegExp(
    `(?<![${LETRA}0-9])(${alternativas})\\.?\\s+(\\d{1,3})(:(\\d{1,3})(-(\\d{1,3}))?)?(?![${LETRA}])`,
    "g"
  );
})();

// Acha referências bíblicas soltas no texto (ex.: "Sl 22", "Rm 1:16-17") e
// transforma em botões clicáveis, sem alterar o texto visível — só guarda
// o nome canônico do livro em data-ref, pronto para virar consulta na
// bible-api.com pelo docs/assets/referencias.js.
function linkarReferencias(html) {
  return html.replace(REGEX_REFERENCIA, function (match, alias, capitulo, _g3, versiculoIni, _g5, versiculoFim) {
    const canonico = ALIASES_LIVRO[alias];
    if (!canonico) return match;
    let ref = `${canonico} ${capitulo}`;
    if (versiculoIni) {
      ref += `:${versiculoIni}`;
      if (versiculoFim) ref += `-${versiculoFim}`;
    }
    return `<button type="button" class="ref-biblica" data-ref="${escapeHtml(ref)}">${match}</button>`;
  });
}

// Conjunto de ícones em SVG puro (sem dependência externa), construídos só
// com formas primitivas (linha, polilinha, polígono, círculo, elipse,
// retângulo) para não depender de curvas Bézier escritas à mão. Também é
// escrito em docs/assets/icones.js para os scripts do navegador reusarem os
// mesmos ícones em estados dinâmicos (tema, marcar como lido, copiar link).
const ICONE_ATRIBUTOS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const ICONES = {
  pencil: `<svg ${ICONE_ATRIBUTOS}><line x1="4" y1="20" x2="7" y2="20"/><line x1="4" y1="20" x2="4" y2="17"/><line x1="4" y1="17" x2="16" y2="5"/><line x1="16" y1="5" x2="19" y2="8"/><line x1="19" y1="8" x2="7" y2="20"/></svg>`,
  calendar: `<svg ${ICONE_ATRIBUTOS}><rect x="4" y="5" width="16" height="16" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>`,
  landmark: `<svg ${ICONE_ATRIBUTOS}><polygon points="12 3 21 9 3 9"/><line x1="4" y1="9" x2="4" y2="20"/><line x1="8" y1="9" x2="8" y2="20"/><line x1="12" y1="9" x2="12" y2="20"/><line x1="16" y1="9" x2="16" y2="20"/><line x1="20" y1="9" x2="20" y2="20"/><line x1="3" y1="21" x2="21" y2="21"/></svg>`,
  book: `<svg ${ICONE_ATRIBUTOS}><polyline points="4 6 12 4 12 19 4 17 4 6"/><polyline points="20 6 12 4 12 19 20 17 20 6"/></svg>`,
  "map-pin": `<svg ${ICONE_ATRIBUTOS}><circle cx="12" cy="9" r="5"/><polygon points="12 21 8 13 16 13"/></svg>`,
  link: `<svg ${ICONE_ATRIBUTOS}><circle cx="8" cy="12" r="3.2"/><circle cx="16" cy="12" r="3.2"/><line x1="11" y1="12" x2="13" y2="12"/></svg>`,
  globe: `<svg ${ICONE_ATRIBUTOS}><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><ellipse cx="12" cy="12" rx="4" ry="9"/></svg>`,
  clock: `<svg ${ICONE_ATRIBUTOS}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>`,
  lightbulb: `<svg ${ICONE_ATRIBUTOS}><circle cx="12" cy="10" r="6"/><line x1="9.5" y1="18" x2="14.5" y2="18"/><line x1="10" y1="21" x2="14" y2="21"/><line x1="12" y1="16" x2="12" y2="18"/></svg>`,
  target: `<svg ${ICONE_ATRIBUTOS}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg>`,
  "clipboard-list": `<svg ${ICONE_ATRIBUTOS}><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  check: `<svg ${ICONE_ATRIBUTOS}><polyline points="4 12 9 17 20 6"/></svg>`,
  sun: `<svg ${ICONE_ATRIBUTOS}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/></svg>`,
  moon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/><circle cx="16.5" cy="8.5" r="6.5" fill="var(--cor-fundo-elevado)"/></svg>`,
  "arrow-up": `<svg ${ICONE_ATRIBUTOS}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  "arrow-left": `<svg ${ICONE_ATRIBUTOS}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  "arrow-right": `<svg ${ICONE_ATRIBUTOS}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  close: `<svg ${ICONE_ATRIBUTOS}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`,
  search: `<svg ${ICONE_ATRIBUTOS}><circle cx="10" cy="10" r="6"/><line x1="20" y1="20" x2="14.5" y2="14.5"/></svg>`,
  dice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24"><polygon points="12 2 13.6 9 21 10 13.6 11 12 18 10.4 11 3 10 10.4 9" fill="currentColor"/></svg>`,
};

function icone(nome) {
  const svg = ICONES[nome];
  if (!svg) throw new Error(`Ícone desconhecido: ${nome}`);
  return `<span class="icone" aria-hidden="true">${svg}</span>`;
}

function parseProse(body) {
  return body
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((par) => `<p>${linkarReferencias(formatInline(par.replace(/\s+/g, " ").trim()))}</p>`)
    .join("\n");
}

function parseBulletList(body) {
  const items = body
    .trim()
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.trim().replace(/^-\s*/, ""));
  return `<ul>\n${items.map((item) => `  <li>${linkarReferencias(formatInline(item))}</li>`).join("\n")}\n</ul>`;
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
    .map((item, i) => {
      const nomeIcone = ICONES_FICHA_ORDEM[i];
      const iconeHtml = nomeIcone ? icone(nomeIcone) : "";
      return `  <div class="ficha-item"><dt>${iconeHtml}${escapeHtml(item.label)}</dt><dd>${formatInline(item.value)}</dd></div>`;
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

  const totalPalavras = CORPO_SECOES.reduce((soma, chave) => soma + contarPalavras(sections[chave].body), 0);
  const tempoLeituraMin = Math.max(1, Math.round(totalPalavras / 200));

  const blocos = CORPO_SECOES.map((chave) => {
    const meta = SECTION_META[chave];
    return {
      id: meta.id,
      titulo: meta.titulo,
      icone: meta.icone,
      html: meta.lista ? parseBulletList(sections[chave].body) : parseProse(sections[chave].body),
    };
  });

  return {
    slug,
    numero,
    nome,
    testamento,
    genero: generoDoLivro(numero),
    tempoLeituraMin,
    fichaRapidaHtml: parseFichaRapida(sections.fichaRapida.body),
    blocos,
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
<script src="${basePath}assets/icones.js"></script>
${bodyHtml}
</body>
</html>
`;
}

function navCard(book, extraClass, rotuloTexto, iconeNome, iconeAntes) {
  if (!book) return `<span class="nav-card nav-vazio" aria-hidden="true"></span>`;
  const iconeHtml = icone(iconeNome);
  const rotuloHtml = iconeAntes ? `${iconeHtml}${rotuloTexto}` : `${rotuloTexto}${iconeHtml}`;
  return `<a class="nav-card ${extraClass}" href="${book.slug}.html">
        <span class="nav-card-rotulo">${rotuloHtml}</span>
        <span class="nav-card-nome">${escapeHtml(book.nome)}</span>
      </a>`;
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
        <span class="status-lido" aria-label="Livro lido" title="Livro lido">${icone("check")}</span>
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
      <button type="button" class="controle tema-toggle" aria-label="Alternar tema"><span class="rotulo-tema">Tema</span></button>
    </div>
    <div class="home-hero">
      <div class="hero-copy">
        <p class="hero-sobretitulo">Uma biblioteca para estudar e compreender</p>
        <h1>${SITE_TITLE}</h1>
        <p class="intro">Contexto, autoria, cronologia e curiosidades em resumos claros,
        organizados para você explorar no seu ritmo.</p>
        <blockquote id="versiculo-dia" class="versiculo-dia" aria-live="polite" hidden>
          <p class="versiculo-dia-rotulo">${icone("sparkle")}Versículo do dia</p>
          <p class="versiculo-dia-texto" id="versiculo-dia-texto"></p>
          <cite class="versiculo-dia-ref" id="versiculo-dia-ref"></cite>
        </blockquote>
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
        <a id="continuar-leitura" class="continuar-leitura" href="livros/01-genesis.html">Começar leitura${icone("arrow-right")}</a>
      </section>
    </div>
  </header>
  <main class="home-conteudo">
    <p id="confirmacao-lido" class="confirmacao-lido" hidden role="status">
      <span id="confirmacao-lido-texto"></span>
      <button type="button" class="fechar-confirmacao" aria-label="Fechar aviso">${icone("close")}</button>
    </p>
    <section class="explorador" aria-labelledby="titulo-explorador">
      <div class="explorador-topo">
        <div>
          <p class="secao-rotulo">Biblioteca</p>
          <h2 id="titulo-explorador">Explore os 66 livros</h2>
        </div>
        <button type="button" id="aleatorio" class="botao-aleatorio">${icone("dice")}Surpreenda-me</button>
      </div>
      <div class="busca-container">
        <span class="busca-icone" aria-hidden="true">${icone("search")}</span>
        <input type="search" id="busca" class="busca" placeholder="Busque por Gênesis, Salmos, Romanos..." aria-label="Buscar livro">
        <button type="button" id="limpar-busca" class="limpar-busca" aria-label="Limpar busca" hidden>${icone("close")}</button>
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
  <script src="assets/referencias.js"></script>
  <script src="assets/versiculo-dia.js"></script>
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
      <h2>${icone(bloco.icone)}${escapeHtml(bloco.titulo)}</h2>
${bloco.html}
    </section>`
    )
    .join("\n");

  const indiceHtml = [{ id: "ficha-rapida", titulo: "Ficha Rápida", icone: "clipboard-list" }, ...book.blocos]
    .map((item) => `      <a href="#${item.id}">${icone(item.icone)}${escapeHtml(item.titulo)}</a>`)
    .join("\n");

  const navAnterior = navCard(prev, "nav-anterior", "Livro anterior", "arrow-left", true);
  const navProximo = navCard(next, "nav-proximo", "Próximo livro", "arrow-right", false);

  const url = `${BASE_URL}livros/${book.slug}.html`;

  const sugestaoHtml = next
    ? `Marcado como lido! <a href="${next.slug}.html">Continuar para ${escapeHtml(next.nome)}${icone("arrow-right")}</a>`
    : `Marcado como lido! ${icone("sparkle")}Você concluiu os 66 livros. <a href="../index.html">Ver seu progresso${icone("arrow-right")}</a>`;

  const body = `  <header class="topo topo-livro">
    <div class="progresso-pagina" aria-hidden="true"><span></span></div>
    <div class="topo-acoes">
      <a class="voltar" href="../index.html">${icone("arrow-left")}Todos os livros</a>
      <div class="acoes-livro">
        <button type="button" class="controle tema-toggle" aria-label="Alternar tema"><span class="rotulo-tema">Tema</span></button>
        <button type="button" class="controle fonte-menos" aria-label="Diminuir texto">A−</button>
        <button type="button" class="controle fonte-mais" aria-label="Aumentar texto">A+</button>
        <button type="button" class="controle marcar-lido" data-slug="${book.slug}" aria-pressed="false">${icone("check")}<span class="rotulo-lido">Marcar como lido</span></button>
        <button type="button" class="copiar-link" data-url="${url}" data-titulo="${escapeHtml(book.nome)} — ${escapeHtml(SITE_TITLE)}">${icone("link")}<span class="rotulo-copiar">Compartilhar</span></button>
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
      <h2>${icone("clipboard-list")}Ficha Rápida</h2>
${book.fichaRapidaHtml}
    </section>
${blocosHtml}
  </main>
  <div class="acoes-fim-livro">
    <p class="acoes-fim-rotulo">Terminou de ler ${escapeHtml(book.nome)}?</p>
    <button type="button" class="controle marcar-lido" data-slug="${book.slug}" aria-pressed="false">${icone("check")}<span class="rotulo-lido">Marcar como lido</span></button>
    <p id="sugestao-proximo" class="sugestao-proximo" hidden>${sugestaoHtml}</p>
  </div>
  <nav class="navegacao-livros">
    ${navAnterior}
    ${navProximo}
  </nav>
  <button type="button" class="voltar-topo" aria-label="Voltar ao início" title="Voltar ao início">${icone("arrow-up")}</button>
  <footer class="rodape">
    <p><a href="../index.html">${icone("arrow-left")}Voltar para todos os livros</a></p>
  </footer>
  <script src="../assets/preferencias.js"></script>
  <script src="../assets/referencias.js"></script>
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
  fs.mkdirSync(path.join(OUT_DIR, "assets"), { recursive: true });

  fs.writeFileSync(path.join(OUT_DIR, "index.html"), renderIndex(books), "utf8");

  books.forEach((book, i) => {
    const prev = i > 0 ? books[i - 1] : null;
    const next = i < books.length - 1 ? books[i + 1] : null;
    fs.writeFileSync(path.join(OUT_DIR, "livros", `${book.slug}.html`), renderLivro(book, prev, next), "utf8");
  });

  const urls = [BASE_URL, ...books.map((b) => `${BASE_URL}livros/${b.slug}.html`)];
  fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), renderSitemap(urls), "utf8");

  const iconesClienteJs = `// Gerado automaticamente por scripts/gerar-site.js -- nao editar a mao.\nwindow.ICONES = ${JSON.stringify(ICONES)};\n`;
  fs.writeFileSync(path.join(OUT_DIR, "assets", "icones.js"), iconesClienteJs, "utf8");

  console.log(`Gerado: docs/index.html + ${books.length} páginas em docs/livros/ + sitemap.xml + assets/icones.js`);
}

main();
