'use strict';
/* ════════════════════════════════════════════
   LUMIO v1.0 — Premium Productivity Suite
   Apple × Notion design language
════════════════════════════════════════════ */

// ════ STATE ════
const state = {
  user: { name: 'Foydalanuvchi', xp: 0, level: 1 },
  theme: 'light',
  accent: 'default',
  settings: { notifications: false, sounds: false, animations: true },
  habits: [],
  completions: {},          // { 'YYYY-MM-DD': { habitId: count } }
  tasks: [],
  notes: [],
  goals: [],
  subjects: [],
  exams: [],
  flashcards: [],
  moods: {},                // { 'YYYY-MM-DD': 1-5 }
  water: {},                // { 'YYYY-MM-DD': count }
  focusSessions: [],        // [{ date, minutes, type }]
  achievements: [],         // unlocked achievement ids
  expenses: [],
  sleeps: [],
  journal: {},              // { 'YYYY-MM-DD': text }
  onboarded: false,
  selectedNote: null,
  flashIdx: 0,
  taskView: 'list',
  taskFilter: 'today',
  habitFreq: 'all',
  goalType: 'all',
};

const STORAGE_KEY = 'lumio_v1';

// ════ HELPERS ════
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
const today = () => new Date().toISOString().split('T')[0];
const dstr = d => d.toISOString().split('T')[0];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const escape = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.warn('Save failed', e); }
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    Object.assign(state, JSON.parse(raw));
    return true;
  } catch { return false; }
}



// ════ DATA ════
const QUOTES = [
  { t:"Katta narsalar kichik odatlardan boshlanadi.", a:"James Clear" },
  { t:"Intizom — sizning bugungi siz va bo'lmoqchi bo'lgan siz orasidagi ko'prik.", a:"Bo Bennett" },
  { t:"Birinchi qadamingiz har doim eng og'iri bo'ladi. Lekin u eng muhimi.", a:"Lao Tzu" },
  { t:"Yaxshi narsa boshlash uchun katta bo'lish shart emas, lekin katta bo'lish uchun boshlash kerak.", a:"Zig Ziglar" },
  { t:"Muvaffaqiyat — bu kichik harakatlarning takrorlanishi.", a:"Robert Collier" },
  { t:"Bugun qilgan narsangiz ertangi sizni shakllantiradi.", a:"Anonim" },
  { t:"Eng yaxshi vaqt — kechagi kun edi. Ikkinchi eng yaxshi vaqt — hozir.", a:"Xitoy maqoli" },
  { t:"Diqqat — eng kuchli kuch.", a:"Cal Newport" },
  { t:"Siz harakatlaringizning natijasisiz, niyatlaringizning emas.", a:"Anonim" },
  { t:"Mukammallik — bu tasodifiy emas, balki harakat.", a:"Aristotel" },
];

const ACH = [
  { id:'first_task', name:"Birinchi qadam", desc:"Birinchi vazifa bajarildi", icon:'🎯', xp:10 },
  { id:'first_habit', name:"Yangi boshlanish", desc:"Birinchi odat qo'shildi", icon:'⚡', xp:10 },
  { id:'streak_3', name:"Uch kunlik seriya", desc:"3 kun ketma-ket", icon:'🔥', xp:30 },
  { id:'streak_7', name:"Haftalik bardosh", desc:"7 kun ketma-ket", icon:'🌟', xp:50 },
  { id:'streak_30', name:"Oy davomida", desc:"30 kun ketma-ket", icon:'🏆', xp:200 },
  { id:'streak_100', name:"Yuz kun klubi", desc:"100 kun ketma-ket", icon:'💎', xp:500 },
  { id:'tasks_10', name:"O'nta vazifa", desc:"10 vazifa bajarildi", icon:'✅', xp:30 },
  { id:'tasks_50', name:"Mahoratli", desc:"50 vazifa bajarildi", icon:'⭐', xp:100 },
  { id:'tasks_100', name:"Yuzta", desc:"100 vazifa bajarildi", icon:'🎖', xp:200 },
  { id:'focus_1h', name:"Bir soat fokus", desc:"60 daqiqa fokuslandi", icon:'🎯', xp:30 },
  { id:'focus_10h', name:"Chuqur ishchi", desc:"10 soat fokus", icon:'🧠', xp:150 },
  { id:'note_1', name:"Birinchi qayd", desc:"Qayd yozildi", icon:'📝', xp:10 },
  { id:'goal_1', name:"Maqsad qo'yildi", desc:"Birinchi maqsad", icon:'🎯', xp:15 },
  { id:'level_5', name:"Beshinchi daraja", desc:"5-darajaga yetdingiz", icon:'🚀', xp:0 },
  { id:'level_10', name:"O'ninchi daraja", desc:"10-darajaga yetdingiz", icon:'👑', xp:0 },
  { id:'water_8', name:"Sog'lom hayot", desc:"Bir kunda 8 stakan suv", icon:'💧', xp:20 },
];

const HABIT_COLORS = ['#1a1a1a','#0284c7','#059669','#ea580c','#7c3aed','#e11d48','#f59e0b','#06b6d4','#ec4899','#84cc16'];
const HABIT_ICONS = ['🏃','📚','💧','🧘','💪','🍎','😴','✍','🎯','🌱','🎨','🎵','💻','📖','☕','🚴','🏋','🧠','💝','🌟'];



// ════ TOAST ════
function toast(msg, type='info', icon=null) {
  const ico = icon || (type==='success'?'fa-check-circle':type==='error'?'fa-circle-xmark':'fa-circle-info');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${ico}"></i><span>${msg}</span>`;
  $('#toastWrap').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, 2800);
}

function xpToast(amount, reason='') {
  const el = document.createElement('div');
  el.className = 'toast xp-toast';
  el.innerHTML = `<i class="fa-solid fa-bolt"></i><span><strong>+${amount} XP</strong>${reason?' · '+reason:''}</span>`;
  $('#toastWrap').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, 2800);
}

// ════ XP & LEVEL ════
function xpForLevel(lvl) { return 100 * lvl + 50 * lvl * lvl; }
function totalXpForLevel(lvl) { let t = 0; for (let i = 1; i < lvl; i++) t += xpForLevel(i); return t; }
function levelTitle(lvl) {
  if (lvl >= 50) return 'Ustoz';
  if (lvl >= 30) return 'Ekspert';
  if (lvl >= 20) return 'Mahoratli';
  if (lvl >= 10) return "Chuqur o'rganuvchi";
  if (lvl >= 5) return 'Tirishqoq';
  if (lvl >= 3) return "Yo'l boshlanmoqda";
  return 'Yangi boshlovchi';
}
function addXp(amount, reason='') {
  state.user.xp += amount;
  // level up?
  const cur = state.user.level;
  while (state.user.xp >= totalXpForLevel(state.user.level + 1)) {
    state.user.level++;
    setTimeout(() => toast(`🎉 Daraja ${state.user.level}! ${levelTitle(state.user.level)}`, 'success', 'fa-rocket'), 400);
    if (state.user.level === 5) unlockAch('level_5');
    if (state.user.level === 10) unlockAch('level_10');
  }
  xpToast(amount, reason);
  save();
  refreshUserUI();
}

function unlockAch(id) {
  if (state.achievements.includes(id)) return;
  const a = ACH.find(x => x.id === id);
  if (!a) return;
  state.achievements.push(id);
  setTimeout(() => toast(`🏆 ${a.name}`, 'success', 'fa-trophy'), 800);
  if (a.xp > 0) setTimeout(() => addXp(a.xp, a.name), 1200);
  save();
}

function refreshUserUI() {
  const init = (state.user.name || 'U').charAt(0).toUpperCase();
  $('#userAvatar').textContent = init;
  $('#userName').textContent = state.user.name;
  $('#userLevel').textContent = `Daraja ${state.user.level}`;
  $('#userXp').textContent = `${state.user.xp} XP`;
  if ($('#bigAvatar')) {
    $('#bigAvatar').textContent = init;
    $('#bigUserName').textContent = state.user.name;
    $('#bigLevel').textContent = `Daraja ${state.user.level} · ${levelTitle(state.user.level)}`;
    const cur = totalXpForLevel(state.user.level);
    const next = totalXpForLevel(state.user.level + 1);
    const pct = Math.min(100, ((state.user.xp - cur) / (next - cur)) * 100);
    $('#xpBar').style.width = pct + '%';
    $('#xpText').textContent = `${state.user.xp - cur} / ${next - cur} XP`;
  }
}



// ════ THEME ════
function setTheme(t) {
  state.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  $('#themeIcon')?.classList.replace(t === 'dark' ? 'fa-moon' : 'fa-sun', t === 'dark' ? 'fa-sun' : 'fa-moon');
  $$('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.th === t));
  save();
}
function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
}
function setAccent(a) {
  state.accent = a;
  if (a === 'default') document.documentElement.removeAttribute('data-accent');
  else document.documentElement.setAttribute('data-accent', a);
  $$('.accent-card').forEach(c => c.classList.toggle('active', c.dataset.acc === a));
  save();
}

// ════ ONBOARDING ════
let obStep = 1;
function obNext() {
  if (obStep === 2) {
    const v = $('#obName').value.trim();
    state.user.name = v || 'Foydalanuvchi';
  }
  if (obStep < 4) {
    obStep++;
    $$('.ob-step').forEach(s => s.classList.toggle('active', +s.dataset.step === obStep));
    $$('.ob-dot').forEach((d, i) => d.classList.toggle('active', i + 1 <= obStep));
  }
}
function obAccent(btn, a) {
  $$('.ob-theme').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  setAccent(a);
}
function obFinish() {
  state.onboarded = true;
  if (!state.habits.length) seedDemo();
  save();
  $('#onboard').classList.add('hidden');
  refreshUserUI();
  renderAll();
}

function seedDemo() {
  // Demo habits
  state.habits = [
    { id: uid(), name: "Suv ichish", icon: '💧', color: '#0284c7', frequency: 'daily', target: 1, category: 'Sog\'liq', diff: 1, createdAt: today() },
    { id: uid(), name: "30 daqiqa o'qish", icon: '📚', color: '#7c3aed', frequency: 'daily', target: 1, category: 'O\'qish', diff: 2, createdAt: today() },
    { id: uid(), name: "Sport mashqi", icon: '💪', color: '#ea580c', frequency: 'daily', target: 1, category: 'Fitness', diff: 3, createdAt: today() },
    { id: uid(), name: "Meditatsiya", icon: '🧘', color: '#059669', frequency: 'daily', target: 1, category: 'Mindfulness', diff: 2, createdAt: today() },
  ];

  // Past completions
  for (let i = 1; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dstr(d);
    state.habits.forEach(h => { if (Math.random() > 0.3) setCmp(h.id, ds, h.target); });
  }

  // Demo tasks
  state.tasks = [
    { id: uid(), name: "Lumio'ni o'rganish", priority: 1, done: false, due: today(), category: 'Asosiy', subtasks: [], createdAt: today() },
    { id: uid(), name: "Birinchi vazifani bajarish", priority: 2, done: true, due: today(), category: 'Boshqa', subtasks: [], createdAt: today() },
    { id: uid(), name: "Maqsadlarni rejalashtirish", priority: 3, done: false, due: today(), category: 'Reja', subtasks: [], createdAt: today() },
  ];

  // Demo goal
  state.goals = [{
    id: uid(), name: "Lumio bilan tanishish", desc: "Barcha funksiyalarni o'rganish",
    type: 'short', icon: '🎯', progress: 30, deadline: '',
    milestones: [
      { id: uid(), name: "Birinchi odat qo'shish", done: true },
      { id: uid(), name: "Birinchi vazifa bajarish", done: true },
      { id: uid(), name: "Fokus sessiyasini sinab ko'rish", done: false },
      { id: uid(), name: "Birinchi qaydni yozish", done: false },
    ],
    createdAt: today(),
  }];

  // Demo note
  state.notes = [{
    id: uid(), title: "Lumio'ga xush kelibsiz!",
    content: `Bu sizning birinchi qaydingiz!\n\n# Boshlash uchun:\n- ⌘K bilan tezkor qidiruv\n- N tugma bilan yangi vazifa\n- F tugma bilan fokus rejim\n\nHar kuni biroz yaxshilaning!`,
    tags: ['Boshlash'], createdAt: today(), updatedAt: today()
  }];

  // Demo subject
  state.subjects = [
    { id: uid(), name: "Matematika", color: '#0284c7', hours: 12 },
    { id: uid(), name: "Ingliz tili", color: '#059669', hours: 8 },
  ];

  state.flashcards = [
    { id: uid(), front: "Lumio nima?", back: "Premium produktivlik dasturi" },
    { id: uid(), front: "Pomodoro vaqti?", back: "25 daqiqa fokus + 5 daqiqa dam olish" },
  ];
}



// ════ NAVIGATION ════
const PAGE_META = {
  dashboard: { title: 'Bosh sahifa', sub: '' },
  tasks: { title: 'Vazifalar', sub: 'Bugungi vazifalaringiz' },
  habits: { title: 'Odatlar', sub: 'Mukammallikni quring' },
  focus: { title: 'Fokus rejim', sub: 'Chuqur konsentratsiya' },
  study: { title: "O'qish", sub: 'Bilim — sarmoya' },
  goals: { title: 'Maqsadlar', sub: 'Hayotni shakllantiring' },
  notes: { title: 'Qaydlar', sub: 'Fikrlaringiz' },
  apps: { title: 'Mini ilovalar', sub: 'Foydali asboblar' },
  achievements: { title: 'Yutuqlar', sub: 'Sizning safaringiz' },
  settings: { title: 'Sozlamalar', sub: 'Moslashtirish' },
};
function goPage(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $('#page-' + page)?.classList.add('active');
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  const m = PAGE_META[page] || { title: page, sub: '' };
  $('#topbarTitle').textContent = m.title;
  $('#topbarDate').textContent = m.sub;
  closeSidebar();
  renderPageContent(page);
  window.scrollTo(0, 0);
}
function renderPageContent(page) {
  if (page === 'dashboard') renderDashboard();
  else if (page === 'tasks') renderTasks();
  else if (page === 'habits') { renderHabits(); renderHeatmap(); renderMoodToday(); }
  else if (page === 'focus') renderFocusStats();
  else if (page === 'study') { renderSubjects(); renderExams(); renderFlashcard(); }
  else if (page === 'goals') renderGoals();
  else if (page === 'notes') { renderNotes(); }
  else if (page === 'achievements') { refreshUserUI(); renderAchievements(); }
  else if (page === 'settings') renderSettings();
}
function toggleSidebar() { $('#sidebar').classList.toggle('open'); }
function closeSidebar() { $('#sidebar').classList.remove('open'); }

// ════ DATE & GREETING ════
function setGreeting() {
  const h = new Date().getHours();
  const greeting = h < 6 ? "Xayrli tun" : h < 12 ? "Xayrli tong" : h < 18 ? "Xayrli kun" : "Xayrli kech";
  $('#greetTime').textContent = greeting;
  $('#greetTitle').textContent = `${greeting}, ${state.user.name}!`;
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const days = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  const d = new Date();
  $('#topbarDate').textContent = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  // Quote
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  $('#quoteText').textContent = `"${q.t}"`;
  $('#quoteAuthor').textContent = `— ${q.a}`;
}

// ════ HELPERS ════
function getCmp(hid, date) { return state.completions[date]?.[hid] || 0; }
function setCmp(hid, date, v) {
  if (!state.completions[date]) state.completions[date] = {};
  state.completions[date][hid] = v;
  save();
}
function isHabitDone(hid, d = today()) {
  const h = state.habits.find(x => x.id === hid);
  return h ? getCmp(hid, d) >= h.target : false;
}
function calcStreak(hid) {
  const h = state.habits.find(x => x.id === hid); if (!h) return 0;
  let s = 0, d = new Date();
  if (!isHabitDone(hid)) d.setDate(d.getDate() - 1);
  while (getCmp(hid, dstr(d)) >= h.target) { s++; d.setDate(d.getDate() - 1); if (s > 3650) break; }
  return s;
}
function calcLongest(hid) {
  const h = state.habits.find(x => x.id === hid); if (!h) return 0;
  const dates = Object.keys(state.completions).sort();
  let max = 0, cur = 0, prev = null;
  dates.forEach(ds => {
    if (getCmp(hid, ds) >= h.target) {
      cur = (prev && (new Date(ds) - new Date(prev))/86400000 === 1) ? cur+1 : 1;
      if (cur > max) max = cur;
      prev = ds;
    } else prev = null;
  });
  return max;
}
function globalStreak() {
  if (!state.habits.length) return 0;
  let s = 0, d = new Date();
  while (true) {
    const ds = dstr(d);
    if (state.habits.some(h => getCmp(h.id, ds) >= h.target)) { s++; d.setDate(d.getDate() - 1); } else break;
    if (s > 3650) break;
  }
  return s;
}
function compRate(hid, days = 30) {
  const h = state.habits.find(x => x.id === hid); if (!h) return 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (getCmp(hid, dstr(d)) >= h.target) done++;
  }
  return Math.round((done/days)*100);
}



// ════ DASHBOARD ════
function renderDashboard() {
  setGreeting();
  // Stats
  const todaysTasks = state.tasks.filter(t => t.due === today() || (!t.due && !t.done));
  const doneToday = state.tasks.filter(t => t.done && (t.completedAt === today() || t.due === today())).length;
  $('#statTasks').textContent = doneToday;
  $('#statStreak').textContent = globalStreak();

  const focusToday = state.focusSessions.filter(s => s.date === today()).reduce((a, s) => a + s.minutes, 0);
  $('#statFocus').textContent = focusToday >= 60 ? `${(focusToday/60).toFixed(1)}h` : `${focusToday}m`;

  const studyToday = state.subjects.reduce((a, s) => a, 0); // placeholder
  $('#statStudy').textContent = focusToday >= 60 ? `${(focusToday/60).toFixed(1)}h` : `${focusToday}m`;

  // Productivity score
  const habitsCount = state.habits.length;
  const habitDone = state.habits.filter(h => isHabitDone(h.id)).length;
  const habitRate = habitsCount ? (habitDone/habitsCount)*100 : 0;
  const taskRate = todaysTasks.length ? (todaysTasks.filter(t => t.done).length/todaysTasks.length)*100 : 0;
  const focusRate = Math.min(100, (focusToday/120)*100);
  const score = Math.round((habitRate*0.4 + taskRate*0.4 + focusRate*0.2));
  $('#scoreVal').textContent = score;
  const ringLength = 364.4;
  $('#scoreRing').style.strokeDashoffset = ringLength - (ringLength * score / 100);

  // Today's items mix (habits + tasks)
  const list = $('#dashTodayList');
  const items = [];
  state.habits.slice(0, 3).forEach(h => items.push({ kind:'habit', id:h.id, name:h.name, icon:h.icon, color:h.color, done:isHabitDone(h.id) }));
  todaysTasks.slice(0, 5).forEach(t => items.push({ kind:'task', id:t.id, name:t.name, icon:'📋', done:t.done }));
  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌱</div><h3>Hech narsa yo'q</h3><p>Birinchi vazifa yoki odatni qo'shing</p></div>`;
  } else {
    list.innerHTML = items.map(i => `
      <div class="today-item ${i.done?'done':''}" onclick="toggleItem('${i.kind}','${i.id}')">
        <div class="today-check" ${i.done?'style="background:'+(i.color||'var(--accent)')+';border-color:'+(i.color||'var(--accent)')+'"':''}>
          ${i.done?'<i class="fa-solid fa-check"></i>':''}
        </div>
        <span class="today-name">${escape(i.icon)} ${escape(i.name)}</span>
        <div class="today-meta"><span class="pill">${i.kind==='habit'?'Odat':'Vazifa'}</span></div>
      </div>
    `).join('');
  }

  // Mini calendar
  renderMiniCal();

  // Widgets
  const gs = globalStreak();
  $('#wStreak').innerHTML = `${gs}<small>kun</small>`;
  const tier = gs >= 100 ? 'Mahoratli' : gs >= 30 ? 'Dadil' : gs >= 7 ? 'Tirishqoq' : gs >= 3 ? "Yo'lda" : 'Yangi boshlovchi';
  $('#wStreakTier').textContent = tier;
  $('#wStreakBar').style.width = Math.min(100, (gs/100)*100) + '%';
  const bestStreak = Math.max(0, ...state.habits.map(h => calcLongest(h.id)));
  $('#wBestStreak').textContent = bestStreak;

  // Water
  renderWaterWidget();

  // Tasks badge
  $('#navTasksBadge').textContent = todaysTasks.filter(t => !t.done).length;
}

function toggleItem(kind, id) {
  if (kind === 'habit') toggleHabit(id);
  else if (kind === 'task') toggleTask(id);
}

let calOffset = 0;
function renderMiniCal() {
  const now = new Date();
  now.setMonth(now.getMonth() + calOffset);
  const y = now.getFullYear(), m = now.getMonth();
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  $('#miniCalMonth').textContent = `${months[m]} ${y}`;
  const first = new Date(y, m, 1);
  const last = new Date(y, m+1, 0);
  let dow = first.getDay() - 1; if (dow < 0) dow = 6;
  const grid = $('#miniCalGrid');
  let html = '';
  for (let i = 0; i < dow; i++) {
    const d = new Date(y, m, -dow+i+1);
    html += `<div class="mini-cal-cell outside">${d.getDate()}</div>`;
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = ds === today();
    const hasTask = state.tasks.some(t => t.due === ds);
    const hasHabit = state.completions[ds] && Object.keys(state.completions[ds]).length > 0;
    const cls = ['mini-cal-cell', isToday?'today':'', (hasTask||hasHabit)?'has-event':''].filter(Boolean).join(' ');
    html += `<div class="${cls}">${d}</div>`;
  }
  const filled = dow + last.getDate();
  for (let i = filled; i < 42; i++) {
    html += `<div class="mini-cal-cell outside">${i-filled+1}</div>`;
  }
  grid.innerHTML = html;
}
function miniCalNav(d) { calOffset += d; renderMiniCal(); }

function renderWaterWidget() {
  const cnt = state.water[today()] || 0;
  $('#waterCount').textContent = `${cnt} / 8`;
  $('#waterStat').textContent = cnt;
  const wrap = $('#waterGlasses');
  let html = '';
  for (let i = 0; i < 8; i++) html += `<div class="water-glass ${i<cnt?'filled':''}" onclick="setWater(${i+1})">💧</div>`;
  wrap.innerHTML = html;
}
function setWater(n) {
  const cur = state.water[today()] || 0;
  state.water[today()] = (cur === n) ? n - 1 : n;
  save();
  renderWaterWidget();
  if (state.water[today()] === 8) { unlockAch('water_8'); }
}



// ════ TASKS ════
function setTaskView(v) { state.taskView = v; $$('.tab[data-view]').forEach(t => t.classList.toggle('active', t.dataset.view === v)); renderTasks(); }
function setTaskFilter(f) { state.taskFilter = f; $$('.tab[data-tfilter]').forEach(t => t.classList.toggle('active', t.dataset.tfilter === f)); renderTasks(); }

function getFilteredTasks() {
  const q = $('#taskSearch')?.value.toLowerCase() || '';
  let list = [...state.tasks];
  if (q) list = list.filter(t => t.name.toLowerCase().includes(q));
  const td = today();
  if (state.taskFilter === 'today') list = list.filter(t => !t.done && (t.due === td || !t.due));
  else if (state.taskFilter === 'upcoming') list = list.filter(t => !t.done && t.due && t.due > td);
  else if (state.taskFilter === 'done') list = list.filter(t => t.done);
  // Sort: priority asc, then due date
  list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if ((a.priority||4) !== (b.priority||4)) return (a.priority||4) - (b.priority||4);
    if (a.due && b.due) return a.due.localeCompare(b.due);
    return 0;
  });
  return list;
}

function renderTasks() {
  const container = $('#tasksContainer');
  const list = getFilteredTasks();
  if (state.taskView === 'kanban') return renderKanban();
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✨</div><h3>Hech qanday vazifa yo'q</h3><p>Yangi vazifa qo'shing va kunni samarali boshlang</p></div>`;
    return;
  }
  container.innerHTML = `<div class="tasks-list">${list.map(t => taskHTML(t)).join('')}</div>`;
  $('#tasksMuted').textContent = `${list.filter(t=>!t.done).length} ta faol vazifa`;
}

