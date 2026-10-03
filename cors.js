'use strict';
function originAllowed(req) {
  const origin=req.headers.origin;
  if(!origin)return true;
  let url;
  try{url=new URL(origin);}catch{return false;}
  if(url.origin!==origin||!['http:','https:'].includes(url.protocol))return false;
  if(url.host===req.headers.host&&(url.protocol==='https:'||process.env.NODE_ENV!=='production'))return true;
  return (process.env.CORS_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean).includes(origin);
}
function applyCors(req,res) {
  if(!originAllowed(req)){res.writeHead(403,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Bu so‘rovga ruxsat yo‘q.'}));return false;}
  res.setHeader('Vary','Origin');
  if(req.headers.origin)res.setHeader('Access-Control-Allow-Origin',req.headers.origin);
  if(req.method!=='OPTIONS')return true;
  const method=req.headers['access-control-request-method'];
  const headers=(req.headers['access-control-request-headers']||'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
  if(method&&!['GET','HEAD','POST'].includes(method)){res.writeHead(405);res.end();return false;}
  if(headers.some(value=>value!=='content-type')){res.writeHead(400);res.end();return false;}
  res.writeHead(204,{'Access-Control-Allow-Methods':'GET, HEAD, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'});res.end();return false;
}
module.exports={originAllowed,applyCors};
