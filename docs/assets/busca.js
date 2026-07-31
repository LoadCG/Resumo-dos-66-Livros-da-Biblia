// Busca por texto + filtro por testamento + botão "livro aleatório" na home.
// Progressive enhancement: sem JS, a lista completa continua visível e
// navegável normalmente.
(function () {
  const input = document.getElementById("busca");
  const cards = Array.from(document.querySelectorAll(".card"));
  const grupos = Array.from(document.querySelectorAll(".grupo"));
  const vazio = document.getElementById("busca-vazia");
  const botoesFiltro = Array.from(document.querySelectorAll(".filtro-botao"));
  const botaoAleatorio = document.getElementById("aleatorio");

  let termo = "";
  let testamento = "todos";

  function aplicarFiltro() {
    let algumVisivel = false;

    cards.forEach(function (card) {
      const nome = card.getAttribute("data-nome") || "";
      const testamentoCard = card.getAttribute("data-testamento") || "";
      const bateTermo = nome.includes(termo);
      const bateTestamento = testamento === "todos" || testamentoCard === testamento;
      const visivel = bateTermo && bateTestamento;
      card.hidden = !visivel;
      if (visivel) algumVisivel = true;
    });

    grupos.forEach(function (grupo) {
      const visiveis = grupo.querySelectorAll(".card:not([hidden])").length;
      grupo.hidden = visiveis === 0;
    });

    if (vazio) vazio.hidden = algumVisivel;
  }

  if (input) {
    input.addEventListener("input", function () {
      termo = input.value.trim().toLowerCase();
      aplicarFiltro();
    });
  }

  botoesFiltro.forEach(function (botao) {
    botao.addEventListener("click", function () {
      testamento = botao.getAttribute("data-testamento");
      botoesFiltro.forEach(function (b) {
        b.classList.toggle("is-ativo", b === botao);
      });
      aplicarFiltro();
    });
  });

  if (botaoAleatorio) {
    botaoAleatorio.addEventListener("click", function () {
      const escolha = cards[Math.floor(Math.random() * cards.length)];
      if (escolha) window.location.href = escolha.getAttribute("href");
    });
  }
})();