function taskHTML(t) {
  const p = t.priority || 4;
  const td = today();
  const due = t.due ? (t.due === td ? 'Bugun' : t.due < td ? 'O\'tgan' : new Date(t.due).toLocaleDateString('uz-UZ', { day:'numeric', month:'short' })) : '';
  const dueClass = t.due === td ? 'today' : (t.due && t.due < td && !t.done) ? 'overdue' : '';
  return `<div class="task-item ${t.done?'done':''}" data-id="${t.id}" onclick="toggleTask('${t.id}')">
    <div class="task-priority priority-${p}"></div>
    <div class="task-check">${t.done?'<i class="fa-solid fa-check"></i>':''}</div>
    <div class="task-name">
      ${escape(t.name)}
      ${t.category?`<small>${escape(t.category)}</small>`:''}
    </div>
    ${due?`<div class="task-due ${dueClass}"><i class="fa-regular fa-calendar"></i> ${due}</div>`:''}
    <button class="icon-btn" onclick="event.stopPropagation();editTask('${t.id}')"><i class="fa-solid fa-pen"></i></button>
    <button class="icon-btn" onclick="event.stopPropagation();deleteTask('${t.id}')"><i class="fa-solid fa-trash"></i></button>
  </div>`;
}

function renderKanban() {
  const cols = [
    { id: 'todo', name: '📋 Bajarish kerak', filter: t => !t.done && (!t.priority || t.priority >= 3) },
    { id: 'doing', name: '🔥 Hozir', filter: t => !t.done && t.priority <= 2 },
    { id: 'review', name: '👀 Tekshirish', filter: t => !t.done && t.due === today() },
    { id: 'done', name: '✅ Bajarilgan', filter: t => t.done },
  ];
  const container = $('#tasksContainer');
  container.innerHTML = `<div class="kanban">${cols.map(c => {
    const filtered = state.tasks.filter(c.filter);
    return `<div class="kanban-col" data-col="${c.id}">
      <div class="kanban-col-head">
        <span class="kanban-col-title">${c.name}</span>
        <span class="kanban-col-count">${filtered.length}</span>
      </div>
      <div class="kanban-cards">
        ${filtered.map(t => `<div class="kanban-card" draggable="true" data-id="${t.id}" onclick="editTask('${t.id}')">
          <div style="font-size:.85rem;font-weight:500;margin-bottom:4px">${escape(t.name)}</div>
          <div style="font-size:.7rem;color:var(--text3);display:flex;justify-content:space-between">
            <span>${t.category?escape(t.category):''}</span>
            <span>${t.due?(new Date(t.due).toLocaleDateString('uz-UZ',{day:'numeric',month:'short'})):''}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('')}</div>`;
  setupKanbanDnD();
}
function setupKanbanDnD() {
  $$('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', e => { card.classList.add('dragging'); e.dataTransfer.setData('id', card.dataset.id); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  $$('.kanban-col').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const id = e.dataTransfer.getData('id');
      const t = state.tasks.find(x => x.id === id); if (!t) return;
      const colId = col.dataset.col;
      if (colId === 'done') { t.done = true; t.completedAt = today(); }
      else if (colId === 'doing') { t.priority = 1; t.done = false; }
      else if (colId === 'review') { t.due = today(); t.done = false; }
      else { t.priority = 3; t.done = false; }
      save();
      renderKanban();
    });
  });
}

function toggleTask(id) {
  const t = state.tasks.find(x => x.id === id); if (!t) return;
  t.done = !t.done;
  if (t.done) {
    t.completedAt = today();
    addXp(10 * (5 - (t.priority||4)), `Vazifa: ${t.name}`);
    const totalDone = state.tasks.filter(x => x.done).length;
    if (totalDone === 1) unlockAch('first_task');
    if (totalDone >= 10) unlockAch('tasks_10');
    if (totalDone >= 50) unlockAch('tasks_50');
    if (totalDone >= 100) unlockAch('tasks_100');
  }
  save();
  renderTasks();
  if ($('#page-dashboard').classList.contains('active')) renderDashboard();
}

function editTask(id) {
  const t = state.tasks.find(x => x.id === id);
  openModal('task', t);
}
function deleteTask(id) {
  if (!confirm('Vazifani o\'chirishni xohlaysizmi?')) return;
  state.tasks = state.tasks.filter(x => x.id !== id);
  save(); renderTasks();
}



// ════ HABITS ════
function setHabitFreq(f) { state.habitFreq = f; $$('.tab[data-hfreq]').forEach(t => t.classList.toggle('active', t.dataset.hfreq === f)); renderHabits(); }

function renderHabits() {
  const grid = $('#habitsGrid');
  const q = $('#habitSearch')?.value.toLowerCase() || '';
  let list = [...state.habits];
  if (state.habitFreq !== 'all') list = list.filter(h => h.frequency === state.habitFreq);
  if (q) list = list.filter(h => h.name.toLowerCase().includes(q));

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🌱</div><h3>Hech qanday odat yo'q</h3><p>Birinchi odatni qo'shing va o'zingizni rivojlantiring</p></div>`;
    return;
  }

  grid.innerHTML = list.map(h => habitHTML(h)).join('');

  // Update select
  const sel = $('#heatmapSelect');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = `<option value="all">Barcha odatlar</option>` + state.habits.map(h => `<option value="${h.id}">${escape(h.name)}</option>`).join('');
    sel.value = state.habits.find(h => h.id === cur) ? cur : 'all';
  }
}

function habitHTML(h) {
  const cur = getCmp(h.id, today());
  const done = isHabitDone(h.id);
  const pct = Math.min(100, (cur/h.target)*100);
  const streak = calcStreak(h.id);
  const longest = calcLongest(h.id);
  const rate = compRate(h.id, 30);
  // Mini week
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dstr(d);
    const wd = ['Ya','Du','Se','Ch','Pa','Ju','Sh'][d.getDay()];
    days.push({ wd, done: getCmp(h.id, ds) >= h.target, today: ds === today() });
  }
  const ringLen = 138.2;
  return `<div class="habit-card" style="--c:${h.color}">
    <div class="habit-top">
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
        <div class="habit-icon" style="background:${h.color}22;color:${h.color}">${h.icon||'⚡'}</div>
        <div style="min-width:0">
          <div class="habit-name">${escape(h.name)}</div>
          <div class="habit-cat">${escape(h.category||'')} · ${h.frequency==='daily'?'Kunlik':h.frequency==='weekly'?'Haftalik':'Oylik'}</div>
        </div>
      </div>
      <div class="progress-ring">
        <svg width="50" height="50">
          <circle class="ring-bg" cx="25" cy="25" r="22"/>
          <circle class="ring-fg" cx="25" cy="25" r="22" stroke="${h.color}" stroke-dasharray="${ringLen}" stroke-dashoffset="${ringLen - (ringLen*pct/100)}"/>
        </svg>
        <div class="progress-ring-text" style="color:${h.color}">${Math.round(pct)}%</div>
      </div>
    </div>

    <div class="habit-mini-week">
      ${days.map(d => `<div class="mini-day ${d.done?'done':''} ${d.today?'today':''}" title="${d.wd}" style="${d.done?`background:${h.color};color:white`:''}">${d.wd[0]}</div>`).join('')}
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;font-size:.78rem">
      <span class="habit-streak">🔥 ${streak} kun</span>
      <span class="muted">${rate}% (30k)</span>
    </div>

    <div style="display:flex;gap:6px">
      <button class="habit-btn ${done?'done':''}" onclick="toggleHabit('${h.id}')" style="flex:1;${done?`background:${h.color};color:white`:''}">
        ${done?'<i class="fa-solid fa-check"></i> Bajarildi':'<i class="fa-solid fa-circle"></i> Belgilash'}
      </button>
      <button class="habit-btn" onclick="editHabit('${h.id}')" style="flex:0 0 auto;width:36px"><i class="fa-solid fa-pen"></i></button>
      <button class="habit-btn" onclick="deleteHabit('${h.id}')" style="flex:0 0 auto;width:36px"><i class="fa-solid fa-trash"></i></button>
    </div>
  </div>`;
}

function toggleHabit(id) {
  const h = state.habits.find(x => x.id === id); if (!h) return;
  const cur = getCmp(id, today());
  if (cur >= h.target) {
    setCmp(id, today(), 0);
  } else {
    setCmp(id, today(), cur + 1);
    if (cur + 1 >= h.target) {
      const xp = 5 + (h.diff || 1) * 5;
      addXp(xp, h.name);
      const streak = calcStreak(id);
      if (streak === 3) unlockAch('streak_3');
      if (streak === 7) unlockAch('streak_7');
      if (streak === 30) unlockAch('streak_30');
      if (streak === 100) unlockAch('streak_100');
    }
  }
  renderHabits();
  if ($('#page-dashboard').classList.contains('active')) renderDashboard();
}
function editHabit(id) {
  const h = state.habits.find(x => x.id === id);
  openModal('habit', h);
}
function deleteHabit(id) {
  if (!confirm("O'chirishni xohlaysizmi?")) return;
  state.habits = state.habits.filter(x => x.id !== id);
  save(); renderHabits();
}



// ════ HEATMAP ════
function renderHeatmap() {
  const wrap = $('#heatmap'); if (!wrap) return;
  const sel = $('#heatmapSelect')?.value || 'all';
  const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 364);
  const weeks = [];
  let curWeek = [];
  // Pad start to Monday
  const startDow = (start.getDay() + 6) % 7;
  for (let i = 0; i < startDow; i++) curWeek.push(null);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    curWeek.push(new Date(d));
    if (curWeek.length === 7) { weeks.push(curWeek); curWeek = []; }
  }
  if (curWeek.length) { while (curWeek.length < 7) curWeek.push(null); weeks.push(curWeek); }

  wrap.innerHTML = weeks.map(week => `<div class="hm-week">${week.map(d => {
    if (!d) return `<div class="hm-cell" style="visibility:hidden"></div>`;
    const ds = dstr(d);
    let val = 0;
    if (sel === 'all') {
      const total = state.habits.length;
      const done = state.habits.filter(h => getCmp(h.id, ds) >= h.target).length;
      val = total ? done/total : 0;
    } else {
      const h = state.habits.find(x => x.id === sel);
      val = h ? Math.min(1, getCmp(sel, ds)/h.target) : 0;
    }
    const lvl = val === 0 ? 0 : val < 0.25 ? 1 : val < 0.5 ? 2 : val < 0.85 ? 3 : 4;
    return `<div class="hm-cell" data-l="${lvl}" title="${ds}: ${Math.round(val*100)}%"></div>`;
  }).join('')}</div>`).join('');
}

// ════ MOOD ════
function setMood(v) {
  state.moods[today()] = v;
  save();
  renderMoodToday();
}
function renderMoodToday() {
  const v = state.moods[today()];
  $$('.mood-btn').forEach((b, i) => b.classList.toggle('selected', i+1 === v));
  if (v) $('#moodToday').textContent = `Bugungi kayfiyat saqlandi`;
}

// ════ FOCUS ════
let focusTimer = null;
let focusRemaining = 25 * 60;
let focusDuration = 25 * 60;
let focusRunning = false;
let focusType = 'focus'; // focus | break
let activeSounds = {};

function selectPreset(el, mins) {
  $$('.focus-preset').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  focusDuration = mins * 60;
  focusRemaining = focusDuration;
}

function enterFocus() {
  $('#focusMode').classList.add('active');
  focusRemaining = focusDuration;
  focusType = 'focus';
  $('#focusLabel').textContent = 'Fokus';
  // Random quote
  const q = QUOTES[Math.floor(Math.random()*QUOTES.length)];
  $('#focusQuote').textContent = `"${q.t}" — ${q.a}`;
  updateFocusDisplay();
  toggleFocus();
}
function exitFocus() {
  $('#focusMode').classList.remove('active');
  if (focusRunning) toggleFocus();
  // Stop all sounds
  Object.values(activeSounds).forEach(s => s.stop && s.stop());
  activeSounds = {};
  $$('.sound-btn').forEach(b => b.classList.remove('active'));
}
function toggleFocus() {
  focusRunning = !focusRunning;
  $('#focusPlayBtn').innerHTML = focusRunning ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
  if (focusRunning) {
    focusTimer = setInterval(() => {
      focusRemaining--;
      updateFocusDisplay();
      if (focusRemaining <= 0) {
        clearInterval(focusTimer);
        focusRunning = false;
        if (focusType === 'focus') {
          // Save session
          state.focusSessions.push({ date: today(), minutes: focusDuration/60, type:'focus' });
          save();
          const totalMins = state.focusSessions.reduce((a,s)=>a+s.minutes,0);
          if (totalMins >= 60) unlockAch('focus_1h');
          if (totalMins >= 600) unlockAch('focus_10h');
          addXp(focusDuration/60, 'Fokus sessiyasi');
          // Switch to break
          focusType = 'break';
          focusDuration = 5 * 60;
          focusRemaining = focusDuration;
          $('#focusLabel').textContent = 'Dam olish';
          updateFocusDisplay();
          toast('🎉 Sessiya tugadi! Endi dam oling.', 'success');
        } else {
          focusType = 'focus';
          focusDuration = 25 * 60;
          focusRemaining = focusDuration;
          $('#focusLabel').textContent = 'Fokus';
          updateFocusDisplay();
          toast('☕ Dam olish tugadi. Yana fokus!', 'info');
        }
        $('#focusPlayBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
      }
    }, 1000);
  } else {
    clearInterval(focusTimer);
  }
}
function resetFocus() {
  if (focusRunning) toggleFocus();
  focusRemaining = focusDuration;
  updateFocusDisplay();
}
function skipFocus() {
  if (focusRunning) toggleFocus();
  focusRemaining = 0;
  updateFocusDisplay();
  if (focusRunning === false && focusRemaining === 0) {
    // simulate end
    setTimeout(() => { focusRemaining = focusDuration; updateFocusDisplay(); }, 100);
  }
}
function updateFocusDisplay() {
  const t = fmtTime(Math.max(0, focusRemaining));
  $('#focusTimerBig').textContent = t;
  $('#wFocusTime').textContent = t;
  const pct = ((focusDuration-focusRemaining)/focusDuration)*100;
  $('#focusProgress').style.width = pct + '%';
  // stats
  const todayMin = state.focusSessions.filter(s => s.date === today()).reduce((a,s)=>a+s.minutes,0);
  $('#focusToday').textContent = todayMin + 'm';
  $('#focusSession').textContent = state.focusSessions.filter(s => s.date === today()).length;
}
function renderFocusStats() {
  const total = state.focusSessions.length;
  const totalMin = state.focusSessions.reduce((a,s)=>a+s.minutes,0);
  const todayMin = state.focusSessions.filter(s => s.date === today()).reduce((a,s)=>a+s.minutes,0);
  // Best day
  const byDay = {};
  state.focusSessions.forEach(s => byDay[s.date] = (byDay[s.date]||0) + s.minutes);
  const bestDay = Math.max(0, ...Object.values(byDay));
  $('#focusTotalSessions').textContent = total;
  $('#focusTotalMinutes').textContent = totalMin >= 60 ? (totalMin/60).toFixed(1)+'h' : totalMin+'m';
  $('#focusTodayMinutes').textContent = todayMin + 'm';
  $('#focusBestDay').textContent = bestDay + 'm';
}



// ════ AMBIENT SOUNDS (Web Audio API) ════
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function makeNoise(type='white') {
  const ctx = initAudio();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    if (type === 'white') data[i] = Math.random() * 2 - 1;
    else if (type === 'pink') {
      // simple pink noise approximation
      const w = Math.random() * 2 - 1;
      data[i] = (data[i-1] || 0) * 0.99 + w * 0.1;
    } else data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer; src.loop = true;
  return src;
}
function playSound(name) {
  const ctx = initAudio();
  const noise = makeNoise(name === 'white' ? 'white' : 'pink');
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  gain.gain.value = 0.15;
  // different filter for different "sounds"
  if (name === 'rain') { filter.type = 'lowpass'; filter.frequency.value = 800; }
  else if (name === 'forest') { filter.type = 'bandpass'; filter.frequency.value = 1500; gain.gain.value = 0.1; }
  else if (name === 'ocean') { filter.type = 'lowpass'; filter.frequency.value = 400; }
  else if (name === 'cafe') { filter.type = 'highshelf'; filter.frequency.value = 1000; filter.gain.value = -10; }
  else { filter.type = 'allpass'; }
  noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  noise.start();
  return { stop: () => { try { noise.stop(); } catch{} gain.disconnect(); filter.disconnect(); } };
}
function toggleSound(name, btn) {
  if (activeSounds[name]) {
    activeSounds[name].stop();
    delete activeSounds[name];
    btn.classList.remove('active');
  } else {
    activeSounds[name] = playSound(name);
    btn.classList.add('active');
  }
}



// ════ NOTES ════
function newNote() {
  const n = { id: uid(), title: 'Yangi qayd', content: '', tags: [], createdAt: today(), updatedAt: today() };
  state.notes.unshift(n);
  state.selectedNote = n.id;
  save();
  if (state.notes.length === 1) unlockAch('note_1');
  renderNotes();
}
function selectNote(id) { state.selectedNote = id; renderNotes(); }
function renderNotes() {
  const list = $('#notesList');
  const q = $('#noteSearch')?.value.toLowerCase() || '';
  let notes = [...state.notes].sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''));
  if (q) notes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q)));
  if (!notes.length) {
    list.innerHTML = `<div class="muted" style="padding:1rem;text-align:center">Qaydlar yo'q</div>`;
  } else {
    list.innerHTML = notes.map(n => `<div class="note-item ${state.selectedNote===n.id?'active':''}" onclick="selectNote('${n.id}')">
      <div class="note-item-title">${escape(n.title || 'Nomsiz')}</div>
      <div class="note-item-preview">${escape((n.content||'').slice(0, 60))}</div>
      <div class="note-item-date">${n.updatedAt||''}</div>
    </div>`).join('');
  }
  renderNoteEditor();
}
function renderNoteEditor() {
  const editor = $('#notesEditor');
  if (!state.selectedNote) {
    editor.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><h3>Qayd tanlanmagan</h3><p>Yangi qayd yarating yoki ro'yxatdan tanlang</p></div>`;
    return;
  }
  const n = state.notes.find(x => x.id === state.selectedNote);
  if (!n) return;
  editor.innerHTML = `
    <input class="note-title-input" id="noteTitleInput" value="${escape(n.title)}" placeholder="Sarlavha"/>
    <div class="note-tags-input">
      ${n.tags.map((t,i)=>`<span class="note-tag-pill"># ${escape(t)} <button onclick="removeNoteTag(${i})">&times;</button></span>`).join('')}
      <input id="noteTagInput" placeholder="+ teg qo'shish" onkeydown="if(event.key==='Enter'){addNoteTag(this.value);this.value=''}"/>
    </div>
    <textarea class="note-content" id="noteContentInput" placeholder="Yozishni boshlang...">${escape(n.content)}</textarea>
    <div style="display:flex;justify-content:space-between;padding-top:1rem;border-top:1px solid var(--border);margin-top:1rem">
      <small class="muted">${n.updatedAt} · ${n.content.length} belgi</small>
      <button class="btn btn-danger" onclick="deleteNote()"><i class="fa-solid fa-trash"></i> O'chirish</button>
    </div>
  `;
  $('#noteTitleInput').addEventListener('input', e => updateNote('title', e.target.value));
  $('#noteContentInput').addEventListener('input', e => updateNote('content', e.target.value));
}
function updateNote(field, value) {
  const n = state.notes.find(x => x.id === state.selectedNote); if (!n) return;
  n[field] = value;
  n.updatedAt = today();
  save();
  // update preview without re-render
  const item = $(`.note-item.active`);
  if (item && field === 'title') item.querySelector('.note-item-title').textContent = value || 'Nomsiz';
  if (item && field === 'content') item.querySelector('.note-item-preview').textContent = (value||'').slice(0,60);
}
function addNoteTag(t) {
  t = t.trim(); if (!t) return;
  const n = state.notes.find(x => x.id === state.selectedNote);
  if (!n.tags.includes(t)) { n.tags.push(t); save(); renderNoteEditor(); }
}
function removeNoteTag(idx) {
  const n = state.notes.find(x => x.id === state.selectedNote);
  n.tags.splice(idx, 1); save(); renderNoteEditor();
}
function deleteNote() {
  if (!confirm("Qaydni o'chirishni xohlaysizmi?")) return;
  state.notes = state.notes.filter(n => n.id !== state.selectedNote);
  state.selectedNote = state.notes[0]?.id || null;
  save();
  renderNotes();
}



// ════ GOALS ════
function setGoalType(t) { state.goalType = t; $$('.tab[data-gtype]').forEach(b => b.classList.toggle('active', b.dataset.gtype === t)); renderGoals(); }
function renderGoals() {
  const grid = $('#goalsGrid');
  let list = [...state.goals];
  const t = state.goalType;
  if (t === 'short') list = list.filter(g => g.type === 'short' && g.progress < 100);
  else if (t === 'long') list = list.filter(g => g.type === 'long' && g.progress < 100);
  else if (t === 'done') list = list.filter(g => g.progress >= 100);
  else list = list.filter(g => g.progress < 100);

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🎯</div><h3>Maqsadlar yo'q</h3><p>Hayotingizni shakllantirish uchun birinchi maqsadni qo'ying</p></div>`;
    return;
  }
  grid.innerHTML = list.map(goalHTML).join('');
}
function goalHTML(g) {
  const pct = g.milestones.length ? Math.round((g.milestones.filter(m=>m.done).length / g.milestones.length)*100) : (g.progress||0);
  return `<div class="goal-card">
    <div class="goal-icon">${g.icon||'🎯'}</div>
    <div class="goal-name">${escape(g.name)}</div>
    <div class="goal-desc">${escape(g.desc||'')}</div>
    <div class="goal-progress">
      <div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${pct}%"></div></div>
      <div class="goal-progress-pct">${pct}%</div>
    </div>
    <div class="goal-meta">
      <span>${g.type === 'short' ? 'Qisqa muddatli' : 'Uzoq muddatli'}</span>
      <span>${g.deadline ? '⏰ ' + g.deadline : ''}</span>
    </div>
    ${g.milestones.length ? `<div class="goal-milestones">
      ${g.milestones.map((m,i) => `<div class="milestone-item ${m.done?'done':''}" onclick="toggleMilestone('${g.id}',${i})">
        <div class="milestone-check">${m.done?'<i class="fa-solid fa-check"></i>':''}</div>
        <span class="milestone-text">${escape(m.name)}</span>
      </div>`).join('')}
    </div>`:''}
    <div style="display:flex;gap:6px;margin-top:.8rem">
      <button class="btn btn-secondary" style="flex:1" onclick="editGoal('${g.id}')"><i class="fa-solid fa-pen"></i> Tahrir</button>
      <button class="btn btn-secondary" onclick="deleteGoal('${g.id}')"><i class="fa-solid fa-trash"></i></button>
    </div>
  </div>`;
}
function toggleMilestone(gid, idx) {
  const g = state.goals.find(x => x.id === gid); if (!g) return;
  g.milestones[idx].done = !g.milestones[idx].done;
  save();
  renderGoals();
}
function editGoal(id) { openModal('goal', state.goals.find(x => x.id === id)); }
function deleteGoal(id) {
  if (!confirm("O'chirishni xohlaysizmi?")) return;
  state.goals = state.goals.filter(x => x.id !== id);
  save(); renderGoals();
}

