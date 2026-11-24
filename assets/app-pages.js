// Shared by the app pages (Breakthru, Catch Up, TallyUp, Spend, Fridge).
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia('(max-width: 680px)');
  var narrow = window.matchMedia('(max-width: 860px)');
  var nav = document.querySelector('body > nav');
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function navH() {
    if (!nav) return 0;
    var pos = getComputedStyle(nav).position;
    return pos === 'sticky' || pos === 'fixed' ? nav.offsetHeight : 0;
  }

  // Sections stack. Every top-level block after the header sticks; a block
  // taller than the screen sticks by its bottom edge, so it scrolls normally
  // until its end is on screen, then holds while the next one slides over it.
  var skip = { SCRIPT: 1, NAV: 1, STYLE: 1, LINK: 1, NOSCRIPT: 1, TEMPLATE: 1 };
  var blocks = Array.prototype.filter.call(document.body.children, function (el) { return !skip[el.tagName]; });
  var bodyBg = getComputedStyle(document.body).backgroundColor;
  blocks.forEach(function (el, i) {
    el.classList.add('stack-block');
    el.style.zIndex = i + 1;
    var bg = getComputedStyle(el).backgroundColor;
    if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') el.style.backgroundColor = bodyBg;
  });

  // Phones: feature cards stack like the home page's How I build cards.
  var cardStacks = Array.prototype.map.call(document.querySelectorAll('.card-stack'), function (grid) {
    return Array.prototype.slice.call(grid.children);
  });

  function layout() {
    var top = navH(), vh = window.innerHeight;
    blocks.forEach(function (el) {
      el.style.top = Math.min(top, vh - el.offsetHeight) + 'px';
    });
    cardStacks.forEach(function (cards) {
      cards.forEach(function (c, i) { c.style.top = phone.matches ? (top + 12 + i * 10) + 'px' : ''; });
    });
    frame();
  }

  // The covered block (or card) dims as the next one comes up over it.
  function cover(list, stuckAt) {
    for (var i = 0; i < list.length; i++) {
      var next = list[i + 1];
      var p = 0;
      if (next && !reduce) {
        // From the moment the next one reaches this one's bottom edge until it sticks.
        var start = Math.min(window.innerHeight, list[i].getBoundingClientRect().bottom), end = stuckAt(next, i + 1);
        p = clamp((start - next.getBoundingClientRect().top) / Math.max(1, start - end));
      }
      list[i].style.setProperty('--p', p.toFixed(3));
    }
  }

  // Cards that deal out from a stack in the middle as their row scrolls in
  // (gathering again on the way back up); on narrow screens each card slides
  // in once from alternating sides.
  var fans = Array.prototype.map.call(document.querySelectorAll('.fan-row'), function (row) {
    var cards = Array.prototype.slice.call(row.children);
    var section = row.closest('section');
    if (section) section.classList.add('fan-section');
    return { row: row, cards: cards };
  });
  if (!reduce && narrow.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.opacity = 1; e.target.style.transform = 'none';
        io.unobserve(e.target);
      });
    }, { threshold: 0.25 });
    fans.forEach(function (f) {
      f.cards.forEach(function (c, i) {
        c.style.opacity = 0; c.style.transform = 'translateX(' + (i % 2 ? 60 : -60) + 'px)';
        c.style.transition = 'opacity .7s ease, transform .9s cubic-bezier(.2,.8,.2,1)';
        io.observe(c);
      });
    });
    fans = [];
  }

  function frame() {
    ticking = false;
    var top = navH(), vh = window.innerHeight;
    cover(blocks, function (el) { return Math.min(top, vh - el.offsetHeight); });
    if (phone.matches) cardStacks.forEach(function (cards) {
      cover(cards, function (el, i) { return top + 12 + i * 10; });
    });
    if (reduce) return;
    fans.forEach(function (f) {
      var t = ease(clamp((vh - f.row.getBoundingClientRect().top) / (vh * 0.6)));
      var midIndex = Math.floor(f.cards.length / 2), mid = f.cards[midIndex].offsetLeft, k = 1 - t;
      f.cards.forEach(function (c, i) {
        var d = i - midIndex;
        c.style.transform = 'translate(' + (mid - c.offsetLeft) * k + 'px,' + (40 + (d ? 18 : 0)) * k + 'px) rotate(' + d * 10 * k + 'deg)';
        c.style.zIndex = d ? 2 : 3;
        c.style.opacity = 0.35 + 0.65 * clamp(t * 1.6);
      });
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { layout(); });
    blocks.forEach(function (el) { ro.observe(el); });
  }
  window.addEventListener('load', layout);
  layout();
})();
