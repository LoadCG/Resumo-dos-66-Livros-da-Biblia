// Gerado automaticamente por scripts/gerar-site.js -- nao editar a mao.
const CACHE_NAME = "biblia-cache-1785813989461";
const PRECACHE_URLS = ["./","index.html","manifest.json","assets/style.css","assets/icones.js","assets/preferencias.js","assets/busca.js","assets/referencias.js","assets/livro.js","assets/versiculo-dia.js","assets/indice-busca.json","assets/icone.svg","assets/livros-biblia.js","biblia/index.html","biblia/capitulos.html","biblia/versiculos.html","biblia/ler.html","livros/01-genesis.html","livros/02-exodo.html","livros/03-levitico.html","livros/04-numeros.html","livros/05-deuteronomio.html","livros/06-josue.html","livros/07-juizes.html","livros/08-rute.html","livros/09-1-samuel.html","livros/10-2-samuel.html","livros/11-1-reis.html","livros/12-2-reis.html","livros/13-1-cronicas.html","livros/14-2-cronicas.html","livros/15-esdras.html","livros/16-neemias.html","livros/17-ester.html","livros/18-jo.html","livros/19-salmos.html","livros/20-proverbios.html","livros/21-eclesiastes.html","livros/22-cantares.html","livros/23-isaias.html","livros/24-jeremias.html","livros/25-lamentacoes.html","livros/26-ezequiel.html","livros/27-daniel.html","livros/28-oseias.html","livros/29-joel.html","livros/30-amos.html","livros/31-obadias.html","livros/32-jonas.html","livros/33-miqueias.html","livros/34-naum.html","livros/35-habacuque.html","livros/36-sofonias.html","livros/37-ageu.html","livros/38-zacarias.html","livros/39-malaquias.html","livros/40-mateus.html","livros/41-marcos.html","livros/42-lucas.html","livros/43-joao.html","livros/44-atos.html","livros/45-romanos.html","livros/46-1-corintios.html","livros/47-2-corintios.html","livros/48-galatas.html","livros/49-efesios.html","livros/50-filipenses.html","livros/51-colossenses.html","livros/52-1-tessalonicenses.html","livros/53-2-tessalonicenses.html","livros/54-1-timoteo.html","livros/55-2-timoteo.html","livros/56-tito.html","livros/57-filemom.html","livros/58-hebreus.html","livros/59-tiago.html","livros/60-1-pedro.html","livros/61-2-pedro.html","livros/62-1-joao.html","livros/63-2-joao.html","livros/64-3-joao.html","livros/65-judas.html","livros/66-apocalipse.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((chave) => chave !== CACHE_NAME).map((chave) => caches.delete(chave))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Páginas de leitura bíblica (biblia/capitulos.html?livro=... etc.) usam
  // a mesma casca HTML para qualquer combinação de parâmetros na URL —
  // ignora a query string ao procurar no cache só para navegação (documento
  // HTML), senão cada combinação diferente de ?livro=&capitulo= pareceria
  // "não cacheada" mesmo com a casca já salva.
  const ehNavegacao = event.request.mode === "navigate" || event.request.destination === "document";
  event.respondWith(
    caches.match(event.request, { ignoreSearch: ehNavegacao }).then((cached) => {
      const emRede = fetch(event.request)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return resposta;
        })
        .catch(() => cached);
      return cached || emRede;
    })
  );
});
