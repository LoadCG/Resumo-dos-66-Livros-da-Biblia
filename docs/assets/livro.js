// Controles de leitura e botão "copiar link" nas páginas de livro.
(function () {
  const botao = document.querySelector(".copiar-link");
  const botoesLido = Array.from(document.querySelectorAll(".marcar-lido"));
  const sugestao = document.getElementById("sugestao-proximo");
  const botaoMenos = document.querySelector(".fonte-menos");
  const botaoMais = document.querySelector(".fonte-mais");
  const botaoTopo = document.querySelector(".voltar-topo");
  const barraPagina = document.querySelector(".progresso-pagina span");
  const raiz = document.documentElement;

  if (botoesLido.length) {
    try {
      localStorage.setItem("biblia-ultimo-livro", botoesLido[0].getAttribute("data-slug"));
    } catch (e) {}
  }

  if (botao) {
    const textoOriginal = botao.textContent;

    botao.addEventListener("click", async function () {
      const url = botao.getAttribute("data-url");
      try {
        await navigator.clipboard.writeText(url);
        botao.textContent = "✅ Link copiado!";
      } catch (erro) {
        botao.textContent = "Não foi possível copiar";
      }
      setTimeout(function () {
        botao.textContent = textoOriginal;
      }, 2000);
    });
  }

  let tamanho = 100;
  try {
    tamanho = Number(localStorage.getItem("biblia-tamanho-fonte")) || 100;
  } catch (e) {}

  function aplicarTamanho() {
    tamanho = Math.max(85, Math.min(130, tamanho));
    raiz.style.setProperty("--escala-leitura", tamanho / 100);
    try {
      localStorage.setItem("biblia-tamanho-fonte", String(tamanho));
    } catch (e) {}
  }

  if (botaoMenos) botaoMenos.addEventListener("click", function () {
    tamanho -= 5;
    aplicarTamanho();
  });
  if (botaoMais) botaoMais.addEventListener("click", function () {
    tamanho += 5;
    aplicarTamanho();
  });
  aplicarTamanho();

  if (botoesLido.length) {
    const slug = botoesLido[0].getAttribute("data-slug");
    let lidos = [];
    try {
      lidos = JSON.parse(localStorage.getItem("biblia-livros-lidos") || "[]");
    } catch (e) {}

    function atualizarLido() {
      const estaLido = lidos.includes(slug);
      botoesLido.forEach(function (botaoLido) {
        botaoLido.classList.toggle("is-ativo", estaLido);
        botaoLido.setAttribute("aria-pressed", String(estaLido));
        botaoLido.textContent = estaLido ? "✓ Livro lido" : "✓ Marcar como lido";
      });
      if (sugestao) sugestao.hidden = !estaLido;
    }

    botoesLido.forEach(function (botaoLido) {
      botaoLido.addEventListener("click", function () {
        lidos = lidos.includes(slug) ? lidos.filter(function (item) {
          return item !== slug;
        }) : lidos.concat(slug);
        try {
          localStorage.setItem("biblia-livros-lidos", JSON.stringify(lidos));
        } catch (e) {}
        atualizarLido();
      });
    });
    atualizarLido();
  }

  function atualizarRolagem() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const porcentagem = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0;
    if (barraPagina) barraPagina.style.width = porcentagem + "%";
    if (botaoTopo) botaoTopo.classList.toggle("is-visivel", window.scrollY > 500);
  }

  window.addEventListener("scroll", atualizarRolagem, { passive: true });
  if (botaoTopo) {
    botaoTopo.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  atualizarRolagem();
})();
