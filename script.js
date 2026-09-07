/* Studio Gallì, interazioni comuni */
document.addEventListener('DOMContentLoaded', function () {

  /* barra di avanzamento lettura */
  var bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);
  window.addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });

  /* menu mobile */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* header con bordo allo scroll */
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () {
      head.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* skyline: lunghezza reale dei tracciati per il disegno */
  document.querySelectorAll('.skyline path').forEach(function (p) {
    var len = Math.ceil(p.getTotalLength());
    p.style.setProperty('--len', len);
  });

  /* contatori */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = target + suffix; return; }
    var start = performance.now();
    var dur = 1400;
    function step(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* osservatore unico per reveal, contatori, skyline, foto */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      if (el.classList.contains('skyline')) el.classList.add('drawn');
      if (el.dataset.count) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .skyline, .photo, [data-count]').forEach(function (el) {
    io.observe(el);
  });

  /* carosello aree */
  document.querySelectorAll('.carousel').forEach(function (car) {
    var track = car.querySelector('.track');
    var prev = car.querySelector('[data-dir="prev"]');
    var next = car.querySelector('[data-dir="next"]');
    if (!track) return;
    function step() {
      var card = track.querySelector('.acard');
      return card ? card.offsetWidth + 20 : 340;
    }
    function sync() {
      if (!prev || !next) return;
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    }
    if (prev) prev.addEventListener('click', function () { manuale(); track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { manuale(); track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', sync, { passive: true });
    sync();

    /* scorrimento automatico, con pausa su hover, focus, tocco e fuori schermo */
    var timer = null, inPausa = false, fermatoDaUtente = false, visibile = true;
    function avanza() {
      if (inPausa || fermatoDaUtente || !visibile || document.hidden) return;
      var fine = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      track.scrollTo({ left: fine ? 0 : track.scrollLeft + step(), behavior: 'smooth' });
    }
    function avvia() { if (!timer && !reduce) timer = setInterval(avanza, 4200); }
    function manuale() { fermatoDaUtente = true; if (pausaBtn) pausaBtn.textContent = 'Riprendi'; }

    var pausaBtn = car.querySelector('.pause');
    if (pausaBtn) {
      pausaBtn.addEventListener('click', function () {
        fermatoDaUtente = !fermatoDaUtente;
        pausaBtn.textContent = fermatoDaUtente ? 'Riprendi' : 'Pausa';
        pausaBtn.setAttribute('aria-pressed', fermatoDaUtente ? 'true' : 'false');
      });
    }
    ['mouseenter', 'focusin', 'touchstart', 'pointerdown'].forEach(function (ev) {
      car.addEventListener(ev, function () { inPausa = true; }, { passive: true });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      car.addEventListener(ev, function () { inPausa = false; }, { passive: true });
    });
    new IntersectionObserver(function (es) {
      visibile = es[0].isIntersecting;
    }, { threshold: 0.3 }).observe(car);
    avvia();
  });

  /* percorso guidato */
  var guide = document.querySelector('.guide');
  if (guide) {
    var out = guide.querySelector('.guide-out');
    var opts = guide.querySelector('.opts');
    var risposte = {
      societa: {
        t: 'Società, startup e società benefit',
        p: 'Costituzione e strutturazione societaria, governance e compliance, supporto alle operazioni early stage. È la specializzazione dello studio.',
        h: 'area-societa.html'
      },
      bilancio: {
        t: 'Bilancio, contabilità e revisione',
        p: 'Redazione del bilancio e revisione legale dei conti, inclusa la revisione degli enti locali e il reporting di sostenibilità.',
        h: 'area-bilancio.html'
      },
      fisco: {
        t: 'Consulenza fiscale e tributaria',
        p: 'Pianificazione fiscale per società e persone fisiche, assistenza nel contenzioso tributario.',
        h: 'area-fiscale.html'
      },
      valutazioni: {
        t: 'Operazioni straordinarie e valutazioni',
        p: 'Valutazioni d\u0027azienda, con l\u0027esperienza di Consulente Tecnico del Tribunale di Milano, e due diligence.',
        h: 'area-valutazioni.html'
      }
    };
    guide.addEventListener('click', function (ev) {
      var b = ev.target.closest('.opt');
      if (b && out) {
        var r = risposte[b.dataset.key];
        if (!r) return;
        out.innerHTML = '<b>' + r.t + '</b><p>' + r.p + '</p>' +
          '<a class="btn" href="' + r.h + '">Vedi l\u0027area</a> ' +
          '<button class="guide-back" type="button">Cambia risposta</button>';
        out.classList.add('show');
        if (opts) opts.style.display = 'none';
      }
      if (ev.target.classList.contains('guide-back')) {
        out.classList.remove('show');
        if (opts) opts.style.display = '';
      }
    });
  }

  /* filtri aree di attività */
  var filters = document.querySelectorAll('.filter');
  if (filters.length) {
    filters.forEach(function (f) {
      f.addEventListener('click', function () {
        filters.forEach(function (x) { x.classList.remove('on'); });
        f.classList.add('on');
        var key = f.dataset.filter;
        document.querySelectorAll('.area').forEach(function (a) {
          var show = key === 'tutti' || (a.dataset.for || '').split(' ').indexOf(key) > -1;
          a.classList.toggle('hide', !show);
        });
      });
    });
  }

  /* schede team */
  var dlg = document.getElementById('member-dialog');
  if (dlg) {
    document.querySelectorAll('.member').forEach(function (m) {
      m.addEventListener('click', function () {
        dlg.querySelector('h3').textContent = m.dataset.nome;
        dlg.querySelector('.role').textContent = m.dataset.ruolo;
        dlg.querySelector('.bio').innerHTML = m.dataset.bio;
        if (typeof dlg.showModal === 'function') dlg.showModal();
      });
    });
    dlg.querySelector('.modal-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* indirizzo email composto lato client, per limitare la raccolta automatica */
  document.querySelectorAll('a.mailto').forEach(function (a) {
    var ind = a.dataset.u + String.fromCharCode(64) + a.dataset.d;
    a.href = 'mail' + 'to:' + ind;
    a.textContent = ind;
  });

  /* banner cookie e consenso ai contenuti di terze parti */
  var consenso = null;
  try { consenso = localStorage.getItem('sg-consenso'); } catch (e) { consenso = null; }
  if (!consenso) {
    var b = document.createElement('div');
    b.className = 'cbanner show';
    b.innerHTML = '<p>Questo sito utilizza solo cookie tecnici. La mappa nella pagina Contatti è fornita da Google e viene caricata unicamente con il consenso dell\'utente. Maggiori informazioni nella <a href="cookie.html">cookie policy</a> e nell\'<a href="privacy.html">informativa privacy</a>.</p>' +
      '<span class="actions"><button type="button" class="solo">Solo cookie tecnici</button><button type="button" class="primary tutti">Accetta contenuti esterni</button></span>';
    document.body.appendChild(b);
    b.addEventListener('click', function (ev) {
      var scelta = ev.target.classList.contains('tutti') ? 'tutti' : (ev.target.classList.contains('solo') ? 'solo' : null);
      if (!scelta) return;
      try { localStorage.setItem('sg-consenso', scelta); } catch (e) {}
      b.classList.remove('show');
      if (scelta === 'tutti' && window.sgApriMappa) window.sgApriMappa();
    });
  }

  /* mappa al clic */
  var mapBtn = document.querySelector('.map-cta');
  if (mapBtn) {
    var apriMappa = function () {
      var holder = mapBtn.parentElement;
      if (!holder || holder.querySelector('iframe')) return;
      var f = document.createElement('iframe');
      f.loading = 'lazy';
      f.title = 'Mappa, Via Caradosso 18, Milano';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.src = 'https://www.google.com/maps?q=Via%20Caradosso%2018%2C%2020123%20Milano&output=embed';
      holder.appendChild(f);
      mapBtn.remove();
    };
    mapBtn.addEventListener('click', apriMappa);
    window.sgApriMappa = apriMappa;
    if (consenso === 'tutti') apriMappa();
  }
});
