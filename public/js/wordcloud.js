/**
 * Minimal word cloud renderer — zero dependencies.
 * Places words on a <canvas> from center outward, avoiding overlap.
 */
(function (global) {
  'use strict';

  function WordCloud(canvas, opts) {
    opts = opts || {};
    var words = (opts.list || []).slice();
    if (!words.length) {
      console.warn('[WordCloud] empty word list');
      return;
    }

    var ctx = canvas.getContext('2d');
    var W = canvas.width;
    var H = canvas.height;
    if (!W || !H) {
      console.warn('[WordCloud] canvas has zero size', W, H);
      return;
    }

    var cx = W / 2;
    var cy = H / 2;

    var fontFamily = opts.fontFamily || 'serif';
    var rotateRatio = opts.rotateRatio != null ? opts.rotateRatio : 0.35;
    var ellipticity = opts.ellipticity != null ? opts.ellipticity : 0.8;
    var gridSize = opts.gridSize || 6;
    var colorFn = opts.color || function () { return '#333'; };

    // Build weighted sizes
    var weights = words.map(function (w) { return w[1]; });
    var maxW = Math.max.apply(null, weights);
    var minW = Math.min.apply(null, weights);
    var range = maxW - minW || 1;
    var maxSize = Math.min(W, H) / 8;
    var minSize = 14;

    var wordObjs = words.map(function (w) {
      var t = (w[1] - minW) / range;
      var sz = Math.round(minSize + t * (maxSize - minSize));
      return { text: w[0], size: sz, placed: false, rotate: Math.random() < rotateRatio };
    });

    // Largest first
    wordObjs.sort(function (a, b) { return b.size - a.size; });

    // Occupancy grid
    var gridCols = Math.ceil(W / gridSize);
    var gridRows = Math.ceil(H / gridSize);
    var grid = new Uint8Array(gridCols * gridRows);

    function isFree(gx, gy) {
      if (gx < 0 || gx >= gridCols || gy < 0 || gy >= gridRows) return false;
      return grid[gy * gridCols + gx] === 0;
    }

    function mark(gx, gy) {
      if (gx >= 0 && gx < gridCols && gy >= 0 && gy < gridRows) {
        grid[gy * gridCols + gx] = 1;
      }
    }

    function rectFree(x, y, w, h) {
      var gx0 = Math.floor(x / gridSize);
      var gy0 = Math.floor(y / gridSize);
      var gx1 = Math.floor((x + w) / gridSize);
      var gy1 = Math.floor((y + h) / gridSize);
      var pad = 0;
      gx0 = Math.max(0, gx0 - pad);
      gy0 = Math.max(0, gy0 - pad);
      gx1 = Math.min(gridCols - 1, gx1 + pad);
      gy1 = Math.min(gridRows - 1, gy1 + pad);
      for (var gy = gy0; gy <= gy1; gy++) {
        for (var gx = gx0; gx <= gx1; gx++) {
          if (!isFree(gx, gy)) return false;
        }
      }
      return true;
    }

    function markRect(x, y, w, h) {
      var gx0 = Math.floor(x / gridSize);
      var gy0 = Math.floor(y / gridSize);
      var gx1 = Math.floor((x + w) / gridSize);
      var gy1 = Math.floor((y + h) / gridSize);
      for (var gy = gy0; gy <= gy1; gy++) {
        for (var gx = gx0; gx <= gx1; gx++) {
          mark(gx, gy);
        }
      }
    }

    // Clear and draw subtle background so canvas is visible even if empty
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    ctx.fillRect(0, 0, W, H);

    var placedCount = 0;
    var skippedCount = 0;

    wordObjs.forEach(function (word, idx) {
      var rotAngle = word.rotate ? (Math.random() * Math.PI / 2 - Math.PI / 4) : 0;

      ctx.save();
      ctx.font = word.size + 'px ' + fontFamily;
      var metrics = ctx.measureText(word.text);
      var tw = metrics.width;
      var th = word.size * 1.2;
      ctx.restore();

      var bw, bh;
      if (word.rotate) {
        var cosA = Math.abs(Math.cos(rotAngle));
        var sinA = Math.abs(Math.sin(rotAngle));
        bw = tw * cosA + th * sinA;
        bh = tw * sinA + th * cosA;
      } else {
        bw = tw;
        bh = th;
      }

      // Don't try to place words that are bigger than the canvas
      if (bw > W || bh > H) {
        skippedCount++;
        return;
      }

      var placed = false;
      var maxAttempts = 3000;
      var angleStep = 0.12;
      var radiusStep = Math.max(2, gridSize * 0.35);
      var angle = Math.random() * 2 * Math.PI;
      var radius = 0;

      for (var attempt = 0; attempt < maxAttempts; attempt++) {
        var ex = cx + radius * Math.cos(angle);
        var ey = cy + radius * Math.sin(angle) * ellipticity;
        var bx = ex - bw / 2;
        var by = ey - bh / 2;

        if (bx >= 0 && by >= 0 && bx + bw <= W && by + bh <= H && rectFree(bx, by, bw, bh)) {
          ctx.save();
          ctx.translate(ex, ey);
          if (word.rotate) ctx.rotate(rotAngle);
          ctx.font = word.size + 'px ' + fontFamily;
          ctx.fillStyle = colorFn(word.text, word.size);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(word.text, 0, 0);
          ctx.restore();

          markRect(bx, by, bw, bh);
          word.placed = true;
          placed = true;
          placedCount++;
          break;
        }

        radius += radiusStep;
        angle += angleStep;
      }

      if (!placed) {
        // Fallback: random scatter with relaxed collision (allow slight overlap)
        for (var fb = 0; fb < 300; fb++) {
          var rx = Math.random() * (W - bw);
          var ry = Math.random() * (H - bh);
          if (rx >= 0 && ry >= 0 && rx + bw <= W && ry + bh <= H && rectFree(rx, ry, bw, bh)) {
            ctx.save();
            ctx.translate(rx + bw / 2, ry + bh / 2);
            if (word.rotate) ctx.rotate(rotAngle);
            ctx.font = word.size + 'px ' + fontFamily;
            ctx.fillStyle = colorFn(word.text, word.size);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(word.text, 0, 0);
            ctx.restore();
            markRect(rx, ry, bw, bh);
            word.placed = true;
            placedCount++;
            break;
          }
        }
        if (!word.placed) {
          // Last resort: just draw it randomly even if it overlaps
          var rx = Math.random() * (W - bw);
          var ry = Math.random() * (H - bh);
          ctx.save();
          ctx.translate(rx + bw / 2, ry + bh / 2);
          if (word.rotate) ctx.rotate(rotAngle);
          ctx.font = word.size + 'px ' + fontFamily;
          ctx.fillStyle = colorFn(word.text, word.size);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(word.text, 0, 0);
          ctx.restore();
          placedCount++;
        }
      }
    });

    console.log('[WordCloud] placed', placedCount, '/', words.length, '(skipped', skippedCount, ')');
  }

  global.WordCloud = WordCloud;
})(window);
