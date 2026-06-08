/* ═══════════════════════════════════════════
   READING ROOM — Heatmap Interactions
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Heatmap Tooltips ───
  var cells = document.querySelectorAll('.heatmap-cell[data-date]');
  cells.forEach(function (cell) {
    cell.addEventListener('mouseenter', function () {
      var tip = cell.querySelector('.heatmap-tooltip');
      if (tip) tip.style.display = 'block';
    });
    cell.addEventListener('mouseleave', function () {
      var tip = cell.querySelector('.heatmap-tooltip');
      if (tip) tip.style.display = 'none';
    });
  });

})();
