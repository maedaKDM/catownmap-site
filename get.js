/* Ad landing: send phones straight to their store; show both badges otherwise.
 * Unlike the share page, this page exists only to install the app, so an
 * immediate store redirect is intended. utm_* values reach Google Play as the
 * install referrer. With the App Store Connect provider token set, utm_campaign
 * (or utm_source) becomes the App Store campaign token for App Analytics.
 */
(function () {
  'use strict';
  var PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.catownmap.app';
  var APPLE_PROVIDER_TOKEN = '';
  var APP_STORE_URL = 'https://apps.apple.com/app/id6804516894';
  var params = new URLSearchParams(window.location.search);
  var ua = navigator.userAgent || '';
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  var referrer = [];
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (key) {
    var value = params.get(key);
    if (value && /^[A-Za-z0-9_.-]{1,64}$/.test(value)) referrer.push(key + '=' + value);
  });
  var playUrl = PLAY_STORE_URL + (referrer.length ? '&referrer=' + encodeURIComponent(referrer.join('&')) : '');

  var campaign = [params.get('utm_campaign'), params.get('utm_source')].filter(function (value) {
    return value && /^[A-Za-z0-9_.-]{1,40}$/.test(value);
  })[0];
  var appleUrl = APPLE_PROVIDER_TOKEN && campaign
    ? 'https://apps.apple.com/app/apple-store/id6804516894?pt=' + APPLE_PROVIDER_TOKEN + '&ct=' + campaign + '&mt=8'
    : APP_STORE_URL;

  if (params.get('stay') !== '1') {
    if (android) { window.location.replace(playUrl); return; }
    if (ios) { window.location.replace(appleUrl); return; }
  }

  var requestedLanguage = params.get('lang');
  var ja = requestedLanguage === 'ja' || (requestedLanguage !== 'en' &&
    (navigator.language || '').toLowerCase().startsWith('ja'));
  window.addEventListener('DOMContentLoaded', function () {
    function el(name) { return document.getElementById(name); }
    document.documentElement.lang = ja ? 'ja' : 'en';
    el('brand').textContent = ja ? 'ねこまちマップ' : 'Catown Map';
    el('title').textContent = ja ? 'ねこまちマップを入手' : 'Get Catown Map';
    el('lead').textContent = ja ? '街の猫を、地図でみんなと見守るアプリです。'
      : 'Find and share the cats of your town on one map.';
    document.title = el('title').textContent;
    el('appStore').href = appleUrl;
    el('googlePlay').href = playUrl;
    el('home').textContent = ja ? 'ねこまちマップについて' : 'About Catown Map';
    el('home').href = ja ? '/' : '/en';
  });
})();
