// Stacking cards, shared by the home and About pages. CSS does the stacking
// with position: sticky; this keeps tall cards readable, lines the finished
// stack up so it leaves as one piece, and adds the shrink and dim as each card
// is covered. Each page calls stackCards with its stacks, each one
//   [containerSelector, cardSelector, active(), fitToScreen(), pauseGap]
// and gets a 'stackmeasured' event on window after every measure.
window.stackCards = function (sets) {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var head = document.querySelector('.site-head');
  var stacks = [];

  function makeStack(container, cards, active, fit, pauseGap) {
    var tops = [];
    var on = false;

    function reset() {
      cards.forEach(function (card) {
        card.style.minHeight = ''; card.style.height = ''; card.style.marginTop = ''; card.style.marginBottom = '';
        card.classList.remove('compact', 'no-shot');
        card.style.top = ''; card.style.removeProperty('--p'); card.style.removeProperty('--s');
      });
    }

    // A card taller than the space below the header sticks by its bottom edge.
    function measure(headH, vh) {
      reset();
      on = active();
      if (!on) return;
      var styles = getComputedStyle(container);
      var base = (parseFloat(styles.getPropertyValue('--stack-top')) || 0) + headH;
      var step = parseFloat(styles.getPropertyValue('--stack-step')) || 0;
      var fitToScreen = fit && fit();
      var h;
      if (fitToScreen) {
        // Phones: every card is exactly as tall as the space below the header
        // (less the peeks of the cards behind it), so each one fits on screen.
        // The screenshot takes what the text leaves; on short screens the
        // description, then the screenshot, give way.
        h = Math.floor(vh - (base + (cards.length - 1) * step) - 16);
        cards.forEach(function (card) {
          card.classList.remove('compact', 'no-shot');
          card.style.height = h + 'px';
          var info = card.querySelector('.app-info');
          var room = function () { return h - 40 - 16 - info.offsetHeight; };
          if (room() < 120) card.classList.add('compact');
          if (room() < 80) card.classList.add('no-shot');
        });
      } else {
        // Same height for every card, so the finished stack lines up and leaves together.
        h = Math.max.apply(null, cards.map(function (card) { return card.offsetHeight; }));
        cards.forEach(function (card) { card.style.minHeight = h + 'px'; });
      }
      cards.forEach(function (card, i) {
        card.style.setProperty('--i', i);
        var top = Math.min(base + i * step, vh - h - 16);
        card.style.top = top + 'px';
        tops[i] = top;
      });
      // Cards with a smaller sticky top get a matching bottom margin (taken back
      // from the next card's top margin), so every card reaches the end of the
      // stack at the same moment and the stack scrolls away as one piece.
      // On wide screens the next card waits until about 24px of scrolling
      // after the current one has settled fully in view.
      var gap = parseFloat(styles.rowGap) || 0;
      var last = tops[tops.length - 1];
      var startY = container.getBoundingClientRect().top + window.scrollY;
      var nat = 0;
      cards.forEach(function (card, i) {
        // The scroll position where this card has settled; the page dots use it.
        card.dataset.at = Math.round(startY + nat - tops[i]);
        if (i === cards.length - 1) return;
        var extra = last - tops[i];
        var dist = gap;
        if (!fitToScreen && pauseGap) dist = Math.max(gap, vh + 24 - tops[i] - h);
        card.style.marginBottom = extra + 'px';
        cards[i + 1].style.marginTop = (dist - gap - extra) + 'px';
        nat += h + dist;
      });
    }

    function update() {
      if (!on || reduce.matches) return;
      for (var i = 0; i < cards.length - 1; i++) {
        var p = 1 - (cards[i + 1].getBoundingClientRect().top - tops[i]) / cards[i].offsetHeight;
        cards[i].style.setProperty('--p', (p < 0 ? 0 : p > 1 ? 1 : p).toFixed(3));
      }
      // The last card shrinks to match the others as it lands (no dim, since
      // nothing covers it), then the finished stack scrolls away together.
      var li = cards.length - 1;
      var lp = 1 - (cards[li].getBoundingClientRect().top - tops[li]) / cards[li].offsetHeight;
      cards[li].style.setProperty('--s', (lp < 0 ? 0 : lp > 1 ? 1 : lp).toFixed(3));
    }

    return { measure: measure, update: update };
  }

  function add(containerSel, cardSel, active, fit, pauseGap) {
    var container = document.querySelector(containerSel);
    if (!container) return;
    var cards = Array.prototype.slice.call(container.querySelectorAll(cardSel));
    if (cards.length > 1) stacks.push(makeStack(container, cards, active, fit, pauseGap));
  }
  sets.forEach(function (s) { add.apply(null, s); });
  if (!stacks.length) return;

  var ticking = false;
  var lastW = 0;
  function updateAll() { ticking = false; stacks.forEach(function (st) { st.update(); }); }
  function measureAll() {
    lastW = window.innerWidth;
    var headH = head ? head.offsetHeight : 0;
    document.documentElement.style.setProperty('--head', headH + 'px');
    stacks.forEach(function (st) { st.measure(headH, window.innerHeight); });
    updateAll();
    window.dispatchEvent(new Event('stackmeasured'));
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateAll); }
  }, { passive: true });
  // A phone's address bar growing or shrinking only changes the height. Skipping
  // those resizes keeps the layout still while you scroll.
  window.addEventListener('resize', function () { if (window.innerWidth !== lastW) measureAll(); });
  window.addEventListener('load', measureAll);
  reduce.addEventListener('change', function () {
    stacks.forEach(function (st) { st.measure(head ? head.offsetHeight : 0, window.innerHeight); });
    updateAll();
  });
  measureAll();
};
