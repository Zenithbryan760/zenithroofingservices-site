// current year in footer
(()=>{ const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear(); })();

// JobNimbus AI chat and scheduling-assistant buttons
(() => {
  const CHAT_SELECTOR = '[data-zenith-jobnimbus-chat]';
  const CALL_SELECTOR = '[data-zenith-jobnimbus-call]';
  const SCRIPT_SELECTOR = 'script[data-zenith-jobnimbus-widget]';
  let footerObserver;

  function setSharedAttributes(button) {
    button.classList.add('vidaButtonV2');
    button.setAttribute('data-vida-button-v2', '');
    button.setAttribute('data-target', 'acct1770668469919');
    button.setAttribute('data-number', '+17606421299');
    button.setAttribute('data-domain', 'https://marketinghub.jobnimbus.com');
    button.setAttribute('data-color', '#123B5D');
    button.setAttribute('data-text-color', '#FFFFFF');
    button.setAttribute('data-size', 'medium');
    button.setAttribute('data-font-size', '14');
    button.setAttribute('data-font-weight', '600');
    button.setAttribute('data-height', '44');
    button.setAttribute('data-padding-x', '16');
    button.setAttribute('data-border-radius', '10');
    button.setAttribute('data-icon-only', 'false');
    button.setAttribute('data-icon-size', '16');
    button.setAttribute('data-icon-position', 'left');
    button.setAttribute('data-position', 'bottom-right');
    button.setAttribute('data-offset-x', '24');
    button.setAttribute('data-offset-y', '24');
    button.style.visibility = 'hidden';
  }

  function installChatButton() {
    if (!document.body || document.querySelector(CHAT_SELECTOR)) return;

    const button = document.createElement('button');
    setSharedAttributes(button);
    button.setAttribute('data-zenith-jobnimbus-chat', '');
    button.setAttribute('data-type', 'chat');
    button.setAttribute('data-text', 'Ask a Roofing Question');
    button.setAttribute('data-icon', 'chat');
    button.setAttribute('data-floating', 'true');
    button.textContent = 'Ask a Roofing Question';
    document.body.appendChild(button);
  }

  function installCallButton() {
    if (document.querySelector(CALL_SELECTOR)) return true;

    const actions = document.querySelector('#site-footer .ftr-cta-actions');
    if (!actions) return false;

    const button = document.createElement('button');
    setSharedAttributes(button);
    button.classList.add('ftr-btn', 'ftr-btn-ghost', 'ftr-btn-assistant');
    button.setAttribute('data-zenith-jobnimbus-call', '');
    button.setAttribute('data-type', 'call');
    button.setAttribute('data-text', 'Call Our 24/7 Scheduling Assistant');
    button.setAttribute('data-icon', 'phone');
    button.setAttribute('data-floating', 'false');
    button.setAttribute('aria-label', 'Call the Zenith Roofing 24/7 scheduling assistant');
    button.textContent = 'Call Our 24/7 Scheduling Assistant';
    actions.appendChild(button);
    return true;
  }

  function loadWidgetScript() {
    if (document.querySelector(SCRIPT_SELECTOR)) return;

    const script = document.createElement('script');
    script.src = 'https://marketinghub.jobnimbus.com/embed/button/v2/script.js';
    script.defer = true;
    script.setAttribute('data-domain', 'https://marketinghub.jobnimbus.com');
    script.setAttribute('data-zenith-jobnimbus-widget', '');
    document.head.appendChild(script);
  }

  function installJobNimbusWidgets() {
    installChatButton();

    if (!installCallButton()) return;

    if (footerObserver) {
      footerObserver.disconnect();
      footerObserver = null;
    }
    loadWidgetScript();
  }

  // The footer is injected asynchronously on this site. Expose the initializer
  // for the include loader and watch as a fallback on pages with another loader.
  window.initFooter = installJobNimbusWidgets;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installJobNimbusWidgets, { once: true });
  } else {
    installJobNimbusWidgets();
  }

  if (!document.querySelector('#site-footer .ftr-cta-actions')) {
    footerObserver = new MutationObserver(() => {
      if (document.querySelector('#site-footer .ftr-cta-actions')) {
        installJobNimbusWidgets();
      }
    });
    footerObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
