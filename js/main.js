/**
 * SEVEN STARS LOGISTICS - CORE JAVASCRIPT
 * Production-ready Vanilla JS for Navigation, Modals, Action Bar, and Accessibility
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileDrawer();
  initActionBar();
  initBackToTop();
  initDynamicYear();
  initFaqAccordion();
  initHeroVideoAutoplay();
});

/**
 * Mobile & iOS Safari Autoplay Assurance
 */
function initHeroVideoAutoplay() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  // iOS Safari requires programmatic muted & playsInline
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  const playVideo = () => {
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Fallback for Low Power Mode: start immediately on first user touch/scroll
        const triggerPlay = () => {
          video.play().catch(() => {});
          ['touchstart', 'touchend', 'click', 'scroll'].forEach(evt => {
            window.removeEventListener(evt, triggerPlay);
          });
        };
        ['touchstart', 'touchend', 'click', 'scroll'].forEach(evt => {
          window.addEventListener(evt, triggerPlay, { once: true, passive: true });
        });
      });
    }
  };

  if (video.readyState >= 2) {
    playVideo();
  } else {
    video.addEventListener('loadeddata', playVideo, { once: true });
  }
}

/**
 * Sticky Navigation with backdrop blur on scroll
 */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * Mobile Navigation Drawer & Focus Trap
 */
function initMobileDrawer() {
  const toggleBtn = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.mobile-overlay');
  const closeBtn = document.querySelector('.mobile-drawer-close');

  if (!toggleBtn || !drawer || !overlay) return;

  const openDrawer = () => {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    toggleBtn.setAttribute('aria-expanded', 'true');
    if (closeBtn) closeBtn.focus();
  };

  const closeDrawer = () => {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.focus();
  };

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) {
      closeDrawer();
    }
  });
}

/**
 * Quick Action Bar Tab Switching
 */
function initActionBar() {
  const tabBtns = document.querySelectorAll('.action-tab-btn');
  const panes = document.querySelectorAll('.action-tab-pane');

  if (!tabBtns.length || !panes.length) return;

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      panes.forEach((p) => {
        p.classList.remove('active');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
}

/**
 * Back-to-Top Button
 */
function initBackToTop() {
  const backBtn = document.querySelector('.back-to-top');
  if (!backBtn) return;

  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Dynamic Current Year
 */
function initDynamicYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * FAQ Accordion if present on page
 */
function initFaqAccordion() {
  const accordions = document.querySelectorAll('.accordion-header');
  accordions.forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isExpanded = header.getAttribute('aria-expanded') === 'true';

      // Close all siblings
      const parent = item.parentElement;
      if (parent) {
        parent.querySelectorAll('.accordion-item').forEach((sibling) => {
          if (sibling !== item) {
            sibling.classList.remove('active');
            const h = sibling.querySelector('.accordion-header');
            if (h) h.setAttribute('aria-expanded', 'false');
          }
        });
      }

      if (isExpanded) {
        item.classList.remove('active');
        header.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/**
 * DSV-Inspired Quick Action Bar: Tabs & Quick Track Handler
 */
function initDsvActionBar() {
  const tabs = document.querySelectorAll('.dsv-tab-btn');
  const modeInput = document.getElementById('dsv-selected-mode');
  if (tabs.length && modeInput) {
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        modeInput.value = tab.getAttribute('data-mode') || 'Ocean Freight';
      });
    });
  }

  const trackBtn = document.getElementById('dsv-track-submit-btn');
  const trackInput = document.getElementById('dsv-track-num');
  if (trackBtn && trackInput) {
    const handleTrack = () => {
      const val = trackInput.value.trim();
      if (!val) {
        alert('Please enter a valid shipment reference or Bill of Lading number.');
        trackInput.focus();
        return;
      }
      window.location.href = `contact.html?ref=${encodeURIComponent(val)}#contact-form`;
    };

    trackBtn.addEventListener('click', handleTrack);
    trackInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTrack();
      }
    });
  }
}

// Call on load
document.addEventListener('DOMContentLoaded', () => {
  initDsvActionBar();
});

