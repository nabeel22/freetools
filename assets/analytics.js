/* Basic consent mode: the Google library is not requested before consent. */
(() => {
  const ID = 'G-Q5SL2DNQ42';
  const KEY = 'freetools-analytics-consent-v1';
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const production = location.hostname === 'freetools.kianimotions.com';
  let loaded = false;
  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && ['granted', 'denied'].includes(saved.value) && Date.now() - saved.time < MAX_AGE && saved.time <= Date.now()) choice = saved.value;
  } catch { /* A blocked storage API must not enable tracking. */ }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
  window['ga-disable-' + ID] = choice !== 'granted';
  function enable() {
    if (!production || loaded) return;
    loaded = true;
    window['ga-disable-' + ID] = false;
    window.gtag('consent', 'update', {analytics_storage:'granted'});
    window.gtag('js', new Date());
    // Keep cookies on this subdomain; never send calculator inputs as events.
    window.gtag('config', ID, {cookie_domain:location.hostname, allow_google_signals:false, allow_ad_personalization_signals:false, page_location:location.origin + location.pathname});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    script.id = 'google-analytics-tag';
    document.head.append(script);
  }
  const panel = document.createElement('section');
  panel.className = 'consent-panel';
  panel.setAttribute('aria-label', 'Besuchsstatistik');
  panel.hidden = choice !== null;
  panel.innerHTML = `<div><strong>Hilf uns, FreeTools zu verbessern.</strong><p>Mit deiner Zustimmung verwenden wir Google Analytics, um Seitenaufrufe und die Nutzung der Website auszuwerten. Dabei werden Daten an Google übermittelt und Statistik-Cookies gesetzt. Deine Recheneingaben senden wir nicht. Ablehnen ist genauso einfach; der Rechner funktioniert weiterhin.</p><p class="consent-small">Du kannst deine Auswahl jederzeit unter „Datenschutzeinstellungen“ ändern. <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener noreferrer">Google-Datenschutzhinweise</a></p></div><div class="consent-actions"><button type="button" data-consent="denied">Ablehnen</button><button type="button" data-consent="granted">Statistik erlauben</button></div>`;
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'consent-settings';
  settings.textContent = 'Datenschutzeinstellungen';
  settings.addEventListener('click', () => {panel.hidden = false; panel.querySelector('button').focus();});
  function choose(value) {
    choice = value;
    try {localStorage.setItem(KEY, JSON.stringify({value, time:Date.now()}));} catch {}
    panel.hidden = true;
    if (value === 'granted') enable();
    else {
      window['ga-disable-' + ID] = true;
      // Reload unloads the library and its listeners after withdrawal.
      for (const part of document.cookie.split(';')) {
        const name = part.trim().split('=')[0];
        if (name === '_ga' || name === '_ga_Q5SL2DNQ42') {
          document.cookie = `${name}=; Max-Age=0; Path=/`;
          document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${location.hostname}`;
        }
      }
      if (loaded) location.reload();
    }
    settings.focus();
  }
  panel.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => choose(button.dataset.consent)));
  document.body.append(panel, settings);
  if (choice === 'granted') enable();
  addEventListener('storage', event => {if (event.key === KEY) location.reload();});
})();
