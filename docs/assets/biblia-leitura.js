// Leitura completa da Bíblia (texto real, buscado na bible-api.com): livro
// → capítulo → versículo → leitura em foco. As 4 páginas em docs/biblia/
// compartilham este único script; cada bloco abaixo só roda se os
// elementos daquela página existirem no DOM (a mesma casca HTML nunca
// muda, só o que a URL pede muda).
(function () {
  const livros = window.LIVROS_BIBLIA || [];

  function paramsAtuais() {
    return new URLSearchParams(window.location.search);
  }

  function encontrarLivro(slug) {
    return livros.find(function (l) {
      return l.slug === slug;
    });
  }

  function escapeHtml(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Grifos: mapa "slugDoLivro:capitulo:versiculo" -> true, persistido no
  // navegador. Compartilhado entre a tela de escolher versículo (mostra
  // quais já estão grifados) e a tela de leitura (onde se grifa de fato).
  const CHAVE_GRIFOS = "biblia-grifos";

  function chaveGrifo(slug, capitulo, versiculo) {
    return slug + ":" + capitulo + ":" + versiculo;
  }

  // Capítulos lidos: lista de "slugDoLivro:capítulo", separada de
  // "biblia-livros-lidos" (usada pelos resumos) de propósito — ler o texto
  // bíblico de um capítulo é uma coisa diferente de ter lido o resumo
  // histórico do livro, então os dois progressos não se misturam.
  const CHAVE_CAPITULOS_LIDOS = "biblia-capitulos-lidos";

  function chaveCapitulo(slug, capitulo) {
    return slug + ":" + capitulo;
  }

  // --- Página 1: escolher o livro (biblia/index.html) ---------------------
  const gradeLivros = document.getElementById("grade-livros-biblia");
  if (gradeLivros) {
    const input = document.getElementById("busca-livro-biblia");
    const botaoLimpar = document.getElementById("limpar-busca-livro-biblia");
    const vazio = document.getElementById("busca-vazia-biblia");

    const capitulosLidos = window.lerArmazenamento(CHAVE_CAPITULOS_LIDOS, []);

    function renderLivros(lista) {
      gradeLivros.innerHTML = lista
        .map(function (l) {
          const lidosDoLivro = capitulosLidos.filter(function (chave) {
            return chave.indexOf(l.slug + ":") === 0;
          }).length;
          const progresso = lidosDoLivro > 0 ? lidosDoLivro + " de " + l.capitulos + " capítulos lidos" : l.capitulos + (l.capitulos > 1 ? " capítulos" : " capítulo");
          return (
            '<a class="card" href="capitulos.html?livro=' +
            encodeURIComponent(l.slug) +
            '">' +
            '<span class="card-numero">' +
            l.numero +
            "</span>" +
            '<span class="card-conteudo"><span class="card-nome">' +
            escapeHtml(l.nome) +
            '</span><span class="genero">' +
            progresso +
            "</span></span></a>"
          );
        })
        .join("");
      vazio.hidden = lista.length > 0;
    }

    function aplicarBusca() {
      const termo = (input.value || "").trim().toLowerCase();
      botaoLimpar.hidden = termo === "";
      renderLivros(
        livros.filter(function (l) {
          return l.nome.toLowerCase().includes(termo);
        })
      );
    }

    input.addEventListener("input", aplicarBusca);
    botaoLimpar.addEventListener("click", function () {
      input.value = "";
      input.focus();
      aplicarBusca();
    });

    renderLivros(livros);
  }

  // --- Página 2: escolher o capítulo (biblia/capitulos.html) --------------
  const gradeCapitulos = document.getElementById("grade-capitulos");
  if (gradeCapitulos) {
    const livro = encontrarLivro(paramsAtuais().get("livro"));
    if (!livro) {
      window.location.href = "index.html";
    } else {
      document.getElementById("titulo-livro-biblia").textContent = livro.nome;
      document.title = livro.nome + " — Selecione o capítulo";

      const capitulosLidos = window.lerArmazenamento(CHAVE_CAPITULOS_LIDOS, []);
      const botoes = [];
      for (let n = 1; n <= livro.capitulos; n++) botoes.push(n);
      gradeCapitulos.innerHTML = botoes
        .map(function (n) {
          const lido = capitulosLidos.indexOf(chaveCapitulo(livro.slug, n)) !== -1 ? " is-lido" : "";
          return (
            '<a class="numero-botao' +
            lido +
            '" href="versiculos.html?livro=' +
            encodeURIComponent(livro.slug) +
            "&capitulo=" +
            n +
            '">' +
            n +
            "</a>"
          );
        })
        .join("");
    }
  }

  // --- Página 3: escolher o versículo (biblia/versiculos.html) ------------
  const gradeVersiculos = document.getElementById("grade-versiculos");
  if (gradeVersiculos) {
    const parametros = paramsAtuais();
    const livro = encontrarLivro(parametros.get("livro"));
    const capitulo = parseInt(parametros.get("capitulo"), 10);
    const carregando = document.getElementById("carregando-versiculos");
    const botaoCapituloInteiro = document.getElementById("ler-capitulo-inteiro");
    const linkVoltar = document.getElementById("voltar-capitulos");

    if (!livro || !capitulo || capitulo < 1 || capitulo > livro.capitulos || !window.BibliaAPI) {
      window.location.href = "index.html";
    } else {
      const refBase = "livro=" + encodeURIComponent(livro.slug) + "&capitulo=" + capitulo;
      linkVoltar.href = "capitulos.html?livro=" + encodeURIComponent(livro.slug);
      botaoCapituloInteiro.addEventListener("click", function () {
        window.location.href = "ler.html?" + refBase;
      });

      const titulo = livro.nome + " " + capitulo;
      document.getElementById("titulo-capitulo-biblia").textContent = titulo;
      document.title = titulo + " — Selecione o versículo";

      window.BibliaAPI.buscar(livro.nome + " " + capitulo)
        .then(function (resultado) {
          carregando.hidden = true;
          const total = resultado.versiculos ? resultado.versiculos.length : 1;
          const grifos = window.lerArmazenamento(CHAVE_GRIFOS, {});
          const botoes = [];
          for (let v = 1; v <= total; v++) botoes.push(v);
          gradeVersiculos.innerHTML = botoes
            .map(function (v) {
              const grifado = grifos[chaveGrifo(livro.slug, capitulo, v)] ? " is-grifado" : "";
              return (
                '<a class="numero-botao' +
                grifado +
                '" href="ler.html?' +
                refBase +
                "&versiculo=" +
                v +
                '">' +
                v +
                "</a>"
              );
            })
            .join("");
        })
        .catch(function () {
          carregando.textContent = "Não foi possível carregar este capítulo agora. Tente de novo em instantes.";
        });
    }
  }

  // --- Página 4: leitura em foco (biblia/ler.html) -------------------------
  const corpoLeitura = document.getElementById("leitura-biblia-corpo");
  if (corpoLeitura) {
    const parametros = paramsAtuais();
    const livro = encontrarLivro(parametros.get("livro"));
    const capitulo = parseInt(parametros.get("capitulo"), 10);
    const versiculoAlvo = parseInt(parametros.get("versiculo"), 10) || null;
    const indiceLivro = livros.indexOf(livro);

    if (!livro || !capitulo || capitulo < 1 || capitulo > livro.capitulos || !window.BibliaAPI) {
      window.location.href = "index.html";
    } else {
      const refBase = "livro=" + encodeURIComponent(livro.slug) + "&capitulo=" + capitulo;
      document.getElementById("voltar-versiculos").href = "versiculos.html?" + refBase;

      const titulo = livro.nome + " " + capitulo;
      document.getElementById("titulo-leitura-biblia").textContent = titulo;
      document.title = titulo + " — " + document.title;

      // Capítulo anterior/próximo, cruzando para o livro vizinho nas
      // fronteiras (ex.: Gênesis 1 não tem anterior; Malaquias 4 → Mateus 1).
      function linkCapitulo(livroAlvo, capituloAlvo) {
        return "ler.html?livro=" + encodeURIComponent(livroAlvo.slug) + "&capitulo=" + capituloAlvo;
      }

      const navAnterior = document.getElementById("capitulo-anterior");
      const navProximo = document.getElementById("capitulo-proximo");

      if (capitulo > 1) {
        navAnterior.href = linkCapitulo(livro, capitulo - 1);
        document.getElementById("capitulo-anterior-nome").textContent = livro.nome + " " + (capitulo - 1);
      } else if (indiceLivro > 0) {
        const anterior = livros[indiceLivro - 1];
        navAnterior.href = linkCapitulo(anterior, anterior.capitulos);
        document.getElementById("capitulo-anterior-nome").textContent = anterior.nome + " " + anterior.capitulos;
      } else {
        navAnterior.classList.add("nav-vazio");
        navAnterior.removeAttribute("href");
      }

      if (capitulo < livro.capitulos) {
        navProximo.href = linkCapitulo(livro, capitulo + 1);
        document.getElementById("capitulo-proximo-nome").textContent = livro.nome + " " + (capitulo + 1);
      } else if (indiceLivro < livros.length - 1) {
        const proximo = livros[indiceLivro + 1];
        navProximo.href = linkCapitulo(proximo, 1);
        document.getElementById("capitulo-proximo-nome").textContent = proximo.nome + " 1";
      } else {
        navProximo.classList.add("nav-vazio");
        navProximo.removeAttribute("href");
      }

      const iconeGrifo = (window.ICONES && window.ICONES.highlighter) || "";
      let grifos = window.lerArmazenamento(CHAVE_GRIFOS, {});

      window.BibliaAPI.buscar(livro.nome + " " + capitulo)
        .then(function (resultado) {
          if (resultado.versiculos && resultado.versiculos.length > 0) {
            corpoLeitura.innerHTML = resultado.versiculos
              .map(function (v) {
                const destaque = v.numero === versiculoAlvo ? " is-destacado" : "";
                const grifado = grifos[chaveGrifo(livro.slug, capitulo, v.numero)];
                return (
                  '<p class="leitura-versiculo' +
                  destaque +
                  (grifado ? " is-grifado" : "") +
                  '" id="versiculo-' +
                  v.numero +
                  '"><button type="button" class="grifo-botao' +
                  (grifado ? " is-ativo" : "") +
                  '" data-versiculo="' +
                  v.numero +
                  '" aria-pressed="' +
                  !!grifado +
                  '" aria-label="Grifar versículo ' +
                  v.numero +
                  '"><span class="icone" aria-hidden="true">' +
                  iconeGrifo +
                  '</span></button><span class="leitura-versiculo-numero">' +
                  v.numero +
                  "</span>" +
                  v.texto +
                  "</p>"
                );
              })
              .join("");
          } else {
            corpoLeitura.innerHTML = "<p class=\"leitura-versiculo\">" + resultado.texto + "</p>";
          }

          if (versiculoAlvo) {
            const alvo = document.getElementById("versiculo-" + versiculoAlvo);
            if (alvo) alvo.scrollIntoView({ block: "center" });
          }
        })
        .catch(function () {
          corpoLeitura.innerHTML =
            '<p class="busca-vazia">Não foi possível carregar este capítulo agora. Tente de novo em instantes.</p>';
        });

      corpoLeitura.addEventListener("click", function (evento) {
        const botao = evento.target.closest(".grifo-botao");
        if (!botao) return;
        const numero = botao.getAttribute("data-versiculo");
        const chave = chaveGrifo(livro.slug, capitulo, numero);
        const ativo = !grifos[chave];
        if (ativo) grifos[chave] = true;
        else delete grifos[chave];
        window.salvarArmazenamento(CHAVE_GRIFOS, grifos);
        botao.classList.toggle("is-ativo", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
        botao.closest(".leitura-versiculo").classList.toggle("is-grifado", ativo);
      });

      // Tamanho de texto (mesmo padrão das páginas de resumo).
      const raiz = document.documentElement;
      const botaoMenos = document.querySelector(".fonte-menos");
      const botaoMais = document.querySelector(".fonte-mais");
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

      // Marcar capítulo como lido (separado de "livro lido", que é sobre
      // o resumo histórico, não o texto bíblico em si).
      const botaoCapituloLido = document.querySelector(".marcar-capitulo-lido");
      if (botaoCapituloLido) {
        const chave = chaveCapitulo(livro.slug, capitulo);
        let capitulosLidos = window.lerArmazenamento(CHAVE_CAPITULOS_LIDOS, []);

        function atualizarBotaoCapituloLido() {
          const lido = capitulosLidos.indexOf(chave) !== -1;
          botaoCapituloLido.classList.toggle("is-ativo", lido);
          botaoCapituloLido.setAttribute("aria-pressed", String(lido));
          botaoCapituloLido.querySelector(".rotulo-capitulo-lido").textContent = lido
            ? "Capítulo lido"
            : "Marcar capítulo como lido";
        }

        botaoCapituloLido.addEventListener("click", function () {
          const indice = capitulosLidos.indexOf(chave);
          if (indice === -1) capitulosLidos.push(chave);
          else capitulosLidos.splice(indice, 1);
          window.salvarArmazenamento(CHAVE_CAPITULOS_LIDOS, capitulosLidos);
          atualizarBotaoCapituloLido();
        });

        atualizarBotaoCapituloLido();
      }
    }
  }
})();
