'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../app/app.js'),'utf8').replace(/navigate\(\);\s*$/, '');
function setup(stored = null) {
  const listeners = {}, dialogListeners = {}, elements = {'app':{}, 'dialog':{open:false,addEventListener:(name,fn)=>dialogListeners[name]=fn,close(){this.open=false;},showModal(){this.open=true;},querySelector(){return null;}},'main':{focus(){}},'composer-text':{value:''},'queue-rows':{},'queue-count':{},'queue-sort-label':{}};
  const ctx = vm.createContext({structuredClone,Intl,Date,setTimeout,clearTimeout,location:{hash:''},matchMedia:()=>({matches:false}),window:{addEventListener(){},scrollTo(){}},document:{getElementById:id=>elements[id],querySelector:()=>null,addEventListener:(name,fn)=>listeners[name]=fn},localStorage:{getItem:()=>stored,setItem(){}}});
  vm.runInContext(source,ctx);
  vm.runInContext('render=()=>{};toast=()=>{};',ctx);
  return {run:code=>vm.runInContext(code,ctx),elements,listeners,dialogListeners};
}
test('ichki izoh mijoz tarixida yo‘q va javobsizni o‘zgartirmaydi',()=>{
  const {run,elements,listeners}=setup();
  run("route='ticket/8492';mode='internal';");
  elements['composer-text'].value='Maxfiy hisob-kitob tafsiloti';
  listeners.submit({preventDefault(){},target:{id:'composer-form',reportValidity:()=>true}});
  assert.equal(run('unanswered(getTicket(8492))'),true);
  assert.equal(run("messages(getTicket(8492),true).includes('Maxfiy hisob-kitob tafsiloti')"),false);
  assert.equal(run("messages(getTicket(8492)).includes('Maxfiy hisob-kitob tafsiloti')"),true);
});
test('ommaviy javobdan keyin javobsiz filtrdan chiqadi; yangi mijoz xabari qaytaradi',()=>{
  const {run}=setup();
  run("getTicket(8492).messages.push({type:'agent',text:'Yechim',author:'Agent',time:'10:00'});");
  assert.equal(run('unanswered(getTicket(8492))'),false);
  run("getTicket(8492).messages.push({type:'client',text:'Hali ishlamadi',author:'Mijoz',time:'10:01'});");
  assert.equal(run('unanswered(getTicket(8492))'),true);
});
test('hal bo‘lgan murojaatlar kechikkan yoki javobsiz hisoblanmaydi',()=>{
  const {run}=setup();
  run("getTicket(8492).status='solved';");
  assert.equal(run('unanswered(getTicket(8492))'),false);
  assert.equal(run('overdue(getTicket(8492))'),false);
});
test('kechikkan so‘rov past ustuvorlikda ham navbat boshida',()=>{
  const {run}=setup();
  run("getTicket(8492).priority='low';filter='unanswered';sort='priority';");
  assert.equal(run('filteredTickets().slice(0,2).every(overdue)'),true);
});
test('mijoz boshqa mijozning murojaatlarini ko‘rmaydi',()=>{
  const {run}=setup();
  assert.equal(run("clientTickets().every(t=>t.client==='Azizbek Rahimov')"),true);
  run("route='client/ticket/8495'");
  assert.equal(run("clientDetail().includes('Sahifa topilmadi')"),true);
});
test('foydalanuvchi HTML matni bajarilmaydi',()=>{
  const {run}=setup();
  assert.equal(run("esc('<img src=x onerror=alert(1)>')"),'&lt;img src=x onerror=alert(1)&gt;');
});
test('buzilgan saqlangan ma’lumot xavfsiz namuna bilan almashtiriladi',()=>{
  assert.equal(setup('{bad json').run('tickets.length'),8);
  assert.equal(setup('[{"id":1}]').run('tickets.length'),8);
});


test('yaratilgan murojaat tasdig‘i qayta yuklashda to‘g‘ri raqamni saqlaydi',()=>{
  const {run,listeners}=setup();
  run("route='client/create';createDraft={title:'Yangi muammo',description:'Muammo batafsil tavsifi',category:'Hisob'};");
  listeners.submit({preventDefault(){},target:{id:'create-form',reportValidity:()=>true}});
  const id=run('lastCreated'),saved=run('JSON.stringify(tickets)');
  assert.equal(run('location.hash'),`client/created/${id}`);
  const restored=setup(saved);
  restored.run(`route='client/created/${id}';`);
  assert.ok(restored.run('createdPage()').includes(`#HD-${id}`));
  restored.run("route='client/created';");
  assert.ok(restored.run('createdPage()').includes(`#HD-${id}`));
  restored.run("route='client/created/8495';");
  assert.ok(restored.run('createdPage()').includes('Sahifa topilmadi'));
});

test('saralash o‘zgarsa ko‘rsatilgan tartib nomi ham yangilanadi',()=>{
  const {run,elements,listeners}=setup();
  run("route='queue';");
  listeners.change({target:{id:'queue-sort',value:'newest'}});
  assert.ok(elements['queue-sort-label'].innerHTML.includes('eng yangi'));
  assert.ok(elements['queue-rows'].innerHTML.indexOf('#HD-8495')<elements['queue-rows'].innerHTML.indexOf('#HD-8492'));
});

test('bekor qilish ommaviy javobni yubormaydi va qoralamani saqlaydi',()=>{
  const {run,dialogListeners}=setup();
  run("route='ticket/8492';drafts[8492]={public:'Saqlangan qoralama'};pendingReply={id:8492,text:'Saqlangan qoralama'};");
  dialogListeners.cancel();
  assert.equal(run('pendingReply'),null);
  assert.equal(run('drafts[8492].public'),'Saqlangan qoralama');
  assert.equal(run('unanswered(getTicket(8492))'),true);
});

test('eski dialog close hodisasi yangi javob ko‘rigini tozalamaydi',()=>{
  const {run,elements,dialogListeners}=setup();
  elements.dialog.open=true;
  run("pendingReply={id:8492,text:'Yangi javob'};");
  dialogListeners.close();
  assert.equal(run('pendingReply.text'),'Yangi javob');
});

test('boshqa murojaatga o‘tish xabar turini ommaviy rejimga qaytaradi',()=>{
  const {run}=setup();
  run("route='ticket/8492';mode='internal';pendingReply={id:8492,text:'Eski javob'};location.hash='#ticket/8495';navigate();");
  assert.equal(run('mode'),'public');
  assert.equal(run('pendingReply'),null);
});

test('qayta ochish mijoz xabarini navbatga qaytaradi va muddatni yangilaydi',()=>{
  const {run,elements,listeners}=setup();
  run("route='client/reopen/8472';getTicket(8472).due=0;");
  elements['reopen-reason']={value:'Muammo hali davom etmoqda'};
  listeners.submit({preventDefault(){},target:{id:'reopen-form',reportValidity:()=>true}});
  assert.equal(run("getTicket(8472).status"),'reopened');
  assert.equal(run('unanswered(getTicket(8472))'),true);
  assert.equal(run('getTicket(8472).due>Date.now()'),true);
});


test('buzilgan saqlangan fayl metadata sahifani ishdan chiqarmaydi',()=>{
  const broken=setup().run("JSON.stringify(tickets.map(t=>({...t,messages:[{type:'client',text:'Salom',files:[null]}]})))");
  const {run}=setup(broken);
  run("route='client/ticket/8492';");
  assert.ok(run('clientDetail()').includes('tolov-cheki.png'));
});
