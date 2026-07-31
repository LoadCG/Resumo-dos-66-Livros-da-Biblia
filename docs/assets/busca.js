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
  let livrosLidos = [];

  try {
    livrosLidos = JSON.parse(localStorage.getItem("biblia-livros-lidos") || "[]");
  } catch (e) {}

  cards.forEach(function (card) {
    card.classList.toggle("is-lido", livrosLidos.includes(card.getAttribute("data-slug")));
  });

  const proximoNaoLidoCard = cards.find(function (card) {
    return !card.classList.contains("is-lido");
  });
  if (proximoNaoLidoCard) proximoNaoLidoCard.classList.add("proximo-sugerido");

  if (confirmacao && confirmacaoTexto) {
    let ultimoTotalVisto = 0;
    try {
      ultimoTotalVisto = Number(localStorage.getItem("biblia-total-visto")) || 0;
    } catch (e) {}
    const totalAtual = livrosLidos.length;
    if (totalAtual > ultimoTotalVisto && totalAtual > 0) {
      confirmacaoTexto.textContent = "🎉 Você concluiu mais um livro! " + totalAtual + " de 66 lidos até agora.";
      confirmacao.hidden = false;
    }
    try {
      localStorage.setItem("biblia-total-visto", String(totalAtual));
    } catch (e) {}
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
      let ultimoSlug = "";
      try {
        ultimoSlug = localStorage.getItem("biblia-ultimo-livro") || "";
      } catch (e) {}
      const ultimoCard = cards.find(function (card) {
        return card.getAttribute("data-slug") === ultimoSlug;
      });
      const proximoNaoLido = cards.find(function (card) {
        return !card.classList.contains("is-lido");
      });
      const destino = ultimoCard || proximoNaoLido;
      if (destino) {
        continuarLeitura.href = destino.getAttribute("href");
        continuarLeitura.textContent = ultimoCard ? "Continuar em " + ultimoCard.querySelector(".card-nome").textContent + " →" : "Começar por " + destino.querySelector(".card-nome").textContent + " →";
      } else {
        continuarLeitura.textContent = "Leitura concluída! ✓";
        continuarLeitura.removeAttribute("href");
      }
    }
  }

  function aplicarFiltro() {
    let algumVisivel = false;

    cards.forEach(function (card) {
      const nome = card.getAttribute("data-nome") || "";
      const testamentoCard = card.getAttribute("data-testamento") || "";
      const generoCard = card.getAttribute("data-genero") || "";
      const lido = card.classList.contains("is-lido");
      const bateTermo = nome.includes(termo);
      const bateTestamento = testamento === "todos" || testamentoCard === testamento;
      const bateGenero = genero === "todos" || generoCard === genero;
      const bateStatus = status === "todos" || (status === "lidos" && lido) || (status === "nao-lidos" && !lido);
      const visivel = bateTermo && bateTestamento && bateGenero && bateStatus;
      card.hidden = !visivel;
      if (visivel) algumVisivel = true;
    });

    grupos.forEach(function (grupo) {
      const visiveis = grupo.querySelectorAll(".card:not([hidden])").length;
      grupo.hidden = visiveis === 0;
    });

    if (vazio) vazio.hidden = algumVisivel;
  }

  function marcarAtivo(botoes, ativo) {
    botoes.forEach(function (botao) {
      botao.classList.toggle("is-ativo", botao === ativo);
      botao.setAttribute("aria-pressed", String(botao === ativo));
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
    botoesGenero.forEach(function (item) {
      item.classList.remove("is-ativo");
      item.setAttribute("aria-pressed", "false");
    });
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
      botoesGenero.forEach(function (item) {
        const ativo = item.getAttribute("data-genero") === genero;
        item.classList.toggle("is-ativo", ativo);
        item.setAttribute("aria-pressed", String(ativo));
      });
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
