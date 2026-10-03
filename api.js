'use strict';
const { createDatabase } = require('./db');

const dbInstance = createDatabase();

function parseJsonBody(req, maxSize = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxSize) {
        req.destroy();
        reject(new Error('So‘rov hajmi ruxsat etilgan limitdan oshdi (max 2MB).'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Noto‘g‘ri JSON formati: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'] || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  }
  if (!token) return null;
  return dbInstance.getUserBySession(token);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

const loginAttempts = new Map();

function checkLoginRateLimit(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return true;
  const now = Date.now();
  if (now > record.resetAt) {
    loginAttempts.delete(ip);
    return true;
  }
  return record.count < 10;
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, resetAt: now + 5 * 60 * 1000 };
  record.count += 1;
  loginAttempts.set(ip, record);
}

function resetLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

async function handleApi(req, res, url) {
  const method = req.method;
  const user = getAuthUser(req);
  const clientIp = req.socket?.remoteAddress || '127.0.0.1';

  try {
    // 1. Auth routes
    if (url === '/api/auth/register' && method === 'POST') {
      const body = await parseJsonBody(req);
      const newUser = dbInstance.createUser({
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role,
        company: body.company,
        avatar_color: body.avatar_color
      });
      const token = dbInstance.createSession(newUser.id);
      sendJson(res, 201, { ok: true, token, user: newUser });
      return;
    }

    if (url === '/api/auth/login' && method === 'POST') {
      if (!checkLoginRateLimit(clientIp)) {
        sendJson(res, 429, { ok: false, error: 'Juda ko‘p urinishlar. Xavfsizlik yuzasidan 5 daqiqadan so‘ng qayta urinib ko‘ring.' });
        return;
      }
      const body = await parseJsonBody(req);
      const verified = dbInstance.verifyUser({
        email: body.email,
        password: body.password
      });
      if (!verified) {
        recordFailedLogin(clientIp);
        sendJson(res, 401, { ok: false, error: 'Gmail/Login yoki parol noto‘g‘ri.' });
        return;
      }
      resetLoginAttempts(clientIp);
      const token = dbInstance.createSession(verified.id);
      sendJson(res, 200, { ok: true, token, user: verified });
      return;
    }

    if (url === '/api/auth/logout' && method === 'POST') {
      const authHeader = req.headers['authorization'] || req.headers['x-auth-token'] || '';
      const token = authHeader.replace(/^Bearer\s+/, '').trim();
      if (token) dbInstance.deleteSession(token);
      sendJson(res, 200, { ok: true, message: 'Tizimdan muvaffaqiyatli chiqildi.' });
      return;
    }

    if (url === '/api/auth/me' && (method === 'GET' || method === 'HEAD')) {
      if (!user) {
        sendJson(res, 200, { ok: false, user: null });
        return;
      }
      sendJson(res, 200, { ok: true, user });
      return;
    }

    // 2. Agents list
    if (url === '/api/agents' && (method === 'GET' || method === 'HEAD')) {
      const agents = dbInstance.listAgents();
      sendJson(res, 200, { ok: true, agents });
      return;
    }

    // 3. Stats
    if (url === '/api/stats' && (method === 'GET' || method === 'HEAD')) {
      const stats = dbInstance.getStats();
      sendJson(res, 200, { ok: true, stats });
      return;
    }

    // 4. Tickets collection: GET, POST
    if (url === '/api/tickets') {
      if (method === 'GET') {
        if (!user) {
          sendJson(res, 401, { ok: false, error: 'Murojaatlarni ko‘rish uchun tizimga kiring.' });
          return;
        }
        const u = new URL(req.url, 'http://localhost');
        const filter = u.searchParams.get('filter') || 'all';
        const search = u.searchParams.get('search') || '';
        const sort = u.searchParams.get('sort') || 'priority';

        const tickets = dbInstance.listTickets({ user, filter, search, sort });
        sendJson(res, 200, { ok: true, tickets });
        return;
      }

      if (method === 'POST') {
        if (!user) {
          sendJson(res, 401, { ok: false, error: 'Murojaat yaratish uchun tizimga kiring.' });
          return;
        }
        const body = await parseJsonBody(req);
        const ticket = dbInstance.createTicket({
          user,
          title: body.title,
          category: body.category,
          description: body.description,
          files: body.files,
          priority: body.priority
        });
        sendJson(res, 201, { ok: true, ticket });
        return;
      }
    }

    // 5. Single ticket routes: /api/tickets/:id and subactions
    const ticketMatch = url.match(/^\/api\/tickets\/(\d+)(?:\/(reply|messages|update|resolve|confirm|reopen))?$/);
    if (ticketMatch) {
      const ticketId = Number(ticketMatch[1]);
      const action = ticketMatch[2];

      if (!action) {
        if (method === 'GET') {
          const ticket = dbInstance.getTicket(ticketId, user);
          if (!ticket) {
            sendJson(res, 404, { ok: false, error: 'Murojaat topilmadi yoki ko‘rishga ruxsat yo‘q.' });
            return;
          }
          sendJson(res, 200, { ok: true, ticket });
          return;
        }
      }

      if ((action === 'reply' || action === 'messages') && method === 'POST') {
        if (!user) {
          sendJson(res, 401, { ok: false, error: 'Xabar yuborish uchun tizimga kiring.' });
          return;
        }
        const body = await parseJsonBody(req);
        const updated = dbInstance.addMessage({
          ticketId,
          user,
          type: body.type,
          text: body.text,
          files: body.files
        });
        sendJson(res, 200, { ok: true, ticket: updated });
        return;
      }

      if (action === 'update' && method === 'POST') {
        if (!user || user.role === 'client') {
          sendJson(res, 403, { ok: false, error: 'Faqat agentlar murojaatni o‘zgartira oladi.' });
          return;
        }
        const body = await parseJsonBody(req);
        const updated = dbInstance.updateTicket({
          ticketId,
          user,
          status: body.status,
          priority: body.priority,
          assigneeId: body.assigneeId
        });
        sendJson(res, 200, { ok: true, ticket: updated });
        return;
      }

      if (action === 'resolve' && method === 'POST') {
        if (!user || user.role === 'client') {
          sendJson(res, 403, { ok: false, error: 'Faqat agentlar yechim taklif qila oladi.' });
          return;
        }
        const updated = dbInstance.resolveTicket({ ticketId, user });
        sendJson(res, 200, { ok: true, ticket: updated });
        return;
      }

      if (action === 'confirm' && method === 'POST') {
        if (!user) {
          sendJson(res, 401, { ok: false, error: 'Tizimga kirish talab qilinadi.' });
          return;
        }
        const updated = dbInstance.confirmResolution({ ticketId, user });
        sendJson(res, 200, { ok: true, ticket: updated });
        return;
      }

      if (action === 'reopen' && method === 'POST') {
        if (!user) {
          sendJson(res, 401, { ok: false, error: 'Tizimga kirish talab qilinadi.' });
          return;
        }
        const body = await parseJsonBody(req);
        const updated = dbInstance.reopenTicket({ ticketId, user, reason: body.reason });
        sendJson(res, 200, { ok: true, ticket: updated });
        return;
      }
    }

    sendJson(res, 404, { ok: false, error: 'API yo‘nalishi topilmadi.' });
  } catch (err) {
    console.error('API Error:', err);
    sendJson(res, 400, { ok: false, error: err.message || 'Ichki server xatoligi.' });
  }
}

module.exports = {
  handleApi,
  dbInstance
};