// ════ STUDY ════
function renderSubjects() {
  const grid = $('#subjectsGrid');
  if (!state.subjects.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📚</div><h3>Fanlar yo'q</h3><p>Birinchi fanni qo'shing</p></div>`;
    return;
  }
  grid.innerHTML = state.subjects.map(s => `
    <div class="subject-card" onclick="editSubject('${s.id}')">
      <div class="subject-color-bar" style="background:${s.color}"></div>
      <div class="subject-name">${escape(s.name)}</div>
      <div class="subject-stats">
        <span><strong>${s.hours||0}</strong>s</span>
        <span><strong>${state.flashcards.filter(f => f.subject === s.id).length}</strong> karta</span>
      </div>
    </div>
  `).join('');
}
function editSubject(id) { openModal('subject', state.subjects.find(x=>x.id===id)); }
function renderExams() {
  const list = $('#examsList');
  if (!state.exams.length) {
    list.innerHTML = `<div class="muted" style="text-align:center;padding:1rem">Imtihonlar yo'q</div>`;
    return;
  }
  const td = today();
  list.innerHTML = state.exams.sort((a,b) => a.date.localeCompare(b.date)).map(e => {
    const days = Math.ceil((new Date(e.date) - new Date(td))/86400000);
    return `<div class="exam-card ${days >= 0 && days <= 7 ? 'urgent' : ''}">
      <div class="exam-name">${escape(e.name)}</div>
      <div class="exam-subject">${escape(e.subject||'')}</div>
      <div class="exam-countdown"><strong>${days >= 0 ? days : 'O\'tdi'}</strong><span>${days >= 0 ? 'kun qoldi' : ''}</span></div>
    </div>`;
  }).join('');
}
function renderFlashcard() {
  if (!state.flashcards.length) {
    $('#flashFront').textContent = "Birinchi flashcard'ni qo'shing";
    $('#flashBack').textContent = '—';
    $('#flashCounter').textContent = '0/0';
    return;
  }
  const f = state.flashcards[state.flashIdx % state.flashcards.length];
  $('#flashFront').textContent = f.front;
  $('#flashBack').textContent = f.back;
  $('#flashCounter').textContent = `${(state.flashIdx % state.flashcards.length) + 1}/${state.flashcards.length}`;
  $('#flashcard').classList.remove('flipped');
}
function nextFlash() { state.flashIdx++; renderFlashcard(); }
function prevFlash() { state.flashIdx = Math.max(0, state.flashIdx - 1); renderFlashcard(); }



// ════ ACHIEVEMENTS ════
function renderAchievements() {
  const grid = $('#achievementsGrid');
  grid.innerHTML = ACH.map(a => {
    const u = state.achievements.includes(a.id);
    return `<div class="ach-card ${u?'unlocked':''}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
      ${a.xp?`<div class="tiny mt-1">+${a.xp} XP</div>`:''}
    </div>`;
  }).join('');
}

