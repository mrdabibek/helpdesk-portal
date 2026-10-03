'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
function apiBase() {
  const value=(process.env.BACKEND_URL||'').trim();
  if(!value){if(process.env.NODE_ENV==='production'||process.env.VERCEL)throw new Error('Vercel build uchun BACKEND_URL kerak.');return '';}
  let url;
  try{url=new URL(value);}catch{throw new Error('BACKEND_URL to‘g‘ri URL bo‘lishi kerak.');}
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||(url.protocol!=='https:'&&!(url.protocol==='http:'&&local&&process.env.NODE_ENV!=='production'&&!process.env.VERCEL)))throw new Error('BACKEND_URL faqat HTTPS origin bo‘lishi kerak; lokal testda HTTP localhost mumkin.');
  return url.origin;
}
async function buildFrontend(outputDirectory=path.join(root,'dist')) {
  const backend=apiBase(),output=path.resolve(outputDirectory);
  const temporary=path.dirname(output)===path.resolve(os.tmpdir())&&path.basename(output).startsWith('yordam-');
  if(output!==path.join(root,'dist')&&!temporary)throw new Error('Build katalogi dist yoki alohida yordam-* test katalogi bo‘lishi kerak.');
  // Resolved target is the named build directory; source directories cannot be removed.
  fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
  for(const name of ['app','prototype','docs','figma_assets'])fs.cpSync(path.join(root,name),path.join(output,name),{recursive:true});
  fs.mkdirSync(path.join(output,'design_before'),{recursive:true});
  fs.copyFileSync(path.join(root,'design_before','desktop.png'),path.join(output,'design_before','desktop.png'));
  fs.copyFileSync(path.join(root,'app','index.html'),path.join(output,'index.html'));
  fs.writeFileSync(path.join(output,'app','config.js'),"'use strict';\nglobalThis.YORDAM_CONFIG = Object.freeze("+JSON.stringify({apiBase:backend})+");\n");
  return output;
}
if(require.main===module)buildFrontend().then(output=>console.log('Frontend build tayyor: '+output)).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={buildFrontend};
