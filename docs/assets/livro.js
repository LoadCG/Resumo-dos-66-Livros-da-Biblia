// Botão "copiar link" nas páginas de livro.
(function () {
  const botao = document.querySelector(".copiar-link");
  if (!botao) return;

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
})();
