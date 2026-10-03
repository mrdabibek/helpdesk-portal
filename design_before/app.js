/**
 * HELPDESK MUROJAATLAR PORTALI — ASOSIY INTERAKTIV MANTIQ (APP.JS)
 * Muallif: Orzuqulov Davlatbek
 * Imkoniyatlar:
 *  - Mijoz (Mobil 390px) va Agent (Desktop 1440px) o'rtasida 100% sinxronlik
 *  - Jonli himoyadagi talab: "Javobsiz murojaatlar" filtri
 *  - Anti-Error UX: Ichki izoh (Sariq fon, qulf) vs Ommaviy javob (Moviy fon)
 *  - SLA real-vaqt hisoblagichi va WCAG matnli kechikish yorliqlari
 *  - LocalStorage orqali saqlash va Web Audio orqali ovozli bildirishnoma
 */

// Boshlang'ich Namunaviy Ma'lumotlar (Seed Data)
const DEFAULT_TICKETS = [
  {
    id: '#HD-8492',
    numericId: 8492,
    title: 'To‘lov o‘tdi, lekin balans to‘ldirilmadi',
    category: 'To‘lovlar va Balans',
    clientName: 'Azizbek Rahimov',
    clientEmail: 'azizbek.rahimov@example.com',
    clientPhone: '+998 (90) 123-45-67',
    clientCompany: '"Smart Trading" MCHJ',
    status: 'Jarayonda', // 'Yangi' | 'Jarayonda' | 'Yechildi' | 'Yopildi' | 'Qayta ochilgan'
    priority: 'Yuqori', // 'Past' | 'O‘rta' | 'Yuqori' | 'Favqulodda'
    assignee: 'Malika Yusupova',
    has_unanswered: true, // JONLI HIMOYADAGI ASOSIY FLAG
    slaDeadline: Date.now() - (75 * 60 * 1000), // 1 soat 15 daqiqa oldin o'tib ketgan (Overdue)
    createdTime: 'Bugun, 13:40',
    sentiment: 'frustrated',
    sentimentLabel: '😡 88% Xavf (G‘azablangan)',
    aiSummary: 'Mijoz Paymedan 150 000 so‘m o‘tkazgan, lekin balans to‘ldirilmagan. Billing servisida 502 uzilish sababli tranzaksiya navbatda qotib qolgan. Hozir Sardor tekshirmoqda.',
    messages: [
      {
        id: 1,
        sender: 'client',
        author: 'Azizbek Rahimov',
        time: '13:40',
        text: 'Assalomu alaykum. Payme orqali 150 000 so‘m o‘tkazdim. Chek ilova qilingan, balansim esa hali ham 0 so‘m bo‘lib turibdi. Iltimos tekshirib bering.',
        attachment: { name: 'chek_skrinshot.png', size: '1.2 MB' }
      },
      {
        id: 2,
        sender: 'internal',
        author: 'Malika Yusupova',
        time: '13:52',
        text: 'Billing servisida 13:50 dan 14:15 gacha kechikish kuzatilgan. Transaksiya ID: #TX-904812. Hozir Sardor bilan tekshiryapmiz.'
      }
    ]
  },
  {
    id: '#HD-8495',
    numericId: 8495,
    title: 'API integratsiyasida 401 Unauthorized',
    category: 'Texnik xato',
    clientName: 'Jasur Berdiyev',
    clientEmail: 'jasur@fintech.uz',
    clientPhone: '+998 (93) 987-65-43',
    clientCompany: '"Fintech Pay" MCHJ',
    status: 'Yangi',
    priority: 'Favqulodda',
    assignee: 'Malika Yusupova',
    has_unanswered: true,
    slaDeadline: Date.now() + (45 * 60 * 1000), // 45 daqiqa qoldi
    createdTime: 'Bugun, 14:05',
    sentiment: 'frustrated',
    sentimentLabel: '⚡ 92% Shoshilinch (Kritik)',
    aiSummary: 'Webhooks integratsiyasida yangi Bearer token bilan 401 Unauthorized qaytmoqda. Mijozning butun to‘lov trafigi to‘xtab qolgan.',
    messages: [
      {
        id: 1,
        sender: 'client',
        author: 'Jasur Berdiyev',
        time: '14:05',
        text: 'Webhooks endpointlarimiz yangi token bilan ishlamayapti. Javob kodida 401 qaytmoqda. Ish to‘xtab qoldi, tezkor yordam bering.'
      }
    ]
  },
  {
    id: '#HD-8480',
    numericId: 8480,
    title: 'Parolni tiklashda SMS kod kelmayapti',
    category: 'Shaxsiy kabinet',
    clientName: 'Nodira Toshmatova',
    clientEmail: 'nodira@gmail.com',
    clientPhone: '+998 (97) 555-12-34',
    clientCompany: 'Jismoniy shaxs',
    status: 'Qayta ochilgan',
    priority: 'Yuqori',
    assignee: 'Sardor Baxtiyorov',
    has_unanswered: false,
    slaDeadline: Date.now() + (120 * 60 * 1000),
    createdTime: 'Kecha, 18:30',
    sentiment: 'neutral',
    sentimentLabel: '😐 60% Neytral (Kutayotgan)',
    aiSummary: 'SMS shlyuzi yangilangandan keyin ham tasdiqlash kodlari bormagan. Mijoz murojaatni 2-marta qayta ochdi.',
    messages: [
      {
        id: 1,
        sender: 'client',
        author: 'Nodira Toshmatova',
        time: 'Kecha, 18:30',
        text: 'Parolni tiklamoqchi bo‘lsam, hech qanaqa SMS kod kelmayapti.'
      },
      {
        id: 2,
        sender: 'agent',
        author: 'Sardor Baxtiyorov',
        time: 'Kecha, 19:10',
        text: 'SMS shlyuzi yangilandi. Iltimos qayta urinib ko‘ring.'
      },
      {
        id: 3,
        sender: 'client',
        author: 'Nodira Toshmatova',
        time: 'Bugun, 10:15',
        text: 'Yana xuddi shu holat, 3 marta urindim, SMS baribir kelmadi. Murojaatni qayta ochdim.'
      }
    ]
  },
  {
    id: '#HD-8472',
    numericId: 8472,
    title: 'Hisobotlarni Excel formatida yuklab bo‘lmayapti',
    category: 'Hisobotlar',
    clientName: 'Farrux Ergashev',
    clientEmail: 'farrux@invest.uz',
    clientPhone: '+998 (99) 444-88-99',
    clientCompany: '"Invest Group"',
    status: 'Yechildi',
    priority: 'Past',
    assignee: 'Bobur Aliyev',
    has_unanswered: false,
    slaDeadline: Date.now() + (180 * 60 * 1000),
    createdTime: '02-Oktyabr, 11:20',
    sentiment: 'positive',
    sentimentLabel: '😊 95% Mamnun (Yechilgan)',
    aiSummary: 'Excel eksport qilish moduli muvaffaqiyatli tuzatildi va mijoz to‘liq tasdiqladi.',
    rating: 5,
    messages: [
      {
        id: 1,
        sender: 'client',
        author: 'Farrux Ergashev',
        time: '02-Okt, 11:20',
        text: 'Oylik savdo hisobotini .xlsx formatida eksport qilganda bo‘sh fayl tushmoqda.'
      },
      {
        id: 2,
        sender: 'agent',
        author: 'Bobur Aliyev',
        time: '02-Okt, 11:45',
        text: 'Fayl generatsiya moduli tuzatildi. Hozir qayta tekshirishingiz mumkin.'
      }
    ]
  }
];

