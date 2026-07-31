// Versículo do dia na home. Reusa window.BibliaAPI (busca+cache), definido
// em referencias.js, em vez de duplicar a lógica de rede — o mesmo padrão
// já usado pelo popover de referências nas páginas de livro.
(function () {
  const el = document.getElementById("versiculo-dia");
  if (!el || !window.BibliaAPI) return;

  // Lista curada (não é a lista de referências detectadas nos resumos):
  // versículos conhecidos e centrais para a fé cristã, apropriados para o
  // público jovem do projeto. O mesmo versículo aparece o dia inteiro para
  // todo mundo, e muda à meia-noite (calculado a partir da data local do
  // visitante, sem depender de servidor).
  const REFERENCIAS = [
    "João 3:16", "Salmos 23:1", "Provérbios 3:5-6", "Filipenses 4:13",
    "Romanos 8:28", "Isaías 41:10", "Josué 1:9", "Salmos 91:1-2",
    "Mateus 11:28", "Gálatas 2:20", "Efésios 2:8-9", "1 Coríntios 13:4-7",
    "Salmos 46:1", "Jeremias 29:11", "Hebreus 11:1", "Tiago 1:5",
    "1 Pedro 5:7", "2 Timóteo 1:7", "Salmos 121:1-2", "Mateus 6:33",
    "Romanos 12:2", "Filipenses 4:6-7", "Provérbios 16:3", "Salmos 27:1",
    "Isaías 40:31", "João 14:6", "Atos 1:8", "Colossenses 3:23",
    "1 João 4:19", "Salmos 34:8", "Mateus 28:19-20", "Romanos 10:9",
    "Efésios 6:10-11", "Salmos 37:4", "Provérbios 18:10", "João 8:32",
    "Filipenses 4:19", "Salmos 139:14", "2 Coríntios 5:17", "Gálatas 5:22-23",
  ];

  const hoje = new Date();
  const inicioDoAno = new Date(hoje.getFullYear(), 0, 0);
  const diaDoAno = Math.floor((hoje - inicioDoAno) / 86400000);
  const referencia = REFERENCIAS[diaDoAno % REFERENCIAS.length];

  const textoEl = document.getElementById("versiculo-dia-texto");
  const refEl = document.getElementById("versiculo-dia-ref");

  window.BibliaAPI.buscar(referencia)
    .then(function (resultado) {
      textoEl.textContent = resultado.texto;
      refEl.textContent = resultado.referencia;
      el.hidden = false;
    })
    .catch(function () {
      // API fora do ar: widget simplesmente não aparece, sem quebrar a home.
    });
})();
