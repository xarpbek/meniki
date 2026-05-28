'use strict';
/* ════════════════════════════════════════
   HABITFLOW PREMIUM v3.0 — app.js
   Full featured: widgets, shortcuts, search,
   onboarding, notifications, offline support
════════════════════════════════════════ */

// ══════════ STATE ══════════
let habits = [], completions = {}, settings = {
  theme: 'midnight', reminderTime: '09:00',
  enableReminders: false, enableSound: false,
  enableAnimations: true, enableBlur: true,
  compactMode: false, onboardingDone: false,
  focusSessions: 0, calMonth: null, calYear: null
};
let charts = {}, selectedColor = '#6366f1', confirmCallback = null;
let focusInterval = null, focusRunning = false;
let focusTime = 25 * 60, focusMode = 'focus'; // focus | break
let cmdSelected = 0, cmdItems = [];
let gKeyBuffer = '';

// ══════════ CONSTANTS ══════════
const CAT_ICON  = { health:'🏥', fitness:'💪', learning:'📚', mindfulness:'🧘', productivity:'⚡', social:'👥', other:'✨' };
const CAT_LABEL = { health:"Sog'liq", fitness:'Sport', learning:"O'rganish", mindfulness:'Mindfulness', productivity:'Samaradorlik', social:'Ijtimoiy', other:'Boshqa' };
const QUOTES = [
  { text:"Katta narsalar kichik odatlardan boshlanadi.", author:"James Clear" },
  { text:"Har kun bir qadam oldinga — bu muvaffaqiyat yo'li.", author:"Konfutsiy" },
  { text:"Intizom — ozodlikning eng yuqori shakli.", author:"Jocko Willink" },
  { text:"Siz odatlaringiz mahsulisiniz.", author:"Aristotel" },
  { text:"Bugun qilgan kichik harakat, ertangi katta o'zgarish.", author:"Lao Tzu" },
  { text:"O'zingizni o'zgartirmoqchi bo'lsangiz, odatlaringizni o'zgartiring.", author:"William James" },
  { text:"Mukammallik bir harakatda emas, oddatda yashaydi.", author:"Aristotel" },
  { text:"Qiyinchilik — o'sishning belgisi.", author:"Epiktet" },
  { text:"Harakat qilish uchun ilhom kutmang, harakat qiling — ilhom keladi.", author:"Jack London" },
  { text:"Har bir ekspert bir paytlar yangi boshlovchi edi.", author:"Helen Hayes" },
];
const KEYS_MAP = { STORAGE_H:'hf_habits', STORAGE_C:'hf_completions', STORAGE_S:'hf_settings', SEED:'hf_seed_done' };

// ══════════ STORAGE ══════════
function save() {
  try {
    localStorage.setItem(KEYS_MAP.STORAGE_H, JSON.stringify(habits));
    localStorage.setItem(KEYS_MAP.STORAGE_C, JSON.stringify(completions));
    localStorage.setItem(KEYS_MAP.STORAGE_S, JSON.stringify(settings));
  } catch(e) { console.warn('Storage full:', e); }
}
function load() {
  const hRaw = localStorage.getItem(KEYS_MAP.STORAGE_H) || localStorage.getItem('hf2_h');
  const cRaw = localStorage.getItem(KEYS_MAP.STORAGE_C) || localStorage.getItem('hf2_c');
  const sRaw = localStorage.getItem(KEYS_MAP.STORAGE_S) || localStorage.getItem('hf2_s');
  try { habits = JSON.parse(hRaw) || []; } catch { habits = []; }
  try { completions = JSON.parse(cRaw) || {}; } catch { completions = {}; }
  try { settings = { ...settings, ...JSON.parse(sRaw) }; } catch {}
  if (habits.length > 0) save();
}

// ══════════ HELPERS ══════════
const today  = () => new Date().toISOString().split('T')[0];
const dstr   = d  => d.toISOString().split('T')[0];
const uid    = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const getCmp = (hid, date) => (completions[date]?.[hid]) || 0;
const setCmp = (hid, date, v) => { if (!completions[date]) completions[date] = {}; completions[date][hid] = v; };
const isDone = hid => { const h = habits.find(x => x.id === hid); return h ? getCmp(hid, today()) >= h.target : false; };

function calcStreak(hid) {
  const h = habits.find(x => x.id === hid); if (!h) return 0;
  let s = 0, d = new Date();
  if (!isDone(hid)) d.setDate(d.getDate() - 1);
  while (getCmp(hid, dstr(d)) >= h.target) { s++; d.setDate(d.getDate() - 1); }
  return s;
}
function calcLongest(hid) {
  const h = habits.find(x => x.id === hid); if (!h) return 0;
  const dates = Object.keys(completions).sort(); let max = 0, cur = 0, prev = null;
  dates.forEach(ds => {
    if (getCmp(hid, ds) >= h.target) {
      cur = (prev && (new Date(ds) - new Date(prev)) / 86400000 === 1) ? cur + 1 : 1;
      if (cur > max) max = cur; prev = ds;
    } else prev = null;
  });
  return max;
}
function globalStreak() {
  if (!habits.length) return 0;
  let s = 0, d = new Date();
  while (true) {
    const ds = dstr(d);
    if (habits.some(h => getCmp(h.id, ds) >= h.target)) { s++; d.setDate(d.getDate() - 1); }
    else break;
    if (s > 3650) break;
  }
  return s;
}
function compRate(hid, days = 30) {
  const h = habits.find(x => x.id === hid); if (!h) return 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (getCmp(hid, dstr(d)) >= h.target) done++;
  }
  return Math.round((done / days) * 100);
}
function todayStats() {
  const t = habits.length, d = habits.filter(h => isDone(h.id)).length;
  return { t, d, r: t ? Math.round((d / t) * 100) : 0 };
}


// ══════════ LOADING SCREEN ══════════
function showLoading() {
  const bar = document.getElementById('loadingBar');
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random() * 18;
    if (p >= 100) { p = 100; clearInterval(iv); }
    bar.style.width = p + '%';
  }, 80);
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('hidden');
  }, 900);
}