// ════ SETTINGS ════
function renderSettings() {
  $('#setName').value = state.user.name;
  $('#setNotif').checked = !!state.settings.notifications;
  $('#setSound').checked = !!state.settings.sounds;
  $('#setAnim').checked = state.settings.animations !== false;
  $$('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.th === state.theme));
  $$('.accent-card').forEach(c => c.classList.toggle('active', c.dataset.acc === state.accent));
}
function updateName(v) {
  state.user.name = v.trim() || 'Foydalanuvchi';
  save();
  refreshUserUI();
  setGreeting();
}
function toggleNotif(on) {
  state.settings.notifications = on;
  if (on && 'Notification' in window) Notification.requestPermission();
  save();
}
function exportAll() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lumio-backup-${today()}.json`;
  a.click();
  toast("Eksport qilindi", 'success');
}
function importFromFile(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      Object.assign(state, data);
      save();
      setTheme(state.theme);
      setAccent(state.accent);
      renderAll();
      toast("Import muvaffaqiyatli", 'success');
    } catch { toast("Noto'g'ri fayl", 'error'); }
  };
  r.readAsText(f);
}
function confirmReset() {
  if (!confirm("Hammasini o'chirishni xohlaysizmi? Buni ortga qaytarib bo'lmaydi!")) return;
  if (!confirm("Yana bir bor: ROSTAN HAM hammasini o'chirilsinmi?")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}



// ════ MODALS ════
function openModal(type, data = null) {
  const c = $('#modalContent');
  if (type === 'task') c.innerHTML = taskModalHTML(data);
  else if (type === 'habit') c.innerHTML = habitModalHTML(data);
  else if (type === 'goal') c.innerHTML = goalModalHTML(data);
  else if (type === 'subject') c.innerHTML = subjectModalHTML(data);
  else if (type === 'exam') c.innerHTML = examModalHTML(data);
  else if (type === 'flashcard') c.innerHTML = flashModalHTML(data);
  else if (type === 'quickAdd') c.innerHTML = quickAddHTML();
  $('#modalOverlay').classList.add('open');
}
function closeModal() { $('#modalOverlay').classList.remove('open'); }

function taskModalHTML(t) {
  const isEdit = !!t;
  return `<div class="modal-head">
    <div class="modal-title">${isEdit?'Vazifani tahrirlash':'Yangi vazifa'}</div>
    <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <form onsubmit="saveTask(event,'${t?.id||''}')">
    <div class="form-group"><label class="form-label">Vazifa nomi</label>
      <input class="input" name="name" value="${t?escape(t.name):''}" required autofocus/></div>
    <div class="row">
      <div class="form-group"><label class="form-label">Muddat</label>
        <input class="input" name="due" type="date" value="${t?.due||today()}"/></div>
      <div class="form-group"><label class="form-label">Ustuvorlik</label>
        <select class="select" name="priority">
          <option value="1" ${t?.priority===1?'selected':''}>🔴 Yuqori</option>
          <option value="2" ${t?.priority===2?'selected':''}>🟠 O'rtacha</option>
          <option value="3" ${t?.priority===3?'selected':''}>🔵 Past</option>
          <option value="4" ${(!t||t.priority===4)?'selected':''}>⚪ Yo'q</option>
        </select></div>
    </div>
    <div class="form-group"><label class="form-label">Kategoriya</label>
      <input class="input" name="category" value="${t?escape(t.category||''):''}" placeholder="Ish, Shaxsiy, ..." /></div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Saqlash</button>
    </div>
  </form>`;
}
function saveTask(e, id) {
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.name.value.trim(),
    due: f.due.value || null,
    priority: parseInt(f.priority.value),
    category: f.category.value.trim(),
  };
  if (id) Object.assign(state.tasks.find(t => t.id === id), data);
  else state.tasks.push({ id: uid(), ...data, done: false, subtasks: [], createdAt: today() });
  save();
  closeModal();
  renderTasks();
  toast(id ? "Yangilandi" : "Qo'shildi", 'success');
}

function habitModalHTML(h) {
  return `<div class="modal-head">
    <div class="modal-title">${h?'Odatni tahrirlash':'Yangi odat'}</div>
    <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <form onsubmit="saveHabit(event,'${h?.id||''}')">
    <div class="form-group"><label class="form-label">Odat nomi</label>
      <input class="input" name="name" value="${h?escape(h.name):''}" required autofocus/></div>
    <div class="row">
      <div class="form-group"><label class="form-label">Davriylik</label>
        <select class="select" name="frequency">
          <option value="daily" ${(!h||h.frequency==='daily')?'selected':''}>Kunlik</option>
          <option value="weekly" ${h?.frequency==='weekly'?'selected':''}>Haftalik</option>
          <option value="monthly" ${h?.frequency==='monthly'?'selected':''}>Oylik</option>
        </select></div>
      <div class="form-group"><label class="form-label">Qiyinlik</label>
        <select class="select" name="diff">
          <option value="1" ${h?.diff===1?'selected':''}>⭐ Oson</option>
          <option value="2" ${(!h||h.diff===2)?'selected':''}>⭐⭐ O'rtacha</option>
          <option value="3" ${h?.diff===3?'selected':''}>⭐⭐⭐ Qiyin</option>
        </select></div>
    </div>
    <div class="row">
      <div class="form-group"><label class="form-label">Maqsad (kunlik)</label>
        <input class="input" name="target" type="number" min="1" value="${h?.target||1}"/></div>
      <div class="form-group"><label class="form-label">Kategoriya</label>
        <input class="input" name="category" value="${h?escape(h.category||''):''}" placeholder="Sog'liq, ..."/></div>
    </div>
    <div class="form-group"><label class="form-label">Belgi</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${HABIT_ICONS.map(i => `<button type="button" class="color-opt" onclick="this.parentElement.querySelectorAll('.color-opt').forEach(b=>b.classList.remove('selected'));this.classList.add('selected');document.getElementById('habitIcon').value='${i}'" style="background:var(--bg3);font-size:1.1rem;width:34px;height:34px ${(h?.icon||'⚡')===i?'class=\"selected\"':''}">${i}</button>`).join('')}
      </div>
      <input type="hidden" id="habitIcon" value="${h?.icon||'⚡'}"/>
    </div>
    <div class="form-group"><label class="form-label">Rang</label>
      <div class="color-picker">
        ${HABIT_COLORS.map(c => `<div class="color-opt ${(h?.color||'#1a1a1a')===c?'selected':''}" style="background:${c}" onclick="this.parentElement.querySelectorAll('.color-opt').forEach(b=>b.classList.remove('selected'));this.classList.add('selected');document.getElementById('habitColor').value='${c}'"></div>`).join('')}
      </div>
      <input type="hidden" id="habitColor" value="${h?.color||'#1a1a1a'}"/>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Saqlash</button>
    </div>
  </form>`;
}
function saveHabit(e, id) {
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.name.value.trim(),
    frequency: f.frequency.value,
    diff: parseInt(f.diff.value),
    target: parseInt(f.target.value) || 1,
    category: f.category.value.trim(),
    icon: $('#habitIcon').value,
    color: $('#habitColor').value,
  };
  if (id) Object.assign(state.habits.find(h => h.id === id), data);
  else {
    state.habits.push({ id: uid(), ...data, createdAt: today() });
    if (state.habits.length === 1) unlockAch('first_habit');
  }
  save();
  closeModal();
  renderHabits();
  toast(id ? "Yangilandi" : "Odat qo'shildi", 'success');
}



function goalModalHTML(g) {
  return `<div class="modal-head">
    <div class="modal-title">${g?'Maqsadni tahrirlash':'Yangi maqsad'}</div>
    <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <form onsubmit="saveGoal(event,'${g?.id||''}')">
    <div class="form-group"><label class="form-label">Maqsad</label>
      <input class="input" name="name" value="${g?escape(g.name):''}" required autofocus/></div>
    <div class="form-group"><label class="form-label">Tavsif</label>
      <textarea class="textarea" name="desc">${g?escape(g.desc||''):''}</textarea></div>
    <div class="row">
      <div class="form-group"><label class="form-label">Tip</label>
        <select class="select" name="type">
          <option value="short" ${(!g||g.type==='short')?'selected':''}>Qisqa muddatli</option>
          <option value="long" ${g?.type==='long'?'selected':''}>Uzoq muddatli</option>
        </select></div>
      <div class="form-group"><label class="form-label">Muddat</label>
        <input class="input" name="deadline" type="date" value="${g?.deadline||''}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Belgi (emoji)</label>
      <input class="input" name="icon" value="${g?.icon||'🎯'}" maxlength="3"/></div>
    <div class="form-group"><label class="form-label">Bosqichlar (vergul bilan)</label>
      <textarea class="textarea" name="milestones" placeholder="Birinchi qadam, Ikkinchi qadam, ...">${g?g.milestones.map(m=>m.name).join(', '):''}</textarea></div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Saqlash</button>
    </div>
  </form>`;
}
function saveGoal(e, id) {
  e.preventDefault();
  const f = e.target;
  const milestonesArr = f.milestones.value.split(',').map(s => s.trim()).filter(Boolean);
  const data = {
    name: f.name.value.trim(),
    desc: f.desc.value.trim(),
    type: f.type.value,
    deadline: f.deadline.value,
    icon: f.icon.value || '🎯',
    progress: 0,
  };
  if (id) {
    const g = state.goals.find(x => x.id === id);
    Object.assign(g, data);
    // Preserve done state for matching milestones
    g.milestones = milestonesArr.map(name => {
      const old = g.milestones.find(m => m.name === name);
      return old || { id: uid(), name, done: false };
    });
  } else {
    state.goals.push({
      id: uid(), ...data,
      milestones: milestonesArr.map(name => ({ id: uid(), name, done: false })),
      createdAt: today(),
    });
    if (state.goals.length === 1) unlockAch('goal_1');
  }
  save();
  closeModal();
  renderGoals();
  toast(id?"Yangilandi":"Maqsad qo'shildi", 'success');
}

function subjectModalHTML(s) {
  return `<div class="modal-head">
    <div class="modal-title">${s?'Fanni tahrirlash':'Yangi fan'}</div>
    <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <form onsubmit="saveSubject(event,'${s?.id||''}')">
    <div class="form-group"><label class="form-label">Fan nomi</label>
      <input class="input" name="name" value="${s?escape(s.name):''}" required autofocus/></div>
    <div class="form-group"><label class="form-label">Rang</label>
      <div class="color-picker">
        ${HABIT_COLORS.map(c => `<div class="color-opt ${(s?.color||'#1a1a1a')===c?'selected':''}" style="background:${c}" onclick="this.parentElement.querySelectorAll('.color-opt').forEach(b=>b.classList.remove('selected'));this.classList.add('selected');document.getElementById('subjColor').value='${c}'"></div>`).join('')}
      </div>
      <input type="hidden" id="subjColor" value="${s?.color||'#1a1a1a'}"/>
    </div>
    <div class="modal-foot">
      ${s?`<button type="button" class="btn btn-danger" onclick="deleteSubject('${s.id}')"><i class="fa-solid fa-trash"></i></button>`:''}
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Saqlash</button>
    </div>
  </form>`;
}
function saveSubject(e, id) {
  e.preventDefault();
  const f = e.target;
  const data = { name: f.name.value.trim(), color: $('#subjColor').value };
  if (id) Object.assign(state.subjects.find(x => x.id === id), data);
  else state.subjects.push({ id: uid(), ...data, hours: 0 });
  save(); closeModal(); renderSubjects();
}
function deleteSubject(id) {
  if (!confirm("O'chirilsinmi?")) return;
  state.subjects = state.subjects.filter(x => x.id !== id);
  save(); closeModal(); renderSubjects();
}

function examModalHTML(e) {
  return `<div class="modal-head">
    <div class="modal-title">Yangi imtihon</div>
    <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <form onsubmit="saveExam(event)">
    <div class="form-group"><label class="form-label">Imtihon nomi</label><input class="input" name="name" required autofocus/></div>
    <div class="form-group"><label class="form-label">Fan</label>
      <select class="select" name="subject"><option value="">— tanlash —</option>
        ${state.subjects.map(s=>`<option value="${s.name}">${escape(s.name)}</option>`).join('')}
      </select></div>
    <div class="form-group"><label class="form-label">Sana</label><input class="input" name="date" type="date" required value="${today()}"/></div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Saqlash</button>
    </div>
  </form>`;
}
function saveExam(e) {
  e.preventDefault();
  const f = e.target;
  state.exams.push({ id: uid(), name: f.name.value.trim(), subject: f.subject.value, date: f.date.value });
  save(); closeModal(); renderExams();
  toast("Imtihon qo'shildi", 'success');
}

function flashModalHTML() {
  return `<div class="modal-head">
    <div class="modal-title">Yangi flashcard</div>
    <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <form onsubmit="saveFlash(event)">
    <div class="form-group"><label class="form-label">Savol</label><textarea class="textarea" name="front" required autofocus></textarea></div>
    <div class="form-group"><label class="form-label">Javob</label><textarea class="textarea" name="back" required></textarea></div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Qo'shish</button>
    </div>
  </form>`;
}
function saveFlash(e) {
  e.preventDefault();
  const f = e.target;
  state.flashcards.push({ id: uid(), front: f.front.value.trim(), back: f.back.value.trim() });
  save(); closeModal(); renderFlashcard();
  toast("Karta qo'shildi", 'success');
}

function quickAddHTML() {
  return `<div class="modal-head">
    <div class="modal-title">Tezkor qo'shish</div>
    <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
    <button class="mini-app-card" onclick="closeModal();openModal('task')"><div class="mini-app-icon" style="background:var(--blue-soft);color:var(--blue)">📋</div><div><div class="mini-app-name">Vazifa</div><div class="mini-app-desc">Yangi vazifa qo'shish</div></div></button>
    <button class="mini-app-card" onclick="closeModal();openModal('habit')"><div class="mini-app-icon" style="background:var(--orange-soft);color:var(--orange)">⚡</div><div><div class="mini-app-name">Odat</div><div class="mini-app-desc">Yangi odat boshlash</div></div></button>
    <button class="mini-app-card" onclick="closeModal();openModal('goal')"><div class="mini-app-icon" style="background:var(--purple-soft);color:var(--purple)">🎯</div><div><div class="mini-app-name">Maqsad</div><div class="mini-app-desc">Yangi maqsad</div></div></button>
    <button class="mini-app-card" onclick="closeModal();newNote();goPage('notes')"><div class="mini-app-icon" style="background:var(--green-soft);color:var(--green)">📝</div><div><div class="mini-app-name">Qayd</div><div class="mini-app-desc">Yangi qayd yozish</div></div></button>
  </div>`;
}



// ════ MINI APPS ════
function openMiniApp(name) {
  const c = $('#modalContent');
  if (name === 'calc') c.innerHTML = calcHTML();
  else if (name === 'stopwatch') c.innerHTML = stopwatchHTML();
  else if (name === 'timer') c.innerHTML = timerHTML();
  else if (name === 'whitenoise') c.innerHTML = whiteNoiseHTML();
  else if (name === 'converter') c.innerHTML = converterHTML();
  else if (name === 'sleep') c.innerHTML = sleepHTML();
  else if (name === 'expense') c.innerHTML = expenseHTML();
  else if (name === 'journal') c.innerHTML = journalHTML();
  $('#modalOverlay').classList.add('open');
  if (name === 'calc') initCalc();
  if (name === 'stopwatch') initStopwatch();
  if (name === 'timer') initTimer();
  if (name === 'whitenoise') initWhiteNoise();
}

// CALCULATOR
let calcState = { current: '0', history: '', op: null, prev: null, justEval: false };
function calcHTML() {
  const btns = ['C','±','%','÷','7','8','9','×','4','5','6','-','1','2','3','+','0','.','='];
  return `<div class="modal-head"><div class="modal-title">🧮 Kalkulyator</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="calc-display">
    <div class="calc-history" id="calcHistory">${calcState.history}</div>
    <div class="calc-current" id="calcCurrent">${calcState.current}</div>
  </div>
  <div class="calc-grid">
    ${btns.map(b => {
      const isOp = ['+','-','×','÷','%'].includes(b);
      const isEq = b === '=';
      const cls = isEq ? 'calc-btn eq' : isOp ? 'calc-btn op' : 'calc-btn';
      return `<button class="${cls}" onclick="calcPress('${b}')">${b}</button>`;
    }).join('')}
  </div>`;
}
function initCalc() { calcState = { current: '0', history: '', op: null, prev: null, justEval: false }; }
function calcPress(b) {
  if (b >= '0' && b <= '9') {
    if (calcState.justEval) { calcState.current = b; calcState.justEval = false; }
    else if (calcState.current === '0') calcState.current = b;
    else calcState.current += b;
  } else if (b === '.') {
    if (!calcState.current.includes('.')) calcState.current += '.';
  } else if (b === 'C') {
    calcState = { current: '0', history: '', op: null, prev: null, justEval: false };
  } else if (b === '±') {
    calcState.current = String(-parseFloat(calcState.current));
  } else if (b === '%') {
    calcState.current = String(parseFloat(calcState.current) / 100);
  } else if (['+','-','×','÷'].includes(b)) {
    if (calcState.op && !calcState.justEval) calcEval();
    calcState.prev = calcState.current;
    calcState.op = b;
    calcState.history = `${calcState.current} ${b}`;
    calcState.current = '0';
    calcState.justEval = false;
  } else if (b === '=') {
    calcEval();
    calcState.justEval = true;
  }
  $('#calcCurrent').textContent = calcState.current;
  $('#calcHistory').textContent = calcState.history;
}
function calcEval() {
  if (!calcState.op || calcState.prev === null) return;
  const a = parseFloat(calcState.prev), b = parseFloat(calcState.current);
  let r = 0;
  if (calcState.op === '+') r = a + b;
  else if (calcState.op === '-') r = a - b;
  else if (calcState.op === '×') r = a * b;
  else if (calcState.op === '÷') r = b !== 0 ? a / b : 0;
  calcState.history = `${calcState.prev} ${calcState.op} ${calcState.current} =`;
  calcState.current = String(Math.round(r * 1e10) / 1e10);
  calcState.op = null; calcState.prev = null;
}

// STOPWATCH
let swInterval = null, swStart = 0, swElapsed = 0, swLaps = [];
function stopwatchHTML() {
  return `<div class="modal-head"><div class="modal-title">⏱ Sekundomer</div><button class="icon-btn" onclick="stopSW();closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="timer-display" id="swDisplay">00:00.00</div>
  <div style="display:flex;gap:8px;justify-content:center">
    <button class="btn btn-secondary" onclick="lapSW()"><i class="fa-solid fa-flag"></i> Lap</button>
    <button class="btn btn-primary" id="swBtn" onclick="toggleSW()"><i class="fa-solid fa-play"></i> Boshlash</button>
    <button class="btn btn-secondary" onclick="resetSW()"><i class="fa-solid fa-rotate-left"></i> Reset</button>
  </div>
  <div class="timer-laps" id="swLaps"></div>`;
}
function initStopwatch() { swElapsed = 0; swLaps = []; updateSWDisplay(); }
function toggleSW() {
  if (swInterval) {
    clearInterval(swInterval); swInterval = null;
    $('#swBtn').innerHTML = '<i class="fa-solid fa-play"></i> Davom';
  } else {
    swStart = Date.now() - swElapsed;
    swInterval = setInterval(() => { swElapsed = Date.now() - swStart; updateSWDisplay(); }, 50);
    $('#swBtn').innerHTML = '<i class="fa-solid fa-pause"></i> Pauza';
  }
}
function lapSW() { if (!swInterval) return; swLaps.unshift(swElapsed); $('#swLaps').innerHTML = swLaps.map((t,i)=>`<div class="timer-lap"><span>Lap ${swLaps.length-i}</span><span>${formatSW(t)}</span></div>`).join(''); }
function resetSW() { stopSW(); swElapsed = 0; swLaps = []; updateSWDisplay(); $('#swLaps').innerHTML=''; $('#swBtn').innerHTML='<i class="fa-solid fa-play"></i> Boshlash'; }
function stopSW() { if (swInterval) { clearInterval(swInterval); swInterval = null; } }
function updateSWDisplay() {
  const el = $('#swDisplay'); if (el) el.textContent = formatSW(swElapsed);
}
function formatSW(ms) {
  const m = Math.floor(ms/60000), s = Math.floor((ms%60000)/1000), cs = Math.floor((ms%1000)/10);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}

// TIMER
let tmrInterval = null, tmrSeconds = 0;
function timerHTML() {
  return `<div class="modal-head"><div class="modal-title">⏲ Taymer</div><button class="icon-btn" onclick="stopTmr();closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="row">
    <div class="form-group"><label class="form-label">Daqiqa</label><input class="input" type="number" id="tmrMin" min="0" value="5"/></div>
    <div class="form-group"><label class="form-label">Sekund</label><input class="input" type="number" id="tmrSec" min="0" max="59" value="0"/></div>
  </div>
  <div class="timer-display" id="tmrDisplay">05:00</div>
  <div style="display:flex;gap:8px;justify-content:center">
    <button class="btn btn-primary" id="tmrBtn" onclick="toggleTmr()"><i class="fa-solid fa-play"></i> Boshlash</button>
    <button class="btn btn-secondary" onclick="resetTmr()"><i class="fa-solid fa-rotate-left"></i> Reset</button>
  </div>`;
}
function initTimer() { tmrSeconds = 5*60; }
function toggleTmr() {
  if (tmrInterval) { clearInterval(tmrInterval); tmrInterval = null; $('#tmrBtn').innerHTML='<i class="fa-solid fa-play"></i> Davom'; return; }
  if (tmrSeconds <= 0) tmrSeconds = (parseInt($('#tmrMin').value)||0) * 60 + (parseInt($('#tmrSec').value)||0);
  if (tmrSeconds <= 0) return;
  tmrInterval = setInterval(() => {
    tmrSeconds--; updateTmrDisplay();
    if (tmrSeconds <= 0) { clearInterval(tmrInterval); tmrInterval = null; toast("⏰ Vaqt tugadi!", 'success'); $('#tmrBtn').innerHTML='<i class="fa-solid fa-play"></i> Boshlash'; }
  }, 1000);
  $('#tmrBtn').innerHTML='<i class="fa-solid fa-pause"></i> Pauza';
}
function resetTmr() { stopTmr(); tmrSeconds = (parseInt($('#tmrMin').value)||0)*60 + (parseInt($('#tmrSec').value)||0); updateTmrDisplay(); $('#tmrBtn').innerHTML='<i class="fa-solid fa-play"></i> Boshlash'; }
function stopTmr() { if (tmrInterval) { clearInterval(tmrInterval); tmrInterval = null; } }
function updateTmrDisplay() { const el = $('#tmrDisplay'); if (el) el.textContent = fmtTime(Math.max(0,tmrSeconds)); }



// WHITE NOISE
let wnSounds = {};
function whiteNoiseHTML() {
  return `<div class="modal-head"><div class="modal-title">🎵 Oq shovqin generatori</div><button class="icon-btn" onclick="stopAllWN();closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <p class="muted mb-2">Konsentratsiya va dam olish uchun</p>
  <div class="mini-apps-grid" style="grid-template-columns:repeat(3,1fr)">
    <button class="mini-app-card" data-snd="white" onclick="toggleWN('white',this)"><div class="mini-app-icon">⚪</div><div class="mini-app-name">Oq shovqin</div></button>
    <button class="mini-app-card" data-snd="rain" onclick="toggleWN('rain',this)"><div class="mini-app-icon">🌧</div><div class="mini-app-name">Yomg'ir</div></button>
    <button class="mini-app-card" data-snd="forest" onclick="toggleWN('forest',this)"><div class="mini-app-icon">🌲</div><div class="mini-app-name">O'rmon</div></button>
    <button class="mini-app-card" data-snd="ocean" onclick="toggleWN('ocean',this)"><div class="mini-app-icon">🌊</div><div class="mini-app-name">Okean</div></button>
    <button class="mini-app-card" data-snd="cafe" onclick="toggleWN('cafe',this)"><div class="mini-app-icon">☕</div><div class="mini-app-name">Kafe</div></button>
    <button class="mini-app-card" data-snd="pink" onclick="toggleWN('pink',this)"><div class="mini-app-icon">💗</div><div class="mini-app-name">Pink shovqin</div></button>
  </div>`;
}
function initWhiteNoise() { wnSounds = {}; }
function toggleWN(name, btn) {
  if (wnSounds[name]) { wnSounds[name].stop(); delete wnSounds[name]; btn.style.borderColor = ''; btn.style.background = ''; }
  else { wnSounds[name] = playSound(name); btn.style.borderColor = 'var(--accent)'; btn.style.background = 'var(--accent-soft)'; }
}
function stopAllWN() { Object.values(wnSounds).forEach(s => s.stop()); wnSounds = {}; }

// CONVERTER
function converterHTML() {
  return `<div class="modal-head"><div class="modal-title">🔄 Konverter</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="form-group"><label class="form-label">Tip</label>
    <select class="select" id="convType" onchange="convChange()">
      <option value="length">Uzunlik</option>
      <option value="weight">Massa</option>
      <option value="temp">Harorat</option>
      <option value="time">Vaqt</option>
    </select></div>
  <div class="row">
    <div class="form-group"><label class="form-label">Dan</label>
      <input class="input" id="convFrom" type="number" value="1" oninput="doConvert()"/>
      <select class="select" id="convFromUnit" onchange="doConvert()" style="margin-top:4px"></select></div>
    <div class="form-group"><label class="form-label">Ga</label>
      <input class="input" id="convTo" type="number" readonly/>
      <select class="select" id="convToUnit" onchange="doConvert()" style="margin-top:4px"></select></div>
  </div>`;
}
const CONV_UNITS = {
  length: { 'm':1, 'km':1000, 'cm':0.01, 'mm':0.001, 'in':0.0254, 'ft':0.3048, 'mi':1609.34 },
  weight: { 'kg':1, 'g':0.001, 'mg':0.000001, 'lb':0.453592, 'oz':0.0283495, 't':1000 },
  time: { 's':1, 'min':60, 'h':3600, 'day':86400, 'week':604800 },
  temp: { 'C':'C', 'F':'F', 'K':'K' }
};
function convChange() {
  const t = $('#convType').value;
  const from = $('#convFromUnit'), to = $('#convToUnit');
  const units = Object.keys(CONV_UNITS[t]);
  from.innerHTML = units.map(u => `<option>${u}</option>`).join('');
  to.innerHTML = units.map(u => `<option>${u}</option>`).join('');
  if (units.length > 1) to.value = units[1];
  doConvert();
}
function doConvert() {
  const t = $('#convType').value;
  const v = parseFloat($('#convFrom').value);
  const fu = $('#convFromUnit').value, tu = $('#convToUnit').value;
  let result = 0;
  if (t === 'temp') {
    let c = v;
    if (fu === 'F') c = (v-32)*5/9; else if (fu === 'K') c = v - 273.15;
    if (tu === 'C') result = c; else if (tu === 'F') result = c*9/5+32; else result = c+273.15;
  } else {
    result = (v * CONV_UNITS[t][fu]) / CONV_UNITS[t][tu];
  }
  $('#convTo').value = Math.round(result * 1e6) / 1e6;
}
setTimeout(() => { if ($('#convType')) convChange(); }, 100);

// SLEEP
function sleepHTML() {
  const last = state.sleeps.slice(-7).reverse();
  const avg = state.sleeps.length ? (state.sleeps.reduce((a,s)=>a+s.hours,0)/state.sleeps.length).toFixed(1) : 0;
  return `<div class="modal-head"><div class="modal-title">😴 Uyqu kuzatuvi</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <p class="muted mb-2">O'rtacha: <strong>${avg}h</strong></p>
  <div class="row">
    <div class="form-group"><label class="form-label">Soat</label><input class="input" type="number" id="sleepHours" min="0" max="24" step="0.5" value="8"/></div>
    <div class="form-group"><label class="form-label">Sifat</label>
      <select class="select" id="sleepQuality">
        <option value="5">😄 A'lo</option><option value="4" selected>🙂 Yaxshi</option>
        <option value="3">😐 O'rtacha</option><option value="2">😕 Yomonroq</option><option value="1">😢 Yomon</option>
      </select></div>
  </div>
  <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="saveSleep()"><i class="fa-solid fa-bed"></i> Saqlash</button>
  <h3 class="h3 mt-3 mb-1">So'nggi 7 kun</h3>
  ${last.length ? last.map(s => `<div class="setting-row"><div class="setting-info"><div class="setting-name">${s.date}</div><div class="setting-desc">Sifat: ${'⭐'.repeat(s.quality)}</div></div><div class="h3">${s.hours}h</div></div>`).join('') : '<div class="muted">Hech qanday yozuv yo\'q</div>'}`;
}
function saveSleep() {
  const hours = parseFloat($('#sleepHours').value);
  const quality = parseInt($('#sleepQuality').value);
  state.sleeps.push({ date: today(), hours, quality });
  save();
  toast("Uyqu saqlandi", 'success');
  closeModal();
}

// EXPENSE
function expenseHTML() {
  const total = state.expenses.filter(e => e.date.startsWith(today().slice(0,7))).reduce((a,e)=>a+e.amount,0);
  return `<div class="modal-head"><div class="modal-title">💰 Xarajatlar</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="card mb-2" style="background:var(--accent-soft);border:none;text-align:center;padding:1.5rem">
    <div class="muted">Bu oy</div>
    <div style="font-size:2rem;font-weight:700;letter-spacing:-0.02em">${total.toLocaleString('uz-UZ')} so'm</div>
  </div>
  <div class="row">
    <div class="form-group"><label class="form-label">Miqdor</label><input class="input" type="number" id="expAmt" placeholder="50000"/></div>
    <div class="form-group"><label class="form-label">Kategoriya</label>
      <select class="select" id="expCat">
        <option>Oziq-ovqat</option><option>Transport</option><option>Ko'ngilochar</option>
        <option>Sog'liq</option><option>Boshqa</option>
      </select></div>
  </div>
  <button class="btn btn-primary mb-2" style="width:100%;justify-content:center" onclick="saveExpense()"><i class="fa-solid fa-plus"></i> Qo'shish</button>
  <h3 class="h3 mb-1">So'nggi xarajatlar</h3>
  ${state.expenses.slice(-10).reverse().map(e => `<div class="setting-row"><div class="setting-info"><div class="setting-name">${e.category}</div><div class="setting-desc">${e.date}</div></div><strong>${e.amount.toLocaleString('uz-UZ')} so'm</strong></div>`).join('') || '<div class="muted">Hech narsa yo\'q</div>'}`;
}
function saveExpense() {
  const amount = parseFloat($('#expAmt').value);
  const category = $('#expCat').value;
  if (!amount) return;
  state.expenses.push({ id: uid(), date: today(), amount, category });
  save();
  openMiniApp('expense');
  toast("Saqlandi", 'success');
}

// JOURNAL
function journalHTML() {
  const entry = state.journal[today()] || '';
  return `<div class="modal-head"><div class="modal-title">📔 Kundalik</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <p class="muted mb-2">${today()} · Bugun nima sodir bo'ldi?</p>
  <textarea class="textarea" id="journalText" rows="10" placeholder="Bugungi fikrlaringiz, voqealar, taassurotlar...">${escape(entry)}</textarea>
  <button class="btn btn-primary mt-2" style="width:100%;justify-content:center" onclick="saveJournal()"><i class="fa-solid fa-floppy-disk"></i> Saqlash</button>`;
}
function saveJournal() {
  state.journal[today()] = $('#journalText').value;
  save();
  toast("Kundalik saqlandi", 'success');
  closeModal();
}



// ════ COMMAND PALETTE ════
let cmdItems = [], cmdSelected = 0;
function openCmd() {
  $('#cmdOverlay').classList.add('open');
  $('#cmdInput').value = '';
  $('#cmdInput').focus();
  renderCmd('');
}
function closeCmd() { $('#cmdOverlay').classList.remove('open'); }

function renderCmd(q) {
  const ql = q.toLowerCase().trim();
  const sections = [];

  // Pages
  const pages = [
    { icon:'fa-house', name:'Bosh sahifa', desc:'Dashboard', action:() => goPage('dashboard') },
    { icon:'fa-circle-check', name:'Vazifalar', desc:'To-do list', action:() => goPage('tasks') },
    { icon:'fa-bolt', name:'Odatlar', desc:'Habit tracker', action:() => goPage('habits') },
    { icon:'fa-circle-dot', name:'Fokus rejim', desc:'Pomodoro', action:() => goPage('focus') },
    { icon:'fa-graduation-cap', name:"O'qish", desc:'Study planner', action:() => goPage('study') },
    { icon:'fa-bullseye', name:'Maqsadlar', desc:'Goals', action:() => goPage('goals') },
    { icon:'fa-note-sticky', name:'Qaydlar', desc:'Notes', action:() => goPage('notes') },
    { icon:'fa-grid-2', name:'Mini ilovalar', desc:'Tools', action:() => goPage('apps') },
    { icon:'fa-trophy', name:'Yutuqlar', desc:'Achievements', action:() => goPage('achievements') },
    { icon:'fa-gear', name:'Sozlamalar', desc:'Settings', action:() => goPage('settings') },
  ];

  // Actions
  const actions = [
    { icon:'fa-plus', name:'Yangi vazifa', desc:'Vazifa qo\'shish', action:() => openModal('task') },
    { icon:'fa-plus', name:'Yangi odat', desc:'Odat qo\'shish', action:() => openModal('habit') },
    { icon:'fa-plus', name:'Yangi maqsad', desc:'Maqsad qo\'shish', action:() => openModal('goal') },
    { icon:'fa-plus', name:'Yangi qayd', desc:'Qayd yaratish', action:() => { goPage('notes'); newNote(); } },
    { icon:'fa-circle-dot', name:'Fokus rejimni ochish', desc:'Pomodoro boshlash', action:() => { goPage('focus'); setTimeout(enterFocus, 200); } },
    { icon:'fa-moon', name:"Mavzuni o'zgartirish", desc:'Light/Dark', action:() => toggleTheme() },
    { icon:'fa-calculator', name:'Kalkulyator', desc:'Calculator', action:() => openMiniApp('calc') },
    { icon:'fa-stopwatch', name:'Sekundomer', desc:'Stopwatch', action:() => openMiniApp('stopwatch') },
    { icon:'fa-music', name:'Oq shovqin', desc:'White noise', action:() => openMiniApp('whitenoise') },
  ];

  const filtered = pages.concat(actions);
  cmdItems = ql ? filtered.filter(i => i.name.toLowerCase().includes(ql) || i.desc.toLowerCase().includes(ql)) : filtered;

  // Habits & tasks search
  if (ql) {
    state.habits.forEach(h => { if (h.name.toLowerCase().includes(ql)) cmdItems.push({ icon:'fa-bolt', name:h.name, desc:'Odat · '+(h.category||''), action:() => goPage('habits') }); });
    state.tasks.forEach(t => { if (t.name.toLowerCase().includes(ql)) cmdItems.push({ icon:'fa-circle-check', name:t.name, desc:'Vazifa', action:() => goPage('tasks') }); });
    state.notes.forEach(n => { if (n.title.toLowerCase().includes(ql)) cmdItems.push({ icon:'fa-note-sticky', name:n.title, desc:'Qayd', action:() => { goPage('notes'); selectNote(n.id); } }); });
  }

  cmdSelected = 0;
  $('#cmdResults').innerHTML = cmdItems.length
    ? cmdItems.map((i, idx) => `<div class="cmd-item ${idx===0?'focused':''}" data-idx="${idx}" onclick="cmdRun(${idx})">
        <div class="cmd-item-icon"><i class="fa-solid ${i.icon}"></i></div>
        <div class="cmd-item-text"><div class="cmd-item-name">${escape(i.name)}</div><div class="cmd-item-desc">${escape(i.desc)}</div></div>
      </div>`).join('')
    : `<div style="padding:2rem;text-align:center;color:var(--text3)">Hech narsa topilmadi</div>`;
}
function cmdRun(i) { const item = cmdItems[i]; if (item) { closeCmd(); item.action(); } }
function cmdMove(d) {
  cmdSelected = Math.max(0, Math.min(cmdItems.length-1, cmdSelected + d));
  $$('.cmd-item').forEach((el, i) => el.classList.toggle('focused', i === cmdSelected));
  const focused = $('.cmd-item.focused');
  focused?.scrollIntoView({ block: 'nearest' });
}

// ════ KEYBOARD SHORTCUTS ════
let gKeyTimeout = null;
let gPressed = false;
document.addEventListener('keydown', e => {
  // Ignore in inputs
  const tag = (document.activeElement?.tagName || '').toLowerCase();
  const inInput = ['input','textarea','select'].includes(tag) && !$('#cmdInput').contains(document.activeElement);
  const cmdOpen = $('#cmdOverlay').classList.contains('open');
  const modalOpen = $('#modalOverlay').classList.contains('open');
  const focusOpen = $('#focusMode').classList.contains('active');

  // Esc
  if (e.key === 'Escape') {
    if (cmdOpen) closeCmd();
    else if (modalOpen) closeModal();
    else if (focusOpen) exitFocus();
    return;
  }

  // Cmd palette navigation
  if (cmdOpen) {
    if (e.key === 'ArrowDown') { e.preventDefault(); cmdMove(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); cmdMove(-1); }
    if (e.key === 'Enter') { e.preventDefault(); cmdRun(cmdSelected); }
    return;
  }

  if (inInput) return;

  // Cmd+K
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); return; }

  if (modalOpen) return;

  // G+letter
  if (gPressed) {
    const map = { d:'dashboard', t:'tasks', h:'habits', f:'focus', s:'study', g:'goals', n:'notes', a:'apps', y:'achievements', c:'settings' };
    if (map[e.key.toLowerCase()]) { e.preventDefault(); goPage(map[e.key.toLowerCase()]); }
    gPressed = false;
    return;
  }
  if (e.key.toLowerCase() === 'g') { gPressed = true; clearTimeout(gKeyTimeout); gKeyTimeout = setTimeout(()=>gPressed=false, 1500); return; }

  // Single keys
  if (e.key === '/') { e.preventDefault(); openCmd(); }
  else if (e.key.toLowerCase() === 'n') { e.preventDefault(); openModal('quickAdd'); }
  else if (e.key.toLowerCase() === 'f') { e.preventDefault(); goPage('focus'); }
  else if (e.key.toLowerCase() === 't') { e.preventDefault(); toggleTheme(); }
  else if (e.key === '?') { e.preventDefault(); goPage('settings'); window.scrollTo(0, document.body.scrollHeight); }
});



// ════ NAV BIND ════
function bindNav() {
  $$('.nav-item').forEach(n => n.addEventListener('click', e => { e.preventDefault(); goPage(n.dataset.page); }));
}

// ════ RENDER ALL ════
function renderAll() {
  refreshUserUI();
  setGreeting();
  const active = $('.page.active')?.id?.replace('page-','') || 'dashboard';
  renderPageContent(active);
}

// ════ INIT ════
async function init() {
  // Loader
  let p = 0;
  const loaderInt = setInterval(() => {
    p += 12 + Math.random() * 18;
    $('#loaderBar').style.width = Math.min(100, p) + '%';
    if (p >= 100) clearInterval(loaderInt);
  }, 100);

  const loaded = load();
  setTheme(state.theme);
  setAccent(state.accent);
  bindNav();

  // Check onboarding
  setTimeout(() => {
    $('#loader').classList.add('hidden');
    if (!state.onboarded) {
      $('#onboard').classList.remove('hidden');
    } else {
      refreshUserUI();
      renderDashboard();
      // Reminders
      if (state.settings.notifications && 'Notification' in window) checkReminders();
    }
  }, 900);

  // Online/offline
  window.addEventListener('offline', () => toast("Internetdan uzildi · Lokal saqlanmoqda", 'info', 'fa-wifi'));
  window.addEventListener('online', () => toast("Internet qayta ulandi", 'success'));
}

// Daily reminders (very basic)
function checkReminders() {
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 9 && now.getMinutes() === 0) {
      const undone = state.tasks.filter(t => !t.done && t.due === today()).length;
      if (undone && Notification.permission === 'granted') {
        new Notification('Lumio', { body: `Bugun ${undone} ta vazifa bajarilmagan` });
      }
    }
  }, 60000);
}

// Start
document.addEventListener('DOMContentLoaded', init);

// Expose globals (for inline onclick)
window.goPage = goPage;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.openModal = openModal;
window.closeModal = closeModal;
window.openCmd = openCmd;
window.closeCmd = closeCmd;
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
window.setAccent = setAccent;
window.miniCalNav = miniCalNav;
window.toggleItem = toggleItem;
window.setWater = setWater;
window.setTaskView = setTaskView;
window.setTaskFilter = setTaskFilter;
window.toggleTask = toggleTask;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.saveTask = saveTask;
window.setHabitFreq = setHabitFreq;
window.toggleHabit = toggleHabit;
window.editHabit = editHabit;
window.deleteHabit = deleteHabit;
window.saveHabit = saveHabit;
window.renderHeatmap = renderHeatmap;
window.setMood = setMood;
window.selectPreset = selectPreset;
window.enterFocus = enterFocus;
window.exitFocus = exitFocus;
window.toggleFocus = toggleFocus;
window.resetFocus = resetFocus;
window.skipFocus = skipFocus;
window.toggleSound = toggleSound;
window.setGoalType = setGoalType;
window.toggleMilestone = toggleMilestone;
window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
window.saveGoal = saveGoal;
window.editSubject = editSubject;
window.saveSubject = saveSubject;
window.deleteSubject = deleteSubject;
window.saveExam = saveExam;
window.saveFlash = saveFlash;
window.nextFlash = nextFlash;
window.prevFlash = prevFlash;
window.newNote = newNote;
window.selectNote = selectNote;
window.addNoteTag = addNoteTag;
window.removeNoteTag = removeNoteTag;
window.deleteNote = deleteNote;
window.openMiniApp = openMiniApp;
window.calcPress = calcPress;
window.toggleSW = toggleSW;
window.lapSW = lapSW;
window.resetSW = resetSW;
window.stopSW = stopSW;
window.toggleTmr = toggleTmr;
window.resetTmr = resetTmr;
window.stopTmr = stopTmr;
window.toggleWN = toggleWN;
window.stopAllWN = stopAllWN;
window.convChange = convChange;
window.doConvert = doConvert;
window.saveSleep = saveSleep;
window.saveExpense = saveExpense;
window.saveJournal = saveJournal;
window.cmdRun = cmdRun;
window.renderCmd = renderCmd;
window.obNext = obNext;
window.obAccent = obAccent;
window.obFinish = obFinish;
window.updateName = updateName;
window.toggleNotif = toggleNotif;
window.exportAll = exportAll;
window.importFromFile = importFromFile;
window.confirmReset = confirmReset;



// ════════════════════════════════════════
// LUMIO v2.0 EXTENSIONS — Premium features
// ════════════════════════════════════════

// Initialize new state slices
function ensureV2State() {
  if (!state.pet) state.pet = { name: 'Lumi', emoji: '🐱', happy: 80, energy: 80, level: 1, lastFed: today() };
  if (!state.quests) state.quests = { date: '', list: [] };
  if (!state.workouts) state.workouts = [];
  if (!state.workoutLogs) state.workoutLogs = [];
  if (!state.meals) state.meals = [];
  if (!state.books) state.books = [];
  if (!state.medSessions) state.medSessions = [];
  if (!state.history) state.history = []; // for undo
  if (!state.lang) state.lang = 'uz';
  if (!state.settings.autoBackup) state.settings.autoBackup = false;
  if (!state.settings.lastBackup) state.settings.lastBackup = today();
  // expose to window for confetti.js
  window.lumioSettings = state.settings;
}

// ════ HISTORY (UNDO/REDO) ════
function pushHistory(action) {
  state.history = state.history || [];
  state.history.push({ action, time: Date.now(), snapshot: JSON.stringify({
    tasks: state.tasks, habits: state.habits, completions: state.completions,
    notes: state.notes, goals: state.goals
  }) });
  if (state.history.length > 20) state.history.shift();
}
function undo() {
  if (!state.history || !state.history.length) { toast("O'chirish uchun tarix yo'q", 'info'); return; }
  const last = state.history.pop();
  const snap = JSON.parse(last.snapshot);
  Object.assign(state, snap);
  save();
  renderAll();
  toast(`Ortga qaytarildi: ${last.action}`, 'success');
  fx?.play('pop');
}

// ════ DYNAMIC WALLPAPER ════
function setDynamicWallpaper() {
  const h = new Date().getHours();
  let time = 'morning';
  if (h < 6) time = 'night';
  else if (h < 9) time = 'dawn';
  else if (h < 12) time = 'morning';
  else if (h < 15) time = 'noon';
  else if (h < 18) time = 'afternoon';
  else if (h < 21) time = 'evening';
  else time = 'night';
  $('#dashHero')?.setAttribute('data-time', time);
}

// ════ PRODUCTIVITY PET ════
const PET_STAGES = [
  { min: 0, emoji: '🥚', name: 'Tuxum' },
  { min: 1, emoji: '🐣', name: 'Yangi tug\'ilgan' },
  { min: 3, emoji: '🐥', name: 'Jo\'ja' },
  { min: 5, emoji: '🐱', name: 'Mushukcha' },
  { min: 10, emoji: '🦊', name: 'Tulkicha' },
  { min: 20, emoji: '🐯', name: 'Yo\'lbars' },
  { min: 30, emoji: '🦁', name: 'Sher' },
  { min: 50, emoji: '🐉', name: 'Ajdarho' },
];
function getPetStage() {
  const lvl = state.user.level;
  let stage = PET_STAGES[0];
  PET_STAGES.forEach(s => { if (lvl >= s.min) stage = s; });
  return stage;
}
function updatePetStats() {
  ensureV2State();
  // Decay over time
  const last = new Date(state.pet.lastFed || today());
  const days = Math.max(0, Math.floor((Date.now() - last.getTime()) / 86400000));
  if (days > 0) {
    state.pet.happy = Math.max(0, state.pet.happy - days * 15);
    state.pet.energy = Math.max(0, state.pet.energy - days * 15);
  }
  // Boost from today's activity
  const todaysTasks = state.tasks.filter(t => t.done && t.completedAt === today()).length;
  const todaysHabits = state.habits.filter(h => isHabitDone(h.id)).length;
  state.pet.happy = Math.min(100, state.pet.happy + todaysHabits * 5);
  state.pet.energy = Math.min(100, state.pet.energy + todaysTasks * 4);
  state.pet.lastFed = today();
}
function renderPet() {
  ensureV2State();
  updatePetStats();
  const stage = getPetStage();
  state.pet.emoji = stage.emoji;
  $('#petEmoji').textContent = stage.emoji;
  $('#petName').textContent = state.pet.name;
  const status = state.pet.happy > 70 ? "Juda baxtli! 😊" : state.pet.happy > 40 ? "Yaxshi 🙂" : state.pet.happy > 20 ? "Biroz xafa 😟" : "Xafa, parvarish kerak 😢";
  $('#petStatus').textContent = `${stage.name} · ${status}`;
  $('#petHappyBar').style.width = state.pet.happy + '%';
  $('#petEnergyBar').style.width = state.pet.energy + '%';
  $('#petWidget')?.classList.toggle('happy', state.pet.happy > 80);
  save();
}
function openPetModal() {
  ensureV2State();
  const stage = getPetStage();
  const c = $('#modalContent');
  c.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">Sizning ${stage.name}ingiz</div>
      <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="pet-modal-content">
      <div class="pet-modal-emoji">${stage.emoji}</div>
      <div class="form-group" style="text-align:left">
        <label class="form-label">Ism</label>
        <input class="input" id="petNameInput" value="${escape(state.pet.name)}" oninput="state.pet.name=this.value;save();renderPet()"/>
      </div>
      <div class="pet-bars" style="text-align:left;margin-top:1rem">
        <div class="pet-bar happy"><span>😊 Baxt</span><div class="pet-bar-track"><div class="pet-bar-fill" style="width:${state.pet.happy}%"></div></div><span>${state.pet.happy}%</span></div>
        <div class="pet-bar energy"><span>⚡ Energiya</span><div class="pet-bar-track"><div class="pet-bar-fill" style="width:${state.pet.energy}%"></div></div><span>${state.pet.energy}%</span></div>
      </div>
      <p class="muted mt-2" style="font-size:.85rem;line-height:1.6">Vazifalarni bajaring va odatlaringizni saqlang — ${state.pet.name} sizdan kuch oladi va o'sib boradi! Har 1, 3, 5, 10, 20, 30, 50 darajada yangi shaklga aylanadi.</p>
      <div class="pet-evolution">
        ${PET_STAGES.map(s => `<span class="pet-stage ${s.min === stage.min?'current':''}">${s.emoji} L${s.min}</span>`).join('')}
      </div>
      <button class="btn btn-primary mt-2" style="width:100%;justify-content:center" onclick="petPet()">
        <i class="fa-solid fa-hand"></i> Erkalash (+5 baxt)
      </button>
    </div>
  `;
  $('#modalOverlay').classList.add('open');
}
function petPet() {
  state.pet.happy = Math.min(100, state.pet.happy + 5);
  save();
  renderPet();
  fx?.play('pop');
  fx?.haptic(20);
  toast(`${state.pet.name} xursand! +5 baxt`, 'success');
}



