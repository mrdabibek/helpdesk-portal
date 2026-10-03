'use strict';
const fileJobs=new Set(),fileErrors=new Map();
const selectedFiles=new WeakMap();
let attachmentURL=null;
const attachmentDB=new Promise((resolve,reject)=>{
  const request=indexedDB.open('yordam-attachments',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('files');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(new Error('Fayl saqlash xizmati ochilmadi.'));
});
attachmentDB.catch(()=>{});
async function storeAttachment(id,file){const db=await attachmentDB;await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put({name:file.name,type:file.type,blob:file},id);tx.oncomplete=resolve;tx.onerror=()=>reject(new Error('Faylni saqlash uchun joy yetarli emas.'));tx.onabort=()=>reject(new Error('Fayl saqlanmadi.'));});}
async function readAttachment(id){const db=await attachmentDB;return new Promise((resolve,reject)=>{const r=db.transaction('files').objectStore('files').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Faylni o‘qib bo‘lmadi.'));});}
document.addEventListener('change',event=>{if(event.target.id==='create-files')selectedFiles.set(event,[...event.target.files]);},true);
document.addEventListener('change',event=>{
  if(event.target.id!=='create-files')return;
  const selected=selectedFiles.get(event)||[];
  for(const file of selected){
    const entry=files.find(f=>f.name===file.name&&f.size===file.size);if(!entry||entry.id)continue;
    const id=crypto.randomUUID();entry.id=id;
    const job=storeAttachment(id,file).catch(error=>{fileErrors.set(id,error.message);const field=document.getElementById('file-error');if(field)field.textContent=error.message+' Faylni olib tashlang yoki yana biriktiring.';}).finally(()=>fileJobs.delete(job));
    fileJobs.add(job);
  }
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='create-form')return;
  const failed=()=>files.some(f=>fileErrors.has(f.id));
  if(!fileJobs.size&&!failed())return;
  event.preventDefault();event.stopImmediatePropagation();const form=event.target;
  Promise.all([...fileJobs]).then(()=>{if(failed()){const field=document.getElementById('file-error');if(field)field.textContent='Fayl saqlanmadi. Uni olib tashlang yoki qayta biriktiring.';}else if(form.isConnected)form.requestSubmit();});
},true);
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-file-id]');if(!button)return;
  try{
    const file=await readAttachment(button.dataset.fileId);if(!file)throw new Error('Fayl shu brauzerda mavjud emas. Uni qayta biriktiring.');
    if(attachmentURL)URL.revokeObjectURL(attachmentURL);attachmentURL=URL.createObjectURL(file.blob);
    const image=['image/png','image/jpeg'].includes(file.type);
    showDialog(`<div class="dialog-icon">${icon('file')}</div><h2 id="dialog-title">${esc(file.name)}</h2>${image?`<img class="attachment-preview" src="${attachmentURL}" alt="${esc(file.name)} biriktirilgan rasmi">`:'<p>PDF faylni yuklab olib ko‘rishingiz mumkin.</p>'}<div class="dialog-actions"><button class="btn" data-action="close-dialog">Yopish</button><a class="btn primary" href="${attachmentURL}" download="${esc(file.name)}">${icon('file')}Yuklab olish</a></div>`);
  }catch(error){toast(error.message);}
});
dialog.addEventListener('close',()=>{if(!dialog.open&&attachmentURL){URL.revokeObjectURL(attachmentURL);attachmentURL=null;}});
