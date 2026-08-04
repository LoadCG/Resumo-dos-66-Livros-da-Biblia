// Controles de leitura (fonte, marcar como lido, copiar link, índice com
// destaque de seção atual, barra de progresso e botão de voltar ao topo)
// nas páginas de livro.
(function () {
  const icones = window.ICONES || {};
  const botaoCopiar = document.querySelector(".copiar-link");
  const botoesLido = Array.from(document.querySelectorAll(".marcar-lido"));
  const sugestao = document.getElementById("sugestao-proximo");
  const botaoMenos = document.querySelector(".fonte-menos");
  const botaoMais = document.querySelector(".fonte-mais");
  const botaoTopo = document.querySelector(".voltar-topo");
  const barraPagina = document.querySelector(".progresso-pagina span");
  const raiz = document.documentElement;

  if (botoesLido.length) {
    window.salvarArmazenamento("biblia-ultimo-livro", botoesLido[0].getAttribute("data-slug"));
  }

  if (botaoCopiar) {
    const original = botaoCopiar.innerHTML;

    botaoCopiar.addEventListener("click", async function () {
      const url = botaoCopiar.getAttribute("data-url");
      const titulo = botaoCopiar.getAttribute("data-titulo") || document.title;

      // Em celulares com suporte, abre o menu nativo de compartilhamento
      // (WhatsApp, Instagram etc.) em vez de só copiar o link.
      if (navigator.share) {
        try {
          await navigator.share({ title: titulo, url: url });
        } catch (erro) {
          // Usuário cancelou o compartilhamento: não é erro, não faz nada.
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(url);
        botaoCopiar.innerHTML =
          '<span class="icone" aria-hidden="true">' + icones.check + '</span><span class="rotulo-copiar">Link copiado!</span>';
      } catch (erro) {
        botaoCopiar.innerHTML =
          '<span class="icone" aria-hidden="true">' +
          icones.close +
          '</span><span class="rotulo-copiar">Não foi possível copiar</span>';
      }
      setTimeout(function () {
        botaoCopiar.innerHTML = original;
      }, 2000);
    });
  }

  let tamanho = Number(window.lerArmazenamento("biblia-tamanho-fonte", 100)) || 100;

  function aplicarTamanho() {
    tamanho = Math.max(85, Math.min(130, tamanho));
    raiz.style.setProperty("--escala-leitura", tamanho / 100);
    window.salvarArmazenamento("biblia-tamanho-fonte", tamanho);
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

  const botaoSerifada = document.querySelector(".fonte-serifada");
  if (botaoSerifada) {
    function aplicarFonteLeitura(serifada) {
      if (serifada) raiz.dataset.fonteLeitura = "serifada";
      else delete raiz.dataset.fonteLeitura;
      botaoSerifada.classList.toggle("is-ativo", serifada);
      botaoSerifada.setAttribute("aria-pressed", String(serifada));
    }

    aplicarFonteLeitura(window.lerArmazenamento("biblia-fonte-serifada", false));
    botaoSerifada.addEventListener("click", function () {
      const serifada = raiz.dataset.fonteLeitura !== "serifada";
      aplicarFonteLeitura(serifada);
      window.salvarArmazenamento("biblia-fonte-serifada", serifada);
    });
  }

  if (botoesLido.length) {
    const slug = botoesLido[0].getAttribute("data-slug");
    let lidos = window.lerArmazenamento("biblia-livros-lidos", []);

    function atualizarLido() {
      const estaLido = lidos.indexOf(slug) !== -1;
      botoesLido.forEach(function (botaoLido) {
        botaoLido.classList.toggle("is-ativo", estaLido);
        botaoLido.setAttribute("aria-pressed", String(estaLido));
        const rotulo = botaoLido.querySelector(".rotulo-lido");
        if (rotulo) rotulo.textContent = estaLido ? "Livro lido" : "Marcar como lido";
      });
      if (sugestao) sugestao.hidden = !estaLido;
    }

    botoesLido.forEach(function (botaoLido) {
      botaoLido.addEventListener("click", function () {
        lidos =
          lidos.indexOf(slug) !== -1
            ? lidos.filter(function (item) {
                return item !== slug;
              })
            : lidos.concat(slug);
        window.salvarArmazenamento("biblia-livros-lidos", lidos);
        atualizarLido();
      });
    });
    atualizarLido();
  }

  const linksIndice = Array.from(document.querySelectorAll(".indice a"));
  const secoesIndice = Array.from(document.querySelectorAll("main .bloco[id]"));
  if (linksIndice.length && secoesIndice.length && "IntersectionObserver" in window) {
    const mapaLinks = {};
    linksIndice.forEach(function (link) {
      mapaLinks[link.getAttribute("href").slice(1)] = link;
    });
    let linkAtual = null;
    const observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          const link = mapaLinks[entrada.target.id];
          if (!link || !entrada.isIntersecting) return;
          if (linkAtual) linkAtual.classList.remove("is-atual");
          link.classList.add("is-atual");
          linkAtual = link;
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    secoesIndice.forEach(function (secao) {
      observador.observe(secao);
    });
  }

  let tickAgendado = false;

  function atualizarRolagem() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const porcentagem = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0;
    if (barraPagina) barraPagina.style.width = porcentagem + "%";
    if (botaoTopo) botaoTopo.classList.toggle("is-visivel", window.scrollY > 500);
    tickAgendado = false;
  }

  function aoRolar() {
    if (!tickAgendado) {
      tickAgendado = true;
      requestAnimationFrame(atualizarRolagem);
    }
  }

  window.addEventListener("scroll", aoRolar, { passive: true });
  if (botaoTopo) {
    botaoTopo.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  atualizarRolagem();

  // Atalhos de teclado: setas para navegar entre livros, T para tema,
  // +/- para o tamanho da fonte. Ignorados com modificadores (Ctrl/Alt/
  // Cmd, que já têm significado do navegador) e enquanto o foco está num
  // campo de referência bíblica ou outro elemento de formulário.
  const linkAnterior = document.querySelector(".nav-anterior");
  const linkProximo = document.querySelector(".nav-proximo");
  const botaoTema = document.querySelector(".tema-toggle");

  document.addEventListener("keydown", function (evento) {
    if (evento.ctrlKey || evento.altKey || evento.metaKey) return;
    const alvo = evento.target;
    if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;

    switch (evento.key) {
      case "ArrowLeft":
        if (linkAnterior) window.location.href = linkAnterior.getAttribute("href");
        break;
      case "ArrowRight":
        if (linkProximo) window.location.href = linkProximo.getAttribute("href");
        break;
      case "t":
      case "T":
        if (botaoTema) botaoTema.click();
        break;
      case "+":
      case "=":
        if (botaoMais) botaoMais.click();
        break;
      case "-":
        if (botaoMenos) botaoMenos.click();
        break;
      default:
        return;
    }
  });
})();
