// current year in footer
(()=>{ const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear(); })();

// JobNimbus AI chat button
(() => {
  const BUTTON_SELECTOR = '[data-zenith-jobnimbus-chat]';
  const SCRIPT_SELECTOR = 'script[data-zenith-jobnimbus-widget]';

  function installChatButton() {
    if (!document.body || document.querySelector(BUTTON_SELECTOR)) return;

    const button = document.createElement('button');
    button.className = 'vidaButtonV2';
    button.setAttribute('data-vida-button-v2', '');
    button.setAttribute('data-zenith-jobnimbus-chat', '');
    button.setAttribute('data-target', 'acct1770668469919');
    button.setAttribute('data-number', '+17606421299');
    button.setAttribute('data-domain', 'https://marketinghub.jobnimbus.com');
    button.setAttribute('data-type', 'chat');
    button.setAttribute('data-text', 'Ask a Roofing Question');
    button.setAttribute('data-color', '#123B5D');
    button.setAttribute('data-text-color', '#FFFFFF');
    button.setAttribute('data-size', 'medium');
    button.setAttribute('data-font-size', '14');
    button.setAttribute('data-font-weight', '600');
    button.setAttribute('data-height', '44');
    button.setAttribute('data-padding-x', '16');
    button.setAttribute('data-border-radius', '10');
    button.setAttribute('data-icon', 'chat');
    button.setAttribute('data-icon-only', 'false');
    button.setAttribute('data-icon-size', '16');
    button.setAttribute('data-icon-position', 'left');
    button.setAttribute('data-floating', 'true');
    button.setAttribute('data-position', 'bottom-right');
    button.setAttribute('data-offset-x', '24');
    button.setAttribute('data-offset-y', '24');
    button.style.visibility = 'hidden';
    button.textContent = 'Ask a Roofing Question';
    document.body.appendChild(button);

    if (!document.querySelector(SCRIPT_SELECTOR)) {
      const script = document.createElement('script');
      script.src = 'https://marketinghub.jobnimbus.com/embed/button/v2/script.js';
      script.defer = true;
      script.setAttribute('data-domain', 'https://marketinghub.jobnimbus.com');
      script.setAttribute('data-zenith-jobnimbus-widget', '');
      document.head.appendChild(script);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installChatButton, { once: true });
  } else {
    installChatButton();
  }
})();
