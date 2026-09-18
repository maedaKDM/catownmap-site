const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../auth-callback.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function run(search, userAgent = 'Android', language = 'ja') {
  const elements = new Map();
  let replaced;
  vm.runInNewContext(script, {
    URL, URLSearchParams, navigator: {language, userAgent},
    document: {documentElement: {}, getElementById(id) {
      if (!elements.has(id)) elements.set(id, {removeAttribute(name) { delete this[name]; }});
      return elements.get(id);
    }},
    window: {location: {search, hash:'#access_token=must-not-forward'},
      history: {replaceState(_state, _title, path) { replaced = path; }}},
  });
  assert.equal(replaced, '/auth-callback');
  assert(!JSON.stringify([...elements]).includes('must-not-forward'));
  return elements;
}
for (const type of ['signup', 'recovery']) {
  test(`${type} reaches only the Android app as an HTTPS callback`, () => {
    const e = run(`?token_hash=one_time_token&type=${type}&redirect_to=https://evil.test&package=evil.app`);
    assert.equal(e.get('openBtn').href,
      `intent://catownmap.com/auth-callback?token_hash=one_time_token&type=${type}&locale=ja#Intent;scheme=https;package=com.catownmap.app;end`);
  });
}
test('OAuth code survives Android handoff', () => {
  assert(run('?code=oauth-code').get('openBtn').href.includes('?code=oauth-code&locale=ja#Intent;'));
});
test('non-Android uses only verified HTTPS, locale overrides browser language', () => {
  const e = run('?token_hash=one&type=recovery&locale=en', 'iPhone');
  assert.equal(e.get('openBtn').href, 'https://catownmap.com/auth-callback?token_hash=one&type=recovery&locale=en');
  assert.equal(e.get('openBtn').textContent, 'Open Catown Map');
});
for (const query of ['', '?token_hash=x', '?token_hash=x&type=unknown',
  '?token_hash=x&type=recovery&token_hash=y', '?token_hash=x&type=recovery&code=y',
  '?token_hash=x&type=recovery&type=signup', '?code=x&code=y',
  '?code=' + 'x'.repeat(2049), '?access_token=x&refresh_token=y',
  '?code=x%23Intent%3Bpackage%3Devil.app', '?error=access_denied']) {
  test(`invalid callback never silently launches the app: ${query}`, () => {
    const e = run(query);
    assert.equal(e.get('openBtn').hidden, true);
    assert.equal(e.get('openBtn').href, undefined);
  });
}
test('page retains no-referrer policy and never launches a custom auth scheme', () => {
  assert(html.includes('name="referrer" content="no-referrer"'));
  assert(!html.includes('straycat://'));
});

test('authentication fragments and unknown query fields are never handed off', () => {
  const href = run('?code=ok&access_token=secret&refresh_token=secret&redirect_to=https://evil.test').get('openBtn').href;
  assert.equal(href, 'intent://catownmap.com/auth-callback?code=ok&locale=ja#Intent;scheme=https;package=com.catownmap.app;end');
});

test('production association retains the recorded Play and upload certificates', () => {
  const associations = JSON.parse(fs.readFileSync(require('node:path').join(__dirname, '../.well-known/assetlinks.json'), 'utf8'));
  const app = associations.find(entry => entry.target.package_name === 'com.catownmap.app');
  assert(app.relation.includes('delegate_permission/common.handle_all_urls'));
  assert.equal(app.target.namespace, 'android_app');
  assert.deepEqual([...app.target.sha256_cert_fingerprints].sort(), [
    '33:C3:03:4E:19:F7:64:CC:5B:B0:33:19:89:EE:0A:59:4F:CF:79:0E:7F:0C:97:55:C8:A5:23:46:F7:D6:0C:01',
    '2E:DE:F3:30:5C:91:23:C9:89:28:35:BD:19:01:50:2B:1D:01:19:FC:99:C6:FF:F7:7D:0A:90:35:50:B6:67:BD',
  ].sort());
});
