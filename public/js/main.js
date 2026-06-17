/* ═══════════════════════════════════════════
   READING ROOM — Client Scripts
   Editorial edition. Minimal. Confident.
   ═══════════════════════════════════════════ */

(function() {
  'use strict';

  // ─── Theme ───
  var STORAGE_KEY = 'reading-room-theme';
  var html = document.documentElement;

  function getTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return 'light'; // editorial defaults to light
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggleTheme() {
    var current = html.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  setTheme(getTheme());

  var toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  // ─── Reading Progress Bar ───
  var progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', function() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) + '%' : '0%';
    }, { passive: true });
  }

  // ─── Nav Scroll ───
  var nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // ─── Back to Top ───
  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function() {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ─── Page Loader ───
  var loader = document.getElementById('page-loader');
  var wrapper = document.getElementById('site-wrapper');
  function hideLoader() {
    if (loader) {
      loader.style.display = 'none';
    }
    if (wrapper) {
      wrapper.style.opacity = '1';
    }
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', hideLoader);
  } else {
    hideLoader();
  }

  // ─── Prefetch nav links on hover → instant page transitions ───
  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('mouseenter', function() {
      var prefetch = document.createElement('link');
      prefetch.rel = 'prefetch';
      prefetch.href = link.href;
      document.head.appendChild(prefetch);
    }, { once: true });
  });

  // ─── Shuffle highlights / reviews on book detail page ───
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  document.querySelectorAll('.bd-shuffle-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var section = btn.dataset.section;
      var bookId = btn.dataset.book;
      var container = document.getElementById('book-' + section);
      if (!container) return;

      // Spin animation
      var svg = btn.querySelector('svg');
      if (svg) svg.style.animation = 'none';
      btn.offsetHeight; // force reflow
      if (svg) svg.style.animation = 'bd-shuffle-spin 0.6s ease';

      // Build HTML matching current card design
      function buildHighlight(h, idx) {
        var num = String(idx + 1).padStart(2, '0');
        var html = (
          '<article class="bd-hl-card">' +
          '<span class="bd-hl-num" aria-hidden="true">' + num + '</span>' +
          '<blockquote class="bd-hl-body">' +
          '<p class="bd-hl-text">' + escapeHTML(h.text) + '</p>' +
          '</blockquote>'
        );
        if (h.chapter) {
          html += (
            '<footer class="bd-hl-foot">' +
            '<span class="bd-hl-chap">' +
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' +
            escapeHTML(h.chapter) +
            '</span>' +
            '<button class="bd-share-btn highlight-share-btn" data-text="' + escapeAttr(h.text) + '" data-chapter="' + (h.chapter ? escapeAttr(h.chapter) : '') + '" title="生成分享图" aria-label="生成分享图">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
            '</button>' +
            '</footer>'
          );
        }
        html += '</article>';
        return html;
      }

      function buildReview(r, idx) {
        var num = String(idx + 1).padStart(2, '0');
        var html = (
          '<article class="bd-rv-card">' +
          '<span class="bd-rv-num" aria-hidden="true">' + num + '</span>'
        );
        if (r.abstract) {
          html += (
            '<aside class="bd-rv-quote-wrap">' +
            '<span class="bd-rv-qmark" aria-hidden="true">\u201C</span>' +
            '<p class="bd-rv-quote">' + escapeHTML(r.abstract) + '</p>' +
            '</aside>'
          );
        }
        html += (
          '<div class="bd-rv-body">' +
          '<p class="bd-rv-text">' + escapeHTML(r.content) + '</p>' +
          '</div>' +
          '<footer class="bd-rv-foot">' +
          '<span class="bd-rv-meta">'
        );
        if (r.star > 0) {
          html += '<span class="bd-rv-stars" title="' + r.star + ' 星">';
          for (var s = 0; s < r.star; s++) html += '\u2605';
          html += '</span>';
        }
        if (r.chapter) {
          html += '<span class="bd-rv-chap">' + escapeHTML(r.chapter) + '</span>';
        }
        html += (
          '</span>' +
          '<button class="bd-share-btn review-share-btn" data-quote="' + (r.abstract ? escapeAttr(r.abstract) : '') + '" data-review="' + escapeAttr(r.content) + '" data-chapter="' + (r.chapter ? escapeAttr(r.chapter) : '') + '" title="生成分享图" aria-label="生成分享图">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
          '</button>' +
          '</footer>' +
          '</article>'
        );
        return html;
      }

      fetch('/api/book/' + bookId + '/' + section + '?n=12')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          var items = section === 'highlights' ? (data.highlights || []) : (data.reviews || []);
          if (!items.length) { container.innerHTML = ''; return; }

          var builder = section === 'highlights' ? buildHighlight : buildReview;
          container.innerHTML = items.map(builder).join('');
        })
        .catch(function() { /* silent — retry on next click */ });
    });
  });

})();

// ─── Toggle Want-To-Read ───
function toggleWish(btn, bookId) {
  var isActive = btn.classList.contains('active');
  var svg = btn.querySelector('svg');
  var fillColor = isActive ? 'none' : 'var(--accent-bright)';
  var strokeColor = isActive ? 'var(--ink-muted)' : 'var(--accent-bright)';
  var want = !isActive;

  fetch('/api/want-to-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId: bookId, want: want })
  }).then(function(r) { return r.json(); })
    .then(function() {
      btn.classList.toggle('active', want);
      btn.title = want ? '取消想读' : '标记为想读';
      svg.setAttribute('fill', fillColor);
      svg.setAttribute('stroke', strokeColor);
    });
}

// ─── Star Rating ───
function rateBook(bookId, rating) {
  var stars = document.querySelectorAll('.star-rating-btn');
  stars.forEach(function(s, i) {
    s.classList.toggle('active', i < rating);
  });
  fetch('/api/rating', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId: bookId, rating: rating })
  });
}
