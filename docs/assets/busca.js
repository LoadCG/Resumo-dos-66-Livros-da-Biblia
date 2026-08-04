// Busca, filtros (testamento/progresso/gênero), livro aleatório e
// indicadores de progresso na home. Progressive enhancement: sem JS, a
// lista completa continua visível e navegável normalmente.
(function () {
  const input = document.getElementById("busca");
  const cards = Array.from(document.querySelectorAll(".card"));
  const grupos = Array.from(document.querySelectorAll(".grupo"));
  const vazio = document.getElementById("busca-vazia");
  const botoesFiltro = Array.from(document.querySelectorAll(".filtro-botao"));
  const botoesStatus = Array.from(document.querySelectorAll(".filtro-status"));
  const botoesGenero = Array.from(document.querySelectorAll(".legenda-item"));
  const botaoAleatorio = document.getElementById("aleatorio");
  const botaoLimpar = document.getElementById("limpar-filtros");
  const botaoLimparVazio = document.getElementById("limpar-busca-vazia");
  const botaoLimparBusca = document.getElementById("limpar-busca");
  const progressoTexto = document.getElementById("progresso-texto");
  const progressoPorcentagem = document.getElementById("progresso-porcentagem");
  const progressoPreenchimento = document.getElementById("progresso-preenchimento");
  const progressoTrilho = document.querySelector(".trilho-progresso");
  const continuarLeitura = document.getElementById("continuar-leitura");
  const confirmacao = document.getElementById("confirmacao-lido");
  const confirmacaoTexto = document.getElementById("confirmacao-lido-texto");
  const fecharConfirmacao = document.querySelector(".fechar-confirmacao");
  const icones = window.ICONES || {};
  const livrosLidos = window.lerArmazenamento("biblia-livros-lidos", []);

  // Cache dos atributos estáticos de cada card, para não repetir
  // getAttribute() em todo card a cada tecla digitada na busca.
  const itens = cards.map(function (card) {
    return {
      el: card,
      slug: card.getAttribute("data-slug") || "",
      nome: card.getAttribute("data-nome") || "",
      testamento: card.getAttribute("data-testamento") || "",
      genero: card.getAttribute("data-genero") || "",
      texto: "",
    };
  });

  // Índice do conteúdo dos resumos (gerado em build por gerar-site.js),
  // carregado à parte para a busca por nome continuar instantânea mesmo
  // antes dele chegar — quando chega, a busca passa a alcançar também o
  // texto dos resumos, não só o nome do livro.
  fetch("assets/indice-busca.json")
    .then(function (resposta) {
      return resposta.ok ? resposta.json() : null;
    })
    .then(function (indice) {
      if (!indice) return;
      itens.forEach(function (item) {
        item.texto = indice[item.slug] || "";
      });
      aplicarFiltro();
    })
    .catch(function () {
      // Sem índice, a busca continua funcionando só por nome.
    });

  function normalizarBusca(texto) {
    return texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }

  cards.forEach(function (card) {
    card.classList.toggle("is-lido", livrosLidos.indexOf(card.getAttribute("data-slug")) !== -1);
  });

  // Conquistas discretas: marcos de leitura ligados à estrutura do cânon
  // (Pentateuco, Evangelhos, testamentos), não a metas de contagem — o
  // objetivo é reconhecer, não transformar a leitura em competição.
  const conquistas = Array.from(document.querySelectorAll(".conquista"));
  if (conquistas.length) {
    const lidosSet = new Set(livrosLidos);
    const todosLidos = function (slugs) {
      return slugs.length > 0 && slugs.every(function (slug) {
        return lidosSet.has(slug);
      });
    };
    const slugsPorTestamento = function (testamento) {
      return itens.filter(function (item) {
        return item.testamento === testamento;
      }).map(function (item) {
        return item.slug;
      });
    };

    const estado = {
      "primeiro-livro": livrosLidos.length >= 1,
      pentateuco: todosLidos(["01-genesis", "02-exodo", "03-levitico", "04-numeros", "05-deuteronomio"]),
      evangelhos: todosLidos(["40-mateus", "41-marcos", "42-lucas", "43-joao"]),
      "antigo-testamento": todosLidos(slugsPorTestamento("Antigo Testamento")),
      "novo-testamento": todosLidos(slugsPorTestamento("Novo Testamento")),
      "biblia-completa": livrosLidos.length >= cards.length,
    };

    conquistas.forEach(function (li) {
      li.classList.toggle("is-conquistada", !!estado[li.getAttribute("data-conquista")]);
    });
  }

  function encontrarProximoNaoLido() {
    return cards.find(function (card) {
      return !card.classList.contains("is-lido");
    });
  }

  const proximoNaoLidoCard = encontrarProximoNaoLido();
  if (proximoNaoLidoCard) proximoNaoLidoCard.classList.add("proximo-sugerido");

  if (confirmacao && confirmacaoTexto) {
    const ultimoTotalVisto = window.lerArmazenamento("biblia-total-visto", 0);
    const totalAtual = livrosLidos.length;
    if (totalAtual > ultimoTotalVisto && totalAtual > 0) {
      confirmacaoTexto.innerHTML =
        '<span class="icone" aria-hidden="true">' +
        icones.sparkle +
        "</span>Você concluiu mais um livro! " +
        totalAtual +
        " de 66 lidos até agora.";
      confirmacao.hidden = false;
    }
    window.salvarArmazenamento("biblia-total-visto", totalAtual);
    if (fecharConfirmacao) {
      fecharConfirmacao.addEventListener("click", function () {
        confirmacao.hidden = true;
      });
    }
  }

  let termo = "";
  let testamento = "todos";
  let status = "todos";
  let genero = "todos";

  function atualizarProgresso() {
    const total = livrosLidos.length;
    const porcentagem = Math.round((total / cards.length) * 100);
    if (progressoTexto) progressoTexto.textContent = total + " de 66 livros lidos";
    if (progressoPorcentagem) progressoPorcentagem.textContent = porcentagem + "%";
    if (progressoPreenchimento) progressoPreenchimento.style.width = porcentagem + "%";
    if (progressoTrilho) progressoTrilho.setAttribute("aria-valuenow", String(total));

    if (continuarLeitura) {
      const ultimoSlug = window.lerArmazenamento("biblia-ultimo-livro", "");
      const ultimoCard = cards.find(function (card) {
        return card.getAttribute("data-slug") === ultimoSlug;
      });
      const destino = ultimoCard || encontrarProximoNaoLido();
      const seta = '<span class="icone" aria-hidden="true">' + icones["arrow-right"] + "</span>";
      if (destino) {
        continuarLeitura.href = destino.getAttribute("href");
        continuarLeitura.innerHTML = ultimoCard
          ? "Continuar em " + ultimoCard.querySelector(".card-nome").textContent + seta
          : "Começar por " + destino.querySelector(".card-nome").textContent + seta;
      } else {
        continuarLeitura.innerHTML = "Leitura concluída!";
        continuarLeitura.removeAttribute("href");
      }
    }
  }

  function aplicarFiltro() {
    const contagemGrupo = {};
    let algumVisivel = false;
    const termoNormalizado = normalizarBusca(termo);

    itens.forEach(function (item) {
      const lido = item.el.classList.contains("is-lido");
      const bateTermo =
        termo === "" || item.nome.includes(termo) || (item.texto && item.texto.includes(termoNormalizado));
      const bateTestamento = testamento === "todos" || item.testamento === testamento;
      const bateGenero = genero === "todos" || item.genero === genero;
      const bateStatus = status === "todos" || (status === "lidos" && lido) || (status === "nao-lidos" && !lido);
      const visivel = bateTermo && bateTestamento && bateGenero && bateStatus;
      item.el.hidden = !visivel;
      if (visivel) {
        algumVisivel = true;
        contagemGrupo[item.testamento] = (contagemGrupo[item.testamento] || 0) + 1;
      }
    });

    grupos.forEach(function (grupo) {
      const chave = grupo.getAttribute("data-testamento");
      grupo.hidden = !contagemGrupo[chave];
    });

    if (vazio) vazio.hidden = algumVisivel;
  }

  function marcarAtivo(botoes, ativo) {
    botoes.forEach(function (botao) {
      const on = botao === ativo;
      botao.classList.toggle("is-ativo", on);
      botao.setAttribute("aria-pressed", String(on));
    });
  }

  function limparTudo() {
    termo = "";
    testamento = "todos";
    status = "todos";
    genero = "todos";
    if (input) input.value = "";
    if (botaoLimparBusca) botaoLimparBusca.hidden = true;
    marcarAtivo(botoesFiltro, botoesFiltro[0]);
    marcarAtivo(botoesStatus, botoesStatus[0]);
    marcarAtivo(botoesGenero, null);
    aplicarFiltro();
  }

  if (input) {
    input.addEventListener("input", function () {
      termo = input.value.trim().toLowerCase();
      if (botaoLimparBusca) botaoLimparBusca.hidden = termo === "";
      aplicarFiltro();
    });
  }

  if (botaoLimparBusca) {
    botaoLimparBusca.addEventListener("click", function () {
      input.value = "";
      termo = "";
      botaoLimparBusca.hidden = true;
      input.focus();
      aplicarFiltro();
    });
  }

  botoesFiltro.forEach(function (botao) {
    botao.addEventListener("click", function () {
      testamento = botao.getAttribute("data-testamento");
      marcarAtivo(botoesFiltro, botao);
      aplicarFiltro();
    });
  });

  botoesStatus.forEach(function (botao) {
    botao.addEventListener("click", function () {
      status = botao.getAttribute("data-status");
      marcarAtivo(botoesStatus, botao);
      aplicarFiltro();
    });
  });

  botoesGenero.forEach(function (botao) {
    botao.addEventListener("click", function () {
      const selecionado = botao.getAttribute("data-genero");
      genero = genero === selecionado ? "todos" : selecionado;
      marcarAtivo(botoesGenero, genero === "todos" ? null : botao);
      aplicarFiltro();
    });
  });

  if (botaoAleatorio) {
    botaoAleatorio.addEventListener("click", function () {
      const visiveis = cards.filter(function (card) {
        return !card.hidden;
      });
      const escolha = visiveis[Math.floor(Math.random() * visiveis.length)];
      if (escolha) window.location.href = escolha.getAttribute("href");
    });
  }

  if (botaoLimpar) botaoLimpar.addEventListener("click", limparTudo);
  if (botaoLimparVazio) botaoLimparVazio.addEventListener("click", limparTudo);

  atualizarProgresso();
  aplicarFiltro();
})();
