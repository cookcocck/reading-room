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

  // ─── Book Modal ───
  var modal = document.getElementById('book-modal');
  if (modal) {
    var overlay = modal.querySelector('.modal-overlay');
    var content = modal.querySelector('.modal-content');

    function openModal(bookId) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/book/' + bookId);
      xhr.onload = function() {
        if (xhr.status === 200) {
          renderModal(JSON.parse(xhr.responseText));
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
      var nb = book.notebook;
      var metaHtml = '';
      if (book.category) metaHtml += '<span>' + book.category + '</span>';
      if (book.finished) metaHtml += '<span>已读完</span>';
      if (nb) {
        metaHtml += '<span><strong>' + nb.noteCount + '</strong> 划线</span>';
        metaHtml += '<span><strong>' + nb.reviewCount + '</strong> 想法</span>';
        metaHtml += '<span><strong>' + nb.bookmarkCount + '</strong> 书签</span>';
      }

      content.innerHTML =
        '<button class="modal-close" onclick="closeBookModal()">&times;</button>' +
        '<div class="modal-cover">' +
          (book.cover ? '<img src="' + book.cover + '" alt="" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'&#128218;\'">' : '&#128218;') +
        '</div>' +
        '<div class="modal-title">' + (book.title || '') + '</div>' +
        '<div class="modal-author">' + (book.author || '佚名') + '</div>' +
        (metaHtml ? '<div class="modal-meta">' + metaHtml + '</div>' : '') +
        '<div class="modal-highlights"><div class="modal-hl-placeholder">载入划线...</div></div>' +
        '<div class="modal-reviews"><div class="modal-hl-placeholder">载入想法...</div></div>';

      // Re-bind close
      var closeBtn = content.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', closeModal);

      // Fetch highlights asynchronously
      var xhrHL = new XMLHttpRequest();
      xhrHL.open('GET', '/api/book/' + book.id + '/highlights');
      xhrHL.onload = function() {
        if (xhrHL.status === 200) {
          var data = JSON.parse(xhrHL.responseText);
          var hlContainer = content.querySelector('.modal-highlights');
          if (hlContainer && data.highlights && data.highlights.length > 0) {
            hlContainer.innerHTML = renderHighlightsHTML(data.highlights);
          } else if (hlContainer) {
            hlContainer.innerHTML = '<div class="modal-hl-empty">本书暂无划线摘录</div>';
          }
        }
      };
      xhrHL.send();

      // Fetch reviews asynchronously
      var xhrRV = new XMLHttpRequest();
      xhrRV.open('GET', '/api/book/' + book.id + '/reviews');
      xhrRV.onload = function() {
        if (xhrRV.status === 200) {
          var data = JSON.parse(xhrRV.responseText);
          var rvContainer = content.querySelector('.modal-reviews');
          if (rvContainer && data.reviews && data.reviews.length > 0) {
            rvContainer.innerHTML = renderReviewsHTML(data.reviews);
          } else if (rvContainer) {
            rvContainer.innerHTML = '<div class="modal-hl-empty">本书暂无想法</div>';
          }
        }
      };
      xhrRV.send();
    }

    function renderHighlightsHTML(highlights) {
      var html = '<hr class="modal-hl-rule"><div class="modal-hl-kicker">划线摘录</div>';
      for (var i = 0; i < highlights.length; i++) {
        var h = highlights[i];
        html += '<blockquote class="modal-highlight">';
        html += '<p class="modal-hl-text">' + escapeHTML(h.text) + '</p>';
        if (h.chapter) {
          html += '<cite class="modal-hl-chapter">— ' + escapeHTML(h.chapter) + '</cite>';
        }
        html += '</blockquote>';
      }
      return html;
    }

    function renderReviewsHTML(reviews) {
      var html = '<hr class="modal-hl-rule"><div class="modal-hl-kicker modal-rv-kicker">我的想法</div>';
      for (var i = 0; i < reviews.length; i++) {
        var r = reviews[i];
        html += '<div class="modal-review">';
        html += '<p class="modal-rv-text">' + escapeHTML(r.content) + '</p>';
        if (r.chapter) {
          html += '<cite class="modal-hl-chapter">— ' + escapeHTML(r.chapter) + '</cite>';
        }
        html += '</div>';
      }
      return html;
    }

    function escapeHTML(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    window.openBookModal = openModal;
    window.closeBookModal = closeModal;
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
      loader.classList.add('fade-out');
      setTimeout(function() { loader.style.display = 'none'; }, 400);
    }
    if (wrapper) {
      wrapper.style.opacity = '1';
      wrapper.style.transition = 'opacity 0.3s ease-in';
    }
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', hideLoader);
  } else {
    hideLoader();
  }

})();