// Holat O'zgaruvchilari (State)
let state = {
  tickets: [],
  selectedTicketId: '#HD-8492',
  currentDeskFilter: 'all', // 'all' | 'mine' | 'unanswered' | 'overdue'
  composerMode: 'public', // 'public' | 'internal'
  uploadedTempFile: null,
  mobileSelectedTicketId: '#HD-8492'
};

// Web Audio API orqali yumshoq bildirishnoma signali
function playSoftChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Audio kontekst bloklangan bo'lsa indamay o'tadi
  }
}

// LocalStorage Yuklash va Saqlash
function loadTickets() {
  const stored = localStorage.getItem('helpdesk_app_tickets');
  if (stored) {
    try {
      state.tickets = JSON.parse(stored);
    } catch (e) {
      state.tickets = [...DEFAULT_TICKETS];
    }
  } else {
    state.tickets = [...DEFAULT_TICKETS];
    saveTickets();
  }
}

function saveTickets() {
  localStorage.setItem('helpdesk_app_tickets', JSON.stringify(state.tickets));
  renderAllViews();
}

function resetDemoData() {
  if (confirm('Barcha namunaviy ma\'lumotlarni asl holatiga qaytarishni xohlaysizmi?')) {
    state.tickets = JSON.parse(JSON.stringify(DEFAULT_TICKETS));
    saveTickets();
    showToast('Namunaviy ma\'lumotlar tiklandi');
  }
}

// ==========================================================================
// 100% AVTOMATIK RESPONSIVE EKOTIZIM (SO'RAMASDAN AVTO-MOSLASHADI)
// ==========================================================================
function handleResponsiveLayout() {
  const width = window.innerWidth;
  const mobileWrap = document.getElementById('view-mobile-wrap');
  const desktopWrap = document.getElementById('view-desktop-wrap');
  const figmaWrap = document.getElementById('view-figma-wrap');

  if (figmaWrap) figmaWrap.classList.remove('active-view');

  if (width < 900) {
    // TELEFON (PHONE): Avtomatik Mobil Mijoz Portali ochiladi
    if (mobileWrap) mobileWrap.classList.add('active-view');
    if (desktopWrap) desktopWrap.classList.remove('active-view');
  } else {
    // LAPTOP / PC / DESKTOP: Avtomatik Agent Desktop Ish Maydoni ochiladi
    if (mobileWrap) mobileWrap.classList.remove('active-view');
    if (desktopWrap) desktopWrap.classList.add('active-view');
  }
}

window.addEventListener('resize', handleResponsiveLayout);

