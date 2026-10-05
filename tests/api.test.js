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

    await t.test('GET /api/auth/google/config - Google konfiguratsiyasini tekshirish', async () => {
      const res = await request(server, '/api/auth/google/config', 'GET');
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(typeof res.body.configured, 'boolean');
    });

    await t.test('POST /api/auth/google/verify - Google token orqali yangi mijoz ro‘yxatdan o‘tishi', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        email: 'google.tester@gmail.com',
        name: 'Google Sinovchi',
        sub: '1029384756',
        iss: 'https://accounts.google.com'
      })).toString('base64url');
      const fakeIdToken = `${header}.${payload}.simulated_sig`;

      const res = await request(server, '/api/auth/google/verify', 'POST', {
        credential: fakeIdToken
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, 'google.tester@gmail.com');
      assert.equal(res.body.user.role, 'client');
      assert.equal(res.body.user.company, 'Google Hisobi');
    });

    await t.test('POST /api/auth/google/verify - Qayta kirganda mavjud foydalanuvchini olish', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        email: 'google.tester@gmail.com',
        name: 'Google Sinovchi'
      })).toString('base64url');
      const fakeIdToken = `${header}.${payload}.simulated_sig`;

      const res = await request(server, '/api/auth/google/verify', 'POST', {
        credential: fakeIdToken
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.user.email, 'google.tester@gmail.com');
    });

    await t.test('POST /api/tickets va filter=all_with_closed - Murojaatlar bazada to‘liq saqlanadi va qaytariladi', async () => {
      const res = await request(server, '/api/tickets', 'POST', {
        title: 'Mening yangi muhim murojaatim',
        category: 'Texnik muammo',
        description: 'Tizimda hisobot yaratilmayapti, iltimos tekshiring.',
        priority: 'urgent'
      }, {
        Authorization: `Bearer ${clientToken}`
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.ok, true);
      const newId = res.body.ticket.id;

      // GET with all_with_closed
      const listRes = await request(server, '/api/tickets?filter=all_with_closed', 'GET', null, {
        Authorization: `Bearer ${clientToken}`
      });
      assert.equal(listRes.status, 200);
      assert.equal(listRes.body.ok, true);
      assert.ok(listRes.body.tickets.some(t => t.id === newId && t.title === 'Mening yangi muhim murojaatim'));
    });

    await t.test('POST /api/tickets - Admin murojaat yaratganda ham saqlanadi va admin ro‘yxatida ko‘rinadi', async () => {
      const res = await request(server, '/api/tickets', 'POST', {
        title: 'Admin tomonidan ochilgan sinov murojaati',
        category: 'Hisobotlar',
        description: 'Admin paneldan yuborilgan ichki murojaat tavsifi.',
        priority: 'normal'
      }, {
        Authorization: `Bearer ${adminToken}`
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.ok, true);
      const adminTicketId = res.body.ticket.id;

      const adminList = await request(server, '/api/tickets?filter=all_with_closed', 'GET', null, {
        Authorization: `Bearer ${adminToken}`
      });
      assert.equal(adminList.status, 200);
      assert.ok(adminList.body.tickets.some(t => t.id === adminTicketId));
    });

  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