// ══════════ ONBOARDING ══════════
let obStep = 1;
function checkOnboarding() {
  if (settings.onboardingDone) {
    document.getElementById('onboarding').classList.add('hidden');
    return;
  }
  document.getElementById('onboarding').classList.remove('hidden');
}
function obNext() {
  if (obStep >= 4) return;
  const cur = document.querySelector(`.ob-step[data-step="${obStep}"]`);
  const nxt = document.querySelector(`.ob-step[data-step="${obStep + 1}"]`);
  const dots = document.querySelectorAll('.ob-dot');
  cur.classList.remove('active');
  nxt.classList.add('active');
  dots[obStep - 1].classList.remove('active');
  dots[obStep].classList.add('active');
  obStep++;
}
function obTheme(btn, theme) {
  document.querySelectorAll('.ob-theme-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyTheme(theme);
}
function finishOnboarding() {
  const notif = document.getElementById('obNotif');
  if (notif.checked) {
    settings.enableReminders = true;
    if ('Notification' in window) Notification.requestPermission();
  }
  settings.onboardingDone = true;
  save();
  document.getElementById('onboarding').style.opacity = '0';
  document.getElementById('onboarding').style.transform = 'scale(1.04)';
  document.getElementById('onboarding').style.transition = 'opacity .5s ease, transform .5s ease';
  setTimeout(() => document.getElementById('onboarding').classList.add('hidden'), 500);
  if (!habits.length) seedDemo();
}

// ══════════ TOAST ══════════
function toast(msg, type = 'info') {
  const ic = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${ic[type]}"></i><span>${msg}</span>`;
  document.getElementById('toastWrap').appendChild(el);
  setTimeout(() => {
    el.style.cssText = 'opacity:0;transform:translateX(20px);transition:.3s';
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

// ══════════ THEME ══════════
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  settings.theme = t; save();
  document.querySelectorAll('.theme-card, .ob-theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t));
  const isLight = t === 'minimal';
  CHART_C.text = isLight ? '#5c6280' : '#6b7499';
  CHART_C.grid = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
}
const CHART_C = { text: '#6b7499', grid: 'rgba(255,255,255,0.06)' };

// ══════════ NAVIGATION ══════════
const PAGE_META = {
  dashboard: { title: 'Dashboard', sub: 'Ana sahifa' },
  habits:    { title: 'Odatlar', sub: "Barcha odatlaringiz" },
  widgets:   { title: 'Widgetlar', sub: 'Shaxsiy boshqaruv paneli' },
  analytics: { title: 'Statistika', sub: 'Tahlil va ko\'rsatkichlar' },
  heatmap:   { title: 'Faollik Xaritasi', sub: 'Yillik aktivlik' },
  settings:  { title: 'Sozlamalar', sub: 'Moslashtirish' },
};
function go(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  const m = PAGE_META[page] || { title: page, sub: '' };
  document.getElementById('pageTitle').textContent = m.title;
  document.getElementById('pageSubtitle').textContent = m.sub;
  document.getElementById('sidebar').classList.remove('open');
  if (page === 'dashboard') renderDashboard();
  if (page === 'habits')    renderHabits();
  if (page === 'widgets')   renderWidgets();
  if (page === 'analytics') renderAnalytics();
  if (page === 'heatmap')   renderHeatmap();
  if (page === 'settings')  renderSettings();
}

// ══════════ MODAL ══════════
function openModal(hid = null) {
  document.getElementById('habitForm').reset();
  selectedColor = '#6366f1';
  document.querySelectorAll('.c-opt').forEach(c => c.classList.remove('sel'));
  document.querySelector('.c-opt[data-c="#6366f1"]').classList.add('sel');
  if (hid) {
    const h = habits.find(x => x.id === hid);
    document.getElementById('modalTitle').textContent = 'Odatni Tahrirlash';
    document.getElementById('editHabitId').value = h.id;
    document.getElementById('habitName').value = h.name;
    document.getElementById('habitCategory').value = h.category;
    document.getElementById('habitTarget').value = h.target;
    document.getElementById('habitUnit').value = h.unit || '';
    document.getElementById('habitDesc').value = h.desc || '';
    document.getElementById('habitReminder').value = h.reminder || '';
    selectedColor = h.color;
    document.querySelectorAll('.c-opt').forEach(c => c.classList.toggle('sel', c.dataset.c === h.color));
  } else {
    document.getElementById('modalTitle').textContent = "Yangi Odat Qo'shish";
    document.getElementById('editHabitId').value = '';
  }
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('habitName').focus(), 120);
}
const closeModal = () => document.getElementById('modalOverlay').classList.remove('open');

function showConfirm(title, msg, cb) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmOverlay').classList.add('open');
  confirmCallback = cb;
}
const closeConfirm = () => { document.getElementById('confirmOverlay').classList.remove('open'); confirmCallback = null; };

// ══════════ SHORTCUTS MODAL ══════════
const openShortcuts  = () => document.getElementById('shortcutsOverlay').classList.add('open');
const closeShortcuts = () => document.getElementById('shortcutsOverlay').classList.remove('open');


// ══════════ COMMAND PALETTE ══════════
function openCmd() {
  document.getElementById('cmdOverlay').classList.add('open');
  document.getElementById('cmdInput').value = '';
  document.getElementById('cmdInput').focus();
  renderCmdResults('');
}
function closeCmd() { document.getElementById('cmdOverlay').classList.remove('open'); }

function renderCmdResults(q) {
  const container = document.getElementById('cmdResults');
  q = q.toLowerCase().trim();
  cmdItems = [];
  let html = '';

  // Pages
  const pages = [
    { icon: 'fa-gauge-high', text: 'Dashboard', sub: 'Ana sahifa', action: () => go('dashboard'), kbd: 'G D' },
    { icon: 'fa-list-check', text: 'Odatlar', sub: 'Barcha odatlar', action: () => go('habits'), kbd: 'G H' },
    { icon: 'fa-table-cells-large', text: 'Widgetlar', sub: 'Boshqaruv paneli', action: () => go('widgets') },
    { icon: 'fa-chart-pie', text: 'Statistika', sub: 'Tahlil', action: () => go('analytics'), kbd: 'G A' },
    { icon: 'fa-fire', text: 'Faollik Xaritasi', sub: 'Heatmap', action: () => go('heatmap'), kbd: 'G M' },
    { icon: 'fa-sliders', text: 'Sozlamalar', sub: 'Sozlash', action: () => go('settings') },
  ];
  // Actions
  const actions = [
    { icon: 'fa-plus', text: "Yangi odat qo'shish", sub: 'Odat yaratish', action: () => { closeCmd(); openModal(); }, kbd: 'N' },
    { icon: 'fa-keyboard', text: 'Keyboard Shortcuts', sub: 'Barcha klaviatura buyruqlari', action: () => { closeCmd(); openShortcuts(); }, kbd: '?' },
    { icon: 'fa-download', text: "Ma'lumotlarni eksport", sub: 'JSON fayl', action: () => { closeCmd(); exportData(); } },
  ];
  // Habits
  const habitItems = habits.map(h => ({
    icon: null, emoji: CAT_ICON[h.category], text: h.name,
    sub: `${CAT_LABEL[h.category]} · ${compRate(h.id, 30)}% (30 kun)`,
    action: () => { closeCmd(); go('habits'); }
  }));

  const allItems = [
    ...(!q ? pages : pages.filter(p => p.text.toLowerCase().includes(q))),
    ...(!q ? actions : actions.filter(a => a.text.toLowerCase().includes(q))),
    ...habitItems.filter(h => !q || h.text.toLowerCase().includes(q)),
  ];
  cmdItems = allItems;

  if (!allItems.length) {
    container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text3);font-size:.85rem">Hech narsa topilmadi</div>`;
    return;
  }

  if (!q) {
    const pageSection = pages.map((p, i) => cmdItemHTML(p, i)).join('');
    const actSection  = actions.map((a, i) => cmdItemHTML(a, pages.length + i)).join('');
    html = `<div class="cmd-section-title">Sahifalar</div>${pageSection}<div class="cmd-section-title">Harakatlar</div>${actSection}`;
    if (habitItems.length) html += `<div class="cmd-section-title">Odatlar</div>` + habitItems.slice(0, 5).map((h, i) => cmdItemHTML(h, pages.length + actions.length + i)).join('');
  } else {
    html = allItems.slice(0, 10).map((item, i) => cmdItemHTML(item, i)).join('');
  }
  container.innerHTML = html;
  cmdSelected = 0;
  highlightCmd(0);
  container.querySelectorAll('.cmd-item').forEach((el, i) => {
    el.addEventListener('mouseenter', () => { cmdSelected = i; highlightCmd(i); });
    el.addEventListener('click', () => { allItems[i]?.action?.(); closeCmd(); });
  });
}

function cmdItemHTML(item, i) {
  return `<div class="cmd-item" data-idx="${i}">
    <div class="cmd-item-icon">${item.emoji ? item.emoji : `<i class="fa-solid ${item.icon}"></i>`}</div>
    <div style="flex:1"><div class="cmd-item-text">${item.text}</div><div class="cmd-item-sub">${item.sub}</div></div>
    ${item.kbd ? `<div class="cmd-item-kbd">${item.kbd.split(' ').map(k => `<kbd>${k}</kbd>`).join('')}</div>` : ''}
  </div>`;
}
function highlightCmd(idx) {
  document.querySelectorAll('.cmd-item').forEach((el, i) => el.classList.toggle('focused', i === idx));
}

// ══════════ KEYBOARD SHORTCUTS ══════════
function initKeyboard() {
  document.addEventListener('keydown', e => {
    const tag = document.activeElement.tagName;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
    const cmdOpen = document.getElementById('cmdOverlay').classList.contains('open');
    const modalOpen = document.querySelector('.modal-overlay.open');

    // ESC — close everything
    if (e.key === 'Escape') {
      if (cmdOpen) { closeCmd(); return; }
      if (modalOpen) { modalOpen.classList.remove('open'); return; }
      return;
    }

    // CMD/CTRL+K — command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openCmd(); return; }

    // Command palette navigation
    if (cmdOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdSelected = Math.min(cmdSelected + 1, cmdItems.length - 1); highlightCmd(cmdSelected); }
      if (e.key === 'ArrowUp') { e.preventDefault(); cmdSelected = Math.max(cmdSelected - 1, 0); highlightCmd(cmdSelected); }
      if (e.key === 'Enter') { e.preventDefault(); cmdItems[cmdSelected]?.action?.(); closeCmd(); }
      return;
    }

    if (isInput || modalOpen) return;

    // Single key shortcuts
    if (e.key === '/') { e.preventDefault(); openCmd(); }
    if (e.key === '?' || e.key === 'F1') { e.preventDefault(); openShortcuts(); }
    if (e.key === 'n' || e.key === 'N') { openModal(); }

    // G+key navigation
    if (e.key === 'g' || e.key === 'G') { gKeyBuffer = 'g'; setTimeout(() => gKeyBuffer = '', 1000); return; }
    if (gKeyBuffer === 'g') {
      const nav = { d: 'dashboard', h: 'habits', a: 'analytics', m: 'heatmap', w: 'widgets', s: 'settings' };
      const dest = nav[e.key.toLowerCase()];
      if (dest) { e.preventDefault(); go(dest); gKeyBuffer = ''; }
    }
  });
}