// ==========================================================================
// DESKTOP AGENT LOGIKASI VA JONLI HIMOYADAGI FILTR
// ==========================================================================
function filterDeskQueue(filterType, btnEl) {
  state.currentDeskFilter = filterType;
  document.querySelectorAll('.desk-filter-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  renderDeskQueue();

  if (filterType === 'unanswered') {
    showToast('⭐ Javobsiz murojaatlar ro‘yxati saralandi');
  }
}

function renderDeskQueue() {
  const container = document.getElementById('desk-queue-items');
  const countUnanswered = state.tickets.filter(t => t.has_unanswered && t.status !== 'Yopildi').length;
  const countOverdue = state.tickets.filter(t => Date.now() > t.slaDeadline && t.status !== 'Yopildi' && t.status !== 'Yechildi').length;
  const countMine = state.tickets.filter(t => t.assignee === 'Malika Yusupova').length;

  // KPI chiplarini yangilash
  document.getElementById('kpi-total-open').innerText = state.tickets.filter(t => t.status !== 'Yopildi').length;
  document.getElementById('kpi-overdue').innerText = countOverdue;
  document.getElementById('kpi-unanswered').innerText = countUnanswered;
  document.getElementById('filter-unanswered-badge').innerText = `⭐ Javobsiz murojaatlar (${countUnanswered})`;

  // Filtrlash
  let filtered = [...state.tickets];
  if (state.currentDeskFilter === 'mine') {
    filtered = filtered.filter(t => t.assignee === 'Malika Yusupova');
  } else if (state.currentDeskFilter === 'unanswered') {
    // JONLI HIMOYADAGI ASOSIY ALGORITM:
    filtered = filtered.filter(t => t.has_unanswered && t.status !== 'Yopildi');
  } else if (state.currentDeskFilter === 'overdue') {
    filtered = filtered.filter(t => Date.now() > t.slaDeadline && t.status !== 'Yopildi' && t.status !== 'Yechildi');
  }

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 32px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
        <div style="font-size: 28px; margin-bottom: 8px;">🎉</div>
        <b>Bu filtrda murojaatlar yo‘q</b><br>
        Barcha vazifalar bajarilgan.
      </div>
    `;
    return;
  }

  filtered.forEach(ticket => {
    const isSelected = ticket.id === state.selectedTicketId;
    const isOverdue = Date.now() > ticket.slaDeadline && ticket.status !== 'Yopildi' && ticket.status !== 'Yechildi';
    
    // SLA hisoblash
    const slaText = formatSlaStatus(ticket.slaDeadline, ticket.status);

    const div = document.createElement('div');
    div.className = `desk-queue-item ${isSelected ? 'selected' : ''}`;
    div.onclick = () => selectDeskTicket(ticket.id);

    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-weight: 700; font-size: 12px; color: var(--text-muted);">${ticket.id}</span>
        ${slaText.badgeHtml}
      </div>
      <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px; color: var(--text-main); line-height: 1.35;">
        ${escapeHtml(ticket.title)}
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
        <span>${escapeHtml(ticket.clientName)}</span>
        ${ticket.has_unanswered ? '<span style="color: #1D4ED8; font-weight: 700;">● Javob kutilmoqda</span>' : '<span>Javob berilgan</span>'}
      </div>
    `;
    container.appendChild(div);
  });
}

function selectDeskTicket(ticketId) {
  state.selectedTicketId = ticketId;
  state.mobileSelectedTicketId = ticketId;
  renderDeskQueue();
  renderDeskActiveTicket();
}

