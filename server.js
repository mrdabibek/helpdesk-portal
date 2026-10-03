'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {handleGemini} = require('./gemini');
const {handleApi} = require('./api');
const {applyCors} = require('./cors');
const root = __dirname;
try { process.loadEnvFile(path.join(root,'.env')); } catch(err) { if(err.code !== 'ENOENT')console.error('Muhit sozlamalarini o‘qib bo‘lmadi.'); }
const allowed = ['app', 'prototype', 'docs', 'figma_assets', 'design_before'];
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8','.zip':'application/zip'};
function createServer() {
  return http.createServer((req, res) => {
    let url;
    try { url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400); res.end(); return; }
    const health=['/health','/ping','/api/health'].includes(url);
    if((url.startsWith('/api/')||health)&&!applyCors(req,res))return;
    if(url === '/api/ai'){
      if(req.method==='POST')handleGemini(req,res);
      else{res.writeHead(405,{'Allow':'POST, OPTIONS'});res.end();}
      return;
    }
    if(health&&['GET','HEAD'].includes(req.method)){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:JSON.stringify({ready:true,geminiConfigured:Boolean(process.env.GEMINI_API_KEY),uptime:Math.floor(process.uptime())}));return;}
    if(url.startsWith('/api/')){
      handleApi(req, res, url);
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    if (url === '/') url = '/app/index.html';
    if (url === '/style.css' || url === '/app.js') url = '/app' + url;
    const file = path.resolve(root, '.' + url);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !allowed.includes(relative.split(path.sep)[0])) {
      res.writeHead(403); res.end('Ruxsat berilmagan'); return;
    }
    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) { res.writeHead(404); res.end('Sahifa topilmadi'); return; }
      res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
    });
  });
}
function start(port) {
  if(!Number.isInteger(port)||port<1||port>65535){console.error('PORT 1–65535 oralig‘ida butun son bo‘lishi kerak.');process.exitCode=1;return;}
  const server=createServer();
  server.on('error', err => {
    if (err.code === 'EADDRINUSE' && process.env.NODE_ENV!=='production' && port < 3100) start(port + 1);
    else { console.error(err.message); process.exitCode = 1; }
  });
  const host=process.env.HOST||(process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1');
  server.listen(port, host, () => {
    console.log(`Yordam serveri: ${host}:${port}`);
    for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();});
  });
}
if(require.main === module)start(process.env.PORT?Number(process.env.PORT):3000);
module.exports={createServer};