// ════ DAILY QUESTS ════
const QUEST_POOL = [
  { id:'q_3tasks', icon:'✅', name:'3 ta vazifa bajaring', goal:3, type:'task', xp:30 },
  { id:'q_5tasks', icon:'✅', name:'5 ta vazifa bajaring', goal:5, type:'task', xp:50 },
  { id:'q_2habits', icon:'⚡', name:'2 ta odat bajaring', goal:2, type:'habit', xp:25 },
  { id:'q_allhabits', icon:'🌟', name:"Bugun barcha odatlarni bajaring", goal:1, type:'all_habits', xp:60 },
  { id:'q_focus25', icon:'⏱', name:'25 daqiqa fokuslaning', goal:25, type:'focus', xp:30 },
  { id:'q_focus60', icon:'🎯', name:'1 soat fokus', goal:60, type:'focus', xp:60 },
  { id:'q_water', icon:'💧', name:'8 stakan suv iching', goal:8, type:'water', xp:25 },
  { id:'q_note', icon:'📝', name:'Bir qayd yozing', goal:1, type:'note', xp:15 },
  { id:'q_mood', icon:'😊', name:'Kayfiyatingizni belgilang', goal:1, type:'mood', xp:10 },
  { id:'q_meditate', icon:'🧘', name:'5 daqiqa meditatsiya', goal:5, type:'meditate', xp:25 },
];
function ensureDailyQuests() {
  ensureV2State();
  if (state.quests.date !== today()) {
    // Generate 3 random quests
    const pool = [...QUEST_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
    state.quests = { date: today(), list: pool.map(q => ({ ...q, progress: 0, done: false })) };
    save();
  }
}
function evalQuests() {
  ensureDailyQuests();
  const tasksDone = state.tasks.filter(t => t.done && t.completedAt === today()).length;
  const habitsDone = state.habits.filter(h => isHabitDone(h.id)).length;
  const focusToday = state.focusSessions.filter(s => s.date === today()).reduce((a,s)=>a+s.minutes,0);
  const water = state.water[today()] || 0;
  const noteToday = state.notes.some(n => n.updatedAt === today());
  const moodToday = !!state.moods[today()];
  const medToday = (state.medSessions||[]).filter(s => s.date === today()).reduce((a,s)=>a+s.minutes,0);
  state.quests.list.forEach(q => {
    let p = 0;
    if (q.type === 'task') p = tasksDone;
    else if (q.type === 'habit') p = habitsDone;
    else if (q.type === 'all_habits') p = (state.habits.length && habitsDone === state.habits.length) ? 1 : 0;
    else if (q.type === 'focus') p = focusToday;
    else if (q.type === 'water') p = water;
    else if (q.type === 'note') p = noteToday ? 1 : 0;
    else if (q.type === 'mood') p = moodToday ? 1 : 0;
    else if (q.type === 'meditate') p = medToday;
    q.progress = Math.min(q.goal, p);
    if (!q.done && q.progress >= q.goal) {
      q.done = true;
      addXp(q.xp, `Kvest: ${q.name}`);
      window.confetti?.fire({ x: window.innerWidth - 100, y: 100, count: 40 });
      fx?.play('achievement');
    }
  });
  save();
}
function renderQuests() {
  ensureDailyQuests();
  evalQuests();
  const list = $('#questsList'); if (!list) return;
  const done = state.quests.list.filter(q => q.done).length;
  $('#questsCount').textContent = `${done}/${state.quests.list.length}`;
  list.innerHTML = state.quests.list.map(q => `
    <div class="quest ${q.done?'done':''}">
      <div class="quest-icon">${q.icon}</div>
      <div class="quest-info">
        <div class="quest-name">${q.name}</div>
        <div class="quest-progress">${q.progress}/${q.goal}</div>
      </div>
      <div class="quest-xp">+${q.xp} XP</div>
    </div>
  `).join('');
}

// ════ VOICE INPUT ════
let voiceRecognition = null;
function toggleVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast("Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi", 'error'); return; }
  const btn = $('#voiceBtn');
  if (voiceRecognition) {
    voiceRecognition.stop();
    voiceRecognition = null;
    btn?.classList.remove('listening');
    return;
  }
  voiceRecognition = new SR();
  voiceRecognition.lang = state.lang === 'en' ? 'en-US' : state.lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = false;
  btn?.classList.add('listening');
  fx?.play('pop');
  voiceRecognition.onresult = e => {
    const text = e.results[0][0].transcript;
    if (text.trim()) {
      state.tasks.push({ id: uid(), name: text, done: false, priority: 4, due: today(), category: 'Ovozli', subtasks: [], createdAt: today() });
      save();
      renderTasks();
      toast(`Vazifa qo'shildi: "${text}"`, 'success');
      fx?.play('complete');
      fx?.haptic([20, 30, 20]);
    }
  };
  voiceRecognition.onerror = e => { toast("Ovoz tanilmadi: " + e.error, 'error'); btn?.classList.remove('listening'); voiceRecognition = null; };
  voiceRecognition.onend = () => { btn?.classList.remove('listening'); voiceRecognition = null; };
  voiceRecognition.start();
}



// ════ TEMPLATES ════
const HABIT_TEMPLATES = [
  { icon:'💧', name:'Suv ichish', desc:'Kuniga 8 stakan', color:'#0284c7', target:8, frequency:'daily', category:'Sog\'liq', diff:1 },
  { icon:'📚', name:'30 daqiqa o\'qish', desc:'Har kuni o\'qish odati', color:'#7c3aed', target:1, frequency:'daily', category:'O\'qish', diff:2 },
  { icon:'🏃', name:'Ertalabki yugurish', desc:'30 daqiqa yugurish', color:'#ea580c', target:1, frequency:'daily', category:'Sport', diff:3 },
  { icon:'🧘', name:'Meditatsiya', desc:'10 daqiqa tinchlik', color:'#059669', target:1, frequency:'daily', category:'Mindfulness', diff:2 },
  { icon:'💪', name:'Push-up', desc:'Kuniga 50 ta', color:'#e11d48', target:50, frequency:'daily', category:'Sport', diff:2 },
  { icon:'😴', name:'7 soat uyqu', desc:'Sog\'lom uyqu', color:'#1a1a1a', target:1, frequency:'daily', category:'Sog\'liq', diff:2 },
  { icon:'☕', name:'Kofeini cheklash', desc:'Kuniga 1 piyola', color:'#92400e', target:1, frequency:'daily', category:'Sog\'liq', diff:2 },
  { icon:'✍', name:'Kundalik yozish', desc:'Bir kun fikr', color:'#0891b2', target:1, frequency:'daily', category:'Mindfulness', diff:1 },
  { icon:'🌱', name:'Yangi til', desc:'15 daqiqa o\'rganish', color:'#16a34a', target:15, frequency:'daily', category:'O\'qish', diff:2 },
  { icon:'📵', name:'Telefonsiz vaqt', desc:'1 soat off', color:'#7c2d12', target:1, frequency:'daily', category:'Mindfulness', diff:3 },
  { icon:'🚶', name:'10,000 qadam', desc:'Yurish odati', color:'#06b6d4', target:10000, frequency:'daily', category:'Sport', diff:2 },
  { icon:'🍎', name:'Sog\'lom ovqat', desc:'Sabzavot va meva', color:'#22c55e', target:1, frequency:'daily', category:'Ovqat', diff:1 },
];
const GOAL_TEMPLATES = [
  { icon:'📖', name:"Kitob o'qish", desc:'Yiliga 12 ta kitob', type:'long', milestones:['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'] },
  { icon:'🎓', name:'Yangi til', desc:'Asosiy bilim olish', type:'long', milestones:['100 so\'z','500 so\'z','Asosiy grammatika','Oddiy suhbat','Erkin suhbat'] },
  { icon:'💪', name:'Sportcha tana', desc:'6 oy ichida', type:'long', milestones:['Haftada 3 marta sport','Sog\'lom ovqatlanish','7-8 soat uyqu','5 kg pasaytirish','Maqsadli tana'] },
  { icon:'💼', name:'Yangi kasb', desc:'Karyera o\'zgarishi', type:'long', milestones:['Tadqiqot','Kurs tanlash','3 oylik o\'rganish','Portfolio','Birinchi ish'] },
  { icon:'💰', name:'Jamg\'arma', desc:"5,000,000 so'm", type:'long', milestones:['1,000,000','2,000,000','3,000,000','4,000,000','5,000,000'] },
  { icon:'🧘', name:'Mindfulness', desc:'Hamma joyda hozir bo\'lish', type:'long', milestones:['Kunlik meditatsiya','7 kunlik streak','30 kunlik streak','Refleksiya','Tinchlik'] },
];
function openTemplates(type) {
  const c = $('#modalContent');
  const tpls = type === 'habit' ? HABIT_TEMPLATES : GOAL_TEMPLATES;
  const title = type === 'habit' ? "Odat shablonlari" : "SMART maqsad shablonlari";
  c.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">${title}</div>
      <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <p class="muted mb-2">Tanlang va birini bosing</p>
    <div class="tpl-grid">
      ${tpls.map((t, i) => `
        <button class="tpl-card" onclick="useTemplate('${type}',${i})">
          <div class="tpl-icon">${t.icon}</div>
          <div class="tpl-name">${t.name}</div>
          <div class="tpl-desc">${t.desc}</div>
        </button>
      `).join('')}
    </div>
  `;
  $('#modalOverlay').classList.add('open');
}
function useTemplate(type, idx) {
  if (type === 'habit') {
    const t = HABIT_TEMPLATES[idx];
    state.habits.push({ id: uid(), name: t.name, icon: t.icon, color: t.color, frequency: t.frequency, target: t.target, category: t.category, diff: t.diff, createdAt: today() });
    if (state.habits.length === 1) unlockAch('first_habit');
    save();
    closeModal();
    renderHabits();
    toast(`Odat qo'shildi: ${t.name}`, 'success');
    fx?.play('complete');
    window.confetti?.fire({ count: 30 });
  } else {
    const t = GOAL_TEMPLATES[idx];
    state.goals.push({
      id: uid(), name: t.name, desc: t.desc, type: t.type, icon: t.icon,
      progress: 0, deadline: '',
      milestones: t.milestones.map(m => ({ id: uid(), name: m, done: false })),
      createdAt: today()
    });
    if (state.goals.length === 1) unlockAch('goal_1');
    save();
    closeModal();
    renderGoals();
    toast(`Maqsad qo'shildi: ${t.name}`, 'success');
    fx?.play('complete');
  }
}