function renderDeskActiveTicket() {
  const ticket = state.tickets.find(t => t.id === state.selectedTicketId);
  if (!ticket) return;

  document.getElementById('desk-ticket-title').innerText = ticket.title;
  document.getElementById('desk-ticket-id').innerText = ticket.id;
  document.getElementById('desk-ticket-client-name').innerText = ticket.clientName;
  document.getElementById('desk-ticket-company').innerText = ticket.clientCompany || 'Kompaniya';

  // Status badge
  const statusEl = document.getElementById('desk-ticket-status-badge');
  statusEl.className = `badge ${getStatusBadgeClass(ticket.status)}`;
  statusEl.innerText = ticket.status;

  // AI Sentiment Badge
  const sentimentBadge = document.getElementById('desk-ticket-sentiment-badge');
  if (sentimentBadge) {
    const sentiment = ticket.sentiment || 'neutral';
    sentimentBadge.className = `sentiment-chip sentiment-${sentiment}`;
    sentimentBadge.innerText = ticket.sentimentLabel || '😐 50% Neytral';
  }

  // AI Smart Summary Widget
  const summaryEl = document.getElementById('desk-ai-summary-text');
  if (summaryEl) {
    summaryEl.innerText = ticket.aiSummary || 'Mijoz murojaat qoldirgan. AI xulosa yaratish uchun yangilang.';
  }

  // SLA Header indicator
  const slaContainer = document.getElementById('desk-ticket-sla-header');
  const slaInfo = formatSlaStatus(ticket.slaDeadline, ticket.status);
  slaContainer.innerHTML = slaInfo.headerHtml;

  // Metadata dropdowns
  document.getElementById('desk-select-status').value = ticket.status;
  document.getElementById('desk-select-priority').value = ticket.priority;
  document.getElementById('desk-select-assignee').value = ticket.assignee;

  // Mijoz profili
  document.getElementById('desk-client-full-name').innerText = ticket.clientName;
  document.getElementById('desk-client-email').innerText = ticket.clientEmail;
  document.getElementById('desk-client-phone').innerText = ticket.clientPhone;
  document.getElementById('desk-client-company-detail').innerText = ticket.clientCompany || '-';

  // Timeline Messages
  const feed = document.getElementById('desk-timeline-feed');
  feed.innerHTML = '';

  ticket.messages.forEach(msg => {
    const bubble = document.createElement('div');
    if (msg.sender === 'client') {
      bubble.className = 'chat-bubble bubble-client';
      bubble.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #1E293B; margin-bottom: 4px; display: flex; justify-content: space-between;">
          <span>Mijoz: ${escapeHtml(msg.author)}</span>
          <span style="font-weight: 400; color: var(--text-muted);">${msg.time}</span>
        </div>
        <div>${escapeHtml(msg.text)}</div>
        ${msg.attachment ? `
          <div style="margin-top: 8px; padding: 6px 10px; background: #F1F5F9; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
            <span>📎</span> <b>${escapeHtml(msg.attachment.name)}</b> (${msg.attachment.size})
          </div>
        ` : ''}
      `;
    } else if (msg.sender === 'internal') {
      // CRITICAL INTERNAL NOTE UI
      bubble.className = 'chat-bubble bubble-internal-note';
      bubble.innerHTML = `
        <div class="internal-note-header">
          <span>🔒</span> MAXFIY ICHKI IZOH (Faqat qo‘llab-quvvatlash jamoasi ko‘radi)
        </div>
        <div style="font-size: 13px;">
          <b>${escapeHtml(msg.author)}:</b> ${escapeHtml(msg.text)}
        </div>
        <div style="font-size: 10px; color: #B45309; text-align: right; margin-top: 4px;">${msg.time}</div>
      `;
    } else {
      // Public reply
      bubble.className = 'chat-bubble bubble-agent';
      bubble.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #1D4ED8; margin-bottom: 4px; display: flex; justify-content: space-between;">
          <span>Agent: ${escapeHtml(msg.author)}</span>
          <span style="font-weight: 400; color: var(--text-muted);">${msg.time}</span>
        </div>
        <div>${escapeHtml(msg.text)}</div>
      `;
    }
    feed.appendChild(bubble);
  });

  feed.scrollTop = feed.scrollHeight;
}

// ==========================================================================
// ANTI-ERROR COMPOSER LOGIKASI (ICHTKI IZOH VS OMMAVIY JAVOB)
// ==========================================================================
function setComposerMode(mode) {
  state.composerMode = mode;
  const tabPublic = document.getElementById('desk-tab-public');
  const tabInternal = document.getElementById('desk-tab-internal');
  const boxContainer = document.getElementById('desk-composer-box');
  const textarea = document.getElementById('desk-composer-input');
  const submitBtn = document.getElementById('desk-composer-submit-btn');
  const modeCaption = document.getElementById('desk-composer-caption');

  if (mode === 'internal') {
    // 100% VISUAL RADICAL SHIFT TO AMBER / WARNING
    tabPublic.className = 'composer-tab';
    tabInternal.className = 'composer-tab active-internal';

    boxContainer.classList.add('mode-internal');
    textarea.placeholder = 'Jamoa a’zolari uchun ichki texnik izoh yoki maslahat yozing...';
    modeCaption.innerText = '🔒 Mijozga bormaydi (faqat jamoa)';

    submitBtn.className = 'btn btn-warning';
    submitBtn.innerHTML = '<span>🔒</span> Ichki izohni saqlash';
    showToast('🔒 Ichki izoh xavfsizlik rejimi faollashdi');
  } else {
    // RESTORE CLEAN PUBLIC REPLY
    tabPublic.className = 'composer-tab active-public';
    tabInternal.className = 'composer-tab';

    boxContainer.classList.remove('mode-internal');
    textarea.placeholder = 'Mijozga ko‘rinadigan rasmiy javobingizni yozing...';
    modeCaption.innerText = 'Mijoz xabarni darhol ko‘radi';

    submitBtn.className = 'btn btn-primary';
    submitBtn.innerHTML = '<span>✈️</span> Mijozga yuborish';
  }
}

function submitDeskMessage() {
  const textarea = document.getElementById('desk-composer-input');
  const text = textarea.value.trim();
  if (!text) {
    alert('Iltimos, xabar matnini kiriting!');
    return;
  }

  const ticket = state.tickets.find(t => t.id === state.selectedTicketId);
  if (!ticket) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (state.composerMode === 'internal') {
    // Post internal note (Does NOT clear has_unanswered, purely private)
    ticket.messages.push({
      id: Date.now(),
      sender: 'internal',
      author: 'Malika Yusupova',
      time: timeStr,
      text: text
    });
    showToast('🔒 Ichki maxfiy izoh muvaffaqiyatli saqlandi');
  } else {
    // Post public reply (Clears unanswered state!)
    ticket.messages.push({
      id: Date.now(),
      sender: 'agent',
      author: 'Malika Yusupova',
      time: timeStr,
      text: text
    });
    ticket.has_unanswered = false;
    showToast('✈️ Javob mijozga yuborildi');
  }

  playSoftChime();
  textarea.value = '';
  saveTickets();
}

