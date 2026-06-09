/**
 * Minimal word cloud renderer — zero dependencies.
 * Places words on a <canvas> from center outward, avoiding overlap.
 */
(function (global) {
  'use strict';

  function WordCloud(canvas, opts) {
    opts = opts || {};
    var words = (opts.list || []).slice();
    if (!words.length) return;

    // Sort largest first
    words.sort(function (a, b) { return b[1] - a[1]; });

    var ctx = canvas.getContext('2d');
    var W = canvas.width;
    var H = canvas.height;
    var cx = W / 2;
    var cy = H / 2;

    var fontFamily = opts.fontFamily || 'serif';
    var minSize = opts.minSize || 14;
    var maxSize = opts.maxSize || Math.min(W, H) / 10;
    var rotateRatio = opts.rotateRatio != null ? opts.rotateRatio : 0.35;
    var ellipticity = opts.ellipticity != null ? opts.ellipticity : 0.8;
    var gridSize = opts.gridSize || 6;
    var colorFn = opts.color || function () { return '#333'; };
    var shuffle = opts.shuffle !== false;

    // Build weights array, map to [minSize..maxSize]
    var weights = words.map(function (w) { return w[1]; });
    var maxW = Math.max.apply(null, weights);
    var minW = Math.min.apply(null, weights);
    var range = maxW - minW || 1;
    var wordObjs = words.map(function (w, i) {
      var t = (w[1] - minW) / range;
      var sz = minSize + Math.round(t * (maxSize - minSize));
      if (opts.weightFactor != null) sz = Math.round(w[1] * opts.weightFactor);
      return { text: w[0], size: sz, placed: false };
    });

    if (shuffle) {
      // Fisher-Yates shuffle (only among same-size groups for stability)
      for (var i_ = wordObjs.length - 1; i_ > 0; i_--) {
        var j_ = Math.floor(Math.random() * (i_ + 1));
        var tmp = wordObjs[i_];
        wordObjs[i_] = wordObjs[j_];
        wordObjs[j_] = tmp;
      }
      // Re-sort by size descending (shuffle breaks order)
      wordObjs.sort(function (a, b) { return b.size - a.size; });
    }

    // Occupancy grid — marks which pixels are taken
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
      // Check all cells (allow some overlap tolerance = padding)
      var pad = 1; // cells of padding
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

    ctx.clearRect(0, 0, W, H);

    // Spiral placement: start from center, spiral outward
    var angleStep = 0.15;
    var radiusStep = gridSize;

    wordObjs.forEach(function (word) {
      var angle = Math.random() * 2 * Math.PI;
      var radius = 0;
      var placed = false;
      var rotated = Math.random() < rotateRatio;
      var rotAngle = rotated ? (Math.random() * Math.PI / 2 - Math.PI / 4) : 0;

      ctx.save();
      ctx.font = word.size + 'px ' + fontFamily;
      var metrics = ctx.measureText(word.text);
      var tw = metrics.width;
      var th = word.size * 1.2;
      ctx.restore();

      // Bounding box after rotation
      var bw, bh;
      if (rotated) {
        var cosA = Math.abs(Math.cos(rotAngle));
        var sinA = Math.abs(Math.sin(rotAngle));
        bw = tw * cosA + th * sinA;
        bh = tw * sinA + th * cosA;
      } else {
        bw = tw;
        bh = th;
      }

      var maxAttempts = 2000;
      for (var attempt = 0; attempt < maxAttempts; attempt++) {
        // Apply ellipticity: squash y-axis
        var ex = cx + radius * Math.cos(angle);
        var ey = cy + radius * Math.sin(angle) * ellipticity;
        var bx = ex - bw / 2;
        var by = ey - bh / 2;

        if (bx >= 0 && by >= 0 && bx + bw <= W && by + bh <= H && rectFree(bx, by, bw, bh)) {
          // Place it
          ctx.save();
          ctx.translate(ex, ey);
          if (rotated) ctx.rotate(rotAngle);
          ctx.font = word.size + 'px ' + fontFamily;
          ctx.fillStyle = colorFn(word.text, word.size);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(word.text, 0, 0);
          ctx.restore();

          markRect(bx, by, bw, bh);
          word.placed = true;
          placed = true;
          break;
        }

        // Spiral outward
        radius += radiusStep * 0.5;
        angle += angleStep;
      }

      if (!placed) {
        // Try placing at a totally random position as last resort
        for (var fb = 0; fb < 200; fb++) {
          var rx = Math.random() * (W - bw);
          var ry = Math.random() * (H - bh);
          if (rx >= 0 && ry >= 0 && rx + bw <= W && ry + bh <= H && rectFree(rx, ry, bw, bh)) {
            ctx.save();
            ctx.translate(rx + bw / 2, ry + bh / 2);
            if (rotated) ctx.rotate(rotAngle);
            ctx.font = word.size + 'px ' + fontFamily;
            ctx.fillStyle = colorFn(word.text, word.size);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(word.text, 0, 0);
            ctx.restore();
            markRect(rx, ry, bw, bh);
            word.placed = true;
            break;
          }
        }
      }
    });
  }

  global.WordCloud = WordCloud;
})(window);
