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

  // Phones: feature cards marked .card-stack stack like the home page's How I
  // build cards, each dimming a little as the next one covers it.
  var cardStacks = phone.matches ? Array.prototype.map.call(document.querySelectorAll('.card-stack'), function (grid) {
    return Array.prototype.slice.call(grid.children);
  }) : [];
  function placeStacks() {
    var top = navH();
    cardStacks.forEach(function (cards) {
      cards.forEach(function (c, i) { c.style.top = (top + 12 + i * 10) + 'px'; });
    });
  }
  function coverStacks() {
    if (reduce) return;
    var top = navH();
    cardStacks.forEach(function (cards) {
      cards.forEach(function (c, i) {
        var next = cards[i + 1], p = 0;
        if (next) {
          var start = Math.min(window.innerHeight, c.getBoundingClientRect().bottom), end = top + 12 + (i + 1) * 10;
          p = clamp((start - next.getBoundingClientRect().top) / Math.max(1, start - end));
        }
        c.style.setProperty('--p', p.toFixed(3));
      });
    });
  }

  // Smaller cards move in as they scroll into view. A grid's data-anim picks
  // the move: rise, pop, tilt or slide play once; fan deals each row out from
  // its middle card as you scroll (and gathers it again on the way back up).
  // On narrow screens a fan becomes a slide. Stacked phone cards skip this.
  var fans = [];
  var io = 'IntersectionObserver' in window && new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  if (!reduce && io) {
    document.documentElement.classList.add('card-motion');
    Array.prototype.forEach.call(document.querySelectorAll('[data-anim]'), function (grid) {
      if (phone.matches && grid.classList.contains('card-stack')) return;
      var kind = grid.getAttribute('data-anim');
      if (kind === 'fan' && narrow.matches) kind = 'slide';
      var cards = Array.prototype.slice.call(grid.children);
      var section = grid.closest('section') || grid.parentNode;
      if (kind === 'fan' || kind === 'slide') section.classList.add('anim-clip');
      if (kind === 'fan') { grid.classList.add('anim-fan'); fans.push(cards); return; }
      grid.classList.add('anim', 'anim-' + kind);
      // Stagger by position within the row, so each row plays left to right.
      var rowTop = null, col = 0;
      cards.forEach(function (c) {
        if (c.offsetTop !== rowTop) { rowTop = c.offsetTop; col = 0; }
        c.style.transitionDelay = (col++ * 0.12) + 's';
        io.observe(c);
      });
    });
  }

  function frame() {
    ticking = false;
    coverStacks();
    var vh = window.innerHeight;
    fans.forEach(function (cards) {
      // Group into rows; each row deals out from its middle card.
      var rows = [];
      cards.forEach(function (c) {
        var r = rows[rows.length - 1];
        if (!r || r.top !== c.offsetTop) rows.push(r = { top: c.offsetTop, cards: [] });
        r.cards.push(c);
      });
      rows.forEach(function (r) {
        var t = ease(clamp((vh - r.cards[0].parentNode.getBoundingClientRect().top - (r.top - r.cards[0].parentNode.firstElementChild.offsetTop)) / (vh * 0.6)));
        var m = Math.floor(r.cards.length / 2), mid = r.cards[m].offsetLeft, k = 1 - t;
        r.cards.forEach(function (c, i) {
          var d = i - m;
          c.style.transform = 'translate(' + (mid - c.offsetLeft) * k + 'px,' + (40 + (d ? 18 : 0)) * k + 'px) rotate(' + d * 8 * k + 'deg)';
          c.style.zIndex = d ? 2 : 3;
          c.style.opacity = 0.35 + 0.65 * clamp(t * 1.6);
        });
      });
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  window.addEventListener('resize', function () { placeStacks(); frame(); });
  window.addEventListener('load', function () { placeStacks(); frame(); });
  placeStacks();
  frame();
})();