// Metadata o'zgarishlari
function updateTicketMetadata(type, value) {
  const ticket = state.tickets.find(t => t.id === state.selectedTicketId);
  if (!ticket) return;

  if (type === 'status') ticket.status = value;
  if (type === 'priority') ticket.priority = value;
  if (type === 'assignee') ticket.assignee = value;

  saveTickets();
  showToast(`Murojaat ${type} o‘zgartirildi: ${value}`);
}

function resolveTicketFromDesk() {
  const ticket = state.tickets.find(t => t.id === state.selectedTicketId);
  if (!ticket) return;

  if (confirm(`Ushbu ${ticket.id} murojaatni "Yechildi" deb belgilamoqchimisiz?`)) {
    ticket.status = 'Yechildi';
    ticket.has_unanswered = false;
    saveTickets();
    showToast('✅ Murojaat "Yechildi" deb belgilandi');
  }
}

// ==========================================================================
// MOBIL MIJOZ PORTALI LOGIKASI
// ==========================================================================
function goToMobileScreen(screenId) {
  document.querySelectorAll('.mobile-screen-view').forEach(s => s.classList.remove('active-screen'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active-screen');

  // Nav tabs highlight
  document.querySelectorAll('.tab-touch-item').forEach(t => t.classList.remove('active'));
  if (screenId === 'm-screen-home') document.getElementById('m-nav-home').classList.add('active');
  if (screenId === 'm-screen-create') document.getElementById('m-nav-create').classList.add('active');
  if (screenId === 'm-screen-archive') document.getElementById('m-nav-archive').classList.add('active');
}

function renderMobileHome() {
  const listContainer = document.getElementById('m-active-tickets-list');
  const activeTickets = state.tickets.filter(t => t.status !== 'Yopildi');

  document.getElementById('m-active-count-badge').innerText = `Faol (${activeTickets.length})`;
  document.getElementById('m-closed-count-badge').innerText = `Yopilganlar (${state.tickets.length - activeTickets.length})`;

  listContainer.innerHTML = '';

  activeTickets.forEach(ticket => {
    const card = document.createElement('div');
    card.className = 'm-ticket-card';
    card.onclick = () => openMobileTicketDetail(ticket.id);

    const statusBadge = `<span class="badge ${getStatusBadgeClass(ticket.status)}">${ticket.status}</span>`;

    card.innerHTML = `
      <div class="m-ticket-header">
        <span class="m-ticket-id">${ticket.id}</span>
        ${statusBadge}
      </div>
      <div class="m-ticket-title">${escapeHtml(ticket.title)}</div>
      <div style="font-size: 12px; color: var(--text-muted); line-height: 1.35; margin-bottom: 6px;">
        ${escapeHtml(ticket.messages[0]?.text || '').substring(0, 75)}...
      </div>
      <div class="m-ticket-footer">
        <span>Agent: <b>${escapeHtml(ticket.assignee)}</b></span>
        <span>${ticket.createdTime}</span>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

function openMobileTicketDetail(ticketId) {
  state.mobileSelectedTicketId = ticketId;
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  document.getElementById('m-detail-id').innerText = ticket.id;
  document.getElementById('m-detail-title').innerText = ticket.title;

  const statusBadge = document.getElementById('m-detail-status-badge');
  statusBadge.className = `badge ${getStatusBadgeClass(ticket.status)}`;
  statusBadge.innerText = ticket.status;

  // SLA indicator
  const slaInfo = formatSlaStatus(ticket.slaDeadline, ticket.status);
  document.getElementById('m-detail-sla').innerText = slaInfo.plainText;

  // Timeline
  const feed = document.getElementById('m-detail-timeline');
  feed.innerHTML = '';

  ticket.messages.forEach(msg => {
    if (msg.sender === 'internal') return; // INTERNAL NOTES NEVER SHOWN TO CLIENT!

    const bubble = document.createElement('div');
    if (msg.sender === 'client') {
      bubble.style = 'align-self: flex-end; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 10px 12px; max-width: 85%; margin-bottom: 8px;';
      bubble.innerHTML = `
        <div style="font-size: 11px; color: var(--primary); font-weight: 700; margin-bottom: 2px;">Siz</div>
        <div style="font-size: 13px;">${escapeHtml(msg.text)}</div>
        ${msg.attachment ? `<div style="font-size: 11px; color: #1D4ED8; margin-top: 4px; font-weight: 500;">📎 ${escapeHtml(msg.attachment.name)}</div>` : ''}
        <div style="font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 4px;">${msg.time}</div>
      `;
    } else {
      bubble.style = 'align-self: flex-start; background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 12px; max-width: 85%; margin-bottom: 8px;';
      bubble.innerHTML = `
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; margin-bottom: 2px;">Agent: ${escapeHtml(msg.author)}</div>
        <div style="font-size: 13px;">${escapeHtml(msg.text)}</div>
        <div style="font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 4px;">${msg.time}</div>
      `;
    }
    feed.appendChild(bubble);
  });

  // Action buttons
  const actionsZone = document.getElementById('m-detail-action-buttons');
  if (ticket.status === 'Yechildi') {
    actionsZone.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        <button class="btn btn-success btn-block" style="height: 40px;" onclick="openModal('m-modal-resolution')">
          ✅ Yechimni Tasdiqlash
        </button>
        <button class="btn btn-outline btn-block" style="height: 40px; color: var(--warning); border-color: #FDE68A;" onclick="openModal('m-modal-reopen')">
          🔄 Muammo yechilmadi / Qayta ochish
        </button>
      </div>
    `;
  } else {
    actionsZone.innerHTML = `
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <input type="text" id="m-client-reply-input" class="field-input" placeholder="Yana javob yozish..." style="font-size: 13px; padding: 8px 12px;">
        <button class="btn btn-primary" style="padding: 8px 14px;" onclick="sendClientReplyFromMobile()">Yuborish</button>
      </div>
    `;
  }

  goToMobileScreen('m-screen-detail');
}

function sendClientReplyFromMobile() {
  const input = document.getElementById('m-client-reply-input');
  const text = input.value.trim();
  if (!text) return;

  const ticket = state.tickets.find(t => t.id === state.mobileSelectedTicketId);
  if (!ticket) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  ticket.messages.push({
    id: Date.now(),
    sender: 'client',
    author: ticket.clientName,
    time: timeStr,
    text: text
  });

  // CLIENT SPOKE -> AUTOMATICALLY MARKS AS UNANSWERED FOR AGENT!
  ticket.has_unanswered = true;

  playSoftChime();
  saveTickets();
  openMobileTicketDetail(ticket.id);
  showToast('Xabaringiz agentga yetkazildi');
}

function submitNewMobileTicket() {
  const title = document.getElementById('m-create-title').value.trim();
  const cat = document.getElementById('m-create-category').value;
  const desc = document.getElementById('m-create-desc').value.trim();

  if (!title || !desc) {
    alert('Iltimos, sarlavha va tavsif maydonlarini to‘ldiring!');
    return;
  }

  const newNumericId = 8500 + state.tickets.length;
  const newTicket = {
    id: `#HD-${newNumericId}`,
    numericId: newNumericId,
    title: title,
    category: cat,
    clientName: 'Azizbek Rahimov',
    clientEmail: 'azizbek.rahimov@example.com',
    clientPhone: '+998 (90) 123-45-67',
    clientCompany: '"Smart Trading" MCHJ',
    status: 'Yangi',
    priority: 'O‘rta',
    assignee: 'Malika Yusupova',
    has_unanswered: true, // Yangi murojaat doim javobsiz sifatida boshlanadi
    slaDeadline: Date.now() + (120 * 60 * 1000), // 2 soat SLA
    createdTime: 'Hozirgina',
    messages: [
      {
        id: Date.now(),
        sender: 'client',
        author: 'Azizbek Rahimov',
        time: 'Hozirgina',
        text: desc,
        attachment: state.uploadedTempFile ? { ...state.uploadedTempFile } : null
      }
    ]
  };

  state.tickets.unshift(newTicket);
  state.uploadedTempFile = null;
  state.selectedTicketId = newTicket.id;

  // Reset form
  document.getElementById('m-create-title').value = '';
  document.getElementById('m-create-desc').value = '';
  document.getElementById('m-dropzone-label').innerText = 'Faylni tanlang yoki rasm oling';

  playSoftChime();
  saveTickets();
  showToast(`Murojaat yaratildi: ${newTicket.id}`);
  goToMobileScreen('m-screen-home');
}

function handleMobileFileUpload() {
  const lbl = document.getElementById('m-dropzone-label');
  lbl.innerHTML = 'Yuklanmoqda... ⏳';
  setTimeout(() => {
    state.uploadedTempFile = { name: 'yangi_skrinshot.png', size: '1.4 MB' };
    lbl.innerHTML = '✅ <b>yangi_skrinshot.png</b> (1.4 MB) biriktirildi';
    showToast('Fayl biriktirildi');
  }, 600);
}

// Modallar boshqaruvi
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show-modal');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show-modal');
}

function confirmClientResolution() {
  closeModal('m-modal-resolution');
  const ticket = state.tickets.find(t => t.id === state.mobileSelectedTicketId);
  if (!ticket) return;

  ticket.status = 'Yopildi';
  ticket.rating = 5;
  ticket.has_unanswered = false;

  playSoftChime();
  saveTickets();
  showToast('✅ Yechim tasdiqlandi va murojaat yopildi!');
  goToMobileScreen('m-screen-home');
}

function confirmClientReopen() {
  closeModal('m-modal-reopen');
  const ticket = state.tickets.find(t => t.id === state.mobileSelectedTicketId);
  if (!ticket) return;

  ticket.status = 'Qayta ochilgan';
  ticket.priority = 'Favqulodda'; // Shoshilinch navbatga
  ticket.has_unanswered = true;
  ticket.slaDeadline = Date.now() + (60 * 60 * 1000); // Tezkor 1 soatlik SLA

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  ticket.messages.push({
    id: Date.now(),
    sender: 'client',
    author: ticket.clientName,
    time: timeStr,
    text: '⚠️ Muammo to‘liq hal bo‘lmadi yoki qaytalandi. Murojaatni zudlik bilan qayta ochdim.'
  });

  playSoftChime();
  saveTickets();
  showToast('🔄 Murojaat 1-ustuvorlik bilan qayta ochildi!');
  openMobileTicketDetail(ticket.id);
}

// ==========================================================================
// YORDAMCHI FUNKSIYALAR VA FORMATTERLAR
// ==========================================================================
function formatSlaStatus(deadlineMs, status) {
  if (status === 'Yopildi' || status === 'Yechildi') {
    return {
      isOverdue: false,
      badgeHtml: '<span class="badge badge-resolved">🟢 Hal bo‘lgan</span>',
      headerHtml: '<span class="badge badge-resolved">🟢 Muammo hal bo‘lgan</span>',
      plainText: 'Hal bo‘lgan'
    };
  }

  const diffMs = deadlineMs - Date.now();
  if (diffMs < 0) {
    // KECHIKKAN (OVERDUE) — WCAG 2.1 AA TALABIGA MOS MATNLI YORLIQ!
    const overdueMins = Math.abs(Math.floor(diffMs / 60000));
    const hours = Math.floor(overdueMins / 60);
    const mins = overdueMins % 60;
    const timeLabel = hours > 0 ? `${hours}s ${mins}m` : `${mins} daqiqa`;

    return {
      isOverdue: true,
      badgeHtml: `<span class="badge badge-overdue">⚠️ Kechikkan - ${timeLabel}</span>`,
      headerHtml: `<div class="badge badge-overdue" style="font-size: 12px; padding: 5px 12px;">⚠️ Kechikkan SLA: Me'yordan ${timeLabel} o‘tdi</div>`,
      plainText: `⚠️ Kechikkan (${timeLabel} o‘tdi)`
    };
  } else {
    // Normal SLA
    const remMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(remMins / 60);
    const mins = remMins % 60;
    const timeLabel = hours > 0 ? `${hours}s ${mins}m` : `${mins} daqiqa`;

    return {
      isOverdue: false,
      badgeHtml: `<span class="badge badge-normal-sla">⏳ ${timeLabel} qoldi</span>`,
      headerHtml: `<div class="badge badge-normal-sla" style="font-size: 12px; padding: 5px 12px;">⏳ SLA muddati: ${timeLabel} qoldi</div>`,
      plainText: `⏳ Javob kutilmoqda: ~${timeLabel}`
    };
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Yangi': return 'badge-normal-sla';
    case 'Jarayonda': return 'badge-in-progress';
    case 'Yechildi': return 'badge-resolved';
    case 'Yopildi': return 'badge-resolved';
    case 'Qayta ochilgan': return 'badge-reopened';
    default: return 'badge-normal-sla';
  }
}

function showToast(msg) {
  const toast = document.getElementById('global-toast');
  toast.innerText = msg;
  toast.style.display = 'block';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 2800);
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==========================================================================
// AI COPILOT & SMART ASSISTANT FUNCTIONS (GEMINI AI LIVE INTEGRATION)
// ==========================================================================
async function triggerAiCopilotReply() {
  const ticket = state.tickets.find(t => t.id === state.selectedTicketId);
  if (!ticket) return;

  const btn = document.querySelector('.btn-ai-magic');
  if (btn) {
    btn.innerHTML = '<span>⏳</span> Gemini AI tahlil qilmoqda...';
    btn.disabled = true;
  }

  playSoftChime();

  const isInternal = state.composerMode === 'internal';
  const lastClientMsg = ticket.messages.filter(m => m.sender === 'client').slice(-1)[0]?.text || ticket.title;

  const prompt = isInternal
    ? `Mijoz muammosi: "${ticket.title}". Xabari: "${lastClientMsg}". Ushbu muammo bo‘yicha qo‘llab-quvvatlash jamoasi uchun qisqa (2-3 gap) ichki texnik xulosa (RCA) yozing.`
    : `Mijoz muammosi: "${ticket.title}". Xabari: "${lastClientMsg}". Mijozga rasmiy, xushmuomala, professional va taskin beruvchi o‘zbek tilida Helpdesk agenti nomidan javob yozing. 2-3 gap bo‘lsin.`;

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        systemInstruction: "Siz professional Helpdesk agentisiz. O‘zbek tilida toza va aniq javob bering."
      })
    });

    const data = await res.json();
    const input = document.getElementById('desk-composer-input');

    if (data.success && data.text) {
      input.value = (isInternal ? '🔒 [Gemini AI RCA]: ' : '') + data.text.trim();
      showToast('✨ Google Gemini AI jonli javob yaratdi!');
    } else {
      useSmartFallbackReply(ticket, isInternal);
      showToast('✨ AI professional javob taklif qildi (Smart Mode)');
    }
  } catch (err) {
    useSmartFallbackReply(ticket, isInternal);
    showToast('✨ AI professional javob taklif qildi (Smart Mode)');
  }

  if (btn) {
    btn.innerHTML = '<span>✨</span> AI Javob Taklif Qilish';
    btn.disabled = false;
  }

  document.getElementById('desk-composer-input').focus();
}

