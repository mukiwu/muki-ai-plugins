/* session-review layout guard
 * Inline this at the very end of every report (after the page's own script).
 * 1. autofit: shrinks, then truncates, any SVG node label that is wider than its box
 * 2. QA (only when the URL hash contains "qa"): finds layout bugs and writes them
 *    as JSON into a hidden pre#qa-result element, which scripts/check_layout.py reads
 */
(function () {
  var MIN = { t1: 9, t2: 7 };
  function boxes(svg) {
    return Array.prototype.map.call(svg.querySelectorAll('rect.nd, polygon.nd'), function (r) {
      var b = r.getBBox();
      return { el: r, x: b.x, y: b.y, w: b.width, h: b.height };
    });
  }
  function inside(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
  function ownerBox(list, t) {
    var x = +t.getAttribute('x'), y = +t.getAttribute('y') - 3;
    var hit = list.filter(function (b) { return inside(b, x, y); });
    hit.sort(function (a, b) { return a.w * a.h - b.w * b.h; });
    return hit[0];
  }
  function autofit() {
    document.querySelectorAll('svg').forEach(function (svg) {
      var list = boxes(svg);
      svg.querySelectorAll('text.t1, text.t2').forEach(function (t) {
        var b = ownerBox(list, t);
        if (!b) return;
        var pad = b.el.tagName === 'polygon' ? b.w * 0.15 : 8;
        var max = b.w - pad * 2;
        var cls = t.classList.contains('t1') ? 't1' : 't2';
        var size = parseFloat(getComputedStyle(t).fontSize) || 12;
        var guard = 0;
        var start = size;
        while (t.getBBox().width > max && size > MIN[cls] && guard++ < 20) {
          size -= 0.5; t.style.fontSize = size + 'px';
        }
        if (size < start - 1) t.setAttribute('data-fit', 'shrunk ' + start + '→' + size + 'px');
        if (t.getBBox().width > max) {
          var full = t.textContent, s = full;
          while (s.length > 1 && t.getBBox().width > max) { s = s.slice(0, -1); t.textContent = s + '…'; }
          var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          title.textContent = full; t.appendChild(title);
          t.setAttribute('data-fit', 'truncated');
        }
      });
    });
  }
  function rectOf(el) { var r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }
  function overlap(a, b) {
    var w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
    return w > 1 && h > 1 ? w * h : 0;
  }
  function visible(el) {
    var d = el.closest('details:not([open])');
    if (d && !el.closest('summary')) return false;
    var s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
  }
  function label(el) {
    var id = el.id ? '#' + el.id : '';
    var cls = el.getAttribute('class'); cls = cls ? '.' + String(cls).trim().split(/\s+/).join('.') : '';
    var sec = el.closest('section, header'); var where = sec && sec.id ? ' @' + sec.id : '';
    var txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return el.tagName.toLowerCase() + id + cls + where + (txt ? ' 「' + txt + '」' : '');
  }
  function scrollBox(el) { return el.closest('.diagram, .tbl-wrap, pre, .codebox, [data-qa-skip]'); }
  function qa() {
    var issues = [];
    function add(kind, el, extra) { issues.push({ kind: kind, el: label(el), extra: extra || '' }); }
    // page-level horizontal scroll
    if (document.documentElement.scrollWidth > window.innerWidth + 1)
      issues.push({ kind: 'page-hscroll', el: 'html', extra: document.documentElement.scrollWidth + ' > ' + window.innerWidth });
    // SVG: label outside its node, labels colliding, text crossing nodes it does not belong to
    document.querySelectorAll('svg').forEach(function (svg) {
      var list = boxes(svg);
      var vb = svg.viewBox && svg.viewBox.baseVal;
      var texts = Array.prototype.filter.call(svg.querySelectorAll('text'), visible);
      var tb = texts.map(function (t) { var b = t.getBBox(); return { el: t, x: b.x, y: b.y, w: b.width, h: b.height, own: ownerBox(list, t) }; });
      tb.forEach(function (a) {
        var fit = a.el.getAttribute('data-fit');
        if (fit) add(fit === 'truncated' ? 'svg-text-truncated' : 'svg-text-shrunk', a.el, fit + '，節點太窄或字太多，請加寬節點或縮短文字');
        if (a.own && (a.x < a.own.x + 1 || a.x + a.w > a.own.x + a.own.w - 1)) add('svg-text-outside-node', a.el);
        if (vb && vb.width && (a.x < vb.x || a.x + a.w > vb.x + vb.width || a.y < vb.y || a.y + a.h > vb.y + vb.height)) add('svg-text-outside-viewbox', a.el);
        list.forEach(function (b) {
          if (b === a.own) return;
          var w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (w > 1 && h > 1) add('svg-text-over-node', a.el, 'node ' + label(b.el));
        });
      });
      for (var i = 0; i < tb.length; i++) for (var j = i + 1; j < tb.length; j++) {
        var a = tb[i], b = tb[j];
        var w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (w > 1 && h > 1) add('svg-text-collide', a.el, 'with ' + label(b.el));
      }
    });
    // HTML: leaf text boxes that collide, text clipped or squeezed
    var leaves = Array.prototype.filter.call(document.body.querySelectorAll('*'), function (el) {
      if (el.closest('svg, script, style, #qa-result') || !visible(el) || scrollBox(el)) return false;
      var hasText = Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      return hasText || el.matches('.col, .bar-fill, .tl-seg, input, button');
    });
    leaves.forEach(function (el) {
      var s = getComputedStyle(el);
      if (s.textOverflow !== 'ellipsis' && s.overflowX !== 'auto' && s.overflowX !== 'scroll' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0)
        add('text-overflow', el, el.scrollWidth + ' > ' + el.clientWidth);
      var bw = el.getBoundingClientRect().width, lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.4;
      var lines = Math.round(el.getBoundingClientRect().height / lh);
      if (lines >= 4 && bw < 160 && (el.textContent || '').trim().length > 16)
        add('column-too-narrow', el, Math.round(bw) + 'px wide, ' + lines + ' lines');
    });
    // inline text that wraps has one box per line; compare those, not the bounding box
    function lineBoxes(el) {
      var list = getComputedStyle(el).display === 'inline' ? Array.prototype.map.call(el.getClientRects(), function (r) {
        return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
      }) : [rectOf(el)];
      return list.filter(function (b) { return b.w > 0 && b.h > 0; });
    }
    var rects = leaves.map(rectOf), lines = leaves.map(lineBoxes);
    for (var i = 0; i < leaves.length; i++) for (var j = i + 1; j < leaves.length; j++) {
      if (leaves[i].contains(leaves[j]) || leaves[j].contains(leaves[i])) continue;
      if (Math.abs(rects[i].t - rects[j].t) > 400) continue;
      var hit = lines[i].some(function (a) { return lines[j].some(function (b) { return overlap(a, b) > 4; }); });
      if (hit) add('overlap', leaves[i], 'with ' + label(leaves[j]));
    }
    // anything escaping its card
    document.querySelectorAll('.card, .stat, .stage, .qcard').forEach(function (card) {
      var c = rectOf(card);
      card.querySelectorAll('*').forEach(function (el) {
        if (!visible(el) || scrollBox(el) || el.closest('svg')) return;
        var r = rectOf(el);
        if (r.t < c.t - 1 || r.b > c.b + 1 || r.l < c.l - 1 || r.r > c.r + 1) add('escapes-card', el, 'card ' + label(card));
      });
    });
    var out = document.getElementById('qa-result') || document.createElement('pre');
    out.id = 'qa-result'; out.hidden = true;
    out.textContent = JSON.stringify({ width: window.innerWidth, issues: issues });
    document.body.appendChild(out);
  }
  function run() {
    try { autofit(); } catch (e) {}
    if (/qa/.test(location.hash)) { try { qa(); } catch (e) { var o = document.createElement('pre'); o.id = 'qa-result'; o.hidden = true; o.textContent = JSON.stringify({ error: String(e) }); document.body.appendChild(o); } }
  }
  var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  window.addEventListener('load', function () { fonts.then(function () { setTimeout(run, 150); }); });
})();
