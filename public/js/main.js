/* ═══════════════════════════════════════════
   READING ROOM — Client Scripts
   ═══════════════════════════════════════════ */

(function() {
  'use strict';

  // ─── Theme ───
  const STORAGE_KEY = 'reading-room-theme';
  const html = document.documentElement;

  function getTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleLabel(theme);
  }

  function updateToggleLabel(theme) {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'light' ? '☀️ 浅色' : '🌙 深色';
    }
  }

  function toggleTheme() {
    const current = html.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Initialize
  setTheme(getTheme());

  // Bind toggle
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTheme(e.matches ? 'light' : 'dark');
    }
  });

  // ─── Book Modal ───
  const modal = document.getElementById('book-modal');
  if (modal) {
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');

    function openModal(bookId) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/book/' + bookId);
      xhr.onload = function() {
        if (xhr.status === 200) {
          const book = JSON.parse(xhr.responseText);
          renderModal(book);
          overlay.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      };
      xhr.send();
    }

    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    function renderModal(book) {
      const content = modal.querySelector('.modal-content');
      const nb = book.notebook;

      let metaHtml = '';
      if (book.category) metaHtml += `<div>📂 ${book.category}</div>`;
      if (book.finished) metaHtml += `<div>✅ 已读完</div>`;
      if (book.updateTime) {
        const d = new Date(book.updateTime * 1000);
        metaHtml += `<div>📖 最近阅读: ${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}</div>`;
      }
      if (nb) {
        metaHtml += `<div>📝 划线 ${nb.noteCount} · 想法 ${nb.reviewCount} · 书签 ${nb.bookmarkCount}</div>`;
      }

      content.innerHTML = `
        <div class="modal-header">
          <img class="modal-cover" src="${book.cover || '/img/placeholder.svg'}" alt="${book.title}" onerror="this.style.display='none'">
          <div class="modal-info">
            <h3>${book.title}</h3>
            <div class="modal-author">${book.author || '佚名'}</div>
            <div class="modal-meta">${metaHtml}</div>
          </div>
        </div>
      `;
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    // Expose to global
    window.openBookModal = openModal;
    window.closeBookModal = closeModal;
  }

  // ─── Bookshelf filter ───
  const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const filter = this.dataset.filter;
      const url = new URL(window.location);
      url.searchParams.set('filter', filter);
      window.location = url.toString();
    });
  });

})();

  // ─── Reading Progress Bar ───
  const progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

  // ─── Nav Scroll Shadow ───
  var nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // ─── Back to Top ───
  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ─── Scroll Reveal ───
  var revealEls = document.querySelectorAll('.scroll-reveal');
  if (revealEls.length > 0) {
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('revealed'); });
    }
  }

})();
