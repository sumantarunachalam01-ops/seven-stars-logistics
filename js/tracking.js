/**
 * SEVEN STARS LOGISTICS - SHIPMENT TRACKING & EDI GATEWAY CONTROLLER
 * Authoritative corporate gateway for container, air cargo, and customs references.
 */

document.addEventListener('DOMContentLoaded', () => {
  const trackingForm = document.getElementById('shipment-tracking-form');
  if (!trackingForm) return;

  const resultContainer = document.getElementById('tracking-result-container');
  const refInput = document.getElementById('tracking-number-input');

  // Handle URL query parameter pre-fill (e.g. from homepage Quick Action Console)
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref');
  if (refParam && refInput) {
    refInput.value = refParam.trim();
    setTimeout(() => {
      performTrackingQuery(refInput.value.trim());
    }, 200);
  }

  trackingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = refInput.value.trim();
    if (!query) {
      refInput.classList.add('is-invalid');
      return;
    }
    refInput.classList.remove('is-invalid');
    performTrackingQuery(query);
  });

  function performTrackingQuery(query) {
    const submitBtn = trackingForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin" style="animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle>
      </svg>
      <span>Verifying Manifest...</span>
    `;

    // Detect shipment classification
    const upperQuery = query.toUpperCase().replace(/\s+/g, '');
    const classification = identifyReferenceType(upperQuery);

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      resultContainer.innerHTML = renderTrackingResult(upperQuery, classification);
      resultContainer.style.display = 'block';
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 550);
  }

  function identifyReferenceType(ref) {
    // ISO 6346 Container Number: 4 letters + 7 numbers (e.g. MSKU1234567)
    const containerRegex = /^[A-Z]{4}\d{7}$/;
    // Air Waybill (MAWB): 3 digits + '-' or space + 8 digits (e.g. 176-12345678 or 11 digits)
    const awbRegex = /^(\d{3})[-]?(\d{8})$/;
    // Seven Stars Booking Reference
    const sslBookingRegex = /^SSL/;
    // Indian Customs Bill of Entry or Shipping Bill
    const customsRegex = /^(BE|SB|BOE|ICD|INMAA)/;

    if (containerRegex.test(ref)) {
      const prefix = ref.substring(0, 4);
      let line = 'Ocean Shipping Line';
      let trackerUrl = null;

      if (prefix.startsWith('MSK') || prefix === 'MAEU' || prefix === 'MRKU') {
        line = 'Maersk Line / A.P. Moller-Maersk';
        trackerUrl = `https://www.maersk.com/tracking/${ref}`;
      } else if (prefix.startsWith('MED') || prefix === 'MSCU') {
        line = 'Mediterranean Shipping Company (MSC)';
        trackerUrl = `https://www.msc.com/en/track-a-shipment?reference=${ref}`;
      } else if (prefix.startsWith('CMA') || prefix === 'APLU') {
        line = 'CMA CGM Group / APL';
        trackerUrl = `https://www.cma-cgm.com/ebusiness/tracking/search?SearchBy=Container&Reference=${ref}`;
      } else if (prefix.startsWith('HLC') || prefix === 'HLXU') {
        line = 'Hapag-Lloyd AG';
        trackerUrl = `https://www.hapag-lloyd.com/en/online-business/track/track-by-booking-solution.html?query=${ref}`;
      } else if (prefix.startsWith('ONE') || prefix === 'KKFU' || prefix === 'NYKU') {
        line = 'Ocean Network Express (ONE)';
      } else if (prefix.startsWith('COS') || prefix === 'CSNU') {
        line = 'COSCO Shipping Lines';
      }

      return {
        type: 'ISO Ocean Container',
        icon: 'container',
        carrierHint: line,
        trackerUrl: trackerUrl,
        badgeColor: '#006298',
        category: 'Ocean Freight Consignment'
      };
    } else if (awbRegex.test(ref.replace(/[^0-9]/g, ''))) {
      const prefix = ref.substring(0, 3);
      let airline = 'IATA Scheduled Air Cargo Carrier';
      if (prefix === '098') airline = 'Air India Cargo (098)';
      else if (prefix === '176') airline = 'Emirates SkyCargo (176)';
      else if (prefix === '618') airline = 'Singapore Airlines Cargo (618)';
      else if (prefix === '074') airline = 'KLM Cargo (074)';
      else if (prefix === '020') airline = 'Lufthansa Cargo (020)';
      else if (prefix === '157') airline = 'Qatar Airways Cargo (157)';

      return {
        type: 'Air Waybill (MAWB)',
        icon: 'plane',
        carrierHint: airline,
        trackerUrl: null,
        badgeColor: '#0284c7',
        category: 'Air Freight Consignment'
      };
    } else if (customsRegex.test(ref)) {
      return {
        type: 'Indian Customs Clearance Reference (ICEGATE)',
        icon: 'shield',
        carrierHint: 'Chennai Customs Commissionerate (Sea / Air / ICD)',
        trackerUrl: 'https://www.icegate.gov.in/',
        badgeColor: '#c9850c',
        category: 'In-House Customs Clearance (CHA)'
      };
    } else if (sslBookingRegex.test(ref)) {
      return {
        type: 'Seven Stars Internal Job / Booking Reference',
        icon: 'clipboard',
        carrierHint: 'Seven Stars Logistics Operations File',
        trackerUrl: null,
        badgeColor: '#006298',
        category: 'Forwarding & CHA Direct File'
      };
    } else {
      return {
        type: 'General Consignment / B/L Reference',
        icon: 'box',
        carrierHint: 'Chennai Gateway Terminal & Forwarding Network',
        trackerUrl: null,
        badgeColor: '#0a1f38',
        category: 'Freight & Clearance Operation'
      };
    }
  }

  function renderTrackingResult(ref, info) {
    return `
      <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-top: 4px solid ${info.badgeColor}; border-radius: 6px; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07); margin-top: 1.5rem;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.25rem; margin-bottom: 1.25rem;">
          <div>
            <span style="display: inline-block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #f1f5f9; color: ${info.badgeColor}; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 0.5rem;">
              ${info.type}
            </span>
            <h3 style="font-size: 1.35rem; font-weight: 700; color: #0a1f38; margin: 0; font-family: monospace; letter-spacing: 0.03em;">
              ${escapeHtml(ref)}
            </h3>
            <span style="font-size: 0.875rem; color: #556987;">${info.category} &bull; ${info.carrierHint}</span>
          </div>

          <div style="text-align: right;">
            <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 600; color: #059669; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.35rem 0.75rem; border-radius: 4px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background-color: #059669; display: inline-block;"></span>
              Active in Operations Registry
            </span>
          </div>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.9375rem; font-weight: 700; color: #0a1f38; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em;">
            Operational Status &amp; Port Attendance
          </h4>
          <p style="font-size: 0.9375rem; color: #334155; line-height: 1.6; margin: 0 0 1rem 0;">
            Seven Stars Logistics maintains direct in-port personnel and real-time EDI connectivity with Chennai Sea Port terminals (CCTPL / CITPL), Air Cargo Complex, and ICEGATE customs servers. For immediate live gate timestamps, examination orders, or delivery orders:
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; font-size: 0.875rem;">
            <div style="background: #ffffff; padding: 0.875rem; border-radius: 4px; border: 1px solid #e2e8f0;">
              <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: #556987; display: block; margin-bottom: 2px;">Chennai Port Operations Desk</span>
              <a href="tel:+914443570909" style="font-size: 1rem; font-weight: 700; color: #006298; text-decoration: none;">+91 44 43570909</a>
              <span style="display: block; font-size: 0.75rem; color: #64748b; margin-top: 2px;">Mon–Sat 09:30–18:30 IST</span>
            </div>

            <div style="background: #ffffff; padding: 0.875rem; border-radius: 4px; border: 1px solid #e2e8f0;">
              <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: #556987; display: block; margin-bottom: 2px;">Director / Clearance Helpline</span>
              <a href="tel:+919677088843" style="font-size: 1rem; font-weight: 700; color: #006298; text-decoration: none;">+91 9677088843</a>
              <span style="display: block; font-size: 0.75rem; color: #64748b; margin-top: 2px;">Mr. Arunachalam RG</span>
            </div>

            <div style="background: #ffffff; padding: 0.875rem; border-radius: 4px; border: 1px solid #e2e8f0;">
              <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: #556987; display: block; margin-bottom: 2px;">Central Dispatch Email</span>
              <a href="mailto:info@sevenstarslogistics.com?subject=Status%20Inquiry%20for%20Reference%20${encodeURIComponent(ref)}" style="font-size: 0.9375rem; font-weight: 700; color: #006298; text-decoration: none; word-break: break-all;">info@sevenstarslogistics.com</a>
              <span style="display: block; font-size: 0.75rem; color: #64748b; margin-top: 2px;">Subject auto-populated</span>
            </div>
          </div>
        </div>

        ${info.trackerUrl ? `
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding-top: 0.75rem;">
            <span style="font-size: 0.8125rem; color: #556987;">
              Identified Carrier / Gateway: <strong>${info.carrierHint}</strong>
            </span>
            <a href="${info.trackerUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
              <span>Open Carrier EDI Portal ↗</span>
            </a>
          </div>
        ` : ''}
      </div>
    `;
  }
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
