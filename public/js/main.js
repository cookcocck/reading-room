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

  // ─── Homepage highlights shuffle ───
  document.querySelectorAll('.hm-shuffle-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var container = document.getElementById('home-highlights');
      if (!container) return;
      var n = parseInt(btn.dataset.n) || 8;

      // Spin animation
      var svg = btn.querySelector('svg');
      if (svg) svg.style.animation = 'none';
      btn.offsetHeight;
      if (svg) svg.style.animation = 'bd-shuffle-spin 0.6s ease';

      fetch('/api/home/highlights?n=' + n)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (!data.highlights || !data.highlights.length) return;
          container.innerHTML = data.highlights.map(function(h) {
            var text = h.markText || h.content || '';
            var bookTitle = h.bookTitle || h.book_title || '未知书名';
            var bookAuthor = h.bookAuthor || h.book_author || '';
            var chapter = h.chapter_title || '';
            return (
              '<div class="highlight-block">' +
              '<div class="highlight-text">' + escapeHTML(text) + '</div>' +
              '<div class="highlight-source">' +
              escapeHTML(bookTitle) +
              '<button class="bd-share-btn highlight-share-btn" ' +
              'data-text="' + escapeAttr(text) + '" ' +
              'data-chapter="' + escapeAttr(chapter) + '" ' +
              'data-book-title="' + escapeAttr(bookTitle) + '" ' +
              'data-book-author="' + escapeAttr(bookAuthor) + '" ' +
              'title="生成分享图" aria-label="生成分享图" ' +
              'style="display:inline-flex;vertical-align:middle;margin-left:6px;">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
              '</button>' +
              '</div>' +
              '</div>'
            );
          }).join('');
        })
        .catch(function() { /* silent */ });
    });
  });

})();

