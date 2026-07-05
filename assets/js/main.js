/**
 * Sanjalika Water Park — Main JavaScript
 * ES6 | AOS | GSAP | Premium Interactions
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initNavbar();
  initFooter();
  initSmoothScrolling();
  initScrollToTop();
  initRipple();
  initCounters();
  initFAQ();
  initGallery();
  initLightSliders();
  initRideFilter();
  initBooking();
  initDownloads();
  initNewsletter();
  initPageTransitions();
  initHeroVideo();
  initCardTilt();
  initSectionReveals();
  initResponsiveMedia();
  initAccessibilityAndSEO();
  initAOS();
  initGSAP();
});

/* Footer */
function initFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-wave" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="#05131f" d="M0,20 C240,60 480,0 720,30 C960,60 1200,10 1440,40 L1440,0 L0,0 Z"/>
      </svg>
    </div>
    <div class="footer-main">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="footer-brand"><span class="brand-mark"><i class="fas fa-water"></i></span> Sanjalika</div>
            <p class="footer-desc">Sri Lanka's premium water park experience with signature slides, resort-style facilities, all-day dining, and family-first guest care.</p>
            <div class="social-links">
              <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
              <a href="#" aria-label="Twitter"><i class="fab fa-x-twitter"></i></a>
              <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
            </div>
          </div>
          <div class="col-6 col-lg-2">
            <h5 class="footer-title">Visit</h5>
            <ul class="footer-links">
              <li><a href="park-info.html">Park Info</a></li>
              <li><a href="rides.html">Rides &amp; Slides</a></li>
              <li><a href="facilities.html">Facilities</a></li>
              <li><a href="food-zone.html">Food Zone</a></li>
            </ul>
          </div>
          <div class="col-6 col-lg-2">
            <h5 class="footer-title">Plan</h5>
            <ul class="footer-links">
              <li><a href="booking.html">Book Tickets</a></li>
              <li><a href="downloads.html">Downloads</a></li>
              <li><a href="gallery.html">Gallery</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          <div class="col-lg-4">
            <h5 class="footer-title">Guest Services</h5>
            <p class="footer-contact"><i class="fas fa-map-marker-alt"></i> 123 Coastal Road, Panadura, Sri Lanka</p>
            <p class="footer-contact"><i class="fas fa-phone"></i> <a href="tel:+94382234567">+94 38 223 4567</a></p>
            <p class="footer-contact"><i class="fas fa-envelope"></i> <a href="mailto:info@sanjalika.lk">info@sanjalika.lk</a></p>
            <div class="footer-hours">
              <span>Mon-Fri: 10 AM-6 PM</span>
              <span>Sat-Sun: 9 AM-8 PM</span>
            </div>
          </div>
        </div>
        <div class="newsletter-box mt-5 p-4 footer-newsletter">
          <div class="row align-items-center g-3">
            <div class="col-md-6"><h5 class="mb-0">Get splash deals in your inbox</h5></div>
            <div class="col-md-6">
              <form class="newsletter-form mt-0" aria-label="Footer newsletter signup">
                <input type="email" placeholder="Your email" required aria-label="Footer newsletter email">
                <button type="submit" class="btn btn-premium btn-primary-premium btn-ripple">Join</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container"><p>&copy; 2026 Sanjalika Water Park. All rights reserved. <a href="downloads.html">Policies &amp; Guides</a></p></div>
    </div>
  `;
}

/* ── Page Loader ── */
function initPageLoader() {
  const loader = document.querySelector('.aqua-preloader, .page-loader');
  if (!loader) {
    document.body.classList.remove('is-loading');
    document.body.classList.add('page-loaded');
    return;
  }

  let completed = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = () => {
    if (completed) return;
    completed = true;

    const completeUi = () => {
      loader.classList.add('is-complete', 'hidden');
      document.body.classList.remove('is-loading');
      document.body.classList.add('page-loaded');
      setTimeout(() => loader.remove(), reducedMotion ? 120 : 900);
    };

    if (window.jQuery) {
      const $loader = window.jQuery(loader);
      const $percent = $loader.find('[data-loader-percent]');
      const $bar = $loader.find('.preloader-progress-fill');

      window.jQuery({ value: parseInt($percent.text(), 10) || 90 }).animate({ value: 100 }, {
        duration: reducedMotion ? 1 : 420,
        easing: 'swing',
        step(now) {
          const value = Math.round(now);
          $percent.text(value);
          $bar.css('width', `${value}%`);
        },
        complete() {
          $loader.delay(reducedMotion ? 0 : 220).fadeOut(reducedMotion ? 1 : 720, completeUi);
        }
      });
      return;
    }

    completeUi();
  };

  if (window.jQuery) {
    const $loader = window.jQuery(loader);
    const $percent = $loader.find('[data-loader-percent]');
    const $bar = $loader.find('.preloader-progress-fill');

    window.jQuery({ value: 0 }).animate({ value: 92 }, {
      duration: reducedMotion ? 1 : 1600,
      easing: 'swing',
      step(now) {
        const value = Math.round(now);
        $percent.text(value);
        $bar.css('width', `${value}%`);
      }
    });

    window.jQuery(window).on('load', () => setTimeout(finish, reducedMotion ? 0 : 450));
  } else {
    window.addEventListener('load', () => setTimeout(finish, reducedMotion ? 0 : 450));
  }

  setTimeout(finish, 4500);
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

  const collapse = nav.querySelector('.navbar-collapse');
  const toggler = nav.querySelector('.navbar-toggler');
  if (collapse) {
    collapse.addEventListener('show.bs.collapse', () => {
      nav.classList.add('nav-menu-open');
      if (toggler) toggler.classList.add('is-active');
    });
    collapse.addEventListener('hide.bs.collapse', () => {
      nav.classList.remove('nav-menu-open');
      if (toggler) toggler.classList.remove('is-active');
    });

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

/* Smooth scrolling */
function initSmoothScrolling() {
  if (!window.jQuery) return;
  const $ = window.jQuery;
  const navOffset = () => (document.querySelector('.premium-nav')?.offsetHeight || 76) + 12;

  $('a[href^="#"]').on('click', function (e) {
    const href = $(this).attr('href');
    if (!href || href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    $('html, body').stop().animate({
      scrollTop: Math.max(0, $(target).offset().top - navOffset())
    }, 760, 'swing');
  });
}

/* Scroll to top */
function initScrollToTop() {
  if (!window.jQuery) return;
  const $ = window.jQuery;
  let $btn = $('.scroll-to-top');

  if (!$btn.length) {
    $btn = $('<button class="scroll-to-top" type="button" aria-label="Scroll to top"><i class="fas fa-arrow-up" aria-hidden="true"></i></button>');
    $('body').append($btn);
  }

  $(window).on('scroll', () => {
    $btn.toggleClass('is-visible', window.scrollY > 620);
  });

  $btn.on('click', () => {
    $('html, body').stop().animate({ scrollTop: 0 }, 760, 'swing');
  });
}

/* ── Hero Video ── */
function initHeroVideo() {
  const video = document.querySelector('.hero-video-wrap video');
  if (!video) return;

  const assets = window.SANJALIKA_ASSETS;
  const primary = assets?.videos?.primary || 'assets/videos/hero_background.mp4';
  const fallback = assets?.videos?.fallback || 'assets/videos/hero_background2.mp4';
  const poster = assets?.heroPoster || 'assets/images/Rides_&_Slides.jpg';

  video.setAttribute('poster', poster);
  let source = video.querySelector('source');
  if (!source) {
    source = document.createElement('source');
    source.type = 'video/mp4';
    video.appendChild(source);
  }
  source.src = primary;

  const fallbackImg = document.querySelector('.hero-fallback-img');
  if (fallbackImg) fallbackImg.src = poster;

  video.load();

  video.addEventListener('error', () => {
    if (source.src.includes('hero_background2')) return;
    source.src = fallback;
    video.load();
    video.play().catch(() => {});
  });

  video.addEventListener('loadeddata', () => {
    video.classList.add('video-loaded');
  });

  const playPromise = video.play();
  if (playPromise) {
    playPromise.catch(() => {
      document.addEventListener('click', () => video.play(), { once: true });
    });
  }

  const subtitle = document.querySelector('.hero-subtitle-animated');
  if (subtitle && typeof gsap !== 'undefined') {
    gsap.fromTo(subtitle,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.2, delay: 1.2, ease: 'power2.out' }
    );
  }
}

/* ── Ripple Effect ── */
function initRipple() {
  document.querySelectorAll('.btn-ripple').forEach(btn => {
    if (btn.dataset.rippleBound === 'true') return;
    btn.dataset.rippleBound = 'true';
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

/* ── Card Tilt ── */
function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
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

    if (window.jQuery) {
      window.jQuery({ value: 0 }).animate({ value: target }, {
        duration,
        easing: 'swing',
        step(now) {
          el.textContent = Math.floor(now).toLocaleString() + suffix;
        },
        complete() {
          el.textContent = target.toLocaleString() + suffix;
        }
      });
      return;
    }

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
      document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(q => q.setAttribute('aria-expanded', 'false'));
      btn.setAttribute('aria-expanded', String(!isActive));
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
        if (window.jQuery) {
          window.jQuery(item)[show ? 'fadeIn' : 'fadeOut'](260);
        } else {
          item.style.display = show ? '' : 'none';
        }
        if (show && typeof gsap !== 'undefined') {
          gsap.fromTo(item, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4 });
        }
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
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
}

/* Lightweight mobile sliders */
function initLightSliders() {
  if (!window.jQuery) return;
  const $ = window.jQuery;

  $('.row').has('.attraction-card, .facility-card, .restaurant-card, .testimonial-card').each(function () {
    const $row = $(this);
    const cardCount = $row.children('[class*="col-"]').length;
    if (cardCount < 4 || $row.closest('.booking-premium, .downloads-grid').length) return;
    $row.addClass('mobile-snap-row');
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

/* ── Toast Notifications ── */
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* ── Validation Helpers ── */
const Validators = {
  fullName(value) {
    const v = value.trim();
    if (v.length < 3) return { valid: false, msg: 'Name must be at least 3 characters' };
    if (/\d/.test(v)) return { valid: false, msg: 'Name cannot contain numbers' };
    if (!/^[a-zA-Z\s'.-]+$/.test(v)) return { valid: false, msg: 'Name contains invalid characters' };
    return { valid: true };
  },
  email(value) {
    const v = value.trim();
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!regex.test(v)) return { valid: false, msg: 'Enter a valid email address' };
    if (v.endsWith('.') || v.includes('..')) return { valid: false, msg: 'Enter a valid email address' };
    return { valid: true };
  },
  phone(value) {
    const v = value.trim();
    const intlRegex = /^\+?[1-9]\d{7,14}$/;
    const cleaned = v.replace(/[\s()-]/g, '');
    if (intlRegex.test(cleaned)) return { valid: true };
    return { valid: false, msg: 'Enter a valid phone number with country code when outside Sri Lanka' };
  },
  visitDate(value) {
    if (!value) return { valid: false, msg: 'Please select a visit date' };
    const selected = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    if (selected < today) return { valid: false, msg: 'Cannot select a past date' };
    return { valid: true };
  },
  quantity(value) {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1) return { valid: false, msg: 'Minimum 1 visitor required' };
    if (n > 20) return { valid: false, msg: 'Maximum 20 visitors allowed' };
    return { valid: true };
  },
  message(value) {
    const v = value.trim();
    if (!v) return { valid: true };
    if (v.length < 10) return { valid: false, msg: 'Message must be at least 10 characters' };
    if (v.length > 500) return { valid: false, msg: 'Message cannot exceed 500 characters' };
    return { valid: true };
  },
  terms(checked) {
    if (!checked) return { valid: false, msg: 'You must accept the terms and conditions' };
    return { valid: true };
  }
};

function setFieldState(input, result, errorEl) {
  const wrap = input.closest('.input-wrap') || input.closest('.form-group');
  const status = wrap?.querySelector('.field-status');

  if (result.valid) {
    input.classList.remove('error', 'shake');
    input.classList.add('success');
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('show'); }
    if (status) {
      status.innerHTML = '<i class="fas fa-check-circle"></i>';
      status.className = 'field-status valid';
    }
  } else {
    input.classList.remove('success');
    input.classList.add('error');
    if (errorEl) { errorEl.textContent = result.msg; errorEl.classList.add('show'); }
    if (status) {
      status.innerHTML = '<i class="fas fa-times-circle"></i>';
      status.className = 'field-status invalid';
    }
  }
  return result.valid;
}

function shakeField(input) {
  input.classList.add('shake');
  setTimeout(() => input.classList.remove('shake'), 500);
}

/* ── Premium Booking ── */
function initBooking() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const prices = { adult: 45, child: 28, family: 120, vip: 89 };
  let selectedTicket = 'adult';
  let selectedDate = null;
  let currentStep = 1;
  const totalSteps = 4;

  const ticketCards = form.querySelectorAll('.ticket-card');
  const ticketTypeInput = form.querySelector('#ticketType');
  const qtyInput = form.querySelector('#ticketQty');
  const visitDateInput = form.querySelector('#visitDate');
  const messageInput = form.querySelector('#message');
  const charCount = form.querySelector('#charCount');
  const btnPrev = form.querySelector('#btnPrev');
  const btnNext = form.querySelector('#btnNext');
  const btnSubmit = form.querySelector('#btnSubmit');
  const progressSteps = document.querySelectorAll('.progress-step');

  const todayStr = () => {
    const d = new Date();
    const offsetDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().split('T')[0];
  };

  if (visitDateInput) {
    visitDateInput.min = todayStr();
    visitDateInput.addEventListener('change', () => {
      selectedDate = visitDateInput.value;
      syncCalendarSelection(selectedDate);
      updateSummary();
      validateField('visitDate');
    });
  }

  ticketCards.forEach(card => {
    card.addEventListener('click', () => {
      ticketCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedTicket = card.dataset.ticket;
      if (ticketTypeInput) ticketTypeInput.value = selectedTicket;
      updateSummary();
      updateProgress();
    });
  });

  form.querySelector('#qtyMinus')?.addEventListener('click', () => {
    const val = Math.max(1, parseInt(qtyInput.value, 10) - 1);
    qtyInput.value = val;
    updateSummary();
    validateField('ticketQty');
  });

  form.querySelector('#qtyPlus')?.addEventListener('click', () => {
    const val = Math.min(20, parseInt(qtyInput.value, 10) + 1);
    qtyInput.value = val;
    updateSummary();
    validateField('ticketQty');
  });

  qtyInput?.addEventListener('input', () => {
    let val = parseInt(qtyInput.value, 10);
    if (isNaN(val)) val = 1;
    qtyInput.value = Math.min(20, Math.max(1, val));
    updateSummary();
    validateField('ticketQty');
  });

  messageInput?.addEventListener('input', () => {
    if (charCount) charCount.textContent = messageInput.value.length;
    validateField('message');
  });

  ['fullName', 'email', 'phone'].forEach(id => {
    const input = form.querySelector(`#${id}`);
    if (!input) return;
    input.addEventListener('input', () => validateField(id));
    input.addEventListener('blur', () => validateField(id));
  });

  form.querySelector('#terms')?.addEventListener('change', () => validateField('terms'));

  function validateField(fieldId, shake = false) {
    let result = { valid: true };
    const errorEl = form.querySelector(`#${fieldId}Error`);

    switch (fieldId) {
      case 'fullName':
        result = Validators.fullName(form.querySelector('#fullName').value);
        return setFieldState(form.querySelector('#fullName'), result, errorEl);
      case 'email':
        result = Validators.email(form.querySelector('#email').value);
        return setFieldState(form.querySelector('#email'), result, errorEl);
      case 'phone':
        result = Validators.phone(form.querySelector('#phone').value);
        return setFieldState(form.querySelector('#phone'), result, errorEl);
      case 'visitDate':
        result = Validators.visitDate(visitDateInput?.value || selectedDate);
        if (!result.valid && visitDateInput) {
          visitDateInput.classList.add('error');
          if (errorEl) { errorEl.textContent = result.msg; errorEl.classList.add('show'); }
        } else if (visitDateInput) {
          visitDateInput.classList.remove('error');
          visitDateInput.classList.add('success');
          if (errorEl) errorEl.classList.remove('show');
        }
        return result.valid;
      case 'ticketQty':
        result = Validators.quantity(qtyInput.value);
        if (!result.valid) {
          qtyInput.classList.add('error');
          if (shake) shakeField(qtyInput);
          if (errorEl) { errorEl.textContent = result.msg; errorEl.classList.add('show'); }
        } else {
          qtyInput.classList.remove('error');
          if (errorEl) errorEl.classList.remove('show');
        }
        return result.valid;
      case 'message':
        result = Validators.message(messageInput?.value || '');
        if (!result.valid && messageInput) {
          messageInput.classList.add('error');
          if (errorEl) { errorEl.textContent = result.msg; errorEl.classList.add('show'); }
        } else if (messageInput) {
          messageInput.classList.remove('error');
          if (errorEl) errorEl.classList.remove('show');
        }
        return result.valid;
      case 'terms':
        result = Validators.terms(form.querySelector('#terms')?.checked);
        if (!result.valid && errorEl) { errorEl.textContent = result.msg; errorEl.classList.add('show'); }
        else if (errorEl) errorEl.classList.remove('show');
        return result.valid;
      default:
        return true;
    }
  }

  function validateStep(step) {
    let valid = true;
    switch (step) {
      case 1:
        if (!selectedTicket) valid = false;
        if (!validateField('ticketQty', true)) valid = false;
        break;
      case 2:
        if (!validateField('visitDate', true)) valid = false;
        break;
      case 3:
        ['fullName', 'email', 'phone', 'message'].forEach(id => {
          if (!validateField(id, true)) valid = false;
        });
        break;
      case 4:
        if (!validateField('terms', true)) valid = false;
        break;
    }
    return valid;
  }

  function goToStep(step) {
    currentStep = step;
    form.querySelectorAll('.booking-step-panel').forEach(p => {
      p.classList.toggle('active', parseInt(p.dataset.panel, 10) === step);
    });
    progressSteps.forEach(s => {
      const sNum = parseInt(s.dataset.step, 10);
      s.classList.toggle('active', sNum === step);
      s.classList.toggle('completed', sNum < step);
    });
    btnPrev.disabled = step === 1;
    btnNext.hidden = step === totalSteps;
    btnSubmit.hidden = step !== totalSteps;
    updateProgress();
    updateReviewPanel();

    if (typeof gsap !== 'undefined') {
      const panel = form.querySelector(`.booking-step-panel[data-panel="${step}"]`);
      if (panel) gsap.fromTo(panel, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.4 });
    }
  }

  function updateProgress() {
    progressSteps.forEach(s => {
      const sNum = parseInt(s.dataset.step, 10);
      s.classList.toggle('completed', sNum < currentStep);
    });
  }

  btnNext?.addEventListener('click', () => {
    if (!validateStep(currentStep)) {
      showToast('Please fix the errors before continuing', 'error');
      return;
    }
    if (currentStep < totalSteps) goToStep(currentStep + 1);
  });

  btnPrev?.addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  function updateSummary() {
    const qty = parseInt(qtyInput?.value || 1, 10);
    const price = prices[selectedTicket] || 0;
    const subtotal = price * qty;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    const ticketLabel = selectedTicket.charAt(0).toUpperCase() + selectedTicket.slice(1);
    const dateLabel = selectedDate
      ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Not selected';

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('summaryTicket', ticketLabel);
    set('summaryQty', qty);
    set('summaryDate', dateLabel);
    set('summaryUnit', `$${price.toFixed(2)}`);
    set('summarySubtotal', `$${subtotal.toFixed(2)}`);
    set('summaryTax', `$${tax.toFixed(2)}`);
    set('summaryTotal', `$${total.toFixed(2)}`);
  }

  function updateReviewPanel() {
    const qty = parseInt(qtyInput?.value || 1, 10);
    const price = prices[selectedTicket] || 0;
    const total = (price * qty) * 1.05;
    const ticketLabel = selectedTicket.charAt(0).toUpperCase() + selectedTicket.slice(1);
    const dateLabel = selectedDate
      ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('reviewTicket', ticketLabel);
    set('reviewQty', qty);
    set('reviewDate', dateLabel);
    set('reviewTotal', `$${total.toFixed(2)}`);
  }

  const calendar = form.querySelector('.calendar-grid');
  let calMonth = new Date().getMonth();
  let calYear = new Date().getFullYear();

  function syncCalendarSelection(dateStr) {
    if (!calendar || !dateStr) return;
    calendar.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
    const parts = dateStr.split('-');
    const day = parseInt(parts[2], 10);
    calendar.querySelectorAll('.calendar-day:not(.header):not(.disabled)').forEach(el => {
      if (parseInt(el.textContent, 10) === day) el.classList.add('selected');
    });
  }

  function buildCalendar() {
    if (!calendar) return;
    calendar.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(d => {
      const el = document.createElement('div');
      el.className = 'calendar-day header';
      el.textContent = d;
      calendar.appendChild(el);
    });

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthLabel = document.getElementById('calMonthLabel');
    if (monthLabel) {
      monthLabel.textContent = new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'calendar-day disabled';
      calendar.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const el = document.createElement('div');
      el.className = 'calendar-day';
      el.textContent = day;
      const date = new Date(calYear, calMonth, day);
      if (date < today) el.classList.add('disabled');

      el.addEventListener('click', () => {
        if (el.classList.contains('disabled')) return;
        calendar.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
        const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        selectedDate = iso;
        if (visitDateInput) visitDateInput.value = iso;
        updateSummary();
        validateField('visitDate');
      });

      calendar.appendChild(el);
    }
  }

  form.querySelector('#calPrev')?.addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    buildCalendar();
  });

  form.querySelector('#calNext')?.addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    buildCalendar();
  });

  buildCalendar();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(4)) {
      showToast('Please accept the terms to complete booking', 'error');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.querySelector('.btn-text').hidden = true;
    btnSubmit.querySelector('.btn-loader').hidden = false;

    await new Promise(r => setTimeout(r, 1800));

    btnSubmit.disabled = false;
    btnSubmit.querySelector('.btn-text').hidden = false;
    btnSubmit.querySelector('.btn-loader').hidden = true;

    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
      const ref = 'SJ-' + Date.now().toString(36).toUpperCase();
      const refEl = modal.querySelector('#bookingRef');
      if (refEl) refEl.textContent = ref;
      modal.classList.add('active');
      showToast('Booking confirmed successfully!', 'success');
    }
  });

  document.querySelector('.confirmation-modal .btn-close-modal')?.addEventListener('click', () => {
    document.querySelector('.confirmation-modal')?.classList.remove('active');
    form.reset();
    selectedDate = null;
    selectedTicket = 'adult';
    currentStep = 1;
    ticketCards.forEach(c => c.classList.remove('selected'));
    ticketCards[0]?.classList.add('selected');
    if (ticketTypeInput) ticketTypeInput.value = 'adult';
    if (charCount) charCount.textContent = '0';
    form.querySelectorAll('.success, .error').forEach(el => el.classList.remove('success', 'error'));
    form.querySelectorAll('.form-error.show').forEach(el => el.classList.remove('show'));
    goToStep(1);
    buildCalendar();
    updateSummary();
    form.querySelector('#fullName')?.focus();
  });

  goToStep(1);
  updateSummary();
}