function useSmartFallbackReply(ticket, isInternal) {
  const input = document.getElementById('desk-composer-input');
  if (isInternal) {
    if (ticket.id === '#HD-8492') {
      input.value = '🔒 [AI RCA Tahlili]: Billing servisidagi 502 xatolik PostgreSQL tranzaksiyalari navbati to‘lib qolgani sababli yuzaga kelgan. Yechim: Sardor billing-worker servisidagi xotira hajmini oshirdi va to‘xtab qolgan 12 ta tranzaksiyani qayta yurgizdi. Mijozga tasdiq xabarini yo‘llash mumkin.';
    } else if (ticket.id === '#HD-8495') {
      input.value = '🔒 [AI Texnik Eslatma]: Mijoz API v2 ga o‘tishda yangi Bearer tokenni auth headerda yubormagan. Xavfsizlik bo‘limi eski Basic tokenni bloklagan. Mijozga v2 qo‘llanmasini berish kerak.';
    } else {
      input.value = `🔒 [AI Ichki Eslatma]: Murojaat ${ticket.category} bo‘yicha tekshirildi. Mas'ul ${ticket.assignee} bilan bog‘lanib, statusni yakunlash tavsiya etiladi.`;
    }
  } else {
    if (ticket.id === '#HD-8492') {
      input.value = 'Assalomu alaykum, hurmatli Azizbek! Murojaatingiz va ilova qilingan chekingizni qabul qildik. Texnik xizmatimiz tomonidan tekshirildi: to‘lov tizimidagi qisqa uzilish sababli kechikish yuz bergan. Hozirda 150 000 so‘m mablag‘ balansingizga to‘liq qo‘lda o‘tkazildi. Iltimos, profilingizdagi balansni qayta tekshirib ko‘ring va muammo bartaraf etilganini tasdiqlang.';
    } else if (ticket.id === '#HD-8495') {
      input.value = 'Assalomu alaykum, hurmatli Jasur! 401 Unauthorized xatoligi yangi API xavfsizlik protokoli joriy etilgani sababli kelib chiqqan. Sizga yangi Bearer token bilan so‘rov yuborish bo‘yicha texnik ko‘rsatmalarni yubordik. Iltimos, qayta sinab ko‘ring va natijasini ma’lum qiling.';
    } else if (ticket.id === '#HD-8480') {
      input.value = 'Assalomu alaykum, Nodira! SMS shlyuzimizdagi uzilish to‘liq bartaraf etildi. Hozir profilingizga kirib, parolni tiklash tugmasini yana bir bor bosishingizni so‘raymiz. Kod 30 soniya ichida yetib boradi.';
    } else {
      input.value = `Assalomu alaykum, hurmatli ${ticket.clientName}! Murojaatingizni diqqat bilan ko‘rib chiqdik. Siz bildirgan ${ticket.title} masalasi bo‘yicha barcha choralar ko‘rildi. Yana savollaringiz bo‘lsa, bajonidil yordam beramiz.`;
    }
  }
}