// ═════════════════════════════════════════════════
// Shared Share Card Engine
// Used by book detail and notebooks pages.
// ═════════════════════════════════════════════════
(function() {
  "use strict";

  function themeColor(light, dark) {
    return document.documentElement.getAttribute("data-theme") === "dark" ? dark : light;
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#39;");
  }

  function waitForHtml2Canvas() {
    return new Promise(function(resolve, reject) {
      if (window.html2canvas) return resolve();
      var tries = 0;
      var timer = setInterval(function() {
        tries++;
        if (window.html2canvas) { clearInterval(timer); resolve(); }
        else if (tries > 30) { clearInterval(timer); reject(new Error("html2canvas timeout")); }
      }, 200);
    });
  }

  function buildHighlightCard(text, chapter, bookTitle, bookAuthor) {
    var LS = "\u300A";
    var RS = "\u300B";
    var DOT = "\u00B7";

    return (
      '<div id="share-card-inner" style="' +
      "width:1400px;height:900px;" +
      "background:#6b4423;" +
      "display:flex;align-items:center;justify-content:center;" +
      "padding:40px;box-sizing:border-box;position:relative;" +
      "font-family:'Courier New',monospace;overflow:hidden;" +
      '">' +
      '<div style="' +
      "width:100%;height:100%;background:#fff8e8;" +
      "border:6px solid #3d2817;" +
      "box-shadow:inset -6px -6px 0 #d4b896,inset 6px 6px 0 #fff;" +
      "display:flex;flex-direction:column;justify-content:center;align-items:center;" +
      "padding:80px 100px;box-sizing:border-box;position:relative;" +
      '">' +
      '<div style="' +
      "position:absolute;top:30px;left:60px;right:60px;height:4px;" +
      "background:repeating-linear-gradient(90deg,#c4a574 0px,#c4a574 12px,transparent 12px,transparent 24px);" +
      '"></div>' +
      '<div style="' +
      "position:absolute;bottom:30px;left:60px;right:60px;height:4px;" +
      "background:repeating-linear-gradient(90deg,#c4a574 0px,#c4a574 12px,transparent 12px,transparent 24px);" +
      '"></div>' +
      '<div style="position:absolute;top:50px;left:50px;font-size:32px;color:#f0c040;">\u2726</div>' +
      '<div style="position:absolute;top:50px;right:50px;font-size:32px;color:#f0c040;">\u2726</div>' +
      '<div style="position:absolute;bottom:50px;left:50px;font-size:32px;color:#5a9c3e;">\u273F</div>' +
      '<div style="position:absolute;bottom:50px;right:50px;font-size:32px;color:#5a9c3e;">\u273F</div>' +
      '<div style="' +
      "position:absolute;top:60px;left:80px;" +
      "font-size:120px;line-height:1;color:#c4a574;opacity:0.3;" +
      "font-family:Georgia,serif;user-select:none;" +
      '">\u201C</div>' +
      '<div style="max-width:1050px;text-align:center;position:relative;z-index:1;">' +
      '<div style="' +
      "display:inline-block;padding:8px 24px;margin-bottom:36px;" +
      "background:#5a9c3e;border:4px solid #3d7a28;" +
      "box-shadow:inset -3px -3px 0 #3d7a28,inset 3px 3px 0 #7bc04e;" +
      "color:#fff;font-size:18px;font-weight:bold;letter-spacing:4px;" +
      '">\u7ECF\u5178\u5212\u7EBF</div>' +
      "<p style=\"" +
      "font-family:'Courier New',monospace;font-size:34px;line-height:1.8;color:#3d2817;" +
      "margin:0 0 36px 0;letter-spacing:0.02em;font-weight:bold;" +
      "\">" + esc(text) + "</p>" +
      (chapter ? "<p style=\"" +
      "font-size:20px;color:#8a7050;margin:0 0 28px 0;letter-spacing:0.08em;" +
      "\">\u2014 " + esc(chapter) + "</p>" : "") +
      '<div style="' +
      "width:120px;height:4px;margin:0 auto 28px auto;" +
      "background:repeating-linear-gradient(90deg,#f0c040 0px,#f0c040 8px,transparent 8px,transparent 16px);" +
      '"></div>' +
      "<p style=\"" +
      "font-size:22px;color:#6b4423;margin:0;font-weight:bold;letter-spacing:0.04em;" +
      "\">" + LS + esc(bookTitle) + RS +
      (bookAuthor ? " " + DOT + " " + esc(bookAuthor) : "") +
      "</p>" +
      '<div style="margin-top:40px;font-size:16px;color:#c4a574;letter-spacing:2px;">\u9605\u8BFB\u4E66\u623F \u00B7 hxb-reading.top</div>' +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function buildReviewCard(quote, review, chapter, bookTitle, bookAuthor) {
    var LS = "\u300A";
    var RS = "\u300B";
    var DOT = "\u00B7";

    var html = (
      '<div id="share-card-inner" style="' +
      "width:1400px;height:900px;" +
      "background:#6b4423;" +
      "display:flex;align-items:center;justify-content:center;" +
      "padding:40px;box-sizing:border-box;position:relative;" +
      "font-family:'Courier New',monospace;overflow:hidden;" +
      '">' +
      '<div style="' +
      "width:100%;height:100%;background:#fff8e8;" +
      "border:6px solid #3d2817;" +
      "box-shadow:inset -6px -6px 0 #d4b896,inset 6px 6px 0 #fff;" +
      "display:flex;flex-direction:column;justify-content:center;align-items:center;" +
      "padding:70px 90px;box-sizing:border-box;position:relative;" +
      '">' +
      '<div style="' +
      "position:absolute;top:30px;left:60px;right:60px;height:4px;" +
      "background:repeating-linear-gradient(90deg,#c4a574 0px,#c4a574 12px,transparent 12px,transparent 24px);" +
      '"></div>' +
      '<div style="' +
      "position:absolute;bottom:30px;left:60px;right:60px;height:4px;" +
      "background:repeating-linear-gradient(90deg,#c4a574 0px,#c4a574 12px,transparent 12px,transparent 24px);" +
      '"></div>' +
      '<div style="position:absolute;top:50px;left:50px;font-size:32px;color:#f0c040;">\u2726</div>' +
      '<div style="position:absolute;top:50px;right:50px;font-size:32px;color:#f0c040;">\u2726</div>' +
      '<div style="position:absolute;bottom:50px;left:50px;font-size:32px;color:#d4502a;">\u273F</div>' +
      '<div style="position:absolute;bottom:50px;right:50px;font-size:32px;color:#d4502a;">\u273F</div>'
    );

    if (quote) {
      html += (
        '<div style="' +
        "position:relative;max-width:1000px;margin-bottom:32px;padding:16px 24px 16px 32px;" +
        "background:#f5e6c8;border-left:6px solid #f0c040;" +
        "border:3px solid #c4a574;box-shadow:inset -2px -2px 0 #d4b896,inset 2px 2px 0 #fff;" +
        '">' +
        "<p style=\"" +
        "font-family:'Courier New',monospace;font-size:20px;line-height:1.6;color:#6b4423;" +
        "margin:0;letter-spacing:0.01em;font-style:italic;" +
        "\">" + esc(quote) + "</p>" +
        "</div>"
      );
    }

    html += (
      '<div style="' +
      "display:inline-block;padding:8px 24px;margin-bottom:28px;" +
      "background:#d4502a;border:4px solid #a03030;" +
      "box-shadow:inset -3px -3px 0 #a03030,inset 3px 3px 0 #e88060;" +
      "color:#fff;font-size:18px;font-weight:bold;letter-spacing:4px;" +
      '">\u6211\u7684\u60F3\u6CD5</div>'
    );

    html += (
      '<div style="max-width:1000px;text-align:center;position:relative;z-index:1;">' +
      "<p style=\"" +
      "font-family:'Courier New',monospace;font-size:30px;line-height:1.8;color:#3d2817;" +
      "margin:0 0 28px 0;letter-spacing:0.02em;font-weight:bold;" +
      "\">" + esc(review) + "</p>"
    );

    if (chapter) {
      html += "<p style=\"" +
        "font-size:18px;color:#8a7050;margin:0 0 24px 0;letter-spacing:0.08em;" +
        "\">\u2014 " + esc(chapter) + "</p>";
    }

    html += (
      '<div style="' +
      "width:120px;height:4px;margin:0 auto 24px auto;" +
      "background:repeating-linear-gradient(90deg,#d4502a 0px,#d4502a 8px,transparent 8px,transparent 16px);" +
      '"></div>' +
      "<p style=\"" +
      "font-size:20px;color:#6b4423;margin:0;font-weight:bold;letter-spacing:0.04em;" +
      "\">" + esc(bookTitle) +
      (bookAuthor ? " " + DOT + " " + esc(bookAuthor) : "") +
      "</p>" +
      '<div style="margin-top:32px;font-size:16px;color:#c4a574;letter-spacing:2px;">\u9605\u8BFB\u4E66\u623F \u00B7 hxb-reading.top</div>' +
      "</div></div></div>"
    );

    return html;
  }

  function generateAndShow(html) {
    var host = document.getElementById("share-card-host");
    if (!host) return;
    host.innerHTML = html;

    var card = document.getElementById("share-card-inner");
    if (!card) { host.innerHTML = ""; return; }

    var overlay = document.createElement("div");
    overlay.id = "share-loading-overlay";
    overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;letter-spacing:0.1em;";
    overlay.textContent = "\u6B63\u5728\u751F\u6210\u5206\u4EAB\u56FE\u2026";
    document.body.appendChild(overlay);
    overlay.offsetHeight;

    requestAnimationFrame(function() {
      host.style.left = "0";
      host.style.top = "0";
      host.style.zIndex = "99990";
      host.style.opacity = "0";
      host.style.maxWidth = "100vw";
      host.style.maxHeight = "100vh";
      host.style.overflow = "hidden";

      Promise.all([
        waitForHtml2Canvas(),
        document.fonts ? document.fonts.ready : Promise.resolve()
      ]).then(function() {
        return html2canvas(card, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          logging: false,
          onclone: function(clonedDoc) {
            var el = clonedDoc.getElementById("share-card-inner");
            if (el) el.style.opacity = "1";
            var link = clonedDoc.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap";
            clonedDoc.head.appendChild(link);
          }
        });
      }).then(function(canvas) {
        showModal(canvas);
      }).catch(function(err) {
        console.error("[share] error:", err);
        alert("生成分享图失败：" + (err.message || err));
      }).finally(function() {
        host.innerHTML = "";
        host.style.left = "-9999px";
        host.style.zIndex = "0";
        host.style.opacity = "";
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      });
    });
  }

  function showModal(canvas) {
    var modal = document.getElementById("share-modal");
    var img = document.getElementById("share-preview-img");
    if (!modal || !img) return;

    var dataUrl = canvas.toDataURL("image/png");
    img.src = dataUrl;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");

    var dlBtn = document.getElementById("share-download-btn");
    if (dlBtn) {
      dlBtn.onclick = function() {
        var a = document.createElement("a");
        a.href = dataUrl;
        a.download = "quote-share.png";
        a.click();
      };
    }

    var cpBtn = document.getElementById("share-copy-btn");
    if (cpBtn) {
      cpBtn.onclick = function() {
        canvas.toBlob(function(blob) {
          if (!blob) { alert("复制失败"); return; }
          navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]).then(function() {
            cpBtn.textContent = "已复制 \u2713";
            setTimeout(function() { cpBtn.textContent = "复制图片"; }, 1500);
          }).catch(function() {
            alert("复制失败，请尝试下载图片");
          });
        }, "image/png");
      };
    }
  }

  function closeModal() {
    var modal = document.getElementById("share-modal");
    if (modal) {
      modal.setAttribute("aria-hidden", "true");
      modal.classList.remove("is-open");
    }
  }

  // Delegated click handler for all share buttons
  document.addEventListener("click", function(e) {
    var hlBtn = e.target.closest(".highlight-share-btn");
    if (hlBtn) {
      e.preventDefault();
      var text = hlBtn.getAttribute("data-text") || "";
      var chapter = hlBtn.getAttribute("data-chapter") || "";
      var bookTitle = hlBtn.getAttribute("data-book-title") || "";
      var bookAuthor = hlBtn.getAttribute("data-book-author") || "";
      // Fallback to .bd-container data attributes for book page
      if (!bookTitle) {
        var container = document.querySelector(".bd-container");
        bookTitle = container ? (container.getAttribute("data-book-title") || "") : "";
        bookAuthor = container ? (container.getAttribute("data-book-author") || "") : "";
      }
      generateAndShow(buildHighlightCard(text, chapter, bookTitle, bookAuthor));
      return;
    }

    var rvBtn = e.target.closest(".review-share-btn");
    if (rvBtn) {
      e.preventDefault();
      var quote = rvBtn.getAttribute("data-quote") || "";
      var review = rvBtn.getAttribute("data-review") || "";
      var chapter = rvBtn.getAttribute("data-chapter") || "";
      var bookTitle = rvBtn.getAttribute("data-book-title") || "";
      var bookAuthor = rvBtn.getAttribute("data-book-author") || "";
      // Fallback to .bd-container data attributes for book page
      if (!bookTitle) {
        var container = document.querySelector(".bd-container");
        bookTitle = container ? (container.getAttribute("data-book-title") || "") : "";
        bookAuthor = container ? (container.getAttribute("data-book-author") || "") : "";
      }
      generateAndShow(buildReviewCard(quote, review, chapter, bookTitle, bookAuthor));
      return;
    }
  });

  // Modal close handlers
  var closeBtn = document.getElementById("share-modal-close");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  var backdrop = document.querySelector(".share-modal-backdrop");
  if (backdrop) backdrop.addEventListener("click", closeModal);

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