// ════ MULTI-LANGUAGE ════
const I18N = {
  uz: { dashboard:'Bosh sahifa', tasks:'Vazifalar', habits:'Odatlar', focus:'Fokus rejim', study:"O'qish", goals:'Maqsadlar', notes:'Qaydlar', settings:'Sozlamalar', save:'Saqlash', cancel:'Bekor', today:'Bugun', save_btn:'Saqlash', new_task:'Yangi vazifa' },
  en: { dashboard:'Dashboard', tasks:'Tasks', habits:'Habits', focus:'Focus mode', study:'Study', goals:'Goals', notes:'Notes', settings:'Settings', save:'Save', cancel:'Cancel', today:'Today', save_btn:'Save', new_task:'New task' },
  ru: { dashboard:'Главная', tasks:'Задачи', habits:'Привычки', focus:'Фокус', study:'Учеба', goals:'Цели', notes:'Заметки', settings:'Настройки', save:'Сохранить', cancel:'Отмена', today:'Сегодня', save_btn:'Сохранить', new_task:'Новая задача' },
};
function setLang(lang) {
  state.lang = lang;
  save();
  document.documentElement.setAttribute('lang', lang);
  // Update nav labels (best-effort)
  const navMap = {
    dashboard:'home', tasks:'circle-check', habits:'bolt', focus:'circle-dot',
    study:'graduation-cap', goals:'bullseye', notes:'note-sticky', settings:'gear'
  };
  $$('.nav-item').forEach(n => {
    const p = n.dataset.page;
    if (I18N[lang][p]) {
      const span = n.querySelector('span');
      if (span) span.textContent = I18N[lang][p];
    }
  });
  toast(lang === 'uz' ? 'Til o\'zgartirildi' : lang === 'en' ? 'Language changed' : 'Язык изменен', 'success');
}



// ════ FULL CALENDAR ════
let calCurMonth = null, calCurYear = null;
function calNav(d) {
  if (calCurMonth === null) { const n = new Date(); calCurMonth = n.getMonth(); calCurYear = n.getFullYear(); }
  if (d === 0) { const n = new Date(); calCurMonth = n.getMonth(); calCurYear = n.getFullYear(); }
  else { calCurMonth += d; if (calCurMonth > 11) { calCurMonth = 0; calCurYear++; } if (calCurMonth < 0) { calCurMonth = 11; calCurYear--; } }
  renderFullCalendar();
}
function renderFullCalendar() {
  if (calCurMonth === null) { const n = new Date(); calCurMonth = n.getMonth(); calCurYear = n.getFullYear(); }
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  $('#calTitle').textContent = `${months[calCurMonth]} ${calCurYear}`;
  const first = new Date(calCurYear, calCurMonth, 1);
  const last = new Date(calCurYear, calCurMonth + 1, 0);
  let dow = first.getDay() - 1; if (dow < 0) dow = 6;
  let html = '';
  // Padding
  for (let i = 0; i < dow; i++) {
    const d = new Date(calCurYear, calCurMonth, -dow + i + 1);
    html += `<div class="cal-day outside"><div class="cal-day-num">${d.getDate()}</div></div>`;
  }
  // Days
  for (let d = 1; d <= last.getDate(); d++) {
    const ds = `${calCurYear}-${String(calCurMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = ds === today();
    const events = [];
    state.tasks.filter(t => t.due === ds && !t.done).forEach(t => events.push({ type:'task', name:t.name }));
    state.exams.filter(e => e.date === ds).forEach(e => events.push({ type:'exam', name:'📚 '+e.name }));
    if (state.completions[ds] && Object.keys(state.completions[ds]).length) events.push({ type:'habit', name: `${Object.keys(state.completions[ds]).length} odat ✓` });
    html += `<div class="cal-day ${isToday?'today':''}" onclick="calCellClick('${ds}')">
      <div class="cal-day-num">${d}</div>
      ${events.slice(0,3).map(e => `<div class="cal-event ${e.type}">${escape(e.name).slice(0,18)}</div>`).join('')}
      ${events.length > 3 ? `<div class="cal-event">+${events.length-3}</div>` : ''}
    </div>`;
  }
  // Trailing
  const total = dow + last.getDate();
  const rem = (7 - (total % 7)) % 7;
  for (let i = 1; i <= rem; i++) {
    html += `<div class="cal-day outside"><div class="cal-day-num">${i}</div></div>`;
  }
  $('#calGrid').innerHTML = html;
}
function calCellClick(ds) { 
  // Open task modal with that date prefilled
  openModal('task');
  setTimeout(() => { const di = document.querySelector('input[name="due"]'); if (di) di.value = ds; }, 50);
}

// ════ WORKOUT ════
function renderWorkouts() {
  ensureV2State();
  const grid = $('#workoutGrid');
  if (!state.workouts.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">💪</div><h3>Mashqlar yo'q</h3><p>Birinchi mashq qo'shing</p></div>`;
  } else {
    grid.innerHTML = state.workouts.map(w => `
      <div class="workout-card">
        <div class="workout-name">${escape(w.name)}</div>
        <div class="workout-meta">${escape(w.type||'Mashq')} · ${(w.exercises||[]).length} ta mashq</div>
        ${(w.exercises||[]).map(e => `<div class="exercise-row">
          <div class="exercise-name">${escape(e.name)}</div>
          <div class="exercise-sets">${e.sets} × ${e.reps}</div>
        </div>`).join('')}
        <div style="display:flex;gap:6px;margin-top:1rem">
          <button class="btn btn-primary" style="flex:1" onclick="logWorkout('${w.id}')"><i class="fa-solid fa-check"></i> Bajarildi</button>
          <button class="btn btn-secondary" onclick="deleteWorkout('${w.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  }
  // Stats
  const week = new Date(); week.setDate(week.getDate() - 7);
  const weekLogs = state.workoutLogs.filter(l => new Date(l.date) >= week);
  $('#wkSessions').textContent = weekLogs.length;
  $('#wkMinutes').textContent = weekLogs.reduce((a,l)=>a+(l.minutes||30),0) + 'm';
  $('#wkTotal').textContent = state.workoutLogs.length;
  $('#wkStreak').textContent = workoutStreak();
}
function workoutStreak() {
  let s = 0, d = new Date();
  while (true) {
    const ds = dstr(d);
    if (state.workoutLogs.some(l => l.date === ds)) { s++; d.setDate(d.getDate() - 1); }
    else break;
    if (s > 365) break;
  }
  return s;
}
function logWorkout(id) {
  const w = state.workouts.find(x => x.id === id); if (!w) return;
  state.workoutLogs.push({ id: uid(), workoutId: id, date: today(), minutes: 30 });
  save(); renderWorkouts();
  addXp(20, `Mashq: ${w.name}`);
  toast('Mashq belgilandi! 💪', 'success');
  fx?.play('complete');
  fx?.haptic(50);
  window.confetti?.fire({ count: 40 });
}
function deleteWorkout(id) {
  if (!confirm("O'chirilsinmi?")) return;
  state.workouts = state.workouts.filter(x => x.id !== id);
  save(); renderWorkouts();
}

// ════ MEALS ════
function renderMeals() {
  ensureV2State();
  const todayMeals = state.meals.filter(m => m.date === today());
  $('#mealCal').textContent = todayMeals.reduce((a,m) => a+(m.calories||0), 0);
  $('#mealProt').textContent = todayMeals.reduce((a,m) => a+(m.protein||0), 0) + 'g';
  $('#mealCarb').textContent = todayMeals.reduce((a,m) => a+(m.carbs||0), 0) + 'g';
  $('#mealFat').textContent = todayMeals.reduce((a,m) => a+(m.fat||0), 0) + 'g';
  const list = $('#mealList');
  if (!todayMeals.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🍽</div><h3>Bugun ovqat yo'q</h3><p>Bugungi ovqatingizni qo'shing</p></div>`;
  } else {
    list.innerHTML = todayMeals.map(m => `
      <div class="meal-item">
        <div class="meal-icon">${m.icon || '🍴'}</div>
        <div class="meal-info">
          <div class="meal-name">${escape(m.name)}</div>
          <div class="meal-time">${m.time || ''} · ${m.type || ''}</div>
        </div>
        <div class="meal-cal">${m.calories || 0} kcal</div>
        <button class="icon-btn" onclick="deleteMeal('${m.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');
  }
}
function deleteMeal(id) { state.meals = state.meals.filter(x => x.id !== id); save(); renderMeals(); }

// ════ READING ════
let bookFilter = 'all';
function setBookFilter(f) { bookFilter = f; $$('.tab[data-bfilter]').forEach(t => t.classList.toggle('active', t.dataset.bfilter === f)); renderReading(); }
function renderReading() {
  ensureV2State();
  const grid = $('#bookGrid');
  let list = [...state.books];
  if (bookFilter !== 'all') list = list.filter(b => b.status === bookFilter);
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📚</div><h3>Kitoblar yo'q</h3><p>Birinchi kitobni qo'shing</p></div>`;
    return;
  }
  grid.innerHTML = list.map(b => {
    const pct = b.pages ? Math.round(((b.read||0)/b.pages)*100) : 0;
    return `<div class="book-card">
      <span class="book-status ${b.status}">${b.status === 'reading' ? "O'qiyapman" : b.status === 'done' ? 'Tugatildi' : 'Navbatda'}</span>
      <div class="book-cover">${escape((b.title||'?')[0])}</div>
      <div class="book-title">${escape(b.title)}</div>
      <div class="book-author">${escape(b.author||'Noma\'lum')}</div>
      <div class="book-progress">
        <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
        <span>${b.read||0}/${b.pages||0}</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:.8rem">
        <button class="btn btn-secondary" style="flex:1" onclick="editBook('${b.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-secondary" onclick="deleteBook('${b.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}
function editBook(id) { openModal('book', state.books.find(x => x.id === id)); }
function deleteBook(id) { if (!confirm("O'chirilsinmi?")) return; state.books = state.books.filter(x => x.id !== id); save(); renderReading(); }



// ════ MEDITATION (BREATHING) ════
const BREATH_PATTERNS = {
  '478': { name: '4-7-8', steps: [{label:'Nafas oling',sec:4,cls:'inhale'},{label:'Ushlang',sec:7,cls:'hold'},{label:'Chiqaring',sec:8,cls:'exhale'}] },
  'box': { name: 'Box', steps: [{label:'Nafas oling',sec:4,cls:'inhale'},{label:'Ushlang',sec:4,cls:'hold'},{label:'Chiqaring',sec:4,cls:'exhale'},{label:'Ushlang',sec:4,cls:'hold'}] },
  'deep': { name: 'Chuqur', steps: [{label:'Nafas oling',sec:5,cls:'inhale'},{label:'Chiqaring',sec:5,cls:'exhale'}] }
};
let breathInterval = null, breathStart = 0, breathCycle = 0, breathPattern = '478', breathStepIdx = 0, breathStepRemain = 0;
function setBreathPattern() { breathPattern = $('#breathPattern').value; resetBreath(); }
function toggleBreath() {
  if (breathInterval) { clearInterval(breathInterval); breathInterval = null; $('#medBtn').innerHTML = '<i class="fa-solid fa-play"></i> Davom'; return; }
  if (!breathStart) breathStart = Date.now();
  $('#medBtn').innerHTML = '<i class="fa-solid fa-pause"></i> Pauza';
  const pattern = BREATH_PATTERNS[breathPattern];
  if (breathStepRemain <= 0) { breathStepIdx = 0; breathStepRemain = pattern.steps[0].sec; }
  applyBreathStep();
  breathInterval = setInterval(() => {
    breathStepRemain--;
    if (breathStepRemain <= 0) {
      breathStepIdx = (breathStepIdx + 1) % pattern.steps.length;
      if (breathStepIdx === 0) breathCycle++;
      breathStepRemain = pattern.steps[breathStepIdx].sec;
      applyBreathStep();
      fx?.play('tick');
    }
    const elapsed = Math.floor((Date.now() - breathStart) / 1000);
    $('#medCycle').textContent = breathCycle;
    $('#medMinutes').textContent = `${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;
  }, 1000);
}
function applyBreathStep() {
  const step = BREATH_PATTERNS[breathPattern].steps[breathStepIdx];
  const orb = $('#breathOrb');
  if (orb) {
    orb.classList.remove('inhale','hold','exhale');
    orb.classList.add(step.cls);
    orb.textContent = step.label;
  }
}
function resetBreath() {
  if (breathInterval) { clearInterval(breathInterval); breathInterval = null; }
  // Save session if was active
  if (breathStart) {
    const elapsed = Math.floor((Date.now() - breathStart) / 60000);
    if (elapsed > 0) {
      state.medSessions = state.medSessions || [];
      state.medSessions.push({ date: today(), minutes: elapsed, pattern: breathPattern });
      save();
      const total = state.medSessions.reduce((a,s)=>a+s.minutes,0);
      $('#medTotal').textContent = total + 'm';
      addXp(elapsed * 2, 'Meditatsiya');
    }
  }
  breathStart = 0; breathCycle = 0; breathStepIdx = 0; breathStepRemain = 0;
  $('#medCycle').textContent = '0';
  $('#medMinutes').textContent = '0:00';
  $('#medBtn').innerHTML = '<i class="fa-solid fa-play"></i> Boshlash';
  const orb = $('#breathOrb');
  if (orb) { orb.classList.remove('inhale','hold','exhale'); orb.textContent = 'Nafas oling'; }
  const total = (state.medSessions || []).reduce((a,s)=>a+s.minutes,0);
  $('#medTotal').textContent = total + 'm';
}

// ════ AI INSIGHTS (rule-based) ════
function generateInsights() {
  ensureV2State();
  const insights = [];
  const td = today();
  const week = new Date(); week.setDate(week.getDate() - 7);

  // Productivity score
  const habitDone = state.habits.filter(h => isHabitDone(h.id)).length;
  const habitTotal = state.habits.length;
  const tasksDone = state.tasks.filter(t => t.done && t.completedAt === td).length;
  const focusToday = state.focusSessions.filter(s => s.date === td).reduce((a,s)=>a+s.minutes,0);

  // Burnout detection
  const last7Focus = state.focusSessions.filter(s => new Date(s.date) >= week).reduce((a,s)=>a+s.minutes,0);
  if (last7Focus > 600) {
    insights.push({ icon:'🔥', title:'Charchashga yaqinmisiz?', text:`Oxirgi 7 kunda ${Math.floor(last7Focus/60)} soatdan ko'p fokusladingiz. Tana va miyaga dam berish kerak — bugun 30 daqiqa pauza qiling.` });
  } else if (last7Focus < 60 && state.tasks.length > 5) {
    insights.push({ icon:'💪', title:'Vaqt — eng qimmatli', text:`Oxirgi 7 kunda atigi ${last7Focus} daqiqa fokusladingiz. Bugun 25 daqiqalik Pomodoro sessiyasini sinab ko'ring!` });
  }

  // Habit consistency
  if (habitTotal > 0 && habitDone === habitTotal) {
    insights.push({ icon:'⭐', title:'Mukammal kun!', text:'Bugun barcha odatlaringizni bajardingiz. Bu ajoyib! Bunday holatni kechqurun ham eslab, o\'zingizni mukofotlang.' });
  } else if (habitTotal > 0 && habitDone === 0) {
    insights.push({ icon:'⚠️', title:'Hech qanday odat yo\'q', text:`${habitTotal} ta odat bor, lekin bugun hali bittasi ham bajarilmagan. Bittadan boshlang — eng osonidan!` });
  }

  // Best streak
  const longestStreak = Math.max(0, ...state.habits.map(h => calcLongest(h.id)));
  if (longestStreak >= 30) {
    insights.push({ icon:'🏆', title:`${longestStreak} kunlik streak!`, text:'Sizning eng yaxshi seriyangiz haqiqatan ham ajoyib. Bu intizom yuqori darajada — davom eting!' });
  }

  // Mood trend
  const moods = Object.entries(state.moods).slice(-7);
  if (moods.length >= 3) {
    const avg = moods.reduce((a,[,v]) => a+v, 0) / moods.length;
    if (avg < 2.5) {
      insights.push({ icon:'💙', title:'Kayfiyat past', text:'Oxirgi kunlarda kayfiyatingiz past. Sport, do\'stlar bilan vaqt o\'tkazish va yaxshi uyqu yordam berishi mumkin.' });
    } else if (avg > 4) {
      insights.push({ icon:'😊', title:'Ajoyib hafta!', text:'Sizning kayfiyatingiz ko\'tarinki. Bu odatlaringiz va vazifalaringizni ko\'paytirish uchun eng yaxshi vaqt!' });
    }
  }

  // Smart suggestions
  const undoneTasks = state.tasks.filter(t => !t.done && t.due && t.due < td);
  if (undoneTasks.length >= 3) {
    insights.push({ icon:'📋', title:'O\'tib ketgan vazifalar', text:`Sizda ${undoneTasks.length} ta o\'tgan vazifa bor. Ularni qayta rejalashtiring yoki o\'chiring.` });
  }

  // Water
  const water = state.water[td] || 0;
  if (water < 4 && new Date().getHours() > 12) {
    insights.push({ icon:'💧', title:'Suv ichish', text:`Bugun atigi ${water} stakan suv ichdingiz. Sog\'lom miya uchun yana ${8 - water} stakan kerak.` });
  }

  // Productive time pattern
  const focusByHour = {};
  state.focusSessions.forEach(s => {
    if (!s.hour) return;
    focusByHour[s.hour] = (focusByHour[s.hour] || 0) + s.minutes;
  });
  const bestHour = Object.entries(focusByHour).sort((a,b) => b[1] - a[1])[0];
  if (bestHour && bestHour[1] > 30) {
    insights.push({ icon:'⏰', title:'Eng samarali vaqt', text:`Sizning eng samarali vaqtingiz — soat ${bestHour[0]}. Muhim ishlarni shu vaqtga rejalashtiring.` });
  }

  // Weekly review
  const weekTasks = state.tasks.filter(t => t.completedAt && new Date(t.completedAt) >= week).length;
  insights.push({ icon:'📊', title:'Haftalik xulosa', text:`Oxirgi 7 kunda: ${weekTasks} vazifa bajarildi · ${Math.floor(last7Focus/60)} soat fokus · ${moods.length} kayfiyat yozuvi · XP: ${state.user.xp}` });

  // Default if no insights
  if (insights.length === 0) {
    insights.push({ icon:'✨', title:'Boshlang!', text:'Lumio sizning faolligingiz haqida ma\'lumotlar to\'plagandan keyin shaxsiy maslahatlar beradi.' });
  }

  return insights;
}
function renderInsights() {
  const list = $('#insightsList');
  const insights = generateInsights();
  list.innerHTML = insights.map(i => `
    <div class="insight-card">
      <div class="insight-icon">${i.icon}</div>
      <div class="insight-body">
        <div class="insight-title">${i.title}</div>
        <div class="insight-text">${i.text}</div>
      </div>
    </div>
  `).join('');
}

// ════ ADVANCED ANALYTICS ════
let analyticsCharts = {};
function destroyAnalyticsCharts() {
  Object.keys(analyticsCharts).forEach(k => {
    try { analyticsCharts[k]?.destroy(); } catch(e) {}
    delete analyticsCharts[k];
  });
}
function renderAdvancedAnalytics() {
  // Always destroy previous charts first to prevent memory leaks & flicker
  destroyAnalyticsCharts();

  const week = new Date(); week.setDate(week.getDate() - 7);
  const weekTasks = state.tasks.filter(t => t.completedAt && new Date(t.completedAt) >= week).length;
  const weekFocus = state.focusSessions.filter(s => new Date(s.date) >= week).reduce((a,s)=>a+s.minutes,0);
  
  // Weekly trend - 7 days
  const labels = [], taskData = [], focusData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dstr(d);
    labels.push(['Du','Se','Ch','Pa','Ju','Sh','Ya'][(d.getDay() + 6) % 7]);
    taskData.push(state.tasks.filter(t => t.completedAt === ds).length);
    focusData.push(state.focusSessions.filter(s => s.date === ds).reduce((a,s)=>a+s.minutes,0));
  }
  $('#anWeekTasks').textContent = weekTasks;
  $('#anWeekFocus').textContent = weekFocus + 'm';

  // Average score (productivity score over last 7 days - approximate)
  const totalH = state.habits.length;
  let scoreSum = 0, days = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dstr(d);
    const hd = totalH ? state.habits.filter(h => getCmp(h.id, ds) >= h.target).length / totalH : 0;
    const tdone = state.tasks.filter(t => t.completedAt === ds).length;
    const f = state.focusSessions.filter(s => s.date === ds).reduce((a,s)=>a+s.minutes,0);
    scoreSum += Math.round(hd * 50 + Math.min(30, tdone * 10) + Math.min(20, f / 6));
    days++;
  }
  $('#anAvgScore').textContent = days ? Math.round(scoreSum / days) : 0;
  $('#anBestDay').textContent = labels[focusData.indexOf(Math.max(...focusData))] || '—';

  // Charts (deferred to next frame so canvas has correct size after page becomes visible)
  if (typeof Chart === 'undefined') return;
  requestAnimationFrame(() => {
    try { renderAnalyticsCharts(weekTasks, weekFocus); } catch(e) { console.warn('analytics charts:', e); }
  });
}

function renderAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#a0a0a0' : '#6b6b6b';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1a1a1a';

  // Build week data
  const labels = [], taskData = [], focusData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dstr(d);
    labels.push(['Du','Se','Ch','Pa','Ju','Sh','Ya'][(d.getDay() + 6) % 7]);
    taskData.push(state.tasks.filter(t => t.completedAt === ds).length);
    focusData.push(state.focusSessions.filter(s => s.date === ds).reduce((a,s)=>a+s.minutes,0));
  }

  // Week chart
  const ctx1 = $('#anWeekChart');
  if (ctx1) {
    try { analyticsCharts.week?.destroy(); } catch(e) {}
    analyticsCharts.week = new Chart(ctx1, {
      type: 'bar',
      data: { labels, datasets: [
        { label: 'Vazifalar', data: taskData, backgroundColor: accent, borderRadius: 6 },
        { label: 'Fokus (daq)', data: focusData, backgroundColor: '#ff8a00', borderRadius: 6 },
      ]},
      options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 3,
        animation: { duration: 400 },
        plugins: { legend: { labels: { color: textColor }}},
        scales: { y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor }}, x: { ticks: { color: textColor }, grid: { display: false }}}
      }
    });
  }

  // Focus chart - last 14 days
  const fLabels = [], fData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    fLabels.push(d.getDate().toString());
    fData.push(state.focusSessions.filter(s => s.date === dstr(d)).reduce((a,s)=>a+s.minutes,0));
  }
  const ctx2 = $('#anFocusChart');
  if (ctx2) {
    try { analyticsCharts.focus?.destroy(); } catch(e) {}
    analyticsCharts.focus = new Chart(ctx2, {
      type: 'line',
      data: { labels: fLabels, datasets: [{ label: 'Daqiqa', data: fData, borderColor: accent, backgroundColor: accent + '33', fill: true, tension: 0.4, pointRadius: 3 }]},
      options: { responsive: true, maintainAspectRatio: true, aspectRatio: 2.4, animation: { duration: 400 }, plugins: { legend: { display: false }}, scales: { y: { ticks: { color: textColor }, grid: { color: gridColor }}, x: { ticks: { color: textColor }, grid: { display: false }}}}
    });
  }

  // Mood chart
  const mLabels = [], mData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    mLabels.push(d.getDate().toString());
    mData.push(state.moods[dstr(d)] || null);
  }
  const ctx3 = $('#anMoodChart');
  if (ctx3) {
    try { analyticsCharts.mood?.destroy(); } catch(e) {}
    analyticsCharts.mood = new Chart(ctx3, {
      type: 'line',
      data: { labels: mLabels, datasets: [{ label: 'Kayfiyat', data: mData, borderColor: '#ff8a00', backgroundColor: '#ff8a0033', fill: true, tension: 0.4, spanGaps: true, pointRadius: 4 }]},
      options: { responsive: true, maintainAspectRatio: true, aspectRatio: 2.4, animation: { duration: 400 }, plugins: { legend: { display: false }}, scales: { y: { min: 0, max: 5, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor }}, x: { ticks: { color: textColor }, grid: { display: false }}}}
    });
  }
}

