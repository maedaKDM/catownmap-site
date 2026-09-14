/* Fill in the real product URLs when each store listing becomes public.
 * QR codes are generated locally, without sending shared IDs to a QR service.
 */
(function () {
  'use strict';
  var PLAY_STORE_URL = '';
  var APP_STORE_URL = '';
  if (window.location.hostname.toLowerCase() === 'maedakdm.github.io') {
    window.location.replace('https://catownmap.com/go' + window.location.search + window.location.hash);
    return;
  }
  var params = new URLSearchParams(window.location.search);
  var type = params.get('type'), id = params.get('id');
  var requestedLanguage = params.get('lang');
  var ja = requestedLanguage === 'ja' || (requestedLanguage !== 'en' &&
    (navigator.language || '').toLowerCase().startsWith('ja'));
  var copy = ja ? {
    brand: 'ねこまちマップ', cat: 'ねこまちマップアプリでこの猫を見る', sighting: 'ねこまちマップアプリでこの投稿を見る',
    open: 'アプリで開く',
    openHelp: '開かない場合は、ブラウザのメニューから標準ブラウザで開いてください。',
    get: 'アプリをお持ちでない方', play: 'Google Playで入手', apple: 'App Storeで入手',
    androidPending: 'Android版はストア公開準備中です。', iosPending: 'iPhone・iPad版はストア公開準備中です。',
    install: 'インストール後は、元の共有リンクをもう一度開いてください。', pending: 'ストア公開後に、ここからインストールできるようになります。',
    qrTitle: 'スマホでこのリンクを開く', qrHint: 'スマホのカメラで読み取ると、この猫・投稿への案内が開きます。', qrLabel: 'この猫・投稿への共有リンクのQRコード',
    invalid: 'この共有リンクは正しくありません', invalidHint: 'リンクが途中で切れていないか確認してください。', home: 'ねこまちマップについて'
  } : {
    brand: 'Catown Map', cat: 'View this cat in Catown Map', sighting: 'View this sighting in Catown Map',
    open: 'Open in app',
    openHelp: 'If it does not open, use the browser menu to open this page in your default browser.',
    get: 'Get Catown Map', play: 'Get it on Google Play', apple: 'Download on the App Store',
    androidPending: 'The Android app is coming to Google Play.', iosPending: 'The iPhone and iPad app is coming to the App Store.',
    install: 'After installing, open the original shared link again.', pending: 'Download links will appear here when the app is released.',
    qrTitle: 'Open this link on your phone', qrHint: 'Scan with your phone camera to open the link to this cat or sighting.', qrLabel: 'QR code for this shared cat or sighting',
    invalid: 'This shared link is invalid', invalidHint: 'Check that you received the complete link.', home: 'About Catown Map'
  };
  function el(name) { return document.getElementById(name); }
  function put(name, text) { el(name).textContent = text; }
  document.documentElement.lang = ja ? 'ja' : 'en';
  put('brand', copy.brand); put('home', copy.home); el('home').href = ja ? '/' : '/en.html';
  var valid = (type === 'cat' || type === 'sighting') && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '');
  put('title', valid ? copy[type] : copy.invalid); document.title = el('title').textContent;
  put('message', valid ? '' : copy.invalidHint);
  el('message').hidden = valid;
  if (!valid) return;
  el('actions').hidden = false; put('openBtn', copy.open);
  el('openBtn').href = 'straycat://' + type + '/' + encodeURIComponent(id);
  put('openHelp', copy.openHelp); put('getTitle', copy.get);
  var ua = navigator.userAgent || '';
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var desktop = !android && !ios, available = false;
  function store(url, label, pending) {
    var item = document.createElement(url ? 'a' : 'p');
    item.className = url ? 'button store' : 'pending'; item.textContent = url ? label : pending;
    if (url) { item.href = url; available = true; }
    el('stores').appendChild(item);
  }
  if (android || desktop) store(PLAY_STORE_URL, copy.play, copy.androidPending);
  if (ios || desktop) store(APP_STORE_URL, copy.apple, copy.iosPending);
  put('installHint', available ? copy.install : copy.pending);
  // HTTPS App/Universal Links open installed apps via the OS. No timer-based
  // installation guesses, forced custom-scheme launches or store redirects.
  if (desktop) {
    el('openBtn').hidden = true; el('openHint').hidden = true;
    if (typeof qrcode === 'function') {
      var qr = qrcode(0, 'M');
      qr.addData('https://catownmap.com/go?type=' + type + '&id=' + encodeURIComponent(id) + '&lang=' + (ja ? 'ja' : 'en')); qr.make();
      el('qr').innerHTML = qr.createSvgTag({cellSize: 4, margin: 16, scalable: true});
      el('qr').setAttribute('aria-label', copy.qrLabel);
      put('qrTitle', copy.qrTitle); put('qrHint', copy.qrHint); el('desktop').hidden = false;
    }
  }
})();
