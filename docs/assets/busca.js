// Filtro simples dos cards de livro na home. Progressive enhancement:
// sem JS, a lista completa continua visível e navegável normalmente.
(function () {
  const input = document.getElementById("busca");
  if (!input) return;

  const cards = Array.from(document.querySelectorAll(".card"));
  const grupos = Array.from(document.querySelectorAll(".grupo"));
  const vazio = document.getElementById("busca-vazia");

  input.addEventListener("input", function () {
    const termo = input.value.trim().toLowerCase();
    let algumVisivel = false;

    cards.forEach(function (card) {
      const nome = card.getAttribute("data-nome") || "";
      const bate = nome.includes(termo);
      card.hidden = !bate;
      if (bate) algumVisivel = true;
    });

    grupos.forEach(function (grupo) {
      const visiveis = grupo.querySelectorAll(".card:not([hidden])").length;
      grupo.hidden = termo.length > 0 && visiveis === 0;
    });

    if (vazio) vazio.hidden = algumVisivel || termo.length === 0;
  });
})();
