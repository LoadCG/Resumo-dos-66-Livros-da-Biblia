// Controles de leitura e botão "copiar link" nas páginas de livro.
(function () {
  const botao = document.querySelector(".copiar-link");
  const botaoLido = document.querySelector(".marcar-lido");
  const botaoMenos = document.querySelector(".fonte-menos");
  const botaoMais = document.querySelector(".fonte-mais");
  const raiz = document.documentElement;

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

  if (botaoLido) {
    const slug = botaoLido.getAttribute("data-slug");
    let lidos = [];
    try {
      lidos = JSON.parse(localStorage.getItem("biblia-livros-lidos") || "[]");
    } catch (e) {}

    function atualizarLido() {
      const estaLido = lidos.includes(slug);
      botaoLido.classList.toggle("is-ativo", estaLido);
      botaoLido.setAttribute("aria-pressed", String(estaLido));
      botaoLido.textContent = estaLido ? "✓ Livro lido" : "✓ Marcar como lido";
    }

    botaoLido.addEventListener("click", function () {
      lidos = lidos.includes(slug) ? lidos.filter(function (item) {
        return item !== slug;
      }) : lidos.concat(slug);
      try {
        localStorage.setItem("biblia-livros-lidos", JSON.stringify(lidos));
      } catch (e) {}
      atualizarLido();
    });
    atualizarLido();
  }
})();