// ══════════ HABIT CRUD ══════════
function saveHabit(e) {
  e.preventDefault();
  const id   = document.getElementById('editHabitId').value;
  const name = document.getElementById('habitName').value.trim();
  if (!name) return toast('Odat nomini kiriting!', 'error');
  const data = {
    name, color: selectedColor,
    category: document.getElementById('habitCategory').value,
    target: parseInt(document.getElementById('habitTarget').value) || 1,
    unit: document.getElementById('habitUnit').value.trim(),
    desc: document.getElementById('habitDesc').value.trim(),
    reminder: document.getElementById('habitReminder').value,
  };
  if (id) {
    const i = habits.findIndex(h => h.id === id);
    habits[i] = { ...habits[i], ...data };
    toast('Odat yangilandi! ✅', 'success');
  } else {
    habits.push({ ...data, id: uid(), createdAt: today() });
    toast("Yangi odat qo'shildi! 🎉", 'success');
  }
  save(); closeModal(); renderAll();
}
function deleteHabit(id) {
  const h = habits.find(x => x.id === id);
  showConfirm("Odatni o'chirish", `"${h.name}" odatini o'chirmoqchimisiz?`, () => {
    habits = habits.filter(x => x.id !== id);
    save(); renderAll(); toast("O'chirildi", 'info'); closeConfirm();
  });
}
function toggleHabit(hid) {
  const h = habits.find(x => x.id === hid); if (!h) return;
  const cur = getCmp(hid, today());
  if (cur >= h.target) {
    setCmp(hid, today(), 0); toast('Bekor qilindi', 'info');
  } else {
    setCmp(hid, today(), cur + 1);
    if (cur + 1 >= h.target) {
      const streak = calcStreak(hid);
      toast(`✅ "${h.name}" — 🔥 ${streak} kun seriya!`, 'success');
      playSound('complete');
    }
  }
  save(); renderAll();
}

