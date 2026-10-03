'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const defaultDbPath = path.join(__dirname, 'data', 'helpdesk.sqlite');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  try {
    const calculated = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculated, 'hex'));
  } catch {
    return false;
  }
}

function createDatabase(filePath = defaultDbPath) {
  const dir = path.dirname(filePath);
  if (dir && dir !== '.' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(filePath);

  // Enable WAL and foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // Schema definitions
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'agent', 'admin')),
      company TEXT DEFAULT '',
      avatar_color TEXT DEFAULT 'mint',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'progress', 'solved', 'reopened', 'closed')),
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('urgent', 'high', 'normal', 'low')),
      client_id INTEGER NOT NULL REFERENCES users(id),
      client_name TEXT NOT NULL,
      company TEXT DEFAULT '',
      assignee_id INTEGER REFERENCES users(id),
      assignee_name TEXT DEFAULT '',
      color TEXT DEFAULT 'mint',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      due_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author_id INTEGER REFERENCES users(id),
      author_name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('client', 'agent', 'internal', 'event')),
      text TEXT NOT NULL,
      files_json TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_messages_ticket ON messages(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  // Seed default users and tickets if empty
  const countUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (countUsers === 0) {
    seedDatabase(db);
  }

  return {
    db,
    // User methods
    createUser({ name, email, password, role = 'client', company = '', avatar_color = 'mint' }) {
      const trimmedEmail = String(email || '').trim().toLowerCase();
      const trimmedName = String(name || '').trim();
      if (!trimmedName || trimmedName.length < 2) throw new Error('Ism kamida 2 belgidan iborat bo‘lishi kerak.');
      if (!trimmedEmail || !trimmedEmail.includes('@')) throw new Error('To‘g‘ri email manzil kiriting.');
      if (!password || password.length < 6) throw new Error('Parol kamida 6 belgidan iborat bo‘lishi kerak.');
      if (!['client', 'agent', 'admin'].includes(role)) role = 'client';

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
      if (existing) throw new Error('Bu email bilan allaqachon ro‘yxatdan o‘tilgan.');

      const { hash, salt } = hashPassword(password);
      const now = Date.now();
      const result = db.prepare(`
        INSERT INTO users (name, email, password_hash, salt, role, company, avatar_color, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(trimmedName, trimmedEmail, hash, salt, role, company, avatar_color, now);

      return {
        id: Number(result.lastInsertRowid),
        name: trimmedName,
        email: trimmedEmail,
        role,
        company,
        avatar_color
      };
    },

    verifyUser({ email, password }) {
      const trimmedEmail = String(email || '').trim().toLowerCase();
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);
      if (!user) return null;
      if (!verifyPassword(password, user.password_hash, user.salt)) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        avatar_color: user.avatar_color
      };
    },

    getUserById(id) {
      const user = db.prepare('SELECT id, name, email, role, company, avatar_color FROM users WHERE id = ?').get(Number(id));
      return user || null;
    },

    createSession(userId) {
      const token = crypto.randomBytes(32).toString('hex');
      const now = Date.now();
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
      db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(token, Number(userId), now, expiresAt);
      return token;
    },

    getUserBySession(token) {
      if (!token) return null;
      const session = db.prepare(`
        SELECT u.id, u.name, u.email, u.role, u.company, u.avatar_color, s.expires_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ?
      `).get(String(token));
      if (!session) return null;
      if (session.expires_at < Date.now()) {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
        return null;
      }
      return {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
        company: session.company,
        avatar_color: session.avatar_color
      };
    },

    deleteSession(token) {
      if (token) {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(String(token));
      }
    },

    listAgents() {
      return db.prepare('SELECT id, name, email, role, avatar_color FROM users WHERE role IN (\'agent\', \'admin\') ORDER BY name').all();
    },

    // Ticket methods
    listTickets({ user, filter = 'all', search = '', sort = 'priority' } = {}) {
      let query = 'SELECT * FROM tickets WHERE 1=1';
      const params = [];

      if (user && user.role === 'client') {
        query += ' AND client_id = ?';
        params.push(user.id);
      }

      const tickets = db.prepare(query).all(...params);

      // Attach messages and compute fields
      const messageStmt = db.prepare('SELECT * FROM messages WHERE ticket_id = ? ORDER BY id ASC');

      const fullTickets = tickets.map(t => {
        let msgs = messageStmt.all(t.id).map(m => {
          let files = [];
          try { files = JSON.parse(m.files_json || '[]'); } catch {}
          return {
            id: m.id,
            type: m.type,
            author: m.author_name,
            author_id: m.author_id,
            text: m.text,
            time: new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' }).format(new Date(m.created_at)),
            created_at: m.created_at,
            files
          };
        });

        // Hide internal notes from clients
        if (user && user.role === 'client') {
          msgs = msgs.filter(m => m.type !== 'internal');
        }

        const dateObj = new Date(t.created_at);
        const createdFormatted = `Bugun, ${new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' }).format(dateObj)}`;

        return {
          id: t.id,
          title: t.title,
          category: t.category,
          status: t.status,
          priority: t.priority,
          client: t.client_name,
          client_id: t.client_id,
          company: t.company,
          assignee: t.assignee_name || 'Biriktirilmagan',
          assignee_id: t.assignee_id,
          color: t.color || 'mint',
          due: t.due_at,
          created: createdFormatted,
          created_at: t.created_at,
          updated_at: t.updated_at,
          messages: msgs
        };
      });

      // Filter and sort
      return applyFiltersAndSort(fullTickets, filter, search, sort);
    },

    getTicket(id, user = null) {
      const t = db.prepare('SELECT * FROM tickets WHERE id = ?').get(Number(id));
      if (!t) return null;

      // If client, ensure ownership
      if (user && user.role === 'client' && t.client_id !== user.id) {
        return null;
      }

      const msgsRaw = db.prepare('SELECT * FROM messages WHERE ticket_id = ? ORDER BY id ASC').all(t.id);
      let msgs = msgsRaw.map(m => {
        let files = [];
        try { files = JSON.parse(m.files_json || '[]'); } catch {}
        return {
          id: m.id,
          type: m.type,
          author: m.author_name,
          author_id: m.author_id,
          text: m.text,
          time: new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' }).format(new Date(m.created_at)),
          created_at: m.created_at,
          files
        };
      });

      if (user && user.role === 'client') {
        msgs = msgs.filter(m => m.type !== 'internal');
      }

      const dateObj = new Date(t.created_at);
      const createdFormatted = `Bugun, ${new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' }).format(dateObj)}`;

      return {
        id: t.id,
        title: t.title,
        category: t.category,
        status: t.status,
        priority: t.priority,
        client: t.client_name,
        client_id: t.client_id,
        company: t.company,
        assignee: t.assignee_name || 'Biriktirilmagan',
        assignee_id: t.assignee_id,
        color: t.color || 'mint',
        due: t.due_at,
        created: createdFormatted,
        created_at: t.created_at,
        updated_at: t.updated_at,
        messages: msgs
      };
    },

    createTicket({ user, title, category, description, files = [], priority = 'normal' }) {
      if (!user) throw new Error('Foydalanuvchi tizimga kirmagan.');
      const trimmedTitle = String(title || '').trim();
      const trimmedDesc = String(description || '').trim();
      if (!trimmedTitle || trimmedTitle.length < 5) throw new Error('Mavzu kamida 5 belgidan iborat bo‘lishi kerak.');
      if (!trimmedDesc || trimmedDesc.length < 10) throw new Error('Tavsif kamida 10 belgidan iborat bo‘lishi kerak.');

      // Next ticket ID (e.g. 8500+)
      const maxId = db.prepare('SELECT MAX(id) as maxId FROM tickets').get().maxId || 8470;
      const newId = maxId + 1;

      const slaDurations = { urgent: 30 * 60000, high: 60 * 60000, normal: 240 * 60000, low: 480 * 60000 };
      const now = Date.now();
      const dueAt = now + (slaDurations[priority] || 240 * 60000);

      // Auto-assign to first agent or round-robin
      const firstAgent = db.prepare('SELECT id, name FROM users WHERE role IN (\'agent\', \'admin\') ORDER BY id ASC LIMIT 1').get();

      db.prepare(`
        INSERT INTO tickets (id, title, category, status, priority, client_id, client_name, company, assignee_id, assignee_name, color, created_at, updated_at, due_at)
        VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId,
        trimmedTitle,
        category || 'Boshqa',
        priority,
        user.id,
        user.name,
        user.company || '',
        firstAgent ? firstAgent.id : null,
        firstAgent ? firstAgent.name : '',
        user.avatar_color || 'mint',
        now,
        now,
        dueAt
      );

      // Initial client message
      db.prepare(`
        INSERT INTO messages (ticket_id, author_id, author_name, type, text, files_json, created_at)
        VALUES (?, ?, ?, 'client', ?, ?, ?)
      `).run(newId, user.id, user.name, trimmedDesc, JSON.stringify(files || []), now);

      return this.getTicket(newId, user);
    },

    addMessage({ ticketId, user, type = 'client', text, files = [] }) {
      if (!user) throw new Error('Tizimga kirish talab qilinadi.');
      const trimmedText = String(text || '').trim();
      if (!trimmedText) throw new Error('Xabar matni bo‘sh bo‘lishi mumkin emas.');

      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(Number(ticketId));
      if (!ticket) throw new Error('Murojaat topilmadi.');

      // Check permission
      if (user.role === 'client') {
        if (ticket.client_id !== user.id) throw new Error('Bu murojaatga ruxsat yo‘q.');
        type = 'client';
      } else {
        if (!['agent', 'internal'].includes(type)) type = 'agent';
      }

      const now = Date.now();
      db.prepare(`
        INSERT INTO messages (ticket_id, author_id, author_name, type, text, files_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(ticket.id, user.id, user.name, type, trimmedText, JSON.stringify(files || []), now);

      // Update ticket status
      let newStatus = ticket.status;
      if (type === 'agent' && (ticket.status === 'new' || ticket.status === 'reopened')) {
        newStatus = 'progress';
      } else if (type === 'client' && (ticket.status === 'solved' || ticket.status === 'closed')) {
        newStatus = 'reopened';
      }

      db.prepare('UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, ticket.id);

      return this.getTicket(ticket.id, user);
    },

    updateTicket({ ticketId, user, status, priority, assigneeId }) {
      if (!user || user.role === 'client') throw new Error('Faqat agentlar murojaat parametrlarini o‘zgartirishi mumkin.');
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(Number(ticketId));
      if (!ticket) throw new Error('Murojaat topilmadi.');

      const now = Date.now();
      let newStatus = status || ticket.status;
      let newPriority = priority || ticket.priority;
      let newAssigneeId = assigneeId !== undefined ? Number(assigneeId) : ticket.assignee_id;
      let newAssigneeName = ticket.assignee_name;

      if (assigneeId !== undefined) {
        const agent = db.prepare('SELECT id, name FROM users WHERE id = ?').get(newAssigneeId);
        newAssigneeName = agent ? agent.name : '';
      }

      db.prepare(`
        UPDATE tickets SET status = ?, priority = ?, assignee_id = ?, assignee_name = ?, updated_at = ?
        WHERE id = ?
      `).run(newStatus, newPriority, newAssigneeId, newAssigneeName, now, ticket.id);

      return this.getTicket(ticket.id, user);
    },

    resolveTicket({ ticketId, user }) {
      if (!user || user.role === 'client') throw new Error('Faqat agentlar yechim taklif qilishi mumkin.');
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(Number(ticketId));
      if (!ticket) throw new Error('Murojaat topilmadi.');

      const now = Date.now();
      db.prepare('UPDATE tickets SET status = \'solved\', updated_at = ? WHERE id = ?').run(now, ticket.id);
      db.prepare(`
        INSERT INTO messages (ticket_id, author_id, author_name, type, text, files_json, created_at)
        VALUES (?, ?, ?, 'event', 'Agent yechim taklif qildi. Mijoz tasdig‘i kutilmoqda.', '[]', ?)
      `).run(ticket.id, user.id, user.name, now);

      return this.getTicket(ticket.id, user);
    },

    confirmResolution({ ticketId, user }) {
      if (!user) throw new Error('Tizimga kirish talab qilinadi.');
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(Number(ticketId));
      if (!ticket) throw new Error('Murojaat topilmadi.');

      const now = Date.now();
      db.prepare('UPDATE tickets SET status = \'closed\', updated_at = ? WHERE id = ?').run(now, ticket.id);
      db.prepare(`
        INSERT INTO messages (ticket_id, author_id, author_name, type, text, files_json, created_at)
        VALUES (?, ?, ?, 'event', 'Mijoz yechimni tasdiqladi. Murojaat yopildi.', '[]', ?)
      `).run(ticket.id, user.id, user.name, now);

      return this.getTicket(ticket.id, user);
    },

    reopenTicket({ ticketId, user, reason }) {
      if (!user) throw new Error('Tizimga kirish talab qilinadi.');
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(Number(ticketId));
      if (!ticket) throw new Error('Murojaat topilmadi.');

      const now = Date.now();
      const newDue = now + 60 * 60000; // 1 hour SLA extension
      db.prepare('UPDATE tickets SET status = \'reopened\', due_at = ?, updated_at = ? WHERE id = ?').run(newDue, now, ticket.id);

      db.prepare(`
        INSERT INTO messages (ticket_id, author_id, author_name, type, text, files_json, created_at)
        VALUES (?, ?, ?, 'event', 'Mijoz murojaatni qayta ochdi: muammo hal bo‘lmadi.', '[]', ?)
      `).run(ticket.id, user.id, user.name, now);

      if (reason) {
        db.prepare(`
          INSERT INTO messages (ticket_id, author_id, author_name, type, text, files_json, created_at)
          VALUES (?, ?, ?, 'client', ?, '[]', ?)
        `).run(ticket.id, user.id, user.name, String(reason).trim(), now);
      }

      return this.getTicket(ticket.id, user);
    },

    getStats() {
      const tickets = this.listTickets({ user: { role: 'agent' } });
      const open = tickets.filter(t => !['closed', 'solved'].includes(t.status)).length;
      const unread = tickets.filter(t => !['closed', 'solved'].includes(t.status) && t.messages.filter(m => ['agent', 'client'].includes(m.type)).at(-1)?.type === 'client').length;
      const late = tickets.filter(t => !['closed', 'solved'].includes(t.status) && t.due < Date.now()).length;
      const solved = tickets.filter(t => ['solved', 'closed'].includes(t.status)).length;
      return { open, unread, late, solved, total: tickets.length };
    }
  };
}

function applyFiltersAndSort(list, filter, search, sort) {
  let result = list;

  if (filter === 'mine') {
    result = result.filter(t => t.status !== 'closed' && t.assignee.includes('Davlatbek'));
  } else if (filter === 'unanswered') {
    result = result.filter(t => !['closed', 'solved'].includes(t.status) && t.messages.filter(m => ['agent', 'client'].includes(m.type)).at(-1)?.type === 'client');
  } else if (filter === 'overdue') {
    result = result.filter(t => !['closed', 'solved'].includes(t.status) && t.due < Date.now());
  } else if (filter === 'closed') {
    result = result.filter(t => t.status === 'closed');
  } else {
    result = result.filter(t => t.status !== 'closed');
  }

  if (search) {
    const s = search.toLowerCase();
    result = result.filter(t => `${t.id} ${t.title} ${t.client} ${t.assignee} ${t.category}`.toLowerCase().includes(s));
  }

  if (sort === 'deadline') {
    result.sort((a, b) => a.due - b.due);
  } else if (sort === 'newest') {
    result.sort((a, b) => b.id - a.id);
  } else {
    // Priority and overdue first
    result.sort((a, b) => {
      const aOver = !['closed', 'solved'].includes(a.status) && a.due < Date.now() ? 1 : 0;
      const bOver = !['closed', 'solved'].includes(b.status) && b.due < Date.now() ? 1 : 0;
      if (bOver !== aOver) return bOver - aOver;
      const prioOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return (prioOrder[a.priority] ?? 2) - (prioOrder[b.priority] ?? 2);
    });
  }

  return result;
}

function seedDatabase(db) {
  const now = Date.now();
  const defaultUsers = [
    { name: 'Davlatbek Orzuqulov', email: 'davlatbek@helpdesk.uz', role: 'agent', company: 'Yordam Helpdesk', color: 'mint' },
    { name: 'Malika Yusupova', email: 'malika@helpdesk.uz', role: 'agent', company: 'Yordam Helpdesk', color: 'mint' },
    { name: 'Sardor Baxtiyorov', email: 'sardor@helpdesk.uz', role: 'agent', company: 'Yordam Helpdesk', color: 'lilac' },
    { name: 'Bobur Aliyev', email: 'bobur@helpdesk.uz', role: 'agent', company: 'Yordam Helpdesk', color: 'peach' },
    { name: 'Azizbek Rahimov', email: 'azizbek@smarttrading.uz', role: 'client', company: 'Smart Trading', color: 'mint' },
    { name: 'Nodira Toshmatova', email: 'nodira@atlas.uz', role: 'client', company: 'Atlas Studio', color: 'lilac' },
    { name: 'Jasur Berdiyev', email: 'jasur@novatech.uz', role: 'client', company: 'Nova Tech', color: 'blue' },
    { name: 'Madina Karimova', email: 'madina@lolamarket.uz', role: 'client', company: 'Lola Market', color: 'lilac' },
    { name: 'Farrux Ergashev', email: 'farrux@baraka.uz', role: 'client', company: 'Baraka Group', color: 'blue' }
  ];

  const userIds = {};
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, salt, role, company, avatar_color, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of defaultUsers) {
    const { hash, salt } = hashPassword('password123');
    const res = insertUser.run(u.name, u.email, hash, salt, u.role, u.company, u.color, now);
    userIds[u.name] = Number(res.lastInsertRowid);
  }

  // Sample tickets
  const sampleTickets = [
    {
      id: 8492,
      title: 'To‘lov o‘tdi, balans to‘ldirilmadi',
      client: 'Azizbek Rahimov',
      company: 'Smart Trading',
      category: 'To‘lovlar',
      status: 'progress',
      priority: 'high',
      assignee: 'Davlatbek Orzuqulov',
      due: now - 75 * 60000,
      color: 'mint',
      messages: [
        { type: 'client', author: 'Azizbek Rahimov', text: 'Assalomu alaykum. Payme orqali 150 000 so‘m to‘ladim, lekin balansim to‘ldirilmadi. To‘lov chekini biriktirdim. Tekshirib bera olasizmi?', files: [{ name: 'tolov-cheki.png', size: 1258291 }] },
        { type: 'internal', author: 'Davlatbek Orzuqulov', text: 'To‘lovlar jamoasi bilan tekshirish kerak. Tranzaksiya navbatda qolgan. Sardor, holatini ko‘rib bering.' }
      ]
    },
    {
      id: 8495,
      title: 'Shaxsiy kabinetga kira olmayapman',
      client: 'Nodira Toshmatova',
      company: 'Atlas Studio',
      category: 'Hisob',
      status: 'new',
      priority: 'urgent',
      assignee: 'Sardor Baxtiyorov',
      due: now - 25 * 60000,
      color: 'lilac',
      messages: [
        { type: 'client', author: 'Nodira Toshmatova', text: 'Parolim to‘g‘ri, lekin tizim xatolik chiqaryapti. Boshqa brauzerda ham sinab ko‘rdim.' }
      ]
    },
    {
      id: 8491,
      title: 'Hisobotni yuklab olishda xatolik',
      client: 'Jasur Berdiyev',
      company: 'Nova Tech',
      category: 'Hisobotlar',
      status: 'progress',
      priority: 'normal',
      assignee: 'Davlatbek Orzuqulov',
      due: now + 45 * 60000,
      color: 'blue',
      messages: [
        { type: 'client', author: 'Jasur Berdiyev', text: 'Oylik hisobotni yuklab olsam bo‘sh fayl chiqmoqda. Yordam kerak.' },
        { type: 'agent', author: 'Davlatbek Orzuqulov', text: 'Tekshirishni boshladik. Qaysi davr uchun hisobot kerakligini yozib yuboring.' },
        { type: 'client', author: 'Jasur Berdiyev', text: 'Sentabr oyi uchun. CSV ham, Excel ham ishlamayapti.' }
      ]
    },
    {
      id: 8488,
      title: 'Bildirishnomalar kelmayapti',
      client: 'Azizbek Rahimov',
      company: 'Smart Trading',
      category: 'Texnik muammo',
      status: 'progress',
      priority: 'low',
      assignee: 'Bobur Aliyev',
      due: now + 120 * 60000,
      color: 'peach',
      messages: [
        { type: 'client', author: 'Azizbek Rahimov', text: 'Yangi javoblar haqida email bildirishnomalar kelmayapti.' },
        { type: 'agent', author: 'Bobur Aliyev', text: 'Sozlamalarda email bildirishnomalarini yoqing va spam papkasini tekshiring. Natijasini yozib yuboring.' }
      ]
    },
    {
      id: 8485,
      title: 'Parolni tiklash kodi kelmayapti',
      client: 'Madina Karimova',
      company: 'Lola Market',
      category: 'Hisob',
      status: 'reopened',
      priority: 'high',
      assignee: 'Sardor Baxtiyorov',
      due: now + 30 * 60000,
      color: 'lilac',
      messages: [
        { type: 'client', author: 'Madina Karimova', text: 'SMS tasdiqlash kodi kelmayapti.' },
        { type: 'agent', author: 'Sardor Baxtiyorov', text: 'Yangi kod yubordik. Iltimos, yana tekshiring.' },
        { type: 'event', text: 'Mijoz murojaatni qayta ochdi: muammo hal bo‘lmadi.' },
        { type: 'client', author: 'Madina Karimova', text: 'Hali ham kod kelmayapti.' }
      ]
    },
    {
      id: 8482,
      title: 'Tarifni o‘zgartirish bo‘yicha yordam',
      client: 'Azizbek Rahimov',
      company: 'Smart Trading',
      category: 'To‘lovlar',
      status: 'solved',
      priority: 'normal',
      assignee: 'Davlatbek Orzuqulov',
      due: now + 60 * 60000,
      color: 'mint',
      messages: [
        { type: 'client', author: 'Azizbek Rahimov', text: 'Jamoa tarifiga o‘tish uchun nima qilishim kerak?' },
        { type: 'agent', author: 'Davlatbek Orzuqulov', text: 'Shaxsiy kabinet → Tariflar → Jamoa bo‘limini tanlang. Hisobingiz uchun o‘zgartirish imkoniyatini yoqdik.' },
        { type: 'event', text: 'Agent yechim taklif qildi. Mijoz tasdig‘i kutilmoqda.' }
      ]
    },
    {
      id: 8479,
      title: 'Profil ma’lumotlarini yangilash',
      client: 'Farrux Ergashev',
      company: 'Baraka Group',
      category: 'Hisob',
      status: 'new',
      priority: 'low',
      assignee: 'Bobur Aliyev',
      due: now + 180 * 60000,
      color: 'blue',
      messages: [
        { type: 'client', author: 'Farrux Ergashev', text: 'Profilimdagi kompaniya nomini yangilashim kerak.' }
      ]
    },
    {
      id: 8472,
      title: 'Hisobotni Excel formatida saqlash',
      client: 'Azizbek Rahimov',
      company: 'Smart Trading',
      category: 'Hisobotlar',
      status: 'closed',
      priority: 'normal',
      assignee: 'Bobur Aliyev',
      due: now + 180 * 60000,
      color: 'peach',
      messages: [
        { type: 'client', author: 'Azizbek Rahimov', text: 'Hisobotni Excel formatida yuklab bo‘lmayapti.' },
        { type: 'agent', author: 'Bobur Aliyev', text: 'Eksportdagi xatolik tuzatildi. Hisobotni qayta yuklab olishingiz mumkin.' },
        { type: 'event', text: 'Mijoz yechimni tasdiqladi. Murojaat yopildi.' }
      ]
    }
  ];

  const insertTicket = db.prepare(`
    INSERT INTO tickets (id, title, category, status, priority, client_id, client_name, company, assignee_id, assignee_name, color, created_at, updated_at, due_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMsg = db.prepare(`
    INSERT INTO messages (ticket_id, author_id, author_name, type, text, files_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of sampleTickets) {
    const clientId = userIds[t.client] || 1;
    const assigneeId = userIds[t.assignee] || null;
    insertTicket.run(t.id, t.title, t.category, t.status, t.priority, clientId, t.client, t.company, assigneeId, t.assignee, t.color, now, now, t.due);

    for (const m of t.messages) {
      const authorId = m.author ? userIds[m.author] || null : null;
      insertMsg.run(t.id, authorId, m.author || 'Tizim', m.type, m.text, JSON.stringify(m.files || []), now);
    }
  }
}

module.exports = {
  createDatabase,
  hashPassword,
  verifyPassword
};
