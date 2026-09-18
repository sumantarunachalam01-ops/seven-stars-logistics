/**
 * SEVEN STARS LOGISTICS - QUOTE FORM CONTROLLER
 * Validates fields, calculates dimensional guidelines, and handles quotation requests.
 */

document.addEventListener('DOMContentLoaded', () => {
  const quoteForm = document.getElementById('freight-quote-form');
  if (!quoteForm) return;

  const modal = document.getElementById('quote-success-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const refCodeEl = document.getElementById('quote-ref-code');

  // Real-time validation on blur
  const requiredInputs = quoteForm.querySelectorAll('[data-required]');
  requiredInputs.forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) {
        validateField(input);
      }
    });
  });

  // Dynamic Volume / Weight ratio calculation preview
  const weightInput = document.getElementById('cargo-weight');
  const volumeInput = document.getElementById('cargo-volume');
  const previewBox = document.getElementById('density-preview');

  const updateDensityPreview = () => {
    if (!previewBox || !weightInput || !volumeInput) return;
    const w = parseFloat(weightInput.value);
    const v = parseFloat(volumeInput.value);

    if (w > 0 && v > 0) {
      const airVolumetricKg = (v * 167).toFixed(1);
      previewBox.innerHTML = `
        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.8125rem; color: #0369a1;">
          <strong>Cargo Density Assessment:</strong> Air freight chargeable weight approx. <strong>${Math.max(w, airVolumetricKg)} kg</strong> (based on 1 CBM : 167 kg IATA standard ratio). Ocean freight ratio: <strong>${v} CBM</strong>.
        </div>
      `;
      previewBox.style.display = 'block';
    } else {
      previewBox.style.display = 'none';
    }
  };

  if (weightInput && volumeInput) {
    weightInput.addEventListener('input', updateDensityPreview);
    volumeInput.addEventListener('input', updateDensityPreview);
  }

  // Handle Form Submission
  quoteForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    requiredInputs.forEach((input) => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      const firstInvalid = quoteForm.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Submit animation
    const submitBtn = quoteForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.8s linear infinite; margin-right: 8px;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"></circle>
      </svg>
      Processing Quote Request...
    `;

    // Generate realistic reference code: SSL-RFQ-YYYY-RANDOM
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `SSL-RFQ-${currentYear}-${randomNum}`;

    // Build payload for email and local storage
    const formData = new FormData(quoteForm);
    const serviceSelect = quoteForm.querySelector('#quote-service');
    const serviceName = serviceSelect ? (serviceSelect.options[serviceSelect.selectedIndex]?.text || serviceSelect.value) : 'Freight Service';
    const origin = quoteForm.querySelector('#quote-origin')?.value || 'N/A';
    const destination = quoteForm.querySelector('#quote-destination')?.value || 'N/A';

    // Email dispatch parameters (Delivers to arunachalam@sevenstarslogistics.com & info@sevenstarslogistics.com)
    formData.append('Reference Code', generatedCode);
    formData.append('_cc', 'info@sevenstarslogistics.com');
    formData.append('_subject', `[New Quote Request] ${generatedCode} - ${serviceName} (${origin} to ${destination})`);
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');

    // Asynchronously dispatch email to arunachalam@sevenstarslogistics.com with CC to info@sevenstarslogistics.com
    const emailPromise = fetch('https://formsubmit.co/ajax/arunachalam@sevenstarslogistics.com', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    }).catch(err => {
      console.warn('Email dispatch notice:', err);
    });

    // Also persist to local server backend
    const payload = Object.fromEntries(formData.entries());
    payload.referenceCode = generatedCode;
    const localPromise = fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn('Local log notice:', err);
    });

    // Complete processing and display confirmation modal
    Promise.allSettled([emailPromise, localPromise]).then(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;

      if (refCodeEl) {
        refCodeEl.textContent = generatedCode;
      }

      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      quoteForm.reset();
      if (previewBox) previewBox.style.display = 'none';
    });
  });

  // Modal Close Handlers
  if (modalClose && modal) {
    modalClose.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
});

function validateField(input) {
  const value = input.value.trim();
  const errorEl = document.getElementById(`${input.id}-error`);
  let isValid = true;
  let message = '';

  if (input.hasAttribute('data-required') && !value) {
    isValid = false;
    message = 'This field is required.';
  } else if (input.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      message = 'Please enter a valid business email address.';
    }
  } else if (input.type === 'tel' && value) {
    const phoneRegex = /^[0-9+()\-.\s]{7,20}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      message = 'Please enter a valid telephone or mobile number.';
    }
  }

  if (!isValid) {
    input.classList.add('is-invalid');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  } else {
    input.classList.remove('is-invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  return isValid;
}
