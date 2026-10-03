'use strict';
const API_BASE=globalThis.YORDAM_CONFIG?.apiBase||'';
const aiStates=new Map();
let aiPendingReplace=null,aiConfigured=null;
function aiState(id){if(!aiStates.has(id))aiStates.set(id,{busy:'',summary:'',suggestion:'',error:''});return aiStates.get(id);}
function paintAI(id){
  const t=currentTicket();if(!t||t.id!==id)return;
  const state=aiState(id),tools=document.querySelector('.ai-tools'),summary=document.querySelector('.ai-summary'),priv=mode==='internal';
  const disabled=state.busy||aiConfigured===false;
  const summaryButton=document.querySelector('[data-ai="summary"]');
  if(summaryButton){summaryButton.disabled=Boolean(disabled);summaryButton.innerHTML=icon('file')+(state.busy==='summary'?'Xulosa tayyorlanmoqda…':'Gemini xulosasi');}
  if(summary){summary.hidden=!state.summary&&(Boolean(tools)||!state.error);summary.textContent=state.summary||(!tools?state.error:'');}
  if(!tools)return;
  tools.innerHTML=`<div class="ai-tools-heading"><span class="ai-label">${icon('headset')}Gemini yordamchi</span><button type="button" class="btn ai-request" data-ai="draft" ${disabled||priv?'disabled':''}>${icon('message')}${state.busy==='reply'?'Taklif tayyorlanmoqda…':'Javob taklif qilish'}</button></div><p class="ai-note">${priv?'Ichki izoh Gemini’ga yuborilmaydi. Javob taklifi uchun “Mijozga javob” rejimini tanlang.':'Ommaviy yozishmalar asosida qoralama. Natijani tekshirib, o‘zingiz yuborasiz.'}</p>${state.error?`<p class="ai-error" role="alert">${esc(state.error)}</p>`:''}${state.suggestion?`<div class="ai-suggestion"><h3>Javob taklifi</h3><div class="ai-suggestion-text">${esc(state.suggestion)}</div><div class="between"><span class="ai-note">Hali mijozga yuborilmagan</span><button type="button" class="btn" data-ai="apply" ${priv||state.busy?'disabled':''}>Qoralamaga qo‘yish ${icon('arrow')}</button></div></div>`:''}<span role="status" class="ai-note">${state.busy?'Gemini javobi kutilmoqda.':aiConfigured===false?'Gemini kaliti serverda sozlanmagan.':''}</span>`;
}
function attachAI(){
  if(!route.startsWith('ticket/'))return;
  const t=currentTicket();if(!t)return;
  let changed=false;
  const heading=document.querySelector('.conversation-head');
  if(heading&&!heading.querySelector('[data-ai="summary"]')){
    const button=document.createElement('button');button.type='button';button.className='btn ai-summary-button';button.dataset.ai='summary';heading.append(button);
    const summary=document.createElement('div');summary.className='ai-summary';summary.setAttribute('role','status');summary.hidden=true;heading.after(summary);changed=true;
  }
  const tabs=document.querySelector('.composer-tabs');
  if(tabs&&!document.querySelector('.ai-tools')){const tools=document.createElement('div');tools.className='ai-tools';tabs.after(tools);changed=true;}
  if(changed)paintAI(t.id);
}
async function requestAI(task){
  const t=currentTicket();if(!t||aiState(t.id).busy||(task==='reply'&&mode==='internal'))return;
  const id=t.id,state=aiState(id);state.busy=task;state.error='';paintAI(id);
  let messages=t.messages.filter(m=>['client','agent'].includes(m.type)).slice(-12).map(m=>({type:m.type,text:m.text.slice(0,5000)}));
  while(messages.reduce((n,m)=>n+m.text.length,0)>16000&&messages.length>1)messages.shift();
  try{
    const response=await fetch(API_BASE+'/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task,title:t.title,messages}),signal:AbortSignal.timeout(70000)});
    const data=await response.json();if(!response.ok||typeof data.text!=='string')throw new Error(data.error||'Gemini javob qaytarmadi.');
    if(task==='summary')state.summary=data.text;else state.suggestion=data.text;
  }catch(error){state.error=error.name==='TimeoutError'?'Javob kelishi kechikdi. Qoralamangiz saqlangan, yana urinib ko‘ring.':error.message==='Failed to fetch'?'Server bilan aloqa yo‘q. Sahifani qayta ochib urinib ko‘ring.':error.message;}
  finally{state.busy='';paintAI(id);}
}
function applyAISuggestion(id,text){
  const t=currentTicket();if(!t||t.id!==id||mode!=='public'){toast('Taklifni qo‘yish uchun shu murojaatning ommaviy javob rejimini oching.');return;}
  drafts[id]??={};drafts[id].public=text;aiPendingReplace=null;if(dialog.open)dialog.close();render();document.getElementById('composer-text')?.focus();toast('Taklif qoralamaga qo‘yildi. Yuborishdan oldin tekshiring.');
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-ai]');if(!button)return;
  const action=button.dataset.ai,t=currentTicket();
  if(action==='summary')requestAI('summary');
  else if(action==='draft')requestAI('reply');
  else if(action==='apply'&&t&&mode==='public'){
    const text=aiState(t.id).suggestion;if(!text)return;
    if(drafts[t.id]?.public?.trim()){
      aiPendingReplace={id:t.id,text};showDialog(`<div class="dialog-icon">${icon('message')}</div><h2 id="dialog-title">Mavjud qoralamani almashtirish</h2><p>Yozgan ommaviy qoralamangiz Gemini taklifi bilan almashtiriladi. Ichki izoh qoralamasi alohida saqlanadi.</p><div class="dialog-actions"><button class="btn" data-action="close-dialog">Bekor qilish</button><button class="btn primary" data-ai="replace">Qoralamani almashtirish</button></div>`);
    }else applyAISuggestion(t.id,text);
  }else if(action==='replace'&&aiPendingReplace)applyAISuggestion(aiPendingReplace.id,aiPendingReplace.text);
});
dialog.addEventListener('close',()=>{if(!dialog.open)aiPendingReplace=null;});
new MutationObserver(attachAI).observe(app,{childList:true,subtree:true});
attachAI();
fetch(API_BASE+'/api/health',{signal:AbortSignal.timeout(70000)}).then(r=>r.ok?r.json():null).then(data=>{aiConfigured=data?.geminiConfigured??null;const t=currentTicket();if(t)paintAI(t.id);}).catch(()=>{});