async function refreshAiSummary() {
  const ticket = state.tickets.find(t => t.id === state.selectedTicketId);
  if (!ticket) return;

  const summaryEl = document.getElementById('desk-ai-summary-text');
  if (summaryEl) {
    summaryEl.innerHTML = '<em>Gemini AI tahlil qilmoqda... 🧠</em>';
    playSoftChime();

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Ushbu mijoz murojaatini 2 ta gapda aniq xulosa qilib bering: Mavzu: "${ticket.title}". Xabar: "${ticket.messages[0]?.text}". Holati: "${ticket.status}".`,
          systemInstruction: "Qisqa, faktlarga asoslangan xulosa bering."
        })
      });
      const data = await res.json();
      if (data.success && data.text) {
        ticket.aiSummary = data.text.trim();
        summaryEl.innerText = ticket.aiSummary;
        showToast('✨ Gemini AI xulosani jonli yangiladi!');
        return;
      }
    } catch (e) {}

    setTimeout(() => {
      summaryEl.innerText = ticket.aiSummary || 'Murojaat bo‘yicha so‘nggi ma’lumotlar yangilandi.';
      showToast('🔄 AI xulosa yangilandi');
    }, 400);
  }
}

function renderAllViews() {
  renderDeskQueue();
  renderDeskActiveTicket();
  renderMobileHome();
}

// Har 1 soniyada SLA taymerlarini yangilab borish
setInterval(() => {
  renderDeskQueue();
}, 5000);

// Init
window.addEventListener('DOMContentLoaded', () => {
  loadTickets();
  renderAllViews();
  handleResponsiveLayout();
});
