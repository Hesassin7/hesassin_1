(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  const navLinks = $$('.main-nav a');
  const serviceSelect = $('#serviceSelect');
  const contactForm = $('#contactForm');
  const progress = $('#readingProgress');
  const backToTop = $('#backToTop');

  // سنة الحقوق تلقائياً.
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // قائمة الموبايل: فتح/إغلاق، إغلاق عند اختيار رابط أو الضغط خارجها أو زر Escape.
  const closeMenu = () => {
    if (!mainNav || !menuToggle) return;
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'فتح القائمة');
  };
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'إغلاق القائمة' : 'فتح القائمة');
    });
    navLinks.forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', event => {
      if (!mainNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  // انتقال سلس لأقسام الصفحة مع مراعاة إعداد تقليل الحركة.
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
      if (history.replaceState) history.replaceState(null, '', link.getAttribute('href'));
    });
  });

  // تعبئة الخدمة تلقائياً في نموذج التواصل.
  $$('[data-service]').forEach(link => {
    link.addEventListener('click', () => {
      if (serviceSelect) {
        serviceSelect.value = link.dataset.service;
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  // تأثيرات ظهور العناصر عند التمرير.
  const revealTargets = [
    '.section-heading', '.about-aside', '.about-main', '.service-row',
    '.process-steps > div', '.guide-grid > div', '.portfolio-grid article',
    '.contact-copy', '.contact-form'
  ];
  const revealItems = revealTargets.flatMap(selector => $$(selector));
  revealItems.forEach((item, index) => {
    item.classList.add('reveal-on-scroll');
    item.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
  });
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // شريط يوضح تقدم التمرير وزر العودة للأعلى.
  let ticking = false;
  const updateScrollUI = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    if (progress) progress.style.width = `${percent}%`;
    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollUI);
      ticking = true;
    }
  }, { passive: true });
  updateScrollUI();
  backToTop?.addEventListener('click', () => window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  }));

  // معرض الصور: عرض كبير، السابق/التالي، إغلاق بالنقر خارج الصورة أو Escape.
  const lightbox = $('#imageLightbox');
  const lightboxImage = $('#lightboxImage');
  const lightboxCaption = $('#lightboxCaption');
  const galleryLinks = $$('.portfolio-gallery .portfolio-image-link');
  const closeLightboxButton = $('#lightboxClose');
  const prevButton = $('#lightboxPrev');
  const nextButton = $('#lightboxNext');
  let activeImageIndex = 0;
  let lastFocusedElement = null;

  const showImage = index => {
    if (!galleryLinks.length || !lightbox) return;
    activeImageIndex = (index + galleryLinks.length) % galleryLinks.length;
    const link = galleryLinks[activeImageIndex];
    const image = $('img', link);
    lightboxImage.src = link.href;
    lightboxImage.alt = image?.alt || 'صورة من معرض الأعمال';
    const caption = link.closest('article')?.querySelector('h3')?.textContent || image?.alt || '';
    lightboxCaption.textContent = `${caption} — ${activeImageIndex + 1} / ${galleryLinks.length}`;
  };
  const openLightbox = index => {
    if (!lightbox) return;
    lastFocusedElement = document.activeElement;
    showImage(index);
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeLightboxButton?.focus();
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    if (lastFocusedElement?.focus) lastFocusedElement.focus();
  };
  galleryLinks.forEach((link, index) => {
    link.removeAttribute('target');
    link.addEventListener('click', event => {
      event.preventDefault();
      openLightbox(index);
    });
  });
  closeLightboxButton?.addEventListener('click', closeLightbox);
  prevButton?.addEventListener('click', () => showImage(activeImageIndex - 1));
  nextButton?.addEventListener('click', () => showImage(activeImageIndex + 1));
  lightbox?.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', event => {
    if (!lightbox?.classList.contains('active')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showImage(activeImageIndex + 1);
    if (event.key === 'ArrowRight') showImage(activeImageIndex - 1);
  });

  // خيار عرض مضغوط لمعرض الأعمال.
  const galleryToggle = $('#galleryViewToggle');
  const gallery = $('.portfolio-gallery');
  galleryToggle?.addEventListener('click', () => {
    const compact = gallery?.classList.toggle('compact-view') || false;
    galleryToggle.setAttribute('aria-pressed', String(compact));
    galleryToggle.textContent = compact ? 'عرض موسّع' : 'عرض مدمج';
  });

  // نموذج التواصل: تحقق من المدخلات ثم فتح رسالة واتساب بعد مراجعتها.
  contactForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const data = new FormData(contactForm);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const service = String(data.get('service') || '').trim();
    const details = String(data.get('details') || '').trim();
    const message = [
      'مرحباً، أود الاستفسار عن إحدى خدمات مكتب المهندس أحمد فرج الله.',
      `الاسم: ${name}`,
      `رقم الهاتف: ${phone || 'غير مذكور'}`,
      `الخدمة المطلوبة: ${service}`,
      `تفاصيل الطلب: ${details || 'أرغب في معرفة التفاصيل'}`
    ].join('\n');
    const whatsappUrl = `https://wa.me/201033124068?text=${encodeURIComponent(message)}`;
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.href = whatsappUrl;
  });

  // توضيح حالة الحقول أثناء الكتابة.
  $$('input, textarea, select', contactForm || document).forEach(field => {
    field.addEventListener('input', () => {
      field.classList.toggle('has-value', Boolean(field.value));
    });
    field.addEventListener('change', () => {
      field.classList.toggle('has-value', Boolean(field.value));
    });
  });

  // تفعيل سنة الحقوق حتى عند تعطيل جافاسكربت لا يؤثر على المحتوى الأساسي.
})();
