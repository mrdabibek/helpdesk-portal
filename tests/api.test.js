'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServer } = require('../server');

function request(server, path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      method,
      headers: reqHeaders
    }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: json || data });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

test('Haqiqiy REST API va SQLite Database testlari', async t => {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    let agentToken = '';
    let clientToken = '';
    let createdTicketId = null;

    let adminToken = '';

    await t.test('POST /api/auth/login - Admin sifatida dabi / 11111111 bilan kirish', async () => {
      const res = await request(server, '/api/auth/login', 'POST', {
        email: 'dabi',
        password: '11111111'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.user.name, 'Davlatbek Orzuqulov');
      assert.equal(res.body.user.role, 'admin');
      assert.equal(res.body.user.email, 'dabi@gmail.com');
      assert.ok(res.body.token);
      adminToken = res.body.token;
    });

    await t.test('POST /api/auth/login - Admin sifatida dabi@gmail.com bilan kirish', async () => {
      const res = await request(server, '/api/auth/login', 'POST', {
        email: 'dabi@gmail.com',
        password: '11111111'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.user.role, 'admin');
    });

    await t.test('POST /api/auth/login - Noto‘g‘ri parol 401 qaytaradi', async () => {
      const res = await request(server, '/api/auth/login', 'POST', {
        email: 'dabi',
        password: 'wrong_password'
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.ok, false);
    });

    await t.test('POST /api/auth/login - Agent sifatida kirish (Davlatbek Orzuqulov)', async () => {
      const res = await request(server, '/api/auth/login', 'POST', {
        email: 'davlatbek@helpdesk.uz',
        password: 'password123'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.user.name, 'Davlatbek Orzuqulov');
      assert.equal(res.body.user.role, 'agent');
      assert.ok(res.body.token);
      agentToken = res.body.token;
    });

    await t.test('POST /api/auth/register - Yangi mijoz ro‘yxatdan o‘tishi', async () => {
      const email = `testuser_${Date.now()}@domain.uz`;
      const res = await request(server, '/api/auth/register', 'POST', {
        name: 'Shohruh Mirzayev',
        email,
        password: 'password123',
        role: 'client',
        company: 'Mirzo Tech'
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.user.name, 'Shohruh Mirzayev');
      assert.equal(res.body.user.role, 'client');
      assert.ok(res.body.token);
      clientToken = res.body.token;
    });

    await t.test('GET /api/auth/me - Token orqali joriy foydalanuvchini olish', async () => {
      const res = await request(server, '/api/auth/me', 'GET', null, {
        Authorization: `Bearer ${clientToken}`
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.user.name, 'Shohruh Mirzayev');
    });

    await t.test('POST /api/tickets - Mijoz yangi haqiqiy murojaat yaratadi', async () => {
      const res = await request(server, '/api/tickets', 'POST', {
        title: 'To‘lov cheki tasdiqlanmadi',
        category: 'To‘lovlar',
        description: 'Men Click orqali to‘lov qildim, lekin balansim oshmadi. Chek ilova qildim.',
        priority: 'high',
        files: [{ name: 'click-chek.png', size: 102400 }]
      }, {
        Authorization: `Bearer ${clientToken}`
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.ticket.client, 'Shohruh Mirzayev');
      assert.equal(res.body.ticket.title, 'To‘lov cheki tasdiqlanmadi');
      createdTicketId = res.body.ticket.id;
    });

    await t.test('GET /api/tickets - Mijoz faqat o‘zining murojaatlarini ko‘radi', async () => {
      const res = await request(server, '/api/tickets', 'GET', null, {
        Authorization: `Bearer ${clientToken}`
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.ok(Array.isArray(res.body.tickets));
      assert.equal(res.body.tickets.length, 1);
      assert.equal(res.body.tickets[0].id, createdTicketId);
    });

    await t.test('GET /api/tickets - Agent barcha murojaatlarni ko‘radi', async () => {
      const res = await request(server, '/api/tickets', 'GET', null, {
        Authorization: `Bearer ${agentToken}`
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.ok(res.body.tickets.length >= 8);
      assert.ok(res.body.tickets.some(t => t.id === createdTicketId));
    });

    await t.test('POST /api/tickets/:id/reply - Agent ommaviy javob yuboradi', async () => {
      const res = await request(server, `/api/tickets/${createdTicketId}/reply`, 'POST', {
        type: 'agent',
        text: 'Assalomu alaykum! To‘lovingiz tekshirilmoqda.'
      }, {
        Authorization: `Bearer ${agentToken}`
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.ticket.messages.length, 2);
    });

    await t.test('POST /api/tickets/:id/resolve - Agent yechim taklif qiladi', async () => {
      const res = await request(server, `/api/tickets/${createdTicketId}/resolve`, 'POST', {}, {
        Authorization: `Bearer ${agentToken}`
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.ticket.status, 'solved');
    });

    await t.test('POST /api/tickets/:id/confirm - Mijoz yechimni tasdiqlaydi (murojaat yopiladi)', async () => {
      const res = await request(server, `/api/tickets/${createdTicketId}/confirm`, 'POST', {}, {
        Authorization: `Bearer ${clientToken}`
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.ticket.status, 'closed');
    });

    await t.test('GET /api/tickets - Ruxsatsiz murojaat 401 qaytaradi', async () => {
      const res = await request(server, '/api/tickets', 'GET');
      assert.equal(res.status, 401);
      assert.equal(res.body.ok, false);
    });

    await t.test('GET /api/tickets - Admin barcha murojaatlarni to‘liq ko‘radi', async () => {
      const res = await request(server, '/api/tickets', 'GET', null, {
        Authorization: `Bearer ${adminToken}`
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.ok(Array.isArray(res.body.tickets));
      assert.ok(res.body.tickets.length >= 7);
    });

    await t.test('GET /api/auth/oauth/url - Provayder konfiguratsiyasini tekshirish', async () => {
      const resG = await request(server, '/api/auth/oauth/url?provider=google', 'GET');
      assert.equal(resG.status, 200);
      assert.equal(resG.body.provider, 'google');

      const resGH = await request(server, '/api/auth/oauth/url?provider=github', 'GET');
      assert.equal(resGH.status, 200);
      assert.equal(resGH.body.provider, 'github');
    });

    await t.test('POST /api/auth/oauth - Google orqali yangi mijoz ro‘yxatdan o‘tishi', async () => {
      const res = await request(server, '/api/auth/oauth', 'POST', {
        provider: 'google',
        name: 'Google Sinovchi',
        email: 'google.tester@gmail.com'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, 'google.tester@gmail.com');
      assert.equal(res.body.user.role, 'client');
      assert.equal(res.body.user.company, 'Google Hisobi');
    });

    await t.test('POST /api/auth/oauth - GitHub orqali ro‘yxatdan o‘tish va qayta kirish', async () => {
      const res1 = await request(server, '/api/auth/oauth', 'POST', {
        provider: 'github',
        name: 'GitHub Dasturchi',
        email: 'dev@github.com'
      });
      assert.equal(res1.status, 200);
      assert.equal(res1.body.ok, true);
      const userId1 = res1.body.user.id;

      // Qayta kirganda shu userni qaytarishi
      const res2 = await request(server, '/api/auth/oauth', 'POST', {
        provider: 'github',
        name: 'GitHub Dasturchi',
        email: 'dev@github.com'
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.body.ok, true);
      assert.equal(res2.body.user.id, userId1);
    });

  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
