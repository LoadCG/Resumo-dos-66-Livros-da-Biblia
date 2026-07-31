// Preferências globais de aparência, persistidas somente neste navegador.
(function () {
  const raiz = document.documentElement;
  const botoesTema = document.querySelectorAll(".tema-toggle");

  function temaAtual() {
    if (raiz.dataset.tema) return raiz.dataset.tema;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }

  function atualizarTema() {
    const escuro = temaAtual() === "escuro";
    botoesTema.forEach(function (botao) {
      botao.textContent = escuro ? "☀ Tema claro" : "☾ Tema escuro";
      botao.setAttribute("aria-label", escuro ? "Usar tema claro" : "Usar tema escuro");
    });
  }

  botoesTema.forEach(function (botao) {
    botao.addEventListener("click", function () {
      raiz.dataset.tema = temaAtual() === "escuro" ? "claro" : "escuro";
      try {
        localStorage.setItem("biblia-tema", raiz.dataset.tema);
      } catch (e) {}
      atualizarTema();
    });
  });

  atualizarTema();
})();
