/* ==========================================================================
   Frankgina Company Limited — storefront behaviour
   Front-end only. Cart state lives in memory for this session; swap the
   CART array for your backend when checkout is built.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '233244360143';
  var FREE_DELIVERY = 500;

  var money = function (n) {
    return '\u00A2' + n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* ----------------------------------------------------------------------
     Toast
     ---------------------------------------------------------------------- */
  var toastEl = doc.getElementById('toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }

  /* ----------------------------------------------------------------------
     Scroll state
     ---------------------------------------------------------------------- */
  var header = doc.getElementById('siteHeader');
  var toTop = doc.getElementById('toTop');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    if (header) header.classList.toggle('is-stuck', y > 10);
    if (toTop) toTop.classList.toggle('is-visible', y > 650);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------------------
     Cart
     ---------------------------------------------------------------------- */
  var CART = [];

  var els = {
    list:   doc.getElementById('cartList'),
    empty:  doc.getElementById('cartEmpty'),
    footer: doc.getElementById('cartFooter'),
    total:  doc.getElementById('cartTotal'),
    qty:    doc.getElementById('cartQty'),
    count:  doc.getElementById('cartCount'),
    countM: doc.getElementById('cartCountM'),
    bar:    doc.getElementById('cartBar'),
    free:   doc.getElementById('cartFree'),
    wa:     doc.getElementById('cartWa')
  };

  function subtotal() {
    return CART.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
  }
  function units() {
    return CART.reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function cartWhatsAppLink() {
    var lines = ['Hello Frankgina, I would like to order:', ''];
    CART.forEach(function (i) {
      lines.push(i.qty + ' x ' + i.name + '  —  ' + money(i.price * i.qty));
    });
    lines.push('', 'Subtotal: ' + money(subtotal()));
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function renderCart() {
    if (!els.list) return;
    var n = units();
    var sum = subtotal();

    els.list.innerHTML = CART.map(function (item, idx) {
      return '' +
        '<li class="citem">' +
          '<span class="citem__img"><img src="' + item.img + '" alt=""></span>' +
          '<div>' +
            '<p class="citem__name">' + item.name + '</p>' +
            '<p class="citem__price">' + money(item.price) + ' each</p>' +
            '<span class="citem__qty">' +
              '<button type="button" data-dec="' + idx + '" aria-label="Reduce quantity">&minus;</button>' +
              '<span>' + item.qty + '</span>' +
              '<button type="button" data-inc="' + idx + '" aria-label="Increase quantity">+</button>' +
            '</span>' +
          '</div>' +
          '<button type="button" class="citem__del" data-del="' + idx + '" aria-label="Remove ' + item.name + '">' +
            '<i class="bi bi-x-lg" aria-hidden="true"></i></button>' +
        '</li>';
    }).join('');

    if (els.qty)    els.qty.textContent = '(' + n + ')';
    if (els.count)  els.count.textContent = n;
    if (els.countM) els.countM.textContent = n;
    if (els.total)  els.total.textContent = money(sum);
    if (els.empty)  els.empty.hidden = n > 0;
    if (els.footer) els.footer.hidden = n === 0;
    if (els.wa)     els.wa.href = cartWhatsAppLink();

    if (els.bar) els.bar.style.width = Math.min((sum / FREE_DELIVERY) * 100, 100) + '%';
    if (els.free) {
      els.free.innerHTML = sum >= FREE_DELIVERY
        ? '<i class="bi bi-check-circle-fill" aria-hidden="true"></i> You\u2019ve unlocked <strong>free Kumasi delivery</strong>.'
        : 'Spend <strong>' + money(FREE_DELIVERY - sum) + '</strong> more for free Kumasi delivery.';
    }
  }

  function addToCart(name, price, img) {
    var found = CART.filter(function (i) { return i.name === name; })[0];
    if (found) { found.qty += 1; }
    else { CART.push({ name: name, price: price, img: img, qty: 1 }); }

    renderCart();
    toast(name + ' added to cart');

    var btn = doc.querySelector('.hact--cart');
    if (btn) {
      btn.classList.remove('is-bump');
      void btn.offsetWidth;
      btn.classList.add('is-bump');
    }
  }

  doc.addEventListener('click', function (e) {
    var add = e.target.closest('.addcart');
    if (add) {
      addToCart(add.getAttribute('data-name'), Number(add.getAttribute('data-price')), add.getAttribute('data-img'));
      return;
    }

    var inc = e.target.closest('[data-inc]');
    if (inc) { CART[+inc.getAttribute('data-inc')].qty += 1; renderCart(); return; }

    var dec = e.target.closest('[data-dec]');
    if (dec) {
      var i = +dec.getAttribute('data-dec');
      CART[i].qty -= 1;
      if (CART[i].qty < 1) CART.splice(i, 1);
      renderCart();
      return;
    }

    var del = e.target.closest('[data-del]');
    if (del) { CART.splice(+del.getAttribute('data-del'), 1); renderCart(); return; }

    var wish = e.target.closest('[data-wish]');
    if (wish) {
      wish.classList.toggle('is-on');
      var on = wish.classList.contains('is-on');
      var icon = wish.querySelector('i');
      if (icon) icon.className = on ? 'bi bi-heart-fill' : 'bi bi-heart';
      var counter = doc.getElementById('wishCount');
      if (counter) counter.textContent = doc.querySelectorAll('[data-wish].is-on').length;
      toast(on ? 'Saved to wishlist' : 'Removed from wishlist');
    }
  });

  renderCart();

  /* ----------------------------------------------------------------------
     Product filter tabs
     ---------------------------------------------------------------------- */
  var tabs = doc.querySelectorAll('.tabs button');
  var cards = doc.querySelectorAll('.pcard');
  var emptyMsg = doc.getElementById('prodEmpty');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-on');
      tab.setAttribute('aria-selected', 'true');

      var want = tab.getAttribute('data-filter');
      var shown = 0;
      cards.forEach(function (card) {
        var match = want === 'all' || card.getAttribute('data-cat') === want;
        card.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });
      if (emptyMsg) emptyMsg.hidden = shown > 0;
    });
  });

  /* ----------------------------------------------------------------------
     Oil finder
     ---------------------------------------------------------------------- */
  var finder = doc.getElementById('finderForm');
  if (finder) {
    finder.addEventListener('submit', function () {
      var type   = doc.getElementById('ffType').value;
      var engine = doc.getElementById('ffEngine').value;
      var grade  = doc.getElementById('ffGrade').value;
      var out    = doc.getElementById('finderResult');

      // Rough starting points only — the counter confirms against the handbook.
      var rec = '15W-40';
      if (engine === 'Diesel') {
        rec = (type === 'Truck / heavy duty') ? '15W-40 heavy duty' : '15W-40';
      } else if (grade === 'Fully synthetic') {
        rec = '5W-30 fully synthetic';
      } else if (grade === 'Semi-synthetic') {
        rec = '10W-40 semi-synthetic';
      } else if (type === 'Motorbike') {
        rec = '20W-50 motorcycle grade';
      } else {
        rec = '20W-50 mineral';
      }

      if (out) {
        out.innerHTML = 'Start with <strong>' + rec + '</strong> for a ' + type.toLowerCase() +
          '. <a href="https://wa.me/' + WA + '?text=' +
          encodeURIComponent('Hello Frankgina, I have a ' + type + ' (' + engine + '). Which oil do you recommend?') +
          '" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline">Confirm on WhatsApp</a>';
      }
    });
  }

  /* ----------------------------------------------------------------------
     Search — front-end only for now
     ---------------------------------------------------------------------- */
  var searchForm = doc.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function () {
      var q = (doc.getElementById('searchInput').value || '').trim();
      if (!q) return;
      var hit = 0;
      cards.forEach(function (card) {
        var text = card.textContent.toLowerCase();
        var match = text.indexOf(q.toLowerCase()) > -1;
        card.classList.toggle('is-hidden', !match);
        if (match) hit++;
      });
      if (emptyMsg) emptyMsg.hidden = hit > 0;
      tabs.forEach(function (t) { t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false'); });
      doc.getElementById('featured').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      toast(hit ? hit + ' product' + (hit === 1 ? '' : 's') + ' for \u201C' + q + '\u201D' : 'Nothing found for \u201C' + q + '\u201D');
    });
  }

  /* ----------------------------------------------------------------------
     Forms — validate, then hand off to WhatsApp until a backend exists
     ---------------------------------------------------------------------- */
  function setStatus(node, msg, ok) {
    if (!node) return;
    node.textContent = msg;
    node.classList.add('is-visible');
    node.classList.toggle('is-ok', !!ok);
    node.classList.toggle('is-bad', !ok);
  }

  var wsForm = doc.getElementById('wholesaleForm');
  if (wsForm) {
    wsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = doc.getElementById('wsStatus');
      var ok = true;

      wsForm.querySelectorAll('[required]').forEach(function (field) {
        var wrap = field.closest('[class*="col-"]') || field.parentElement;
        var good = field.checkValidity() && field.value.trim() !== '';
        wrap.classList.toggle('is-bad', !good);
        if (!good && ok) { field.focus(); ok = false; }
      });

      if (!ok) { setStatus(status, 'Please fill the highlighted fields.', false); return; }

      var btn = wsForm.querySelector('button[type="submit"]');
      if (btn) btn.classList.add('is-loading');

      var data = {};
      new FormData(wsForm).forEach(function (v, k) { data[k] = String(v).trim(); });

      var lines = ['Wholesale enquiry from frankginagh.com', ''];
      Object.keys(data).forEach(function (k) {
        if (data[k]) lines.push(k.charAt(0).toUpperCase() + k.slice(1) + ': ' + data[k]);
      });

      var endpoint = wsForm.getAttribute('data-endpoint');
      function done(good, msg) {
        if (btn) btn.classList.remove('is-loading');
        setStatus(status, msg, good);
        if (good) { wsForm.reset(); wsForm.querySelectorAll('.is-bad').forEach(function (el) { el.classList.remove('is-bad'); }); }
      }

      if (endpoint) {
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(); done(true, 'Thanks — we\u2019ll call you back with trade pricing today.'); })
          .catch(function () { done(false, 'That didn\u2019t send. Call 0244 360 143 and we\u2019ll take the details directly.'); });
        return;
      }

      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
      done(true, 'Thanks — we\u2019ll call you back with trade pricing today.');
    });
  }

  var newsForm = doc.getElementById('newsForm');
  if (newsForm) {
    newsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var mail = doc.getElementById('nlMail');
      var status = doc.getElementById('nlStatus');
      if (!mail.value || !mail.checkValidity()) {
        setStatus(status, 'Enter a valid email address.', false);
        mail.focus();
        return;
      }
      setStatus(status, 'You\u2019re on the list. We\u2019ll message you when new stock lands.', true);
      newsForm.reset();
    });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */
  var revealTargets = doc.querySelectorAll(
    '.cat, .pcard, .promo, .rev, .wsfig, .wsform, .storyfig, .trustgrid, .usp__list li, .visitbox, .nl, .finder__box'
  );

  if (reduce || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        setTimeout(function () { entry.target.classList.add('is-in'); }, Math.min(i, 5) * 60);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */
  var year = doc.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
