'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const vm=require('node:vm');

async function withEnv(values,run){
  const previous=Object.fromEntries(Object.keys(values).map(key=>[key,process.env[key]]));
  for(const [key,value] of Object.entries(values))value===undefined?delete process.env[key]:process.env[key]=value;
  try{return await run();}
  finally{for(const [key,value] of Object.entries(previous))value===undefined?delete process.env[key]:process.env[key]=value;}
}
function request(server,url,method='GET',headers={}){
  return new Promise((resolve,reject)=>{
    const req=http.request({hostname:'127.0.0.1',port:server.address().port,path:url,method,headers},res=>{
      let body='';res.setEncoding('utf8');res.on('data',chunk=>body+=chunk);
      res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
    });
    req.on('error',reject);req.end();
  });
}

test('production health, CORS va yopiq statik fayllar',async t=>{
  await withEnv({CORS_ORIGINS:'https://yordam.vercel.app',NODE_ENV:'production'},async()=>{
    const {createServer}=require('../server');
    const server=createServer();
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    try{
      await t.test('health endpointlari GET va HEAD uchun 200 va no-store',async()=>{
        for(const endpoint of ['/health','/ping','/api/health'])for(const method of ['GET','HEAD']){
          const response=await request(server,endpoint,method);
          assert.equal(response.status,200,`${method} ${endpoint}`);
          assert.equal(response.headers['cache-control'],'no-store');
          if(method==='HEAD')assert.equal(response.body,'');
        }
      });
      await t.test('aniq allowlist va HTTPS same-host origin ruxsat oladi',async()=>{
        const allowed=await request(server,'/api/health','GET',{Origin:'https://yordam.vercel.app'});
        assert.equal(allowed.status,200);
        assert.equal(allowed.headers['access-control-allow-origin'],'https://yordam.vercel.app');
        const sameHost=await request(server,'/api/health','GET',{Host:'yordam.onrender.com',Origin:'https://yordam.onrender.com','X-Forwarded-Proto':'https'});
        assert.equal(sameHost.status,200);
      });
      await t.test('noma’lum, localhost va allowlistga o‘xshash origin rad etiladi',async()=>{
        for(const origin of ['https://unknown.example','http://localhost:5173','https://yordam.vercel.app.evil.example']){
          const response=await request(server,'/api/health','GET',{Origin:origin});
          assert.equal(response.status,403,origin);
          assert.equal(response.headers['access-control-allow-origin'],undefined);
        }
      });
      await t.test('AI preflight aniq origin, metodlar va Content-Type beradi',async()=>{
        const response=await request(server,'/api/ai','OPTIONS',{Origin:'https://yordam.vercel.app','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'});
        assert.equal(response.status,204);
        assert.equal(response.body,'');
        assert.equal(response.headers['access-control-allow-origin'],'https://yordam.vercel.app');
        assert.deepEqual(response.headers['access-control-allow-methods'].split(',').map(x=>x.trim()).sort(),['POST','GET','HEAD','OPTIONS'].sort());
        assert.equal(response.headers['access-control-allow-headers'].toLowerCase(),'content-type');
        const denied=await request(server,'/api/ai','OPTIONS',{Origin:'https://unknown.example','Access-Control-Request-Method':'POST'});
        assert.equal(denied.status,403);
        assert.equal(denied.headers['access-control-allow-origin'],undefined);
      });
      await t.test('preflight so‘ralmagan metod va headerlarni ochmaydi',async()=>{
        const base={Origin:'https://yordam.vercel.app'};
        assert.equal((await request(server,'/api/ai','OPTIONS',{...base,'Access-Control-Request-Method':'DELETE'})).status,405);
        assert.equal((await request(server,'/api/ai','OPTIONS',{...base,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type, authorization'})).status,400);
      });
      await t.test('server va env fayllari ommaviy berilmaydi',async()=>{
        for(const endpoint of ['/.env','/server.js'])assert.equal((await request(server,endpoint)).status,403);
      });
    }finally{await new Promise(resolve=>server.close(resolve));}
  });
});

test('frontend build faqat ommaviy aktivlar va API manzilini chiqaradi',async()=>{
  const {buildFrontend}=require('../scripts/build-frontend');
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'yordam-deploy-'));
  try{
    await withEnv({BACKEND_URL:'https://example.onrender.com',NODE_ENV:'production',VERCEL:undefined},()=>buildFrontend(output));
    for(const file of ['index.html','app/index.html','app/config.js','app/app.js','app/style.css','app/ai.js','app/ai.css','docs/07_Handoff_Spetsifikatsiyasi.md','figma_assets/yordam-ui-kit.svg'])assert.ok((await fs.stat(path.join(output,file))).isFile(),file);
    const config=await fs.readFile(path.join(output,'app/config.js'),'utf8');
    const context=vm.createContext({});vm.runInContext(config,context);
    assert.equal(context.YORDAM_CONFIG.apiBase,'https://example.onrender.com');
    assert.deepEqual(Object.keys(context.YORDAM_CONFIG),['apiBase']);
    assert.equal(Object.isFrozen(context.YORDAM_CONFIG),true);
    const files=await fs.readdir(output,{recursive:true});
    for(const file of files){
      const name=String(file).replaceAll('\\','/');
      assert.ok(!/(^|\/)(\.env(?:\..*)?|gemini\.js|server\.js|tests)(\/|$)/.test(name),name);
    }
  }finally{assert.equal(path.dirname(path.resolve(output)),path.resolve(os.tmpdir()));assert.ok(path.basename(output).startsWith('yordam-'));await fs.rm(output,{recursive:true,force:true});}
});

test('production build BACKEND_URLsiz va noto‘g‘ri URL bilan to‘xtaydi',async()=>{
  const {buildFrontend}=require('../scripts/build-frontend');
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'yordam-url-test-'));
  try{
    for(const env of [{NODE_ENV:'production',VERCEL:undefined},{NODE_ENV:'development',VERCEL:'1'}]){
      await withEnv({...env,BACKEND_URL:undefined},()=>assert.rejects(async()=>buildFrontend(output)));
    }
    for(const url of ['http://external.example','https://user:pass@example.com','https://example.com?key=value','https://example.com#section','http://127.0.0.1:3002']){
      await withEnv({NODE_ENV:'production',VERCEL:undefined,BACKEND_URL:url},()=>assert.rejects(async()=>buildFrontend(output),url));
    }
    await withEnv({NODE_ENV:'development',VERCEL:undefined,BACKEND_URL:'http://127.0.0.1:3002'},async()=>{
      await buildFrontend(output);
      const config=await fs.readFile(path.join(output,'app/config.js'),'utf8');
      const context=vm.createContext({});vm.runInContext(config,context);
      assert.equal(context.YORDAM_CONFIG.apiBase,'http://127.0.0.1:3002');
    });
  }finally{assert.equal(path.dirname(path.resolve(output)),path.resolve(os.tmpdir()));assert.ok(path.basename(output).startsWith('yordam-'));await fs.rm(output,{recursive:true,force:true});}
});
