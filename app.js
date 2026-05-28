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
