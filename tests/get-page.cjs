const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const original=fs.readFileSync('get.js','utf8');
let source=original;
const PLAY='https://play.google.com/store/apps/details?id=com.catownmap.app';
const APPLE='https://apps.apple.com/app/id6804516894';
function run(ua,{search='',lang='en-US',platform='',touch=0}={}){
 let replaced; const nodes={}; let ready;
 const location={search,replace(u){replaced=u}};
 const context={URLSearchParams,encodeURIComponent,window:{location,addEventListener(e,f){if(e==='DOMContentLoaded')ready=f}},
  navigator:{userAgent:ua,language:lang,platform,maxTouchPoints:touch},
  document:{documentElement:{},getElementById(k){return nodes[k]??={}}}};
 vm.createContext(context);vm.runInContext(source,context);
 if(ready)ready();
 return {replaced,nodes,context};
}
assert.equal(run('Mozilla/5.0 (Linux; Android 14) Instagram').replaced,PLAY);
assert.equal(run('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Instagram').replaced,APPLE);
assert.equal(run('Macintosh',{platform:'MacIntel',touch:5}).replaced,APPLE,'iPadOS desktop UA');
console.log('PASS: Android and iPhone/iPad visitors go straight to their store');

const desktop=run('Windows NT 10.0');
assert.equal(desktop.replaced,undefined);
assert.equal(desktop.nodes.appStore.href,APPLE);assert.equal(desktop.nodes.googlePlay.href,PLAY);
assert.equal(desktop.context.document.documentElement.lang,'en');
assert.equal(run('Windows NT 10.0',{lang:'ja-JP'}).context.document.documentElement.lang,'ja');
assert.equal(run('Mozilla/5.0 (Linux; Android 14)',{search:'?stay=1'}).replaced,undefined,'stay=1 previews the page');
console.log('PASS: desktop and ?stay=1 show both store badges without redirecting');

const tagged=run('Android',{search:'?utm_source=instagram&utm_medium=paid&utm_campaign=doha_launch&utm_content=ad1'}).replaced;
assert.equal(tagged,PLAY+'&referrer='+encodeURIComponent('utm_source=instagram&utm_medium=paid&utm_campaign=doha_launch&utm_content=ad1'));
const unsafe=run('Android',{search:'?utm_source=a%26b%3Dc&utm_campaign=ok&id=evil.app'}).replaced;
assert.equal(unsafe,PLAY+'&referrer='+encodeURIComponent('utm_campaign=ok'),'unsafe or unknown values are dropped');
assert.equal(run('iPhone',{search:'?utm_source=instagram'}).replaced,APPLE);
console.log('PASS: valid utm_* values reach Google Play as the install referrer; others are dropped');

source=original.replace(/var APPLE_PROVIDER_TOKEN = '[^']*';/,"var APPLE_PROVIDER_TOKEN = '123456';");
const CAMPAIGN='https://apps.apple.com/app/apple-store/id6804516894?pt=123456&ct=';
assert.equal(run('iPhone',{search:'?utm_source=instagram&utm_campaign=doha_launch'}).replaced,CAMPAIGN+'doha_launch&mt=8');
assert.equal(run('iPhone',{search:'?utm_source=instagram'}).replaced,CAMPAIGN+'instagram&mt=8','source used without campaign');
assert.equal(run('iPhone',{search:'?utm_campaign=x%26pt%3D9'}).replaced,APPLE,'unsafe campaign falls back to the plain link');
assert.equal(run('iPhone').replaced,APPLE,'untagged visits keep the plain link');
assert.equal(run('Windows NT 10.0',{search:'?utm_campaign=doha_launch'}).nodes.appStore.href,CAMPAIGN+'doha_launch&mt=8');
console.log('PASS: with a provider token, the campaign reaches App Store Connect analytics');

source=original;
const en=run('Windows NT 10.0',{search:'?stay=1&utm_campaign=doha_launch',lang:'en-US'}).nodes.langSwitch;
assert.equal(en.textContent,'日本語');assert.equal(en.href,'?stay=1&utm_campaign=doha_launch&lang=ja');
const ja=run('Windows NT 10.0',{search:'?lang=ja'}).nodes.langSwitch;
assert.equal(ja.textContent,'English');assert.equal(ja.href,'?lang=en');
console.log('PASS: the language switch keeps stay/utm_* and flips lang');
