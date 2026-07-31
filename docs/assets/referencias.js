// Busca e exibe o texto de referências bíblicas citadas nos resumos,
// usando a API pública bible-api.com (sem chave, CORS liberado, tradução
// Almeida em português). A lógica de busca+cache (window.BibliaAPI) fica
// separada da lógica de exibição do popover de propósito, para poder ser
// reaproveitada por outras funcionalidades futuras (ex.: um "versículo do
// dia" na home) sem duplicar a parte de rede/cache.
(function () {
  const BASE_URL = "https://bible-api.com/";
  const CHAVE_CACHE = "biblia-cache-versiculos";
  const MAX_CACHE = 200;

  async function buscar(ref) {
    const chave = ref.trim();
    const cache = window.lerArmazenamento(CHAVE_CACHE, {});
    if (cache[chave]) return cache[chave];

    const url = BASE_URL + encodeURIComponent(chave) + "?translation=almeida";
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("Falha ao buscar " + chave);
    const dados = await resposta.json();
    if (dados.error) throw new Error(dados.error);

    const resultado = {
      referencia: dados.reference,
      texto: dados.text.trim().replace(/\s+/g, " "),
    };

    cache[chave] = resultado;
    const chaves = Object.keys(cache);
    if (chaves.length > MAX_CACHE) delete cache[chaves[0]];
    window.salvarArmazenamento(CHAVE_CACHE, cache);

    return resultado;
  }

  function apenasCapitulo(ref) {
    return ref.replace(/:.*/, "");
  }

  window.BibliaAPI = { buscar: buscar, apenasCapitulo: apenasCapitulo };
})();

(function () {
  const icones = window.ICONES || {};
  let popover = null;
  let botaoAtual = null;
  let refAtual = "";

  function criarPopover() {
    const el = document.createElement("div");
    el.className = "popover-versiculo";
    el.hidden = true;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-live", "polite");
    el.innerHTML =
      '<div class="popover-versiculo-topo">' +
      '<strong class="popover-versiculo-ref"></strong>' +
      '<button type="button" class="popover-versiculo-fechar" aria-label="Fechar">' +
      '<span class="icone" aria-hidden="true">' + (icones.close || "") + "</span>" +
      "</button>" +
      "</div>" +
      '<div class="popover-versiculo-corpo"></div>' +
      '<button type="button" class="popover-versiculo-capitulo">Ver capítulo inteiro</button>';
    document.body.appendChild(el);

    el.querySelector(".popover-versiculo-fechar").addEventListener("click", fechar);
    el.querySelector(".popover-versiculo-capitulo").addEventListener("click", function () {
      carregar(window.BibliaAPI.apenasCapitulo(refAtual), true);
    });

    return el;
  }

  function posicionar(botao) {
    const rectBotao = botao.getBoundingClientRect();
    const largura = Math.min(340, window.innerWidth - 24);
    popover.style.width = largura + "px";
    popover.style.visibility = "hidden";
    popover.hidden = false;

    const alturaPopover = popover.offsetHeight;
    const espacoAbaixo = window.innerHeight - rectBotao.bottom;
    const abrirAcima = espacoAbaixo < alturaPopover + 16 && rectBotao.top > alturaPopover + 16;

    let esquerda = rectBotao.left;
    esquerda = Math.max(12, Math.min(esquerda, window.innerWidth - largura - 12));

    const topo = abrirAcima ? rectBotao.top - alturaPopover - 8 : rectBotao.bottom + 8;

    popover.style.left = esquerda + "px";
    popover.style.top = Math.max(12, topo) + "px";
    popover.style.visibility = "visible";
  }

  async function carregar(ref, substituirRotulo) {
    const corpo = popover.querySelector(".popover-versiculo-corpo");
    const rotulo = popover.querySelector(".popover-versiculo-ref");
    corpo.innerHTML = '<p class="popover-versiculo-estado">Carregando...</p>';
    if (substituirRotulo) rotulo.textContent = ref;

    try {
      const resultado = await window.BibliaAPI.buscar(ref);
      rotulo.textContent = resultado.referencia;
      corpo.innerHTML = "<p>" + resultado.texto + "</p>";
    } catch (erro) {
      corpo.innerHTML =
        '<p class="popover-versiculo-estado">Não foi possível carregar esse versículo agora. Tente de novo em instantes.</p>';
    }
  }

  function abrir(botao) {
    if (!popover) popover = criarPopover();
    botaoAtual = botao;
    refAtual = botao.getAttribute("data-ref");
    popover.querySelector(".popover-versiculo-ref").textContent = refAtual;
    posicionar(botao);
    carregar(refAtual, false);
    popover.querySelector(".popover-versiculo-fechar").focus();
  }

  function fechar() {
    if (!popover) return;
    popover.hidden = true;
    if (botaoAtual) botaoAtual.focus();
    botaoAtual = null;
  }

  document.addEventListener("click", function (evento) {
    const botaoRef = evento.target.closest(".ref-biblica");
    if (botaoRef) {
      abrir(botaoRef);
      return;
    }
    if (popover && !popover.hidden && !popover.contains(evento.target)) {
      fechar();
    }
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && popover && !popover.hidden) fechar();
  });

  window.addEventListener(
    "scroll",
    function () {
      if (popover && !popover.hidden && botaoAtual) posicionar(botaoAtual);
    },
    { passive: true }
  );
})();
