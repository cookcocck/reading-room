/* ═══════════════════════════════════════════
   CLASSICS — 经典篇目阅读交互
   点击字词 → 释义区；典故常驻；翻译可折叠
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  var dataEl = document.getElementById('cls-data');
  if (!dataEl) return;

  var data = JSON.parse(dataEl.textContent);
  var paragraphs = data.paragraphs || [];
  var allusions = data.allusions || [];

  var textEl = document.getElementById('cls-text');
  var meaningBody = document.getElementById('cls-meaning-body');
  var allusionBody = document.getElementById('cls-allusion-body');
  var meaningMod = document.getElementById('cls-mod-meaning');

  var currentTerm = null;
  var currentParaIndex = 0;

  // ─── 工具条 ───
  var FONT_MIN = 14;
  var FONT_MAX = 26;
  var fontBase = 17;

  function setFontSize(v) {
    fontBase = Math.max(FONT_MIN, Math.min(FONT_MAX, v));
    if (textEl) textEl.style.fontSize = fontBase + 'px';
  }

  var fontMinus = document.getElementById('cls-font-minus');
  var fontPlus = document.getElementById('cls-font-plus');
  if (fontMinus) fontMinus.addEventListener('click', function () { setFontSize(fontBase - 1); });
  if (fontPlus) fontPlus.addEventListener('click', function () { setFontSize(fontBase + 1); });

  // 开关类工具按钮
  var toggles = document.querySelectorAll('[data-toggle]');
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-toggle');
      if (key === 'highlight') {
        var off = document.body.classList.toggle('cls-hl-off');
        btn.classList.toggle('is-on', !off);
      } else {
        var bodyClass = key === 'translation' ? 'cls-trans' : 'cls-' + key;
        var on = document.body.classList.toggle(bodyClass);
        btn.classList.toggle('is-on', on);
        if (key === 'vertical') {
          document.body.classList.remove('cls-trans');
          var transBtn = document.querySelector('[data-toggle="translation"]');
          if (transBtn) transBtn.classList.remove('is-on');
        }
      }
    });
  });

  // ─── 移动端：滚动到目标模块 ───
  function scrollToMod(el) {
    if (window.innerWidth > 1080 || !el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── 打开正文内联翻译对照并定位段落 ───
  function showInlineTranslation(focusPara) {
    document.body.classList.add('cls-trans');
    var transBtn = document.querySelector('[data-toggle="translation"]');
    if (transBtn) transBtn.classList.add('is-on');
    var para = textEl.querySelector('.cls-para[data-para="' + focusPara + '"]');
    if (para) {
      para.scrollIntoView({ behavior: 'smooth', block: 'center' });
      para.classList.add('cls-para-flash');
      setTimeout(function () { para.classList.remove('cls-para-flash'); }, 1600);
    }
  }

  // ─── 数据查找 ───
  function findAnnotation(term, paraIndex) {
    var p = paragraphs[paraIndex];
    if (p && p.annotations) {
      var hit = p.annotations.filter(function (a) { return a.term === term; });
      if (hit.length) return { ann: hit[0], paraIndex: paraIndex };
    }
    for (var i = 0; i < paragraphs.length; i++) {
      var anns = paragraphs[i].annotations || [];
      var found = anns.filter(function (a) { return a.term === term; });
      if (found.length) return { ann: found[0], paraIndex: i };
    }
    return null;
  }

  // ─── 渲染：释义区 ───
  function renderMeaning(term, paraIndex) {
    var target = findAnnotation(term, paraIndex);
    if (!target || !meaningBody) return;

    var html = '';
    if (target.ann) {
      html +=
        '<div class="cls-word-card">' +
        '<div class="cls-word-head">' +
        '<span class="cls-word-term">' + escapeHtml(target.ann.term) + '</span>' +
        (target.ann.phonetic ? '<span class="cls-word-phonetic">' + escapeHtml(target.ann.phonetic) + '</span>' : '') +
        '</div>' +
        '<p class="cls-word-def">' + escapeHtml(target.ann.definition) + '</p>' +
        '</div>';
    }

    html += '<div class="cls-word-list"><span class="cls-word-list-title">本篇注释 · 点击查看</span>';
    paragraphs.forEach(function (p, pi) {
      (p.annotations || []).forEach(function (a) {
        var active = (a.term === target.ann.term && pi === target.paraIndex) ? ' is-active' : '';
        html +=
          '<div class="cls-word-item' + active + '" data-term="' + escapeHtml(a.term) + '" data-para="' + pi + '">' +
          '<span class="cls-word-item-term">' + escapeHtml(a.term) + '</span>' +
          '<span class="cls-word-item-def">' + escapeHtml(a.definition) + '</span>' +
          '</div>';
      });
    });
    html += '</div>';

    meaningBody.innerHTML = html;
    scrollToMod(meaningMod);

    meaningBody.querySelectorAll('.cls-word-item').forEach(function (item) {
      item.addEventListener('click', function () {
        markTerm(item.getAttribute('data-term'), parseInt(item.getAttribute('data-para'), 10));
      });
    });
  }

  // ─── 渲染：典故区（常驻） ───
  function renderAllusions() {
    if (!allusionBody) return;
    if (!allusions.length) {
      allusionBody.innerHTML = '<p class="cls-panel-empty">本篇暂无典故。</p>';
      return;
    }
    var html = '';
    allusions.forEach(function (a, i) {
      html +=
        '<div class="cls-allusion-card">' +
        '<div class="cls-allusion-head">' +
        '<span class="cls-allusion-no">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<h4 class="cls-allusion-title">' + escapeHtml(a.title) + '</h4>' +
        '</div>' +
        '<span class="cls-allusion-source">出处 · ' + escapeHtml(a.source) + '</span>' +
        '<p class="cls-allusion-content">' + escapeHtml(a.content) + '</p>' +
        '</div>';
    });
    allusionBody.innerHTML = html;
  }

  // ─── 定位原文段落 ───
  function scrollToPara(index) {
    var para = textEl.querySelector('.cls-para[data-para="' + index + '"]');
    if (para) {
      para.scrollIntoView({ behavior: 'smooth', block: 'center' });
      para.classList.add('cls-para-flash');
      setTimeout(function () { para.classList.remove('cls-para-flash'); }, 1600);
    }
  }

  // ─── 标记当前词 ───
  function markTerm(term, paraIndex) {
    textEl.querySelectorAll('.cls-term.is-active').forEach(function (el) {
      el.classList.remove('is-active');
    });
    var paraEl = textEl.querySelector('.cls-para[data-para="' + paraIndex + '"]');
    if (paraEl) {
      paraEl.querySelectorAll('.cls-term').forEach(function (el) {
        if (el.getAttribute('data-term') === term) el.classList.add('is-active');
      });
    }
    currentTerm = term;
    currentParaIndex = paraIndex;
    renderMeaning(term, paraIndex);
  }

  // ─── 正文事件委托 ───
  textEl.addEventListener('click', function (e) {
    var termEl = e.target.closest ? e.target.closest('.cls-term') : null;
    if (termEl) {
      var paraEl = e.target.closest('.cls-para');
      var pi = paraEl ? parseInt(paraEl.getAttribute('data-para'), 10) : 0;
      markTerm(termEl.getAttribute('data-term'), pi);
      return;
    }
    var hlEl = e.target.closest ? e.target.closest('.cls-hl') : null;
    if (hlEl) {
      var pEl = hlEl.closest('.cls-para');
      var idx = pEl ? parseInt(pEl.getAttribute('data-para'), 10) : 0;
      showInlineTranslation(idx);
    }
  });

  // ─── 工具函数 ───
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── 初始化：常驻渲染典故 ───
  renderAllusions();

  // 段落闪动样式
  var style = document.createElement('style');
  style.textContent = '.cls-para-flash { animation: clsFlash 1.6s ease; } @keyframes clsFlash { 0% { background: rgba(26,39,68,0.10); } 100% { background: transparent; } }';
  document.head.appendChild(style);
})();
