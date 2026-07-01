/**
 * Sanjalika Water Park — Main JavaScript
 * ES6 | AOS | GSAP | Interactions
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initNavbar();
  initRipple();
  initCounters();
  initFAQ();
  initGallery();
  initRideFilter();
  initBooking();
  initNewsletter();
  initPageTransitions();
  initHeroVideo();
  initAOS();
  initGSAP();
});

/* ── Page Loader ── */
function initPageLoader() {
  const loader = document.querySelector('.page-loader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.add('page-loaded');
    }, 800);
  });

  setTimeout(() => {
    loader.classList.add('hidden');
    document.body.classList.add('page-loaded');
  }, 3000);
}

/* ── Navbar Scroll ── */
function initNavbar() {
  const nav = document.querySelector('.premium-nav');
  if (!nav) return;

  const isHome = document.body.classList.contains('home-page');
  if (isHome) nav.classList.add('nav-transparent');

  const handleScroll = () => {
    if (window.scrollY > 60) {
      nav.classList.add('nav-scrolled');
      nav.classList.remove('nav-transparent');
    } else if (isHome) {
      nav.classList.remove('nav-scrolled');
      nav.classList.add('nav-transparent');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  const toggler = nav.querySelector('.navbar-toggler');
  const collapse = nav.querySelector('.navbar-collapse');
  if (toggler && collapse) {
    collapse.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992) {
          const bsCollapse = bootstrap.Collapse.getInstance(collapse);
          if (bsCollapse) bsCollapse.hide();
        }
      });
    });
  }
}

/* ── Hero Video Fallback ── */
function initHeroVideo() {
  const video = document.querySelector('.hero-video-wrap video');
  if (!video) return;

  const fallbackSrc = 'https://cdn.coverr.co/videos/coverr-splashing-water-in-a-swimming-pool-4876/1080p.mp4';

  video.addEventListener('error', () => {
    const source = video.querySelector('source');
    if (source && !source.dataset.fallbackUsed) {
      source.src = fallbackSrc;
      source.dataset.fallbackUsed = 'true';
      video.load();
      video.play().catch(() => {});
    }
  });

  const playPromise = video.play();
  if (playPromise) {
    playPromise.catch(() => {
      document.addEventListener('click', () => video.play(), { once: true });
    });
  }
}

/* ── Ripple Effect ── */
function initRipple() {
  document.querySelectorAll('.btn-ripple').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/* ── Counter Animation ── */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ── FAQ Accordion ── */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isActive = item.classList.contains('active');

      document.querySelectorAll('.faq-item.active').forEach(i => i.classList.remove('active'));

      if (!isActive) item.classList.add('active');
    });
  });
}

/* ── Gallery Filter & Lightbox ── */
function initGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const items = grid.querySelectorAll('.gallery-item');
  const filterBtns = document.querySelectorAll('.gallery-filter');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      items.forEach(item => {
        const cat = item.dataset.category;
        const show = filter === 'all' || cat === filter;
        item.style.display = show ? '' : 'none';
        item.style.opacity = show ? '1' : '0';
      });
    });
  });

  let lightbox = document.querySelector('.lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Close lightbox"><i class="fas fa-times"></i></button>
      <img src="" alt="Gallery preview">
    `;
    document.body.appendChild(lightbox);
  }

  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  items.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

/* ── Ride Filter ── */
function initRideFilter() {
  const grid = document.querySelector('.rides-grid');
  if (!grid) return;

  const cards = grid.querySelectorAll('[data-ride-type]');
  const filterBtns = document.querySelectorAll('.ride-filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const type = card.dataset.rideType;
        const show = filter === 'all' || type === filter;
        card.style.display = show ? '' : 'none';

        if (show && typeof gsap !== 'undefined') {
          gsap.fromTo(card, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        }
      });
    });
  });
}

/* ── Booking Form ── */
function initBooking() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const prices = { adult: 45, child: 28, senior: 35, family: 120 };
  let selectedTicket = 'adult';
  let selectedDate = null;

  const ticketOptions = form.querySelectorAll('.ticket-option');
  ticketOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      ticketOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedTicket = opt.dataset.ticket;
      updateSummary();
    });
  });

  if (ticketOptions.length) ticketOptions[0].classList.add('selected');

  const calendar = form.querySelector('.calendar-grid');
  if (calendar) buildCalendar(calendar, (date) => {
    selectedDate = date;
    updateSummary();
  });

  const qtyInput = form.querySelector('#ticketQty');
  if (qtyInput) qtyInput.addEventListener('input', updateSummary);

  function updateSummary() {
    const qty = parseInt(form.querySelector('#ticketQty')?.value || 1, 10);
    const price = prices[selectedTicket] || 0;
    const subtotal = price * qty;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('summaryTicket', selectedTicket.charAt(0).toUpperCase() + selectedTicket.slice(1));
    set('summaryQty', qty);
    set('summaryDate', selectedDate || 'Not selected');
    set('summarySubtotal', `$${subtotal.toFixed(2)}`);
    set('summaryTax', `$${tax.toFixed(2)}`);
    set('summaryTotal', `$${total.toFixed(2)}`);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateBookingForm(form)) return;

    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
      const ref = 'SJ-' + Date.now().toString(36).toUpperCase();
      const refEl = modal.querySelector('#bookingRef');
      if (refEl) refEl.textContent = ref;
      modal.classList.add('active');
    }
  });

  document.querySelector('.confirmation-modal .btn-close-modal')?.addEventListener('click', () => {
    document.querySelector('.confirmation-modal')?.classList.remove('active');
    form.reset();
    selectedDate = null;
    ticketOptions.forEach(o => o.classList.remove('selected'));
    if (ticketOptions.length) ticketOptions[0].classList.add('selected');
    updateSummary();
  });

  updateSummary();
}

function buildCalendar(container, onSelect) {
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  const render = () => {
    container.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(d => {
      const el = document.createElement('div');
      el.className = 'calendar-day header';
      el.textContent = d;
      container.appendChild(el);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'calendar-day disabled';
      container.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const el = document.createElement('div');
      el.className = 'calendar-day';
      el.textContent = day;

      const date = new Date(currentYear, currentMonth, day);
      if (date < today) el.classList.add('disabled');

      el.addEventListener('click', () => {
        if (el.classList.contains('disabled')) return;
        container.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
        const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        onSelect(formatted);
      });

      container.appendChild(el);
    }
  };

  render();
}

function validateBookingForm(form) {
  let valid = true;
  const fields = [
    { id: 'fullName', rule: v => v.trim().length >= 2, msg: 'Enter your full name' },
    { id: 'email', rule: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Enter a valid email' },
    { id: 'phone', rule: v => v.trim().length >= 8, msg: 'Enter a valid phone number' }
  ];

  fields.forEach(({ id, rule, msg }) => {
    const input = form.querySelector(`#${id}`);
    const error = form.querySelector(`#${id}Error`);
    if (!input) return;

    if (!rule(input.value)) {
      input.classList.add('error');
      if (error) { error.textContent = msg; error.classList.add('show'); }
      valid = false;
    } else {
      input.classList.remove('error');
      if (error) error.classList.remove('show');
    }
  });

  return valid;
}

