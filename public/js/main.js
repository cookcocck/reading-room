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

  // ─── Fetch book intro from WeRead API (if not cached server-side) ───
  var placeholder = document.getElementById('intro-placeholder');
  if (placeholder) {
    var bookId = window.location.pathname.split('/').pop();
    fetch('/api/book/' + bookId + '/intro')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.intro) {
          placeholder.className = '';
          placeholder.textContent = data.intro;
        } else {
          placeholder.textContent = '暂无简介';
        }
      })
      .catch(function() {
        placeholder.textContent = '暂无简介';
      });
  }

  // ─── Shuffle highlights / reviews on book detail page ───
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  document.querySelectorAll('.shuffle-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var section = btn.dataset.section;
      var bookId = btn.dataset.book;
      var container = document.getElementById('book-' + section);
      if (!container) return;

      // Spin animation
      btn.classList.add('spinning');
      btn.addEventListener('animationend', function() { btn.classList.remove('spinning'); }, { once: true });

      // Build HTML for a single item
      function buildHighlight(h) {
        var html = '<blockquote class="detail-highlight"><p>' + escapeHTML(h.text) + '</p>';
        if (h.chapter) html += '<cite>\u2014 ' + escapeHTML(h.chapter) + '</cite>';
        html += '</blockquote>';
        return html;
      }

      function buildReview(r) {
        var html = '<div class="detail-review"><p>' + escapeHTML(r.content) + '</p>';
        if (r.chapter) html += '<cite>\u2014 ' + escapeHTML(r.chapter) + '</cite>';
        html += '</div>';
        return html;
      }

      fetch('/api/book/' + bookId + '/' + section + '?n=12')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          var items = section === 'highlights' ? (data.highlights || []) : (data.reviews || []);
          if (!items.length) { container.innerHTML = ''; return; }

          var builder = section === 'highlights' ? buildHighlight : buildReview;
          container.innerHTML = items.map(builder).join('');

          // Trigger fade-in
          container.classList.add('inserting');
          container.addEventListener('animationend', function() { container.classList.remove('inserting'); }, { once: true });
        })
        .catch(function() { /* silent — retry on next click */ });
    });
  });

})();