// ════ NEW MINI APPS ════
function qrHTML() {
  return `<div class="modal-head"><div class="modal-title">📱 QR Generator</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="form-group"><label class="form-label">Matn yoki URL</label><input class="input" id="qrInput" placeholder="https://..." oninput="genQR()" autofocus/></div>
  <div class="qr-output" id="qrOutput"><span style="color:#999">Matn kiriting...</span></div>
  <button class="btn btn-secondary" style="width:100%;justify-content:center" onclick="downloadQR()"><i class="fa-solid fa-download"></i> Yuklab olish</button>`;
}
function genQR() {
  const text = $('#qrInput').value.trim();
  const out = $('#qrOutput');
  if (!text) { out.innerHTML = '<span style="color:#999">Matn kiriting...</span>'; return; }
  // Use external API for QR
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  out.innerHTML = `<img src="${url}" width="180" height="180" alt="QR" id="qrImg"/>`;
}
function downloadQR() {
  const img = $('#qrImg'); if (!img) return toast("Avval matn kiriting", 'error');
  const a = document.createElement('a'); a.href = img.src; a.download = 'qr.png'; a.target = '_blank'; a.click();
}

function passwordHTML() {
  return `<div class="modal-head"><div class="modal-title">🔐 Parol generator</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="card mb-2" style="background:var(--bg3);text-align:center;padding:1.5rem">
    <div id="pwOut" style="font-family:monospace;font-size:1.3rem;font-weight:600;letter-spacing:.05em;word-break:break-all">—</div>
  </div>
  <div class="form-group"><label class="form-label">Uzunlik: <span id="pwLen">16</span></label>
    <input type="range" id="pwRange" min="6" max="32" value="16" oninput="$('#pwLen').textContent=this.value;genPassword()"/></div>
  <div class="setting-row"><span class="setting-name">Katta harflar (A-Z)</span><label class="toggle"><input type="checkbox" id="pwUpper" checked onchange="genPassword()"/><span class="toggle-slider"></span></label></div>
  <div class="setting-row"><span class="setting-name">Raqamlar (0-9)</span><label class="toggle"><input type="checkbox" id="pwNum" checked onchange="genPassword()"/><span class="toggle-slider"></span></label></div>
  <div class="setting-row"><span class="setting-name">Belgilar (!@#)</span><label class="toggle"><input type="checkbox" id="pwSym" checked onchange="genPassword()"/><span class="toggle-slider"></span></label></div>
  <div style="display:flex;gap:8px;margin-top:1rem">
    <button class="btn btn-primary" style="flex:1" onclick="genPassword()"><i class="fa-solid fa-rotate"></i> Yangilash</button>
    <button class="btn btn-secondary" onclick="copyPassword()"><i class="fa-solid fa-copy"></i> Nusxa</button>
  </div>`;
}
function genPassword() {
  const len = parseInt($('#pwRange').value);
  let chars = 'abcdefghijklmnopqrstuvwxyz';
  if ($('#pwUpper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if ($('#pwNum').checked) chars += '0123456789';
  if ($('#pwSym').checked) chars += '!@#$%^&*-_=+';
  let p = '';
  for (let i = 0; i < len; i++) p += chars[Math.floor(Math.random() * chars.length)];
  $('#pwOut').textContent = p;
}
function copyPassword() {
  const p = $('#pwOut').textContent;
  navigator.clipboard?.writeText(p);
  toast('Nusxa olindi', 'success');
}

function bmiHTML() {
  return `<div class="modal-head"><div class="modal-title">⚖ BMI Kalkulyator</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="row">
    <div class="form-group"><label class="form-label">Bo'y (cm)</label><input class="input" type="number" id="bmiHeight" value="170" oninput="calcBMI()"/></div>
    <div class="form-group"><label class="form-label">Vazn (kg)</label><input class="input" type="number" id="bmiWeight" value="70" oninput="calcBMI()"/></div>
  </div>
  <div class="card" style="background:var(--bg3);text-align:center;padding:1.8rem 1rem">
    <div id="bmiVal" style="font-size:3rem;font-weight:700;letter-spacing:-.03em">22.4</div>
    <div id="bmiLabel" style="font-size:.95rem;font-weight:600;color:var(--green);margin-top:4px">Normal vazn</div>
    <div id="bmiAdvice" style="font-size:.82rem;color:var(--text2);margin-top:8px;line-height:1.5">Sog'lom diapazonda</div>
  </div>`;
}
function calcBMI() {
  const h = parseFloat($('#bmiHeight').value) / 100;
  const w = parseFloat($('#bmiWeight').value);
  if (!h || !w) return;
  const bmi = w / (h * h);
  $('#bmiVal').textContent = bmi.toFixed(1);
  let label, color, advice;
  if (bmi < 18.5) { label = "Vazn kam"; color = '#0284c7'; advice = "Sog'lom oziq-ovqat va sport tavsiya etiladi"; }
  else if (bmi < 25) { label = "Normal vazn"; color = '#22c55e'; advice = "Sog'lom diapazonda — davom eting!"; }
  else if (bmi < 30) { label = "Ortiqcha vazn"; color = '#f59e0b'; advice = "Sport va sog'lom ovqatlanish foydali"; }
  else { label = "Semizlik"; color = '#ef4444'; advice = "Shifokorga murojaat qiling"; }
  $('#bmiLabel').textContent = label;
  $('#bmiLabel').style.color = color;
  $('#bmiAdvice').textContent = advice;
}

function tipHTML() {
  return `<div class="modal-head"><div class="modal-title">💵 Tip Kalkulyator</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="form-group"><label class="form-label">Hisob summasi</label><input class="input" type="number" id="tipBill" placeholder="100000" oninput="calcTip()"/></div>
  <div class="row">
    <div class="form-group"><label class="form-label">Chayrak %</label>
      <select class="select" id="tipPct" onchange="calcTip()">
        <option>10</option><option selected>15</option><option>18</option><option>20</option><option>25</option>
      </select></div>
    <div class="form-group"><label class="form-label">Odamlar</label><input class="input" type="number" id="tipPpl" min="1" value="1" oninput="calcTip()"/></div>
  </div>
  <div class="card" style="background:var(--bg3)">
    <div class="setting-row"><span>Chayrak</span><strong id="tipAmt">0</strong></div>
    <div class="setting-row"><span>Jami</span><strong id="tipTotal">0</strong></div>
    <div class="setting-row"><span>Bir kishiga</span><strong id="tipPer">0</strong></div>
  </div>`;
}
function calcTip() {
  const bill = parseFloat($('#tipBill').value) || 0;
  const pct = parseFloat($('#tipPct').value) || 15;
  const ppl = parseInt($('#tipPpl').value) || 1;
  const tip = bill * pct / 100;
  const total = bill + tip;
  const per = total / ppl;
  const fmt = n => Math.round(n).toLocaleString('uz-UZ');
  $('#tipAmt').textContent = fmt(tip) + " so'm";
  $('#tipTotal').textContent = fmt(total) + " so'm";
  $('#tipPer').textContent = fmt(per) + " so'm";
}

function worldClockHTML() {
  return `<div class="modal-head"><div class="modal-title">🌍 Jahon vaqti</div><button class="icon-btn" onclick="stopWC();closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="world-clock-list" id="wcList"></div>`;
}
const WC_CITIES = [
  { city: 'Toshkent', tz: 'Asia/Tashkent' },
  { city: 'Moskva', tz: 'Europe/Moscow' },
  { city: 'London', tz: 'Europe/London' },
  { city: 'Nyu York', tz: 'America/New_York' },
  { city: 'Tokio', tz: 'Asia/Tokyo' },
  { city: 'Dubay', tz: 'Asia/Dubai' },
];
let wcInterval = null;
function initWC() {
  if (wcInterval) clearInterval(wcInterval);
  const update = () => {
    const list = $('#wcList'); if (!list) return;
    list.innerHTML = WC_CITIES.map(c => {
      const time = new Date().toLocaleTimeString('uz-UZ', { timeZone: c.tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const off = new Date().toLocaleString('en-US', { timeZone: c.tz, hour12: false });
      return `<div class="wc-item"><div><div class="wc-city">${c.city}</div><div class="wc-tz">${c.tz}</div></div><div class="wc-time">${time}</div></div>`;
    }).join('');
  };
  update();
  wcInterval = setInterval(update, 1000);
}
function stopWC() { if (wcInterval) { clearInterval(wcInterval); wcInterval = null; } }

function colorPickerHTML() {
  return `<div class="modal-head"><div class="modal-title">🎨 Color Picker</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="color-picker-display" id="cpDisp" style="background:#7c3aed">#7c3aed</div>
  <input type="color" id="cpInput" value="#7c3aed" oninput="cpUpdate()" style="width:100%;height:40px;border:none;border-radius:8px;cursor:pointer;background:none"/>
  <div class="card mt-2" style="background:var(--bg3);font-size:.82rem">
    <div class="setting-row"><span>HEX</span><strong id="cpHex">#7c3aed</strong></div>
    <div class="setting-row"><span>RGB</span><strong id="cpRgb">124, 58, 237</strong></div>
    <div class="setting-row"><span>HSL</span><strong id="cpHsl">263°, 83%, 58%</strong></div>
  </div>
  <button class="btn btn-secondary mt-2" style="width:100%;justify-content:center" onclick="cpCopy()"><i class="fa-solid fa-copy"></i> HEX nusxa olish</button>`;
}
function cpUpdate() {
  const hex = $('#cpInput').value;
  $('#cpDisp').style.background = hex;
  $('#cpDisp').textContent = hex.toUpperCase();
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  $('#cpHex').textContent = hex.toUpperCase();
  $('#cpRgb').textContent = `${r}, ${g}, ${b}`;
  // HSL
  const rr=r/255, gg=g/255, bb=b/255;
  const max = Math.max(rr,gg,bb), min = Math.min(rr,gg,bb);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > .5 ? d/(2-max-min) : d/(max+min);
    if (max === rr) h = (gg-bb)/d + (gg < bb ? 6 : 0);
    else if (max === gg) h = (bb-rr)/d + 2;
    else h = (rr-gg)/d + 4;
    h /= 6;
  }
  $('#cpHsl').textContent = `${Math.round(h*360)}°, ${Math.round(s*100)}%, ${Math.round(l*100)}%`;
}
function cpCopy() { navigator.clipboard?.writeText($('#cpHex').textContent); toast('HEX nusxa olindi', 'success'); }

function markdownEditorHTML() {
  return `<div class="modal-head"><div class="modal-title">✍ Markdown Editor</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="md-editor-grid">
    <textarea class="md-input" id="mdInput" oninput="mdRender()" placeholder="# Sarlavha
## Sub
**bold** *italic* \`code\`
- ro'yxat
- band
[link](url)"></textarea>
    <div class="md-preview" id="mdPreview"></div>
  </div>`;
}
function mdRender() {
  const md = $('#mdInput').value;
  // Simple MD parser
  let html = escape(md);
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
  html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/\n/g, '<br>');
  $('#mdPreview').innerHTML = html;
}



// ════ NEW MODALS (workout, meal, book) ════
function workoutModalHTML(w) {
  return `<div class="modal-head"><div class="modal-title">${w?'Mashqni tahrirlash':'Yangi mashq'}</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <form onsubmit="saveWorkout(event,'${w?.id||''}')">
    <div class="form-group"><label class="form-label">Mashq nomi</label><input class="input" name="name" value="${w?escape(w.name):''}" required autofocus/></div>
    <div class="form-group"><label class="form-label">Tip</label>
      <select class="select" name="type">
        <option ${w?.type==='Kuch'?'selected':''}>Kuch</option>
        <option ${w?.type==='Kardio'?'selected':''}>Kardio</option>
        <option ${w?.type==='Cho\'zilish'?'selected':''}>Cho'zilish</option>
        <option ${w?.type==='Yoga'?'selected':''}>Yoga</option>
      </select></div>
    <div class="form-group"><label class="form-label">Mashqlar (har biri yangi qatordan: nom × set × repeat)</label>
      <textarea class="textarea" name="ex" rows="5" placeholder="Push-up × 3 × 15
Squat × 3 × 20
Plank × 3 × 60s">${w?(w.exercises||[]).map(e=>`${e.name} × ${e.sets} × ${e.reps}`).join('\n'):''}</textarea></div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Saqlash</button>
    </div>
  </form>`;
}
function saveWorkout(e, id) {
  e.preventDefault();
  const f = e.target;
  const exercises = f.ex.value.split('\n').filter(Boolean).map(line => {
    const parts = line.split('×').map(s => s.trim());
    return { name: parts[0] || '?', sets: parts[1] || '?', reps: parts[2] || '?' };
  });
  const data = { name: f.name.value.trim(), type: f.type.value, exercises };
  if (id) Object.assign(state.workouts.find(x => x.id === id), data);
  else state.workouts.push({ id: uid(), ...data, createdAt: today() });
  save(); closeModal(); renderWorkouts();
  toast(id ? 'Yangilandi' : 'Mashq qo\'shildi', 'success');
}

function mealModalHTML() {
  return `<div class="modal-head"><div class="modal-title">Yangi ovqat</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <form onsubmit="saveMeal(event)">
    <div class="form-group"><label class="form-label">Ovqat nomi</label><input class="input" name="name" required autofocus/></div>
    <div class="row">
      <div class="form-group"><label class="form-label">Tip</label>
        <select class="select" name="type">
          <option>🌅 Nonushta</option><option>🌞 Tushlik</option><option>🌆 Kechki ovqat</option><option>🍪 Tamaddi</option>
        </select></div>
      <div class="form-group"><label class="form-label">Vaqt</label><input class="input" type="time" name="time"/></div>
    </div>
    <div class="row">
      <div class="form-group"><label class="form-label">Kaloriya</label><input class="input" type="number" name="calories" placeholder="500"/></div>
      <div class="form-group"><label class="form-label">Oqsil (g)</label><input class="input" type="number" name="protein"/></div>
    </div>
    <div class="row">
      <div class="form-group"><label class="form-label">Uglevod (g)</label><input class="input" type="number" name="carbs"/></div>
      <div class="form-group"><label class="form-label">Yog' (g)</label><input class="input" type="number" name="fat"/></div>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Saqlash</button>
    </div>
  </form>`;
}
function saveMeal(e) {
  e.preventDefault();
  const f = e.target;
  const icons = { '🌅 Nonushta':'🥐','🌞 Tushlik':'🍱','🌆 Kechki ovqat':'🍝','🍪 Tamaddi':'🍪' };
  state.meals.push({
    id: uid(), date: today(),
    name: f.name.value, type: f.type.value, time: f.time.value, icon: icons[f.type.value] || '🍴',
    calories: parseFloat(f.calories.value)||0, protein: parseFloat(f.protein.value)||0,
    carbs: parseFloat(f.carbs.value)||0, fat: parseFloat(f.fat.value)||0
  });
  save(); closeModal(); renderMeals();
  toast('Saqlandi', 'success');
}

function bookModalHTML(b) {
  return `<div class="modal-head"><div class="modal-title">${b?'Kitobni tahrirlash':'Yangi kitob'}</div><button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
  <form onsubmit="saveBook(event,'${b?.id||''}')">
    <div class="form-group"><label class="form-label">Sarlavha</label><input class="input" name="title" value="${b?escape(b.title):''}" required autofocus/></div>
    <div class="form-group"><label class="form-label">Muallif</label><input class="input" name="author" value="${b?escape(b.author||''):''}"/></div>
    <div class="row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="select" name="status">
          <option value="queue" ${(!b||b.status==='queue')?'selected':''}>Navbatda</option>
          <option value="reading" ${b?.status==='reading'?'selected':''}>O'qiyapman</option>
          <option value="done" ${b?.status==='done'?'selected':''}>Tugatildi</option>
        </select></div>
      <div class="form-group"><label class="form-label">Sahifalar</label><input class="input" type="number" name="pages" value="${b?.pages||''}"/></div>
    </div>
    <div class="form-group"><label class="form-label">O'qilgan sahifa</label><input class="input" type="number" name="read" value="${b?.read||0}"/></div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Saqlash</button>
    </div>
  </form>`;
}
function saveBook(e, id) {
  e.preventDefault();
  const f = e.target;
  const data = { title: f.title.value.trim(), author: f.author.value.trim(), status: f.status.value, pages: parseInt(f.pages.value)||0, read: parseInt(f.read.value)||0 };
  if (id) Object.assign(state.books.find(x => x.id === id), data);
  else state.books.push({ id: uid(), ...data, createdAt: today() });
  save(); closeModal(); renderReading();
  toast(id?'Yangilandi':'Kitob qo\'shildi', 'success');
}

// ════ AUTO BACKUP ════
function autoBackupCheck() {
  if (!state.settings.autoBackup) return;
  const last = state.settings.lastBackup ? new Date(state.settings.lastBackup) : new Date(0);
  const days = (Date.now() - last.getTime()) / 86400000;
  if (days >= 7) {
    localStorage.setItem('lumio_backup_' + today(), JSON.stringify(state));
    state.settings.lastBackup = today();
    save();
    // Keep only 4 most recent backups
    const keys = Object.keys(localStorage).filter(k => k.startsWith('lumio_backup_')).sort();
    while (keys.length > 4) localStorage.removeItem(keys.shift());
    toast('Avtomatik backup yaratildi', 'info');
  }
}

// ════ PWA ════
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => $('#installBanner')?.classList.add('show'), 5000);
});
window.installPWA = async function() {
  if (!deferredPrompt) { toast('Brauzeringiz hali tayyor emas', 'info'); return; }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') toast('Lumio o\'rnatildi! 🎉', 'success');
  deferredPrompt = null;
  $('#installBanner')?.classList.remove('show');
};

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ════ ENHANCE EXISTING FUNCTIONS ════
// Override openModal to support new types
const _originalOpenModal = window.openModal;
window.openModal = function(type, data = null) {
  const c = $('#modalContent');
  if (type === 'workout') c.innerHTML = workoutModalHTML(data);
  else if (type === 'meal') c.innerHTML = mealModalHTML();
  else if (type === 'book') c.innerHTML = bookModalHTML(data);
  else if (type === 'habitTemplates') return openTemplates('habit');
  else if (type === 'goalTemplates') return openTemplates('goal');
  else return _originalOpenModal(type, data);
  $('#modalOverlay').classList.add('open');
};