/* ── Contact Form ── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    ['contactName', 'contactEmail', 'contactMessage'].forEach(id => {
      const input = form.querySelector(`#${id}`);
      const error = form.querySelector(`#${id}Error`);
      if (!input.value.trim()) {
        input.classList.add('error');
        if (error) error.classList.add('show');
        valid = false;
      } else {
        input.classList.remove('error');
        if (error) error.classList.remove('show');
      }
    });

    if (valid) {
      const toast = document.createElement('div');
      toast.className = 'alert alert-success position-fixed bottom-0 end-0 m-4';
      toast.style.zIndex = '10002';
      toast.textContent = 'Message sent successfully! We will respond within 24 hours.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
      form.reset();
    }
  });
}

document.addEventListener('DOMContentLoaded', initContactForm);

/* ── Newsletter ── */
function initNewsletter() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.value.trim()) return;

      const btn = form.querySelector('button');
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Subscribed!';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
        input.value = '';
      }, 3000);
    });
  });
}

/* ── Page Transitions ── */
function initPageTransitions() {
  let transition = document.querySelector('.page-transition');
  if (!transition) {
    transition = document.createElement('div');
    transition.className = 'page-transition';
    document.body.appendChild(transition);
  }

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || link.target === '_blank') return;
    if (!href.endsWith('.html') && href !== 'index.html' && !href.match(/\.html/)) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      transition.classList.add('active');
      setTimeout(() => { window.location.href = href; }, 500);
    });
  });
}

/* ── AOS Init ── */
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
      disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }
}

/* ── GSAP Animations ── */
function initGSAP() {
  if (typeof gsap === 'undefined') return;
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const heroBadge = document.querySelector('.hero-badge');
  const heroActions = document.querySelector('.hero-actions');

  if (heroTitle) {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (heroBadge) tl.from(heroBadge, { opacity: 0, y: 30, duration: 0.8 });
    tl.from(heroTitle, { opacity: 0, y: 50, duration: 1 }, '-=0.4');
    if (heroSubtitle) tl.from(heroSubtitle, { opacity: 0, y: 30, duration: 0.8 }, '-=0.5');
    if (heroActions) tl.from(heroActions, { opacity: 0, y: 20, duration: 0.8 }, '-=0.4');
  }

  document.querySelectorAll('.section-title').forEach(title => {
    if (typeof ScrollTrigger === 'undefined') return;
    gsap.from(title, {
      scrollTrigger: { trigger: title, start: 'top 85%' },
      opacity: 0, y: 40, duration: 0.8, ease: 'power2.out'
    });
  });

  gsap.utils.toArray('.hero-float').forEach((el, i) => {
    gsap.to(el, {
      y: -30,
      duration: 3 + i,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  });
}
