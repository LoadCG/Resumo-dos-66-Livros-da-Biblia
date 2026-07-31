// Preferências globais de aparência, persistidas somente neste navegador.
// Também expõe dois helpers de localStorage (window.lerArmazenamento /
// window.salvarArmazenamento) reusados por busca.js e livro.js, para não
// repetir o mesmo try/catch em cada arquivo. Este script carrega antes dos
// outros em toda página, então os helpers já existem quando eles rodam.
(function () {
  window.lerArmazenamento = function (chave, padrao) {
    try {
      const bruto = localStorage.getItem(chave);
      if (bruto === null) return padrao;
      try {
        return JSON.parse(bruto);
      } catch (e2) {
        return bruto;
      }
    } catch (e) {
      return padrao;
    }
  };

  window.salvarArmazenamento = function (chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {}
  };

  const raiz = document.documentElement;
  const botoesTema = document.querySelectorAll(".tema-toggle");
  const icones = window.ICONES || {};

  function temaAtual() {
    if (raiz.dataset.tema) return raiz.dataset.tema;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }

  function atualizarTema() {
    const escuro = temaAtual() === "escuro";
    const iconeHtml = escuro ? icones.sun : icones.moon;
    const rotulo = escuro ? "Tema claro" : "Tema escuro";
    botoesTema.forEach(function (botao) {
      botao.innerHTML =
        '<span class="icone" aria-hidden="true">' + iconeHtml + "</span>" + '<span class="rotulo-tema">' + rotulo + "</span>";
      botao.setAttribute("aria-label", escuro ? "Usar tema claro" : "Usar tema escuro");
    });
  }

  botoesTema.forEach(function (botao) {
    botao.addEventListener("click", function () {
      raiz.dataset.tema = temaAtual() === "escuro" ? "claro" : "escuro";
      window.salvarArmazenamento("biblia-tema", raiz.dataset.tema);
      atualizarTema();
    });
  });

  atualizarTema();
})();
