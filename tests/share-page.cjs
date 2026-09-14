const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('go.js','utf8'), vendor=fs.readFileSync('vendor/qrcode-2.0.4.js','utf8');
const id='11111111-1111-4111-8111-111111111111';
function run(ua,lang,type='cat',value=id,configured=false,platform='',touch=0,requested=''){
 const nodes={}; const make=()=>({hidden:true,textContent:'',children:[],appendChild(x){this.children.push(x)},setAttribute(k,v){this[k]=v}});
 const location={hostname:'catownmap.com',search:`?type=${type}&id=${value}&lang=${requested}`,hash:''};
 const context={URLSearchParams,window:{location},navigator:{userAgent:ua,language:lang,platform,maxTouchPoints:touch},document:{documentElement:{},getElementById(k){return nodes[k]??=make()},createElement(tag){return {...make(),tag}}}};
 vm.createContext(context);vm.runInContext(vendor,context);
 vm.runInContext(configured?source.replace("var PLAY_STORE_URL = '';","var PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=test';").replace("var APP_STORE_URL = '';","var APP_STORE_URL = 'https://apps.apple.com/app/id123';"):source,context);
 assert.equal(location.href,undefined,'no forced redirect');return {nodes,context};
}
for(const type of ['cat','sighting'])for(const lang of ['ja-JP','en-US'])for(const configured of [false,true]){
 for(const [ua,count,desktop] of [['Android',1,false],['iPhone',1,false],['Windows NT',2,true]]){
  const {nodes:n,context:c}=run(ua,lang,type,id,configured);
  assert.equal(n.actions.hidden,false);assert.equal(n.stores.children.length,count);
  assert.equal(n.openBtn.href,`straycat://${type}/${id}`);
  assert.equal(c.document.documentElement.lang,lang==='ja-JP'?'ja':'en');
  if(desktop){assert.equal(n.desktop.hidden,false);assert.match(n.qr.innerHTML,/<svg/)}
  assert(n.stores.children.every(x=>x.tag===(configured?'a':'p')));
 }
}
assert.equal(run('Macintosh','en','cat',id,false,'MacIntel',5).nodes.stores.children.length,1);
for(const [t,i] of [['cat','bad'],['other',id],['sighting','<script>']])assert.equal(run('Android','ja',t,i).nodes.actions,undefined);
console.log('PASS: 24 platform/language/store/type scenarios, iPad and 3 invalid links; no automatic redirect');

for(const requested of ['en','ja']) {
 const result=run('Android',requested==='en'?'ja-JP':'en-US','cat',id,false,'',0,requested);
 assert.equal(result.context.document.documentElement.lang,requested);
}
assert.equal(run('Android','ja-JP','cat',id,false,'',0,'invalid').context.document.documentElement.lang,'ja');
console.log('PASS: shared language overrides browser language; invalid language falls back');