// ══════════ SOUND ══════════
function playSound(type) {
  if (!settings.enableSound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'complete') { osc.frequency.setValueAtTime(523, ctx.currentTime); osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2); }
    if (type === 'timer')    { osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(554, ctx.currentTime + 0.15); }
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

// ══════════ NOTIFICATIONS ══════════
function scheduleReminders() {
  if (!settings.enableReminders || !('Notification' in window) || Notification.permission !== 'granted') return;
  setInterval(() => {
    const now = new Date();
    const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    habits.forEach(h => {
      if (h.reminder === cur && !isDone(h.id)) {
        new Notification('HabitFlow ⚡', { body: `"${h.name}" vaqti keldi!`, icon: '/favicon.ico' });
      }
    });
    // Daily reminder
    if (cur === settings.reminderTime) {
      const s = todayStats();
      if (s.d < s.t) new Notification('HabitFlow — Kunlik eslatma', { body: `Bugun ${s.t - s.d} odat bajarilmagan.` });
    }
  }, 60000);
}
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
}


// ══════════ FOCUS TIMER ══════════
const FOCUS_TIMES = { focus: 25 * 60, break: 5 * 60 };
function focusAction(type) {
  if (type === 'toggle') {
    focusRunning = !focusRunning;
    const btn = document.getElementById('focusPlayBtn');
    btn.innerHTML = focusRunning ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    if (focusRunning) {
      focusInterval = setInterval(() => {
        focusTime--;
        updateFocusDisplay();
        if (focusTime <= 0) {
          clearInterval(focusInterval); focusRunning = false;
          btn.innerHTML = '<i class="fa-solid fa-play"></i>';
          playSound('timer');
          if (focusMode === 'focus') {
            settings.focusSessions++; save();
            toast('🎉 Focus sessiya tugadi! Dam olish vaqti.', 'success');
            focusMode = 'break'; focusTime = FOCUS_TIMES.break;
          } else {
            toast('☕ Dam olish tugadi! Yana fokus.', 'info');
            focusMode = 'focus'; focusTime = FOCUS_TIMES.focus;
          }
          updateFocusDisplay();
        }
      }, 1000);
    } else clearInterval(focusInterval);
  }
  if (type === 'reset') {
    clearInterval(focusInterval); focusRunning = false;
    focusTime = FOCUS_TIMES[focusMode];
    document.getElementById('focusPlayBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
    updateFocusDisplay();
  }
  if (type === 'skip') {
    clearInterval(focusInterval); focusRunning = false;
    focusMode = focusMode === 'focus' ? 'break' : 'focus';
    focusTime = FOCUS_TIMES[focusMode];
    document.getElementById('focusPlayBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
    updateFocusDisplay();
  }
}
function updateFocusDisplay() {
  const m = Math.floor(focusTime / 60), s = focusTime % 60;
  const el = document.getElementById('focusDisplay');
  const lbl = document.getElementById('focusModeLabel');
  const sess = document.getElementById('focusSessions');
  if (el) el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  if (lbl) lbl.textContent = focusMode === 'focus' ? '🎯 Focus' : '☕ Dam olish';
  if (sess) sess.textContent = settings.focusSessions;
}

// ══════════ CALENDAR WIDGET ══════════
let calDisplayMonth, calDisplayYear;
function initCal() {
  const now = new Date();
  calDisplayMonth = now.getMonth();
  calDisplayYear = now.getFullYear();
  renderCal();
}
function calPrev() { calDisplayMonth--; if (calDisplayMonth < 0) { calDisplayMonth = 11; calDisplayYear--; } renderCal(); }
function calNext() { calDisplayMonth++; if (calDisplayMonth > 11) { calDisplayMonth = 0; calDisplayYear++; } renderCal(); }
function renderCal() {
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const lbl = document.getElementById('calMonthLabel');
  if (lbl) lbl.textContent = `${months[calDisplayMonth]} ${calDisplayYear}`;
  const grid = document.getElementById('calGrid'); if (!grid) return;
  const todayStr = today();
  const firstDay = new Date(calDisplayYear, calDisplayMonth, 1);
  const lastDay  = new Date(calDisplayYear, calDisplayMonth + 1, 0);
  let startDow = firstDay.getDay(); if (startDow === 0) startDow = 7; // Mon=1
  let cells = '';
  // Prev month padding
  for (let i = 1; i < startDow; i++) {
    const d = new Date(calDisplayYear, calDisplayMonth, 1 - (startDow - i));
    cells += `<div class="w-cal-cell other-month">${d.getDate()}</div>`;
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const ds = `${calDisplayYear}-${String(calDisplayMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = ds === todayStr;
    const anyDone = habits.some(h => getCmp(h.id, ds) >= h.target);
    const allDone = habits.length > 0 && habits.every(h => getCmp(h.id, ds) >= h.target);
    const cls = [isToday ? 'today' : '', allDone ? 'done-day' : anyDone ? 'has-habit' : ''].filter(Boolean).join(' ');
    cells += `<div class="w-cal-cell ${cls}" title="${ds}">${d}</div>`;
  }
  grid.innerHTML = cells;
}

// ══════════ QUOTES ══════════
let quoteIdx = Math.floor(Math.random() * QUOTES.length);
function refreshQuote() {
  quoteIdx = (quoteIdx + 1) % QUOTES.length;
  const q = QUOTES[quoteIdx];
  const t = document.getElementById('wQuoteText');
  const a = document.getElementById('wQuoteAuthor');
  if (t) { t.style.opacity = '0'; setTimeout(() => { t.textContent = `"${q.text}"`; t.style.opacity = '1'; t.style.transition = 'opacity .4s'; }, 200); }
  if (a) a.textContent = `— ${q.author}`;
}

// ══════════ EXPORT / IMPORT ══════════
function exportData() {
  const blob = new Blob([JSON.stringify({ habits, completions, settings }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `habitflow-${today()}.json`;
  a.click();
  toast("Ma'lumotlar eksport qilindi! 📥", 'success');
}
function importData(file) {
  const r = new FileReader();
  r.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (d.habits) habits = d.habits;
      if (d.completions) completions = d.completions;
      if (d.settings) settings = { ...settings, ...d.settings };
      save(); applyTheme(settings.theme); renderAll();
      toast("Import muvaffaqiyatli! 🎉", 'success');
    } catch { toast("Fayl noto'g'ri format!", 'error'); }
  };
  r.readAsText(file);
}


// ══════════ CHART HELPERS ══════════
function killChart(k) { if (charts[k]) { charts[k].destroy(); charts[k] = null; } }
const cOpts = (extra = {}) => ({
  responsive: true, maintainAspectRatio: true,
  plugins: { legend: { display: false }, ...extra.plugins },
  scales: {
    y: { beginAtZero: true, max: 100, ticks: { color: CHART_C.text, callback: v => v + '%' }, grid: { color: CHART_C.grid } },
    x: { ticks: { color: CHART_C.text }, grid: { display: false } }
  }, ...extra
});

// ══════════ DASHBOARD CHARTS ══════════
function renderWeeklyChart() {
  killChart('weekly');
  const days = ['Du','Se','Ch','Pa','Ju','Sh','Ya'], labels = [], data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    labels.push(days[d.getDay() === 0 ? 6 : d.getDay() - 1]);
    const ds = dstr(d), done = habits.filter(h => getCmp(h.id, ds) >= h.target).length;
    data.push(habits.length ? Math.round((done / habits.length) * 100) : 0);
  }
  const ctx = document.getElementById('weeklyBarChart'); if (!ctx) return;
  charts['weekly'] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: data.map(v => v >= 80 ? 'rgba(34,197,94,.8)' : v >= 50 ? 'rgba(99,102,241,.8)' : 'rgba(239,68,68,.5)'), borderRadius: 8, borderSkipped: false }] },
    options: cOpts()
  });
}
function renderTrendChart() {
  killChart('trend');
  const labels = [], data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    labels.push(i % 7 === 0 ? dstr(d).slice(5) : '');
    const done = habits.filter(h => getCmp(h.id, dstr(d)) >= h.target).length;
    data.push(habits.length ? Math.round((done / habits.length) * 100) : 0);
  }
  const ctx = document.getElementById('trendLineChart'); if (!ctx) return;
  charts['trend'] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ data, borderColor: 'var(--accent)', backgroundColor: 'rgba(99,102,241,.07)', fill: true, tension: .4, pointRadius: 0, pointHoverRadius: 5 }] },
    options: cOpts()
  });
}
function renderCatDonut() {
  killChart('catd');
  const cats = {}; habits.forEach(h => { cats[h.category] = (cats[h.category] || 0) + 1; });
  const ctx = document.getElementById('categoryDonutChart'); if (!ctx) return;
  const colors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
  charts['catd'] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: Object.keys(cats).map(k => CAT_ICON[k] + ' ' + CAT_LABEL[k]), datasets: [{ data: Object.values(cats), backgroundColor: colors.slice(0, Object.keys(cats).length), borderWidth: 0, hoverOffset: 10 }] },
    options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'right', labels: { color: CHART_C.text, boxWidth: 11, padding: 10, font: { size: 11 } } } } }
  });
}

// ══════════ RENDER DASHBOARD ══════════
function renderDashboard() {
  const s = todayStats(), gs = globalStreak();
  document.getElementById('statTotal').textContent  = s.t;
  document.getElementById('statToday').textContent  = s.d;
  document.getElementById('statStreak').textContent = gs;
  document.getElementById('statRate').textContent   = s.r + '%';
  document.getElementById('sidebarStreak').textContent = gs;
  document.getElementById('streakBarFill').style.width = Math.min(100, (gs / 30) * 100) + '%';
  document.getElementById('todayProgress').textContent = `${s.d}/${s.t}`;
  document.getElementById('todayBar').style.width = (s.t ? (s.d / s.t) * 100 : 0) + '%';

  const list = document.getElementById('todayList');
  if (!habits.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon"><i class="fa-solid fa-seedling"></i></div><p>Hali odat qo'shilmagan</p></div>`;
  } else {
    list.innerHTML = habits.map(h => {
      const done = isDone(h.id), streak = calcStreak(h.id);
      return `<div class="t-item ${done ? 'done' : ''}" onclick="toggleHabit('${h.id}')">
        <div class="t-check" style="border-color:${h.color};${done ? `background:${h.color}` : ''}">
          ${done ? '<i class="fa-solid fa-check"></i>' : ''}
        </div>
        <span class="t-name">${CAT_ICON[h.category] || '✨'} ${h.name}</span>
        ${streak > 0 ? `<span class="t-streak">🔥${streak}</span>` : ''}
      </div>`;
    }).join('');
  }
  renderWeeklyChart(); renderTrendChart(); renderCatDonut();
}

// ══════════ RENDER HABITS ══════════
function renderHabits() {
  const q   = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat = document.querySelector('.fpill.active[data-cat]')?.dataset.cat || 'all';
  const st  = document.getElementById('filterStatus')?.value || 'all';
  const filtered = habits.filter(h => {
    if (q && !h.name.toLowerCase().includes(q)) return false;
    if (cat !== 'all' && h.category !== cat) return false;
    if (st === 'completed' && !isDone(h.id)) return false;
    if (st === 'active' && isDone(h.id)) return false;
    return true;
  });
  const grid = document.getElementById('habitsGrid');
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty full"><div class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></div>
      <p>${habits.length ? 'Hech narsa topilmadi' : "Hali odat qo'shilmagan"}</p>
      ${!habits.length ? `<button class="btn-primary" onclick="openModal()" style="margin-top:.8rem"><i class="fa-solid fa-plus"></i> Qo'shish</button>` : ''}
    </div>`;
    return;
  }
  grid.innerHTML = filtered.map(h => {
    const cur = getCmp(h.id, today()), pct = Math.min(100, (cur / h.target) * 100);
    const done = cur >= h.target, streak = calcStreak(h.id), rate = compRate(h.id, 30);
    return `<div class="habit-card">
      <div class="hc-glow" style="background:${h.color}"></div>
      <div class="hc-top">
        <div class="hc-left">
          <div class="hc-icon" style="background:${h.color}22;color:${h.color}">${CAT_ICON[h.category] || '✨'}</div>
          <div><div class="hc-name">${h.name}</div>${h.desc ? `<div class="hc-desc">${h.desc}</div>` : ''}</div>
        </div>
        <div class="hc-actions">
          <button class="ic-btn" onclick="openModal('${h.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="ic-btn del" onclick="deleteHabit('${h.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="hc-tags">
        <span class="hc-tag" style="background:${h.color}20;color:${h.color}">${CAT_LABEL[h.category]}</span>
        ${h.unit ? `<span class="hc-tag" style="background:var(--glass);color:var(--text2)">${h.target} ${h.unit}</span>` : ''}
        ${streak > 0 ? `<span class="hc-tag" style="background:var(--orange-g);color:var(--orange)">🔥 ${streak} kun</span>` : ''}
      </div>
      <div class="hc-progress">
        <div class="hc-prog-wrap"><div class="hc-prog-fill" style="width:${pct}%;background:${h.color}"></div></div>
        <span class="hc-prog-text" style="color:${h.color}">${cur}/${h.target}</span>
      </div>
      <div class="hc-stats">
        <span><i class="fa-solid fa-calendar-check"></i> 30 kun: ${rate}%</span>
        <span><i class="fa-solid fa-medal"></i> Rekord: ${calcLongest(h.id)}</span>
      </div>
      <button class="hc-btn ${done ? 'done' : ''}" onclick="toggleHabit('${h.id}')"
        style="border-color:${h.color};color:${done ? '#fff' : h.color};${done ? `background:${h.color}` : ''}">
        <i class="fa-solid ${done ? 'fa-rotate-left' : 'fa-check'}"></i>
        ${done ? 'Bekor qilish' : 'Bajarildi'}
      </button>
    </div>`;
  }).join('');
}


// ══════════ RENDER WIDGETS ══════════
function renderWidgets() {
  const s = todayStats(), gs = globalStreak();
  // Streak
  const wn = document.getElementById('wStreakNum');
  const wf = document.getElementById('wStreakFill');
  if (wn) wn.textContent = gs;
  if (wf) wf.style.width = Math.min(100, (gs / 30) * 100) + '%';
  // Quote
  const q = QUOTES[quoteIdx];
  const qt = document.getElementById('wQuoteText');
  const qa = document.getElementById('wQuoteAuthor');
  if (qt) qt.textContent = `"${q.text}"`;
  if (qa) qa.textContent = `— ${q.author}`;
  // Goal ring
  const pct = s.t ? Math.round((s.d / s.t) * 100) : 0;
  const ring = document.getElementById('goalRing');
  const gp   = document.getElementById('goalPct');
  const gl   = document.getElementById('goalLabel');
  if (ring) { const c = 2 * Math.PI * 34; ring.style.strokeDashoffset = c - (c * pct / 100); }
  if (gp) gp.textContent = pct + '%';
  if (gl) gl.textContent = `${s.d} / ${s.t} bajarildi`;
  // Focus
  updateFocusDisplay();
  // Calendar
  renderCal();
  // Mini chart
  renderWidgetMiniChart();
}
function renderWidgetMiniChart() {
  killChart('wmini');
  const ctx = document.getElementById('widgetMiniChart'); if (!ctx) return;
  const days = ['Du','Se','Ch','Pa','Ju','Sh','Ya'], labels = [], data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    labels.push(days[d.getDay() === 0 ? 6 : d.getDay() - 1]);
    const done = habits.filter(h => getCmp(h.id, dstr(d)) >= h.target).length;
    data.push(habits.length ? Math.round((done / habits.length) * 100) : 0);
  }
  charts['wmini'] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: 'rgba(99,102,241,.6)', borderRadius: 6, borderSkipped: false }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { ticks: { color: CHART_C.text, font: { size: 10 } }, grid: { display: false } } } }
  });
}

// ══════════ ANALYTICS CHARTS ══════════
function renderAnalytics() {
  renderCompareChart(); renderCatPie(); renderTopHabits();
  renderMonthlyChart(); renderTimeDist(); renderStreakRank();
}
function renderCompareChart() {
  killChart('compare'); if (!habits.length) return;
  const ctx = document.getElementById('habitCompareChart'); if (!ctx) return;
  charts['compare'] = new Chart(ctx, {
    type: 'bar',
    data: { labels: habits.map(h => h.name.length > 13 ? h.name.slice(0,13)+'…' : h.name),
      datasets: [{ data: habits.map(h => compRate(h.id, 30)), backgroundColor: habits.map(h => h.color + 'bb'), borderColor: habits.map(h => h.color), borderWidth: 2, borderRadius: 10, borderSkipped: false }] },
    options: cOpts()
  });
}
function renderCatPie() {
  killChart('catp');
  const cats = {}; habits.forEach(h => { cats[h.category] = (cats[h.category] || 0) + 1; });
  if (!Object.keys(cats).length) return;
  const ctx = document.getElementById('categoryPieChart'); if (!ctx) return;
  const colors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
  charts['catp'] = new Chart(ctx, {
    type: 'pie',
    data: { labels: Object.keys(cats).map(k => CAT_ICON[k] + ' ' + CAT_LABEL[k]), datasets: [{ data: Object.values(cats), backgroundColor: colors.slice(0, Object.keys(cats).length), borderWidth: 0, hoverOffset: 12 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: CHART_C.text, boxWidth: 13, padding: 12 } } } }
  });
}
function renderTopHabits() {
  const el = document.getElementById('topHabitsList'); if (!el) return;
  const cls = ['rb-1','rb-2','rb-3','rb-n','rb-n'];
  const sorted = [...habits].sort((a, b) => compRate(b.id, 30) - compRate(a.id, 30)).slice(0, 5);
  el.innerHTML = sorted.length ? sorted.map((h, i) => `
    <div class="rank-item"><div class="rank-badge ${cls[i]}">${i+1}</div>
    <div class="rank-info"><div class="rank-name">${h.name}</div><div class="rank-sub">${CAT_LABEL[h.category]}</div></div>
    <span class="rank-score" style="color:${h.color}">${compRate(h.id,30)}%</span></div>`).join('')
    : `<div class="empty"><div class="empty-icon"><i class="fa-solid fa-trophy"></i></div><p>Ma'lumot yo'q</p></div>`;
}
function renderMonthlyChart() {
  killChart('monthly');
  const months = [], data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const y = d.getFullYear(), m = d.getMonth(), dim = new Date(y, m+1, 0).getDate();
    let t = 0, dn = 0;
    for (let day = 1; day <= dim; day++) {
      const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      if (new Date(ds) > new Date()) continue;
      habits.forEach(h => { t++; if (getCmp(h.id, ds) >= h.target) dn++; });
    }
    months.push(['Yan','Feb','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'][m]);
    data.push(t ? Math.round((dn / t) * 100) : 0);
  }
  const ctx = document.getElementById('monthlyCompareChart'); if (!ctx) return;
  charts['monthly'] = new Chart(ctx, {
    type: 'line',
    data: { labels: months, datasets: [{ data, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,.07)', fill: true, tension: .4, pointBackgroundColor: '#22c55e', pointRadius: 5, pointHoverRadius: 8 }] },
    options: cOpts()
  });
}
function renderTimeDist() {
  killChart('time');
  const slots = { 'Ertalab': 0, 'Kunduz': 0, 'Kechqurun': 0, 'Kech': 0 };
  habits.forEach(h => {
    const r = h.reminder;
    if (r) { const hr = parseInt(r); if (hr>=6&&hr<12) slots['Ertalab']++; else if (hr>=12&&hr<18) slots['Kunduz']++; else if (hr>=18&&hr<22) slots['Kechqurun']++; else slots['Kech']++; }
    else slots['Ertalab']++;
  });
  const ctx = document.getElementById('timeDistributionChart'); if (!ctx) return;
  charts['time'] = new Chart(ctx, {
    type: 'polarArea',
    data: { labels: Object.keys(slots), datasets: [{ data: Object.values(slots), backgroundColor: ['rgba(99,102,241,.7)','rgba(34,197,94,.7)','rgba(245,158,11,.7)','rgba(236,72,153,.7)'], borderWidth: 0 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: CHART_C.text, boxWidth: 11, padding: 8, font: { size: 11 } } } }, scales: { r: { ticks: { display: false }, grid: { color: CHART_C.grid } } } }
  });
}
function renderStreakRank() {
  const el = document.getElementById('streakRankingList'); if (!el) return;
  const sorted = [...habits].sort((a, b) => calcStreak(b.id) - calcStreak(a.id));
  el.innerHTML = sorted.length ? sorted.map((h, i) => `
    <div class="rank-item"><div class="rank-badge rb-n">${i+1}</div>
    <div class="rank-info"><div class="rank-name">${h.name}</div><div class="rank-sub">Rekord: ${calcLongest(h.id)} kun</div></div>
    <span class="rank-score" style="color:var(--orange)">🔥 ${calcStreak(h.id)}</span></div>`).join('')
    : `<div class="empty"><div class="empty-icon"><i class="fa-solid fa-fire"></i></div><p>Ma'lumot yo'q</p></div>`;
}

// ══════════ HEATMAP ══════════
function renderHeatmap() {
  const sel = document.getElementById('heatmapSelect');
  if (sel) { const v = sel.value; sel.innerHTML = '<option value="all">Barcha odatlar</option>' + habits.map(h => `<option value="${h.id}">${h.name}</option>`).join(''); sel.value = habits.find(h => h.id === v) ? v : 'all'; }
  const selHabit = sel?.value || 'all';
  const grid = document.getElementById('heatmapGrid'); if (!grid) return;
  const end = new Date(), start = new Date(); start.setFullYear(start.getFullYear() - 1); start.setDate(start.getDate() + 1);
  const cells = {};
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = dstr(d);
    if (selHabit === 'all') { const t = habits.length, dn = habits.filter(h => getCmp(h.id, ds) >= h.target).length; cells[ds] = t ? dn / t : 0; }
    else { const h = habits.find(x => x.id === selHabit); cells[ds] = h ? Math.min(1, getCmp(h.id, ds) / h.target) : 0; }
  }
  const weeks = []; let week = []; let cur = new Date(start);
  let sd = cur.getDay(); if (sd === 0) sd = 7;
  for (let i = 1; i < sd; i++) week.push(null);
  while (cur <= end) { week.push(new Date(cur)); if (week.length === 7) { weeks.push(week); week = []; } cur.setDate(cur.getDate() + 1); }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
  grid.innerHTML = weeks.map(wk => `<div class="hm-week">${wk.map(d => {
    if (!d) return `<div class="hm-cell" style="visibility:hidden"></div>`;
    const ds = dstr(d), v = cells[ds] || 0, l = v===0?0:v<.25?1:v<.5?2:v<.85?3:4;
    return `<div class="hm-cell" data-l="${l}" title="${ds}: ${Math.round(v*100)}%"></div>`;
  }).join('')}</div>`).join('');
  // Stats
  const active = Object.values(cells).filter(v => v > 0).length;
  let curStr = 0, lng = 0, tmp = 0; const d2 = new Date();
  while ((cells[dstr(d2)] || 0) > 0) { curStr++; d2.setDate(d2.getDate() - 1); if (curStr > 3650) break; }
  Object.keys(cells).sort().forEach(ds => { if ((cells[ds]||0)>0){tmp++;}else tmp=0; if (tmp>lng)lng=tmp; });
  const total = Object.keys(cells).length;
  document.getElementById('heatDays').textContent    = active;
  document.getElementById('heatCurrent').textContent = curStr;
  document.getElementById('heatLongest').textContent = lng;
  document.getElementById('heatRate').textContent    = total ? Math.round((active/total)*100)+'%' : '0%';
}

// ══════════ SETTINGS ══════════
function renderSettings() {
  document.querySelectorAll('.theme-card').forEach(b => b.classList.toggle('active', b.dataset.theme === settings.theme));
  const fields = { reminderTime: 'reminderTime', enableReminders: 'enableReminders', enableSound: 'enableSound', enableAnimations: 'enableAnimations', enableBlur: 'enableBlur', compactMode: 'compactMode' };
  Object.entries(fields).forEach(([k, id]) => {
    const el = document.getElementById(id); if (!el) return;
    if (el.type === 'checkbox') el.checked = !!settings[k]; else el.value = settings[k];
  });
}

// ══════════ RENDER ALL ══════════
function renderAll() {
  const p = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (p === 'dashboard') renderDashboard();
  if (p === 'habits')    renderHabits();
  if (p === 'widgets')   renderWidgets();
  if (p === 'analytics') renderAnalytics();
  if (p === 'heatmap')   renderHeatmap();
  if (p === 'settings')  renderSettings();
}

// ══════════ DEMO SEED ══════════
function seedDemo() {
  const alreadyHas = localStorage.getItem(KEYS_MAP.STORAGE_H) || localStorage.getItem('hf2_h') || localStorage.getItem(KEYS_MAP.SEED);
  if (alreadyHas && habits.length > 0) return;
  const demo = [
    { name: 'Ertalabki yugurish', category: 'fitness',      color: '#22c55e', target: 1,  unit: 'marta',  desc: '30 daqiqa yugurish' },
    { name: "Kitob o'qish",       category: 'learning',     color: '#6366f1', target: 20, unit: 'sahifa', desc: "Har kuni o'qish" },
    { name: 'Meditatsiya',        category: 'mindfulness',  color: '#06b6d4', target: 10, unit: 'daqiqa', desc: 'Tinchlanish va fokus' },
    { name: 'Suv ichish',         category: 'health',       color: '#f59e0b', target: 8,  unit: 'stakan', desc: '2 litr suv' },
    { name: "Ko'nikishlar",       category: 'productivity', color: '#ec4899', target: 1,  unit: 'marta',  desc: 'Kunlik vazifalar' },
  ];
  demo.forEach(d => habits.push({ ...d, id: uid(), createdAt: today() }));
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dstr(d);
    habits.forEach(h => { if (Math.random() > 0.22) setCmp(h.id, ds, h.target); });
  }
  localStorage.setItem(KEYS_MAP.SEED, '1');
  save();
}

// ══════════ DATE ══════════
function setDate() {
  const d = new Date();
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const days   = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  document.getElementById('todayDate').textContent = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}


// ══════════ INIT ══════════
function init() {
  showLoading();
  load();
  applyTheme(settings.theme);
  setDate();
  checkOnboarding();

  // Nav
  document.querySelectorAll('.nav-item').forEach(n =>
    n.addEventListener('click', e => { e.preventDefault(); go(n.dataset.page); })
  );
  // Sidebar
  document.getElementById('menuBtn').addEventListener('click', () =>
    document.getElementById('sidebar').classList.toggle('open')
  );
  document.getElementById('sidebarClose').addEventListener('click', () =>
    document.getElementById('sidebar').classList.remove('open')
  );

  // Add habit
  document.getElementById('openAddModal').addEventListener('click', () => openModal());
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('habitForm').addEventListener('submit', saveHabit);

  // Color picker
  document.querySelectorAll('.c-opt').forEach(o => o.addEventListener('click', () => {
    document.querySelectorAll('.c-opt').forEach(c => c.classList.remove('sel'));
    o.classList.add('sel'); selectedColor = o.dataset.c;
  }));

  // Confirm
  document.getElementById('confirmCancel').addEventListener('click', closeConfirm);
  document.getElementById('confirmOk').addEventListener('click', () => { if (confirmCallback) confirmCallback(); });
  document.getElementById('confirmOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeConfirm(); });

  // Shortcuts modal
  document.getElementById('shortcutsOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeShortcuts(); });

  // Search & filter
  document.getElementById('searchInput').addEventListener('input', renderHabits);
  document.getElementById('filterStatus').addEventListener('change', renderHabits);
  document.querySelectorAll('.fpill[data-cat]').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('.fpill[data-cat]').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); renderHabits();
  }));

  // Command palette
  document.getElementById('cmdOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeCmd(); });
  document.getElementById('cmdInput').addEventListener('input', e => renderCmdResults(e.target.value));

  // Theme cards in settings
  document.querySelectorAll('.theme-card').forEach(b => b.addEventListener('click', () => applyTheme(b.dataset.theme)));

  // Settings toggles & inputs
  const settingBindings = {
    reminderTime:    (e) => { settings.reminderTime = e.target.value; save(); },
    enableReminders: (e) => { settings.enableReminders = e.target.checked; save(); if (e.target.checked) requestNotifPermission(); },
    enableSound:     (e) => { settings.enableSound = e.target.checked; save(); },
    enableAnimations:(e) => { settings.enableAnimations = e.target.checked; document.body.classList.toggle('no-anim', !e.target.checked); save(); },
    enableBlur:      (e) => { settings.enableBlur = e.target.checked; save(); },
    compactMode:     (e) => { settings.compactMode = e.target.checked; document.body.classList.toggle('compact', e.target.checked); save(); },
  };
  Object.entries(settingBindings).forEach(([id, fn]) => {
    const el = document.getElementById(id); if (el) el.addEventListener('change', fn);
  });

  // Export / Import
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); });
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    showConfirm("Barcha ma'lumotlarni o'chirish", "Barcha odatlar va ma'lumotlar o'chib ketadi!", () => {
      habits = []; completions = {}; localStorage.removeItem(KEYS_MAP.SEED);
      save(); renderAll(); closeConfirm(); toast("Barcha ma'lumotlar o'chirildi", 'info');
    });
  });

  // Heatmap select
  document.getElementById('heatmapSelect').addEventListener('change', renderHeatmap);

  // Keyboard
  initKeyboard();

  // Notifications
  scheduleReminders();

  // Calendar init
  initCal();

  // Initial render
  if (settings.onboardingDone || habits.length > 0) {
    if (!habits.length) seedDemo();
    renderDashboard();
  }

  // Offline support indicator
  window.addEventListener('offline', () => toast("Internetdan uzildi — ma'lumotlar local saqlanmoqda", 'info'));
  window.addEventListener('online',  () => toast("Internet qayta ulandi! ✅", 'success'));
}

document.addEventListener('DOMContentLoaded', init);
