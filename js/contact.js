/**
 * SEVEN STARS LOGISTICS - CONTACT PAGE CONTROLLER
 * Manages office tabs, map link switching, and contact inquiry validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initOfficeTabs();
  initContactForm();
});

function initOfficeTabs() {
  const tabs = document.querySelectorAll('.office-tab-btn');
  const cards = document.querySelectorAll('.office-card');

  if (!tabs.length || !cards.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-office');

      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      cards.forEach((c) => {
        c.classList.remove('active');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const targetCard = document.getElementById(targetId);
      if (targetCard) {
        targetCard.classList.add('active');
      }
    });
  });
}

function initContactForm() {
  const contactForm = document.getElementById('contact-inquiry-form');
  if (!contactForm) return;

  const successAlert = document.getElementById('contact-success-alert');

  // Handle URL parameters (e.g. ?ref=... from Quick Track on homepage or ?service=...)
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref') || urlParams.get('tracking');
  const serviceParam = urlParams.get('service');

  if (refParam) {
    const msgEl = document.getElementById('inquiry-message');
    if (msgEl) {
      msgEl.value = `Tracking Status Request for Shipment Ref / B/L #: ${refParam}`;
    }
    const serviceEl = document.getElementById('inquiry-service');
    if (serviceEl) {
      serviceEl.value = 'Courier & Handling';
    }
    const targetSection = document.getElementById('contact-form') || contactForm;
    if (targetSection) {
      setTimeout(() => {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    }
  } else if (serviceParam) {
    const serviceEl = document.getElementById('inquiry-service');
    if (serviceEl) {
      for (let i = 0; i < serviceEl.options.length; i++) {
        if (serviceEl.options[i].value.toLowerCase().includes(serviceParam.toLowerCase())) {
          serviceEl.selectedIndex = i;
          break;
        }
      }
    }
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    const requiredInputs = contactForm.querySelectorAll('[data-required]');

    requiredInputs.forEach((input) => {
      const val = input.value.trim();
      const err = document.getElementById(`${input.id}-error`);

      if (!val) {
        isValid = false;
        input.classList.add('is-invalid');
        if (err) {
          err.textContent = 'This field is required.';
          err.classList.add('visible');
        }
      } else if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          isValid = false;
          input.classList.add('is-invalid');
          if (err) {
            err.textContent = 'Please provide a valid email.';
            err.classList.add('visible');
          }
        } else {
          input.classList.remove('is-invalid');
          if (err) err.classList.remove('visible');
        }
      } else {
        input.classList.remove('is-invalid');
        if (err) err.classList.remove('visible');
      }
    });

    if (!isValid) return;

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending Message...';

    const formData = new FormData(contactForm);
    const senderName = contactForm.querySelector('#inquiry-name')?.value || 'Website Visitor';
    formData.append('_cc', 'info@sevenstarslogistics.com,support@sevenstarslogistics.com');
    formData.append('_subject', `[Website Inquiry] New Message from ${senderName}`);
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');

    const emailPromise = fetch('https://formsubmit.co/ajax/arunachalam@sevenstarslogistics.com', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    }).catch(err => {
      console.warn('Contact email dispatch notice:', err);
    });

    const payload = Object.fromEntries(formData.entries());
    const localPromise = fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn('Contact local log notice:', err);
    });

    Promise.allSettled([emailPromise, localPromise]).then(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      contactForm.reset();

      if (successAlert) {
        successAlert.style.display = 'block';
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

/**
 * Handle Homepage 10-Field Enquiry Form
 */
function initHomeEnquiryForm() {
  const homeForm = document.getElementById('home-enquiry-form');
  const modal = document.getElementById('form-success-modal');
  const modalClose = document.getElementById('modal-close-btn');

  const closeModal = () => {
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  if (modal) {
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  if (!homeForm) return;

  homeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!homeForm.checkValidity()) {
      homeForm.reportValidity();
      return;
    }

    const submitBtn = homeForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting Enquiry...';

    const formData = new FormData(homeForm);
    const senderName = homeForm.querySelector('#enquiry-name')?.value || 'Website Visitor';
    formData.append('_cc', 'info@sevenstarslogistics.com,support@sevenstarslogistics.com');
    formData.append('_subject', `[Commercial Enquiry] New Message from ${senderName}`);
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');

    const emailPromise = fetch('https://formsubmit.co/ajax/arunachalam@sevenstarslogistics.com', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    }).catch(err => {
      console.warn('Commercial enquiry email dispatch notice:', err);
    });

    const payload = Object.fromEntries(formData.entries());
    const localPromise = fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn('Enquiry dispatch notice:', err);
    });

    Promise.allSettled([emailPromise, localPromise]).finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      homeForm.reset();
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHomeEnquiryForm();
});