/* ── Downloads ── */
function initDownloads() {
  const grid = document.getElementById('downloadsGrid');
  if (!grid || !window.SANJALIKA_ASSETS) return;

  const docs = SANJALIKA_ASSETS.downloads;

  const renderCard = (doc) => `
    <article class="premium-download-card" data-category="${doc.category}" data-tilt>
      <div class="download-card-preview">
        <img src="${assetUrl(doc.preview)}" alt="${doc.title} preview" loading="lazy">
        <div class="download-preview-overlay">
          <i class="fas ${doc.icon}"></i>
        </div>
        <span class="file-type-badge badge-${doc.type.toLowerCase()}">${doc.type}</span>
      </div>
      <div class="download-card-body">
        <span class="download-category">${doc.category}</span>
        <h4>${doc.title}</h4>
        <p>${doc.description}</p>
        <div class="download-meta">
          <span><i class="fas fa-weight-hanging"></i> ${doc.size}</span>
          <span><i class="fas fa-file-lines"></i> ${doc.pages}</span>
          <span><i class="fas fa-calendar-check"></i> ${doc.updated}</span>
          <span><i class="fas fa-download"></i> ${doc.downloads.toLocaleString()} downloads</span>
        </div>
        <a href="${doc.file}" download class="btn btn-premium btn-primary-premium btn-ripple btn-download" data-doc-id="${doc.id}">
          <i class="fas fa-download"></i> Download ${doc.type}
        </a>
      </div>
      <div class="download-card-glow" aria-hidden="true"></div>
    </article>
  `;

  grid.innerHTML = docs.map(renderCard).join('');

  grid.querySelectorAll('.btn-download').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.docId;
      const doc = docs.find(d => d.id === id);
      if (doc) {
        doc.downloads++;
        showToast(`Downloading ${doc.title}...`, 'success');
      }
    });
  });

  document.querySelectorAll('.download-filter').forEach(filterBtn => {
    filterBtn.addEventListener('click', () => {
      document.querySelectorAll('.download-filter').forEach(b => b.classList.remove('active'));
      filterBtn.classList.add('active');
      const filter = filterBtn.dataset.filter;

      grid.querySelectorAll('.premium-download-card').forEach(card => {
        const cat = card.dataset.category;
        const show = filter === 'all' || cat === filter ||
          (filter === 'Brochure' && cat === 'Brochure') ||
          (filter === 'Park Map' && cat === 'Park Map') ||
          (filter === 'Visitor Guide' && (cat === 'Visitor Guide' || cat === 'Ticket Information')) ||
          (filter === 'Safety Guide' && cat === 'Safety Guide') ||
          (filter === 'Policies' && (cat === 'Policies' || cat === 'Rules & Regulations'));
        card.style.display = show ? '' : 'none';
        if (show && typeof gsap !== 'undefined') {
          gsap.fromTo(card, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 });
        }
      });
    });
  });

  initRipple();
  initCardTilt();
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
        shakeField(input);
        if (error) error.classList.add('show');
        valid = false;
      } else {
        input.classList.remove('error');
        input.classList.add('success');
        if (error) error.classList.remove('show');
      }
    });

    if (valid) {
      showToast('Message sent successfully! We will respond within 24 hours.', 'success');
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
      showToast('Successfully subscribed to our newsletter!', 'success');
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
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') ||
        href.startsWith('tel') || link.target === '_blank' || link.hasAttribute('download')) return;
    if (!href.endsWith('.html') && !href.includes('.html')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.add('is-transitioning');
      transition.classList.add('active');
      setTimeout(() => { window.location.href = href; }, 500);
    });
  });

  window.addEventListener('pageshow', () => {
    transition.classList.remove('active');
    document.body.classList.remove('is-transitioning');
  });
}

