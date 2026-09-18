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
    formData.append('_cc', 'info@sevenstarslogistics.com');
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