// Override openMiniApp to support new ones
const _originalOpenMiniApp = window.openMiniApp;
window.openMiniApp = function(name) {
  const c = $('#modalContent');
  if (name === 'qr') { c.innerHTML = qrHTML(); $('#modalOverlay').classList.add('open'); return; }
  if (name === 'password') { c.innerHTML = passwordHTML(); $('#modalOverlay').classList.add('open'); setTimeout(genPassword, 50); return; }
  if (name === 'bmi') { c.innerHTML = bmiHTML(); $('#modalOverlay').classList.add('open'); setTimeout(calcBMI, 50); return; }
  if (name === 'tip') { c.innerHTML = tipHTML(); $('#modalOverlay').classList.add('open'); return; }
  if (name === 'worldclock') { c.innerHTML = worldClockHTML(); $('#modalOverlay').classList.add('open'); setTimeout(initWC, 50); return; }
  if (name === 'color') { c.innerHTML = colorPickerHTML(); $('#modalOverlay').classList.add('open'); return; }
  if (name === 'markdown') { c.innerHTML = markdownEditorHTML(); $('#modalOverlay').classList.add('open'); return; }
  return _originalOpenMiniApp(name);
};

// Override goPage to render new pages
const _originalGoPage = window.goPage;
window.goPage = function(page) {
  _originalGoPage(page);
  if (page === 'calendar') renderFullCalendar();
  else if (page === 'workout') renderWorkouts();
  else if (page === 'meals') renderMeals();
  else if (page === 'meditation') resetBreath();
  else if (page === 'reading') renderReading();
  else if (page === 'insights') renderInsights();
  else if (page === 'analytics') renderAdvancedAnalytics();
};

// Enhance toggleTask & toggleHabit with effects
const _origToggleTask = window.toggleTask;
window.toggleTask = function(id) {
  const t = state.tasks.find(x => x.id === id);
  const wasUndone = t && !t.done;
  _origToggleTask(id);
  if (wasUndone && t.done) {
    fx?.play('complete');
    fx?.haptic([20, 30, 20]);
    window.confetti?.fire({ count: 30, x: window.innerWidth/2, y: window.innerHeight - 100 });
    if (state.tasks.filter(x => x.done).length % 10 === 0) {
      window.confetti?.celebrate();
    }
    renderQuests();
    renderPet();
  }
};

const _origToggleHabit = window.toggleHabit;
window.toggleHabit = function(id) {
  const h = state.habits.find(x => x.id === id);
  const wasUndone = h && !isHabitDone(id);
  _origToggleHabit(id);
  if (wasUndone && isHabitDone(id)) {
    fx?.play('complete');
    fx?.haptic([20, 30, 20]);
    window.confetti?.fire({ count: 25, x: window.innerWidth/2, y: window.innerHeight - 100 });
    renderQuests();
    renderPet();
  }
};

// Enhance addXp with sound
const _origAddXp = window.addXp || addXp;
const enhancedAddXp = function(amount, reason) {
  const oldLevel = state.user.level;
  _origAddXp(amount, reason);
  if (state.user.level > oldLevel) {
    fx?.play('levelup');
    window.confetti?.celebrate();
  }
};
window.addXp = enhancedAddXp;

// Enhance unlockAch with confetti
const _origUnlockAch = window.unlockAch || unlockAch;
window.unlockAch = function(id) {
  const has = state.achievements.includes(id);
  _origUnlockAch(id);
  if (!has && state.achievements.includes(id)) {
    fx?.play('achievement');
    window.confetti?.celebrate();
  }
};

// Hook setMood to play sound
const _origSetMood = window.setMood;
window.setMood = function(v) {
  _origSetMood(v);
  fx?.play('pop');
  fx?.haptic(20);
  renderQuests();
};

// Setup keyboard for new shortcuts
document.addEventListener('keydown', e => {
  const tag = (document.activeElement?.tagName || '').toLowerCase();
  const inInput = ['input','textarea','select'].includes(tag);
  if (inInput) return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  else if (e.key.toLowerCase() === 'v') { 
    if (window.location.hash.includes('tasks') || $('#page-tasks')?.classList.contains('active')) {
      e.preventDefault(); toggleVoice();
    }
  }
});

// Final init enhancement
const _origInit = init;
async function enhancedInit() {
  ensureV2State();
  await _origInit();
  setTimeout(() => {
    setDynamicWallpaper();
    if (state.onboarded) {
      renderPet();
      renderQuests();
      autoBackupCheck();
      // Settings UI
      if ($('#setLang')) $('#setLang').value = state.lang || 'uz';
      if ($('#setAutoBackup')) $('#setAutoBackup').checked = !!state.settings.autoBackup;
    }

    // ✨ FIX: Add v2.0 page renderers to nav clicks
    // (original bindNav captured local goPage, so v2 pages didn't render)
    const v2Renderers = {
      dashboard: () => { setDynamicWallpaper(); renderPet(); renderQuests(); },
      calendar: () => renderFullCalendar(),
      workout: () => renderWorkouts(),
      meals: () => renderMeals(),
      meditation: () => resetBreath(),
      reading: () => renderReading(),
      insights: () => renderInsights(),
      analytics: () => { try { renderAdvancedAnalytics(); } catch(e){ console.warn('analytics:', e); } },
    };
    // v2 page meta titles
    const v2PageMeta = {
      calendar: { title: 'Taqvim', sub: 'Hammasi bir joyda' },
      workout: { title: 'Sport', sub: 'Tana sog\'lom — fikr tiniq' },
      meals: { title: 'Ovqatlanish', sub: 'Sog\'lom ovqat — sog\'lom hayot' },
      meditation: { title: 'Meditatsiya', sub: 'Nafas — hozirgi daqiqaga qaytish' },
      reading: { title: 'Kitoblar', sub: 'Bilim — eng yaxshi sarmoya' },
      insights: { title: 'AI Maslahatlar', sub: 'Sizning produktivligingiz haqida' },
      analytics: { title: 'Statistika', sub: 'Sizning produktivlik tarixi' },
    };

    $$('.nav-item').forEach(n => {
      n.addEventListener('click', e => {
        const p = n.dataset.page;
        // Wait until original handler switches the active page
        setTimeout(() => {
          // Update topbar for v2 pages (original PAGE_META lacks them)
          if (v2PageMeta[p]) {
            $('#topbarTitle').textContent = v2PageMeta[p].title;
            const ds = $('#topbarDate');
            if (ds && !$('#page-' + p + ' .page-head .muted')?.textContent.includes(ds.textContent)) {
              // keep existing date in topbar — page muted shows sub
            }
          }
          // Render v2 content
          if (v2Renderers[p]) v2Renderers[p]();
        }, 60);
      });
    });

    // Periodic refresh
    setInterval(() => { if ($('#page-dashboard')?.classList.contains('active')) { setDynamicWallpaper(); renderQuests(); } }, 60000);
  }, 1500);
}

// Replace init
document.removeEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', enhancedInit);

// Expose all
window.openPetModal = openPetModal;
window.petPet = petPet;
window.toggleVoice = toggleVoice;
window.undo = undo;
window.calNav = calNav;
window.calCellClick = calCellClick;
window.useTemplate = useTemplate;
window.openTemplates = openTemplates;
window.setLang = setLang;
window.logWorkout = logWorkout;
window.deleteWorkout = deleteWorkout;
window.deleteMeal = deleteMeal;
window.setBookFilter = setBookFilter;
window.editBook = editBook;
window.deleteBook = deleteBook;
window.toggleBreath = toggleBreath;
window.setBreathPattern = setBreathPattern;
window.resetBreath = resetBreath;
window.renderInsights = renderInsights;
window.renderAdvancedAnalytics = renderAdvancedAnalytics;
window.saveWorkout = saveWorkout;
window.saveMeal = saveMeal;
window.saveBook = saveBook;
window.genQR = genQR;
window.downloadQR = downloadQR;
window.genPassword = genPassword;
window.copyPassword = copyPassword;
window.calcBMI = calcBMI;
window.calcTip = calcTip;
window.cpUpdate = cpUpdate;
window.cpCopy = cpCopy;
window.mdRender = mdRender;
window.stopWC = stopWC;
window.$ = $;



// ════════════════════════════════════════════
// LUMIO POLISH v1.1 — Performance & UX
// ════════════════════════════════════════════

// ── Debounce utility ──
function debounce(fn, ms = 250) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}
function throttle(fn, ms = 100) {
  let last = 0, t;
  return function(...args) {
    const now = Date.now();
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else {
      clearTimeout(t);
      t = setTimeout(() => { last = Date.now(); fn.apply(this, args); }, remaining);
    }
  };
}

// ── Debounce search inputs (was firing on every keystroke) ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const inputs = [
      { id: 'taskSearch', fn: () => window.renderTasks?.() },
      { id: 'habitSearch', fn: () => window.renderHabits?.() },
      { id: 'noteSearch', fn: () => window.renderNotes?.() },
    ];
    inputs.forEach(({ id, fn }) => {
      const el = document.getElementById(id);
      if (el) {
        el.removeAttribute('oninput');
        el.addEventListener('input', debounce(fn, 200));
      }
    });

    // Prefer passive listeners for scroll performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }, 2000);
});

// ── Auto-save on visibility change (saves data if user closes tab) ──
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    try { save(); } catch {}
  }
});

window.addEventListener('beforeunload', () => {
  try { save(); } catch {}
});

// ── In-app TOUR (interactive help) ──
const TOUR_STEPS = [
  { selector: '#sidebar .nav-item.active', title: 'Bosh sahifa', text: 'Bu yerda kunlik xulosa, statistika, va widgetlaringiz bor.', position: 'right' },
  { selector: '[data-page="tasks"]', title: 'Vazifalar', text: "Kanban yoki ro'yxat ko'rinishida vazifalarni boshqaring. Ovoz orqali ham qo'shsa bo'ladi!", position: 'right' },
  { selector: '[data-page="habits"]', title: 'Odatlar', text: 'Streak, heatmap va kayfiyat tracker. Mukammal odatlar shu yerda quriladi.', position: 'right' },
  { selector: '[data-page="focus"]', title: 'Fokus rejim', text: 'Pomodoro + 6 ambient ovoz bilan chuqur konsentratsiya.', position: 'right' },
  { selector: '#openAddModal, .btn-primary', title: "Tezkor qo'shish", text: "Bu yerdan istalgan element qo'shing — vazifa, odat, maqsad, qayd.", position: 'bottom' },
  { selector: '#sidebar .sidebar-search', title: 'Qidiruv', text: "Cmd/Ctrl+K bilan istalgan joyga tezkor o'ting yoki narsani qidiring.", position: 'right' },
  { selector: '.user-card', title: 'Profilingiz', text: "XP, daraja va achievements. Vazifalar, odatlar bajaring va Lumi (sevimli pet) bilan o'sib boring!", position: 'right' },
];

let tourIdx = 0;
let tourActive = false;

function startTour() {
  tourIdx = 0;
  tourActive = true;
  showTourStep();
}

function showTourStep() {
  if (tourIdx >= TOUR_STEPS.length) return endTour();
  const step = TOUR_STEPS[tourIdx];
  
  // Remove old highlight
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));

  // Add highlight to target
  const target = document.querySelector(step.selector);
  if (target) {
    target.classList.add('tour-highlight');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Show popup
  let overlay = document.getElementById('tourOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tourOverlay';
    overlay.className = 'tour-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="tour-popup">
      <h3>${step.title}</h3>
      <p>${step.text}</p>
      <div class="tour-popup-actions">
        <button class="btn btn-secondary" onclick="endTour()">${tourIdx === TOUR_STEPS.length - 1 ? 'Tugatish' : "O'tkazish"}</button>
        ${tourIdx > 0 ? `<button class="btn btn-secondary" onclick="prevTour()"><i class="fa-solid fa-arrow-left"></i></button>` : ''}
        <button class="btn btn-primary" onclick="nextTour()">${tourIdx === TOUR_STEPS.length - 1 ? '✓ Tugatish' : 'Keyingi'} <i class="fa-solid fa-arrow-right"></i></button>
      </div>
      <div class="tour-popup-progress">${tourIdx + 1} / ${TOUR_STEPS.length}</div>
    </div>
  `;
  overlay.classList.add('show');
}

function nextTour() { tourIdx++; showTourStep(); }
function prevTour() { tourIdx = Math.max(0, tourIdx - 1); showTourStep(); }
function endTour() {
  tourActive = false;
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  const overlay = document.getElementById('tourOverlay');
  if (overlay) overlay.classList.remove('show');
  if (state) {
    state.settings = state.settings || {};
    state.settings.tourCompleted = true;
    save();
  }
}

window.startTour = startTour;
window.nextTour = nextTour;
window.prevTour = prevTour;
window.endTour = endTour;

// ── Show tour after onboarding finishes (only once) ──
const _origObFinish = window.obFinish;
if (typeof _origObFinish === 'function') {
  window.obFinish = function() {
    _origObFinish();
    setTimeout(() => {
      if (!state.settings?.tourCompleted) {
        if (confirm('Lumio bilan qisqacha tanishish turini boshlashingiz mumkin. Boshlaymizmi?')) {
          startTour();
        } else {
          state.settings = state.settings || {};
          state.settings.tourCompleted = true;
          save();
        }
      }
    }, 1200);
  };
}

// ── Better toast deduplication ──
const _origToast = window.toast || toast;
let lastToast = { msg: '', time: 0 };
window.toast = function(msg, type, icon) {
  const now = Date.now();
  if (lastToast.msg === msg && now - lastToast.time < 1500) return;
  lastToast = { msg, time: now };
  _origToast(msg, type, icon);
};

// ── Smooth number animation ──
function animateNumber(el, from, to, duration = 800) {
  if (!el) return;
  const start = Date.now();
  const diff = to - from;
  function step() {
    const elapsed = Date.now() - start;
    const t = Math.min(1, elapsed / duration);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(from + diff * eased);
    el.textContent = val + (el.dataset.suffix || '');
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}
window.animateNumber = animateNumber;

// ── Smarter render of dashboard (animate stat cards) ──
const _origRenderDashboard = window.renderDashboard || renderDashboard;
const _animatedStats = { tasks: 0, streak: 0, focus: 0, study: 0, score: 0 };
window.renderDashboard = function() {
  _origRenderDashboard();
  // Animate the stat numbers if they changed (only once per dashboard mount)
  setTimeout(() => {
    const ids = [
      { id: 'statTasks', key: 'tasks' },
      { id: 'statStreak', key: 'streak' },
      { id: 'scoreVal', key: 'score' },
    ];
    ids.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const target = parseInt(el.textContent) || 0;
      if (_animatedStats[key] !== target) {
        animateNumber(el, _animatedStats[key], target, 700);
        _animatedStats[key] = target;
      }
    });
  }, 50);
};

// ── Smart greeting based on day of week ──
const DAY_GREETINGS = [
  "Ajoyib yakshanba!",        // 0
  "Yangi hafta — yangi imkoniyatlar 🚀",  // 1
  "Seshanba — produktiv kun",   // 2
  "Hafta o'rtasi, davom eting!", // 3
  "Payshanba — maqsadga yaqinroq", // 4
  "Juma — yakunlash kuni",      // 5
  "Shanba — dam olish va o'sish", // 6
];

const _origSetGreeting = window.setGreeting || setGreeting;
window.setGreeting = function() {
  _origSetGreeting();
  const dayMsg = DAY_GREETINGS[new Date().getDay()];
  const subtitle = document.getElementById('greetTime');
  if (subtitle && dayMsg) {
    subtitle.textContent = subtitle.textContent + ' · ' + dayMsg;
  }
};

// ── Help button in topbar ──
function addHelpButton() {
  const actions = document.querySelector('.topbar-actions');
  if (!actions || document.getElementById('helpBtn')) return;
  const btn = document.createElement('button');
  btn.className = 'icon-btn help-btn';
  btn.id = 'helpBtn';
  btn.title = 'Yordam (?)';
  btn.innerHTML = '<i class="fa-solid fa-question"></i>';
  btn.onclick = () => startTour();
  // Insert before theme button
  const themeBtn = actions.querySelector('button:last-child');
  if (themeBtn) actions.insertBefore(btn, themeBtn);
  else actions.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(addHelpButton, 1000);
});

// ── Install prompt smarter (only show if user uses app for a while) ──
let _installShown = false;
const _showInstall = () => {
  const banner = document.getElementById('installBanner');
  if (banner && !_installShown && window.deferredPrompt) {
    banner.classList.add('show');
    _installShown = true;
  }
};
// Show after 2 minutes of usage
setTimeout(_showInstall, 120000);

// ── Performance: avoid heavy re-renders on hidden pages ──
const _heavyRenderers = ['renderHeatmap', 'renderAdvancedAnalytics', 'renderFullCalendar'];
_heavyRenderers.forEach(name => {
  const orig = window[name];
  if (typeof orig === 'function') {
    window[name] = function(...args) {
      // Skip if doc is hidden
      if (document.visibilityState === 'hidden') return;
      return orig.apply(this, args);
    };
  }
});

// ── Smarter date formatting ──
window.fmtDate = function(d, locale = 'uz-UZ') {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};

window.fmtDateTime = function(d, locale = 'uz-UZ') {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// ── Smarter relative time (e.g. "2 hours ago") ──
window.timeAgo = function(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'hozirgina';
  if (diff < 3600) return `${Math.floor(diff/60)} daq oldin`;
  if (diff < 86400) return `${Math.floor(diff/3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff/86400)} kun oldin`;
  return fmtDate(date);
};

// ── Better error handling globally ──
window.addEventListener('error', e => {
  console.warn('[Lumio]', e.message);
  // Don't show toast for every error to avoid spam
});

window.addEventListener('unhandledrejection', e => {
  console.warn('[Lumio Promise]', e.reason);
});

// ── Smooth scroll on hash navigation ──
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (a && a.hash) {
    const target = document.querySelector(a.hash);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});

// ── Detect first-time user and offer demo data ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!state) return;
    if (state.onboarded && state.tasks?.length === 0 && state.habits?.length === 0 &&
        state.notes?.length === 0 && !state.settings?.demoOffered) {
      state.settings = state.settings || {};
      state.settings.demoOffered = true;
      save();
      setTimeout(() => {
        if (confirm('Lumio bo\'sh ko\'rinadi. Demo ma\'lumotlarni yuklash uchun ruxsat berasizmi? (vazifa, odat va boshqalar)')) {
          if (typeof seedDemo === 'function') {
            seedDemo();
            location.reload();
          }
        }
      }, 1500);
    }
  }, 3000);
});

// ── Make confetti on level-up automatic ──
{
  const _addXpForLvlUp = window.addXp;
  if (_addXpForLvlUp) {
    window.addXp = function(amount, reason) {
      const oldLevel = state?.user?.level || 1;
      _addXpForLvlUp(amount, reason);
      const newLevel = state?.user?.level || 1;
      if (newLevel > oldLevel && window.confetti?.celebrate) {
        setTimeout(() => window.confetti.celebrate(), 200);
      }
    };
  }
}

// ── Better text resize ──
function _adjustFontSize() {
  const w = window.innerWidth;
  if (w < 380) document.documentElement.style.fontSize = '13px';
  else if (w < 480) document.documentElement.style.fontSize = '14px';
  else document.documentElement.style.fontSize = '15px';
}
_adjustFontSize();
window.addEventListener('resize', throttle(_adjustFontSize, 200));

// ── PWA: theme color sync ──
function syncThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  meta.setAttribute('content', isDark ? '#0a0a0a' : '#fafaf9');
}
const _origSetTheme = window.setTheme;
if (_origSetTheme) {
  window.setTheme = function(t) {
    _origSetTheme(t);
    syncThemeColor();
  };
}
syncThemeColor();

// ── Online/offline status indicator ──
function updateOnlineStatus() {
  if (!navigator.onLine) {
    if (typeof toast === 'function') toast('Offline rejim — barcha ma\'lumotlar lokalda saqlanmoqda', 'info');
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ── Lazy load Chart.js usage check ──
if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 12 };
  Chart.defaults.plugins.tooltip.bodyFont = { size: 11 };
  Chart.defaults.borderColor = 'rgba(0,0,0,0.06)';
}

console.log('✨ Lumio v1.1 polish loaded');