/* Section reveal fallback */
function initSectionReveals() {
  const revealables = document.querySelectorAll('.glass-card, .attraction-card, .pricing-card, .testimonial-card, .info-card, .facility-card, .restaurant-card, .premium-download-card, .newsletter-box, .cta-banner');
  if (!revealables.length) return;

  revealables.forEach(el => {
    if (!el.hasAttribute('data-aos')) el.classList.add('reveal-on-scroll');
  });

  const reveal = (el) => {
    el.classList.add('is-revealed');
    if (window.jQuery) window.jQuery(el).stop(true, true).animate({ opacity: 1 }, 420);
  };

  if (!('IntersectionObserver' in window)) {
    revealables.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
}

function initResponsiveMedia() {
  document.querySelectorAll('img:not([loading])').forEach(img => {
    if (!img.closest('.hero-section, .page-header')) img.loading = 'lazy';
  });

  document.querySelectorAll('img').forEach(img => {
    img.decoding = 'async';
  });
}

function initAccessibilityAndSEO() {
  if (!document.querySelector('meta[name="theme-color"]')) {
    const theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#05131f';
    document.head.appendChild(theme);
  }

  if (!document.querySelector('link[rel="canonical"]')) {
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.href.split('#')[0];
    document.head.appendChild(canonical);
  }

  if (!document.querySelector('script[type="application/ld+json"][data-sanjalika-schema]')) {
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.dataset.sanjalikaSchema = 'true';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AmusementPark',
      name: 'Sanjalika Water Park',
      description: 'Premium water park destination with slides, wave pools, dining, facilities, and online booking.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Coastal Road',
        addressLocality: 'Panadura',
        addressCountry: 'LK'
      },
      url: window.location.href.split('#')[0]
    });
    document.head.appendChild(schema);
  }

  document.querySelectorAll('.navbar-toggler').forEach(btn => {
    btn.setAttribute('aria-label', 'Toggle navigation menu');
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
  const heroSubtitle = document.querySelector('.hero-subtitle, .hero-subtitle-animated');
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

  gsap.utils.toArray('.hero-float, .water-bubble').forEach((el, i) => {
    gsap.to(el, {
      y: -30,
      x: i % 2 ? 15 : -15,
      duration: 3 + i * 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  });

  document.querySelectorAll('.premium-download-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card.querySelector('.download-card-preview img'), {
        scale: 1.08, duration: 0.6, ease: 'power2.out'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card.querySelector('.download-card-preview img'), {
        scale: 1, duration: 0.6, ease: 'power2.out'
      });
    });
  });
}
