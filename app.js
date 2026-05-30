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
  { t:"Hayot 10% sizga sodir bo'lgan narsa va 90% siz unga qanday javob berasiz.", a:"Charles Swindoll" },
  { t:"Mag'lubiyatdan qo'rqmang. Hech narsa qilmaslikdan qo'rqing.", a:"Konfutsiy" },
  { t:"Sabr — fazilatlarning eng katti.", a:"Cato" },
  { t:"Yulduzlarga erishmoqchi bo'lsangiz, oydan kechmang.", a:"W. Clement Stone" },
  { t:"Hech qachon kech emas, qachondir bo'lib bo'lmaydi.", a:"George Eliot" },
  { t:"Iste'dod arzon. Intizom — qimmatli.", a:"Mike Tyson" },
  { t:"Eng katta dushman — siz o'zingizsiz.", a:"Sun Tzu" },
  { t:"Vaqt — eng qimmatbaho narsa, uni tejash mumkin emas, faqat sarflash mumkin.", a:"Theophrastus" },
  { t:"Bilim — kuch.", a:"Frensis Bekon" },
  { t:"Sukut bilan oltin sotib olib bo'lmaydi, lekin ko'pincha tinchlik sotib olinadi.", a:"O'zbek maqoli" },
  { t:"O'zingni bil — donolikning boshlanishi shu.", a:"Sokrat" },
  { t:"Hech qachon emasdan ko'ra kechroq yaxshi.", a:"Tito Liviy" },
  { t:"O'zgarish boshlanadi qachon siz boshlasangiz.", a:"Anonim" },
  { t:"Hayot — bu siklda harakat. Tugatish uchun yoki davom ettirish uchun har doim tanlovingiz bor.", a:"Tony Robbins" },
  { t:"Eng katta xavf — xavf qilmaslik.", a:"Mark Zuckerberg" },
  { t:"Imkonsiz — bu shunchaki xayolda mavjud.", a:"Muhammad Ali" },
  { t:"Tushlaringga ergashing, lekin uxlamasdan.", a:"Anonim" },
  { t:"Xato qilishdan qo'rqma — hech narsa qilmaslikdan qo'rq.", a:"Bob Marley" },
  { t:"Yutuq — kichik harakatlarning yig'indisi, har kun takrorlangan.", a:"Robert Collier" },
  { t:"Bugun yashang — ertaga sovg'a emas.", a:"Anonim" },
  { t:"Sizning yagona cheklov — siz o'zingiz qo'ygan cheklov.", a:"Les Brown" },
  { t:"Niyatsiz harakat — natijasiz qoladi.", a:"Bukker T. Vashington" },
  { t:"Eng baxtli odamlar eng yaxshi narsalarga ega emas — ular bor narsalardan eng yaxshi olishadi.", a:"Anonim" },
  { t:"Birinchi vazifa — o'zingiz bilan halol bo'lish.", a:"Stiv Maraboli" },
  { t:"Qanchalik harakatga moyil bo'lsangiz, shunchalik omadli bo'lasiz.", a:"Tomas Jefferson" },
  { t:"Boshlanish — eng qiyin qism. Birinchi qadam — qolganlarining yarmi.", a:"Aristotel" },
  { t:"Sabr achchiq, lekin uning mevasi shirin.", a:"Jan-Jak Russo" },
  { t:"Hech qachon takomiliroq vaqtni kutmang. Hozir va shu yerda boshlang.", a:"Napoleon Hill" },
  { t:"O'zgarmoq qiyin, lekin o'zgarmaslik halokatli.", a:"Anonim" },
  { t:"Hayot 100% bo'lib o'tadi — siz xohlasangiz ham, xohlamasangiz ham. Faolm bo'ling.", a:"Anonim" },
  { t:"Eng katta sovg'a — bugungi kun. Shuning uchun u 'present' deb ataladi.", a:"Eleanor Roosevelt" },
  { t:"Aql qancha kuchli bo'lsa, fikrlar shuncha tinch.", a:"Patanjali" },
  { t:"Quyoshga yuzlaning va soyalar orqada qoladi.", a:"Maori maqoli" },
  { t:"Ulug' yutuqlar uchun ulug' qurbonliklar kerak emas — faqat doimiy harakat.", a:"Anonim" },
  { t:"Oltinning qiymati issiq olovda chiniqishida.", a:"Seneka" },
  { t:"Yaxshi odat — ozodlik ramzi.", a:"Sokrat" },
  { t:"Bugun harakatga keling — kechagi kechikkan.", a:"Anonim" },
  { t:"Hech kim sizdan kuchli emas. Hech narsa imkonsiz emas.", a:"Anonim" },
  { t:"Aqlli odam — bilmasligini biladigan odam.", a:"Sokrat" },
  { t:"Hayot dengizdek — to'lqinlar keladi va ketadi. Siz uchayveringiz.", a:"Anonim" },
  { t:"O'qiganni yashash — eng yaxshi ta'lim.", a:"Albert Eynshteyn" },
  { t:"Eng baxtli inson — boshqalarni baxtli qilgan inson.", a:"Tagor" },
  { t:"Yaxshi tinglovchi har joyda hurmat oladi.", a:"Dale Carnegie" },
  { t:"Sizning fikrlaringiz — sizning hayotingiz.", a:"Marcus Aurelius" },
  { t:"Hayot 10 yoshda — o'yinlar, 20 yoshda — sevgi, 30 yoshda — kasb, 40 yoshda — bola, 50 yoshda — donolik.", a:"O'zbek maqoli" },
  { t:"Eng kuchli kishi — o'zini boshqarayotgan kishi.", a:"Lao Tzu" },
  { t:"Hech kim bizdan ozodlikni olib qo'ya olmaydi, agar biz uni o'zimiz topshirmasak.", a:"Eleanor Roosevelt" },
  { t:"Vaqtni isrof qilmang — bu hayot sodir bo'layotgan narsa.", a:"Lennon" },
  { t:"Saxiylik bilan bering — kamroq bo'lib qolmaydi.", a:"Vinston Cherchill" },
  { t:"Hech qachon o'rganishni to'xtatmang — chunki hayot hech qachon o'rgatishni to'xtatmaydi.", a:"Anonim" },
  { t:"Eng katta safar — bir qadamdan boshlanadi.", a:"Lao Tzu" },
  { t:"Mas'uliyat — kuchli odamning belgisi.", a:"Anonim" },
  { t:"Ish qilishni boshlang. Mukammal vaqt yo'q.", a:"Napoleon Hill" },
  { t:"Tafakkur — eng yuqori tartibli mehnat.", a:"Henri Ford" },
  { t:"Quyoshli kunda soyani ko'rmaslik mumkin, lekin u doim sizga ergashadi.", a:"O'zbek maqoli" },
  { t:"Eng katta kuch — sevgi. Eng katta zaiflik — qo'rquv.", a:"Yi Cing" },
  { t:"O'zingiz bo'ling. Boshqalar allaqachon band.", a:"Oscar Wilde" },
  { t:"Hayot adolatli emas — bunga ko'nikinging.", a:"Bill Geyts" },
  { t:"Imkoniyat tayyor odamlarni topadi.", a:"Lui Paster" },
  { t:"Iste'dodingni jonlat — yashash hayotning eng katta sovg'asidir.", a:"Anonim" },
  { t:"Avval o'zingiz bilan to'g'ri yashang.", a:"Sokrat" },
  { t:"Yashashni o'rganish — tushunish uchun.", a:"Konfutsiy" },
  { t:"Hech qachon to'xtamang. Davom eting.", a:"Vinston Cherchill" },
];

// Track shown quotes per session for non-repeating
let _quotesShownThisSession = new Set();
function getRandomQuote() {
  // Reset if all shown
  if (_quotesShownThisSession.size >= QUOTES.length) {
    _quotesShownThisSession.clear();
  }
  let attempts = 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * QUOTES.length);
    attempts++;
  } while (_quotesShownThisSession.has(idx) && attempts < 50);
  _quotesShownThisSession.add(idx);
  return QUOTES[idx];
}

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
// 'light' | 'dark' | 'system' (qurilma sozlamasiga moslashadi)
const _systemThemeMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function resolveTheme(t) {
  // 'system' bo'lsa — qurilmaning real mavzusini qaytaradi
  if (t === 'system') {
    return (_systemThemeMQ && _systemThemeMQ.matches) ? 'dark' : 'light';
  }
  return t;
}

function setTheme(t) {
  state.theme = t;
  const effective = resolveTheme(t); // light yoki dark
  document.documentElement.setAttribute('data-theme', effective);
  const icon = $('#themeIcon');
  if (icon) {
    icon.classList.remove('fa-moon', 'fa-sun', 'fa-circle-half-stroke');
    icon.classList.add(t === 'system' ? 'fa-circle-half-stroke' : (effective === 'dark' ? 'fa-sun' : 'fa-moon'));
  }
  $$('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.th === t));
  // PWA theme-color meta sync
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', effective === 'dark' ? '#0a0a0a' : '#fafaf9');
  save();
}

// Qurilma mavzusi o'zgarganda (faqat 'system' rejimida) avtomatik yangilash
if (_systemThemeMQ) {
  const _onSystemThemeChange = () => {
    if (state.theme === 'system') setTheme('system');
  };
  if (_systemThemeMQ.addEventListener) _systemThemeMQ.addEventListener('change', _onSystemThemeChange);
  else if (_systemThemeMQ.addListener) _systemThemeMQ.addListener(_onSystemThemeChange); // eski brauzerlar
}

function toggleTheme() {
  // light → dark → system → light ...
  const next = state.theme === 'light' ? 'dark' : state.theme === 'dark' ? 'system' : 'light';
  setTheme(next);
  const label = next === 'light' ? "☀️ Yorug'" : next === 'dark' ? '🌙 Qora' : '💻 Tizim';
  if (typeof toast === 'function') toast(`Mavzu: ${label}`, 'info');
}
function setAccent(a) {
  state.accent = a;
  if (a === 'default') document.documentElement.removeAttribute('data-accent');
  else document.documentElement.setAttribute('data-accent', a);
  $$('.accent-card').forEach(c => c.classList.toggle('active', c.dataset.acc === a));
  try { window.fx?.haptic(15); } catch {}
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
  // Quote (different on every refresh, no repeat in same session)
  const q = getRandomQuote();
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
  // Random quote (no repeat in session)
  const q = getRandomQuote();
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
  if (!state.pet) state.pet = { name: 'Lumi', emoji: '🌱', happy: 80, energy: 80, level: 1, lastFed: today() };
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
// Fantasy creature evolution - mythical beings that grow with you
const PET_STAGES = [
  { min: 0,   emoji: '🌱', name: 'Yashil urug\'' },           // Seedling — boshlanish
  { min: 1,   emoji: '🌿', name: 'Yosh maysa' },             // Sapling
  { min: 3,   emoji: '🦋', name: 'Yorug\'lik kapalagi' },    // Light Butterfly
  { min: 5,   emoji: '🦄', name: 'Sehrli yakkashox' },       // Unicorn
  { min: 8,   emoji: '🧚', name: 'Aql parisi' },             // Wisdom Fairy
  { min: 12,  emoji: '🐲', name: 'Yosh ajdarcha' },          // Young Dragon
  { min: 18,  emoji: '🦅', name: 'Olovli qush — Feniks' },   // Phoenix
  { min: 25,  emoji: '🐉', name: 'Sharqona ajdar' },         // Eastern Dragon
  { min: 35,  emoji: '🦉', name: 'Donishmand boyqush' },     // Wise Owl (mystical)
  { min: 50,  emoji: '🌟', name: 'Yulduz mavjudoti' },       // Star Being
  { min: 75,  emoji: '⚡', name: 'Chaqmoq jini' },           // Lightning Spirit
  { min: 100, emoji: '🔮', name: 'Abadiy donishmand' },      // Eternal Sage
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
      <p class="muted mt-2" style="font-size:.85rem;line-height:1.6">Vazifalarni bajaring va odatlaringizni saqlang — ${state.pet.name} sizdan kuch oladi va sehrli mavjudotga aylanadi! 🌱→🌿→🦋→🦄→🧚→🐲→🦅→🐉→🦉→🌟→⚡→🔮</p>
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
  // Vazifalar
  { id:'q_3tasks', icon:'✅', name:'3 ta vazifa bajaring', goal:3, type:'task', xp:30 },
  { id:'q_5tasks', icon:'✅', name:'5 ta vazifa bajaring', goal:5, type:'task', xp:50 },
  { id:'q_7tasks', icon:'🚀', name:'7 ta vazifa bajaring', goal:7, type:'task', xp:80 },
  { id:'q_priority', icon:'🔥', name:'Yuqori ustuvorlikdagi vazifani bajaring', goal:1, type:'priority_task', xp:40 },
  // Odatlar
  { id:'q_2habits', icon:'⚡', name:'2 ta odat bajaring', goal:2, type:'habit', xp:25 },
  { id:'q_3habits', icon:'⚡', name:'3 ta odat bajaring', goal:3, type:'habit', xp:40 },
  { id:'q_5habits', icon:'⚡', name:'5 ta odat bajaring', goal:5, type:'habit', xp:65 },
  { id:'q_allhabits', icon:'🌟', name:"Bugun barcha odatlarni bajaring", goal:1, type:'all_habits', xp:60 },
  { id:'q_morning', icon:'🌅', name:"Ertalab odat bajaring (12:00 dan oldin)", goal:1, type:'morning_habit', xp:35 },
  // Fokus
  { id:'q_focus15', icon:'⏱', name:'15 daqiqa fokus', goal:15, type:'focus', xp:20 },
  { id:'q_focus25', icon:'⏱', name:'25 daqiqa fokuslaning', goal:25, type:'focus', xp:30 },
  { id:'q_focus60', icon:'🎯', name:'1 soat fokus', goal:60, type:'focus', xp:60 },
  { id:'q_focus2h', icon:'🧠', name:'2 soat chuqur ish', goal:120, type:'focus', xp:100 },
  { id:'q_2sessions', icon:'💪', name:'2 ta fokus sessiyasi', goal:2, type:'focus_count', xp:45 },
  // Sog'liq
  { id:'q_water6', icon:'💧', name:'6 stakan suv iching', goal:6, type:'water', xp:20 },
  { id:'q_water', icon:'💧', name:'8 stakan suv iching', goal:8, type:'water', xp:25 },
  { id:'q_water10', icon:'💦', name:'10 stakan suv (super!)', goal:10, type:'water', xp:35 },
  // Yozish
  { id:'q_note', icon:'📝', name:'Bir qayd yozing', goal:1, type:'note', xp:15 },
  { id:'q_journal', icon:'📔', name:'Kundalik yozing', goal:1, type:'journal', xp:20 },
  { id:'q_2notes', icon:'✍', name:'2 ta qayd yarating', goal:2, type:'note', xp:30 },
  // Kayfiyat
  { id:'q_mood', icon:'😊', name:'Kayfiyatingizni belgilang', goal:1, type:'mood', xp:10 },
  { id:'q_good_mood', icon:'😄', name:"Kayfiyatingiz 4+ bo'lsin", goal:1, type:'good_mood', xp:25 },
  // Meditatsiya
  { id:'q_meditate', icon:'🧘', name:'5 daqiqa meditatsiya', goal:5, type:'meditate', xp:25 },
  { id:'q_meditate10', icon:'🧘', name:'10 daqiqa meditatsiya', goal:10, type:'meditate', xp:40 },
  { id:'q_meditate20', icon:'🌌', name:'20 daqiqa chuqur meditatsiya', goal:20, type:'meditate', xp:75 },
  // Sport
  { id:'q_workout', icon:'💪', name:'Bir mashq bajaring', goal:1, type:'workout', xp:30 },
  { id:'q_workout3', icon:'🏋', name:'3 ta mashq bajaring', goal:3, type:'workout', xp:60 },
  // O'qish
  { id:'q_book', icon:'📚', name:'10 daqiqa kitob', goal:10, type:'reading', xp:25 },
  { id:'q_book30', icon:'📖', name:'30 daqiqa o\'qing', goal:30, type:'reading', xp:55 },
  { id:'q_flashcard', icon:'🎴', name:'5 ta flashcard', goal:5, type:'flashcard', xp:20 },
  // Sotsial / shaxsiy
  { id:'q_goal', icon:'🎯', name:'Maqsadni yangilang', goal:1, type:'goal_progress', xp:30 },
  { id:'q_milestone', icon:'⭐', name:'Bir milestone tugating', goal:1, type:'milestone', xp:40 },
  // Ovqatlanish
  { id:'q_meal', icon:'🍎', name:'Ovqatni qaydlang', goal:1, type:'meal', xp:15 },
  // Kombinatsiya
  { id:'q_3areas', icon:'✨', name:"3 sohada faollik (vazifa, odat, fokus)", goal:1, type:'combo_3', xp:70 },
  { id:'q_perfect', icon:'🏆', name:'Mukammal kun (5 sohada faollik)', goal:1, type:'perfect_day', xp:120 },
  // Erta turish
  { id:'q_early', icon:'🌄', name:'Erta turing (8:00 gacha faollik)', goal:1, type:'early_active', xp:30 },
  // Yo'naltirish
  { id:'q_no_phone', icon:'📵', name:'30 daq fokus (telefonsiz)', goal:30, type:'focus', xp:50 },
];

function ensureDailyQuests() {
  ensureV2State();
  if (state.quests.date !== today()) {
    // Generate 3 fresh random quests, avoid yesterday's quests
    const yesterdayIds = (state.quests.list || []).map(q => q.id);
    let pool = [...QUEST_POOL].filter(q => !yesterdayIds.includes(q.id));
    if (pool.length < 3) pool = [...QUEST_POOL]; // fallback if filter too restrictive
    pool.sort(() => Math.random() - 0.5);

    // Try to get balanced mix: 1 easy (xp<=25), 1 medium (26-50), 1 hard (>50)
    const easy = pool.filter(q => q.xp <= 25);
    const medium = pool.filter(q => q.xp > 25 && q.xp <= 50);
    const hard = pool.filter(q => q.xp > 50);

    const selected = [];
    if (easy.length) selected.push(easy[0]);
    if (medium.length) selected.push(medium[0]);
    if (hard.length) selected.push(hard[0]);
    // If we don't have 3 (rare edge case), fill from pool
    while (selected.length < 3 && pool.length > selected.length) {
      const next = pool.find(q => !selected.includes(q));
      if (next) selected.push(next);
      else break;
    }

    state.quests = { date: today(), list: selected.map(q => ({ ...q, progress: 0, done: false })) };
    save();
  }
}
function evalQuests() {
  ensureDailyQuests();
  const tasksDone = state.tasks.filter(t => t.done && t.completedAt === today()).length;
  const priorityTasksDone = state.tasks.filter(t => t.done && t.completedAt === today() && (t.priority === 1 || t.priority === 2)).length;
  const habitsDone = state.habits.filter(h => isHabitDone(h.id)).length;
  const focusSessions = state.focusSessions.filter(s => s.date === today());
  const focusToday = focusSessions.reduce((a,s)=>a+s.minutes,0);
  const water = state.water[today()] || 0;
  const noteToday = state.notes.some(n => n.updatedAt === today() || n.createdAt === today());
  const notesCount = state.notes.filter(n => n.updatedAt === today() || n.createdAt === today()).length;
  const moodToday = !!state.moods[today()];
  const moodValue = state.moods[today()] || 0;
  const medSessions = (state.medSessions || []).filter(s => s.date === today());
  const medToday = medSessions.reduce((a,s)=>a+s.minutes,0);
  const journalToday = !!(state.journal && state.journal[today()]);
  const workoutsToday = (state.workoutLogs || []).filter(w => w.date === today()).length;
  const mealsToday = (state.meals || []).filter(m => m.date === today()).length;
  // Reading - approximate from book progress
  const readingMinutes = (state.medSessions || [])
    .filter(s => s.date === today() && s.type === 'reading')
    .reduce((a,s) => a + (s.minutes || 0), 0);
  const flashcardsToday = state.flashIdx || 0; // simple proxy
  const goalProgressToday = (state.goals || []).some(g => g.updatedAt === today());
  const milestonesDone = (state.goals || []).reduce((a, g) =>
    a + (g.milestones || []).filter(m => m.done && m.doneAt === today()).length, 0);

  // Time-based checks
  const now = new Date();
  const hour = now.getHours();
  const earlyActivity = hour < 8 && (tasksDone > 0 || habitsDone > 0 || focusToday > 0);
  const morningHabit = hour < 12 && habitsDone > 0;

  // Combo
  const areasActive = [
    tasksDone > 0,
    habitsDone > 0,
    focusToday > 0,
    noteToday,
    moodToday,
    medToday > 0,
    workoutsToday > 0,
    mealsToday > 0,
    journalToday,
  ].filter(Boolean).length;

  state.quests.list.forEach(q => {
    let p = 0;
    if (q.type === 'task') p = tasksDone;
    else if (q.type === 'priority_task') p = priorityTasksDone;
    else if (q.type === 'habit') p = habitsDone;
    else if (q.type === 'all_habits') p = (state.habits.length && habitsDone === state.habits.length) ? 1 : 0;
    else if (q.type === 'morning_habit') p = morningHabit ? 1 : 0;
    else if (q.type === 'focus') p = focusToday;
    else if (q.type === 'focus_count') p = focusSessions.length;
    else if (q.type === 'water') p = water;
    else if (q.type === 'note') p = notesCount || (noteToday ? 1 : 0);
    else if (q.type === 'journal') p = journalToday ? 1 : 0;
    else if (q.type === 'mood') p = moodToday ? 1 : 0;
    else if (q.type === 'good_mood') p = moodValue >= 4 ? 1 : 0;
    else if (q.type === 'meditate') p = medToday;
    else if (q.type === 'workout') p = workoutsToday;
    else if (q.type === 'reading') p = readingMinutes;
    else if (q.type === 'flashcard') p = flashcardsToday;
    else if (q.type === 'goal_progress') p = goalProgressToday ? 1 : 0;
    else if (q.type === 'milestone') p = milestonesDone;
    else if (q.type === 'meal') p = mealsToday;
    else if (q.type === 'combo_3') p = areasActive >= 3 ? 1 : 0;
    else if (q.type === 'perfect_day') p = areasActive >= 5 ? 1 : 0;
    else if (q.type === 'early_active') p = earlyActivity ? 1 : 0;

    q.progress = Math.min(q.goal, p);
    if (!q.done && q.progress >= q.goal) {
      q.done = true;
      addXp(q.xp, `Kvest: ${q.name}`);
      try { window.confetti?.fire({ x: window.innerWidth - 100, y: 100, count: 40 }); } catch {}
      try { fx?.play('achievement'); } catch {}
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
**bold** *italic* code
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



// ════════════════════════════════════════════
// LUMIO REMINDERS — Smart Notification System
// ════════════════════════════════════════════
// Each reminder: {
//   id, emoji, title, message, time: "HH:MM",
//   days: [0..6] (0=Sunday), enabled, lastFired: "YYYY-MM-DD"
// }

const REMINDER_TEMPLATES = {
  book:       { emoji: '📚', title: 'Kitob o\'qish', message: 'Bugun kitob o\'qishni unutmang! 30 daqiqa ham yetadi 📖', time: '21:00' },
  water:      { emoji: '💧', title: 'Suv ichish vaqti', message: 'Suv ichib qo\'ying — sog\'lom miya uchun zarur', time: '10:00' },
  exercise:   { emoji: '💪', title: 'Sport mashqi', message: 'Tana harakatga muhtoj! 15 daqiqa ham juda yaxshi', time: '07:00' },
  meditation: { emoji: '🧘', title: 'Meditatsiya', message: '5 daqiqa nafas oling va miyangizga dam bering', time: '22:00' },
  study:      { emoji: '📖', title: 'O\'qish vaqti', message: 'Bugungi rejangizni eslang — 25 daqiqalik fokus sessiyasi?', time: '19:00' },
  sleep:      { emoji: '😴', title: 'Uyqu vaqti yaqin', message: 'Sog\'lom hayot uchun 7-8 soatlik uyqu kerak. Telefonni qo\'ying!', time: '23:00' },
  stretch:    { emoji: '🤸', title: 'Cho\'zilish', message: '2 daqiqa cho\'ziling — kompyuter oldida o\'tirgan tana uchun', time: '15:00' },
  break:      { emoji: '☕', title: 'Pauza', message: 'Ishni to\'xtating va 5 daqiqa dam oling', time: '14:00' },
};

const DAY_NAMES_SHORT = ['Ya','Du','Se','Ch','Pa','Ju','Sh'];
const DAY_NAMES_FULL = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];

// Make sure state has reminders array
function _ensureReminders() {
  if (!state) return;
  if (!Array.isArray(state.reminders)) state.reminders = [];
}

function addQuickReminder(key) {
  _ensureReminders();
  const tpl = REMINDER_TEMPLATES[key];
  if (!tpl) return;
  state.reminders.push({
    id: uid(),
    emoji: tpl.emoji,
    title: tpl.title,
    message: tpl.message,
    time: tpl.time,
    days: [0,1,2,3,4,5,6],
    enabled: true,
    lastFired: null,
    createdAt: today(),
  });
  save();
  renderReminders();
  toast(`${tpl.emoji} "${tpl.title}" eslatmasi qo'shildi`, 'success');
  fx?.play?.('complete');
  ensureNotificationPermission();
}

function renderReminders() {
  _ensureReminders();
  const list = document.getElementById('remindersList');
  if (!list) return;

  // Permission card
  const permCard = document.getElementById('notifPermCard');
  if (permCard) {
    if ('Notification' in window && Notification.permission !== 'granted') {
      permCard.style.display = '';
    } else {
      permCard.style.display = 'none';
    }
  }

  const cnt = document.getElementById('remindersCount');
  if (cnt) cnt.textContent = state.reminders.length ? `${state.reminders.filter(r => r.enabled).length} faol / ${state.reminders.length} jami` : '';

  if (!state.reminders.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔔</div><h3>Eslatmalar yo'q</h3><p>Yuqoridagi shablondan birini tanlang yoki "Yangi eslatma" tugmasini bosing</p></div>`;
    return;
  }

  // Sort by time
  const sorted = [...state.reminders].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  list.innerHTML = sorted.map(r => `
    <div class="reminder-item ${r.enabled ? '' : 'disabled'}">
      <div class="reminder-icon">${r.emoji || '🔔'}</div>
      <div class="reminder-info">
        <div class="reminder-title">${escape(r.title)}</div>
        <div class="reminder-meta">${escape(r.message || '').slice(0, 60)}${(r.message || '').length > 60 ? '…' : ''}</div>
        <div class="reminder-days">
          ${[1,2,3,4,5,6,0].map(d => `<div class="reminder-day ${(r.days || []).includes(d) ? 'active' : ''}">${DAY_NAMES_SHORT[d][0]}</div>`).join('')}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <div class="reminder-time">${r.time || '--:--'}</div>
        <div style="display:flex;gap:4px">
          <label class="toggle" title="Yoqish/o'chirish">
            <input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="toggleReminder('${r.id}', this.checked)"/>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div style="display:flex;gap:4px">
          <button class="icon-btn" onclick="testReminder('${r.id}')" title="Sinab ko'rish"><i class="fa-solid fa-paper-plane"></i></button>
          <button class="icon-btn" onclick="editReminder('${r.id}')" title="Tahrirlash"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn" onclick="deleteReminder('${r.id}')" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleReminder(id, enabled) {
  const r = state.reminders.find(x => x.id === id);
  if (!r) return;
  r.enabled = enabled;
  save();
  renderReminders();
  toast(enabled ? 'Eslatma yoqildi' : 'Eslatma o\'chirildi', 'info');
}

function deleteReminder(id) {
  if (!confirm('Eslatmani o\'chirishni xohlaysizmi?')) return;
  state.reminders = state.reminders.filter(x => x.id !== id);
  save();
  renderReminders();
  toast('O\'chirildi', 'info');
}

function editReminder(id) {
  openModal('reminder', state.reminders.find(x => x.id === id));
}

function testReminder(id) {
  const r = state.reminders.find(x => x.id === id);
  if (!r) return;
  fireReminder(r, true);
}

// Reminder modal
const REMINDER_EMOJIS = ['🔔','📚','💧','💪','🧘','📖','😴','🤸','☕','🍎','📞','💼','🎯','✨','🌟','💡','🔥','⏰','📝','🎨','🎵','🌱','🏃','🍱','💊','🚶','📵','✍'];

function reminderModalHTML(r) {
  const isEdit = !!r;
  const days = r?.days || [1,2,3,4,5,6,0];
  return `<div class="modal-head">
    <div class="modal-title">${isEdit ? 'Eslatmani tahrirlash' : 'Yangi eslatma'}</div>
    <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <form onsubmit="saveReminder(event,'${r?.id || ''}')">
    <div class="form-group">
      <label class="form-label">Sarlavha *</label>
      <input class="input" name="title" value="${r ? escape(r.title) : ''}" placeholder="Masalan: Kitob o'qish" required autofocus/>
    </div>
    <div class="form-group">
      <label class="form-label">Xabar matni</label>
      <textarea class="textarea" name="message" rows="2" placeholder="Bugun kitob o'qishni unutmang!">${r ? escape(r.message || '') : ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Vaqt</label>
      <input class="input" type="time" name="time" value="${r?.time || '09:00'}" required style="font-size:1.05rem"/>
    </div>
    <div class="form-group">
      <label class="form-label">Kunlar</label>
      <div class="day-picker" id="dayPickerWrap">
        ${[1,2,3,4,5,6,0].map(d => `
          <button type="button" class="day-pick ${days.includes(d) ? 'active' : ''}" data-day="${d}" onclick="this.classList.toggle('active')">
            ${DAY_NAMES_SHORT[d]}
          </button>
        `).join('')}
      </div>
      <div style="display:flex;gap:6px;margin-top:6px">
        <button type="button" class="btn btn-ghost" style="font-size:.75rem;padding:5px 10px" onclick="setReminderDays('all')">Hammasi</button>
        <button type="button" class="btn btn-ghost" style="font-size:.75rem;padding:5px 10px" onclick="setReminderDays('weekdays')">Ish kunlari</button>
        <button type="button" class="btn btn-ghost" style="font-size:.75rem;padding:5px 10px" onclick="setReminderDays('weekends')">Dam olish</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Belgi (emoji)</label>
      <div class="emoji-picker">
        ${REMINDER_EMOJIS.map(e => `
          <button type="button" class="emoji-pick ${(r?.emoji || '🔔') === e ? 'active' : ''}" onclick="document.querySelectorAll('.emoji-pick').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.getElementById('reminderEmoji').value='${e}'">${e}</button>
        `).join('')}
      </div>
      <input type="hidden" id="reminderEmoji" value="${r?.emoji || '🔔'}"/>
    </div>
    <div class="modal-foot">
      ${isEdit ? `<button type="button" class="btn btn-danger" onclick="deleteReminder('${r.id}');closeModal()"><i class="fa-solid fa-trash"></i> O'chirish</button>` : ''}
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Bekor</button>
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Saqlash</button>
    </div>
  </form>`;
}

function setReminderDays(preset) {
  const wrap = document.getElementById('dayPickerWrap');
  if (!wrap) return;
  wrap.querySelectorAll('.day-pick').forEach(b => {
    const d = parseInt(b.dataset.day);
    let active = false;
    if (preset === 'all') active = true;
    else if (preset === 'weekdays') active = d >= 1 && d <= 5;
    else if (preset === 'weekends') active = d === 0 || d === 6;
    b.classList.toggle('active', active);
  });
}

function saveReminder(e, id) {
  e.preventDefault();
  _ensureReminders();
  const f = e.target;
  const days = Array.from(document.querySelectorAll('#dayPickerWrap .day-pick.active')).map(b => parseInt(b.dataset.day));
  const data = {
    title: f.title.value.trim(),
    message: f.message.value.trim(),
    time: f.time.value,
    days: days.length ? days : [0,1,2,3,4,5,6],
    emoji: document.getElementById('reminderEmoji').value || '🔔',
    enabled: true,
  };
  if (!data.title) return toast('Sarlavhani kiriting', 'error');
  if (id) {
    Object.assign(state.reminders.find(r => r.id === id), data);
    toast('Yangilandi', 'success');
  } else {
    state.reminders.push({ id: uid(), ...data, lastFired: null, createdAt: today() });
    toast('🔔 Eslatma qo\'shildi', 'success');
    fx?.play?.('complete');
    ensureNotificationPermission();
  }
  save();
  closeModal();
  renderReminders();
}

// ── Notification permission ──
async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    toast('Bildirishnomalar bloklangan. Brauzer sozlamalaridan ruxsat bering.', 'error');
    return false;
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      state.settings = state.settings || {};
      state.settings.notifications = true;
      save();
      toast('🔔 Bildirishnomalar yoqildi!', 'success');
      // Send a welcome notification
      setTimeout(() => {
        new Notification('Lumio ✨', {
          body: 'Eslatmalar muvaffaqiyatli yoqildi! Endi belgilangan vaqtda xabarnoma olasiz.',
          tag: 'welcome',
        });
      }, 600);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

window.requestNotifPermission = ensureNotificationPermission;

// ── Fire a reminder ──
function fireReminder(r, isTest = false) {
  if (!r) return;

  // Always show in-app toast
  const toastMsg = `${r.emoji || '🔔'} ${r.title}${r.message ? ' — ' + r.message : ''}`;
  toast(toastMsg, 'info', 'fa-bell');
  fx?.play?.('pop');
  fx?.haptic?.([20, 30, 20]);

  // System notification (if permission granted)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(r.title || 'Lumio eslatmasi', {
        body: r.message || 'Eslatma vaqti keldi!',
        tag: r.id,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%231a1a1a"/><text x="50" y="62" font-size="60" text-anchor="middle" fill="white">' + (r.emoji || '🔔') + '</text></svg>',
        badge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="%231a1a1a"/></svg>',
        renotify: false,
        requireInteraction: false,
      });
      n.onclick = () => { window.focus(); n.close(); };
      // Auto-close after 8s
      setTimeout(() => { try { n.close(); } catch {} }, 8000);
    } catch (e) {
      console.warn('Notification error:', e);
    }
  }

  if (!isTest) {
    r.lastFired = today();
    save();
  }
}

// ── Master scheduler — checks every minute ──
let _reminderInterval = null;
function startReminderScheduler() {
  if (_reminderInterval) return;
  // Check immediately
  checkReminderTick();
  // Then every minute, aligned to the start of each minute
  const now = new Date();
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  setTimeout(() => {
    checkReminderTick();
    _reminderInterval = setInterval(checkReminderTick, 60000);
  }, msToNextMinute);
}

function checkReminderTick() {
  _ensureReminders();
  if (!state.reminders.length) return;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;
  const currentDay = now.getDay();
  const todayStr = today();

  state.reminders.forEach(r => {
    if (!r.enabled) return;
    if (r.time !== currentTime) return;
    if (Array.isArray(r.days) && !r.days.includes(currentDay)) return;
    if (r.lastFired === todayStr) return; // already fired today
    fireReminder(r);
  });

  // Backup: check if we missed any from earlier today (e.g., user just opened tab)
  // Only fire if within last 5 minutes
  state.reminders.forEach(r => {
    if (!r.enabled || !r.time) return;
    if (Array.isArray(r.days) && !r.days.includes(currentDay)) return;
    if (r.lastFired === todayStr) return;
    const [rh, rm] = r.time.split(':').map(Number);
    const reminderMinutes = rh * 60 + rm;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = nowMinutes - reminderMinutes;
    if (diff > 0 && diff <= 5) {
      fireReminder(r);
    }
  });
}

// ── Hook into init ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    _ensureReminders();
    startReminderScheduler();
  }, 2500);
});

// ── Update PAGE_META so reminders has nice title ──
setTimeout(() => {
  if (typeof PAGE_META === 'object' && PAGE_META) {
    PAGE_META.reminders = { title: 'Eslatmalar', sub: 'Sizga qachon va nima haqida eslatish kerakligini sozlang' };
  }
}, 100);

// ── Hook into nav-click rendering for reminders page ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.nav-item[data-page="reminders"]').forEach(n => {
      n.addEventListener('click', () => {
        setTimeout(() => renderReminders(), 60);
      });
    });
  }, 1800);
});

// ── Wire up reminder modal type ──
{
  const _origOpenModal = window.openModal;
  if (_origOpenModal) {
    window.openModal = function(type, data) {
      if (type === 'reminder') {
        const c = document.getElementById('modalContent');
        if (c) {
          c.innerHTML = reminderModalHTML(data);
          document.getElementById('modalOverlay').classList.add('open');
          return;
        }
      }
      return _origOpenModal(type, data);
    };
  }
}

// ── Settings: when user toggles notifications, request permission ──
{
  const _origToggleNotif = window.toggleNotif;
  if (_origToggleNotif) {
    window.toggleNotif = function(on) {
      _origToggleNotif(on);
      if (on) ensureNotificationPermission();
    };
  }
}

// Expose globals
window.addQuickReminder = addQuickReminder;
window.toggleReminder = toggleReminder;
window.deleteReminder = deleteReminder;
window.editReminder = editReminder;
window.testReminder = testReminder;
window.saveReminder = saveReminder;
window.setReminderDays = setReminderDays;
window.renderReminders = renderReminders;
window.fireReminder = fireReminder;
window.ensureNotificationPermission = ensureNotificationPermission;

console.log('🔔 Lumio Reminders v1.0 loaded');



// ════════════════════════════════════════════
// PWA SMART INSTALL — iOS, Android, Desktop
// ════════════════════════════════════════════

const PWA = {
  // Detect platforms
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
  isMacSafari: () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: () => /Android/i.test(navigator.userAgent),
  isMobile: () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
  isStandalone: () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
  isChromium: () => /Chrome|Chromium|CriOS|Edg|OPR/.test(navigator.userAgent),
};

// Show iOS install instructions modal
function showIOSInstallGuide() {
  const c = document.getElementById('modalContent');
  if (!c) return;
  c.innerHTML = `
    <div class="ios-install-modal">
      <div class="ios-install-icon">L</div>
      <div class="ios-install-title">Lumio'ni o'rnating</div>
      <div class="ios-install-subtitle">iPhone yoki iPad'ingizga ilovadek qo'shing — ofline ishlaydi va home screen'da ikonka bo'ladi</div>

      <div class="ios-install-steps">
        <div class="ios-install-step">
          <div class="ios-step-num">1</div>
          <div class="ios-step-text">
            Pastdagi <span class="ios-share-icon"></span> <strong>Share</strong> tugmasini bosing
          </div>
        </div>
        <div class="ios-install-step">
          <div class="ios-step-num">2</div>
          <div class="ios-step-text">
            Pastga aylantiring va <span class="ios-step-icon">📱</span> <strong>"Add to Home Screen"</strong> ni tanlang
          </div>
        </div>
        <div class="ios-install-step">
          <div class="ios-step-num">3</div>
          <div class="ios-step-text">
            <strong>"Add"</strong> tugmasini bosing — Lumio home screen'ingizga qo'shiladi! ✨
          </div>
        </div>
      </div>

      <div class="android-install-banner-tip">
        <i class="fa-solid fa-circle-info"></i>
        <div>
          <strong>Maslahat:</strong> Faqat <strong>Safari brauzerida</strong> ishlaydi.
          Chrome yoki boshqa brauzerda ochsangiz, avval Safari'da oching.
        </div>
      </div>

      <div style="display:flex;justify-content:center;margin-top:1rem">
        <button class="btn btn-primary" onclick="closeModal()">Tushundim ✓</button>
      </div>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

// Show Android/Desktop install (uses native prompt)
async function triggerNativeInstall() {
  if (window.deferredPrompt) {
    try {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast('🎉 Lumio o\'rnatildi!', 'success');
        try { fx?.play?.('achievement'); } catch {}
      }
      window.deferredPrompt = null;
      const banner = document.getElementById('installBanner');
      if (banner) banner.classList.remove('show');
    } catch (e) {
      console.warn('Install error:', e);
    }
  } else {
    // Fallback for browsers that don't support beforeinstallprompt yet
    showInstallGuide();
  }
}

// Universal install entry point — picks the right flow
function showInstallGuide() {
  if (PWA.isStandalone()) {
    toast('✓ Lumio allaqachon o\'rnatilgan!', 'success');
    return;
  }
  if (PWA.isIOS() || PWA.isMacSafari()) {
    showIOSInstallGuide();
  } else if (window.deferredPrompt) {
    triggerNativeInstall();
  } else {
    showGenericInstallGuide();
  }
}

// Generic instructions (Chrome desktop, Edge, Firefox, etc.)
function showGenericInstallGuide() {
  const c = document.getElementById('modalContent');
  if (!c) return;
  const isMobile = PWA.isMobile();
  c.innerHTML = `
    <div class="ios-install-modal">
      <div class="ios-install-icon">L</div>
      <div class="ios-install-title">Lumio'ni o'rnating</div>
      <div class="ios-install-subtitle">${isMobile ? 'Telefoningizga' : 'Kompyuteringizga'} ilovadek qo'shing</div>

      <div class="ios-install-steps">
        <div class="ios-install-step">
          <div class="ios-step-num">1</div>
          <div class="ios-step-text">
            Brauzer manzil satrining yonidagi <span class="ios-step-icon">⋮</span> <strong>menyu</strong> tugmasini bosing
          </div>
        </div>
        <div class="ios-install-step">
          <div class="ios-step-num">2</div>
          <div class="ios-step-text">
            <strong>"${isMobile ? 'Add to Home Screen' : 'Install Lumio'}"</strong> ni tanlang
          </div>
        </div>
        <div class="ios-install-step">
          <div class="ios-step-num">3</div>
          <div class="ios-step-text">
            <strong>"Install"</strong> ni bosing — Lumio mustaqil ilovadek ochiladi
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:center;margin-top:1rem">
        <button class="btn btn-primary" onclick="closeModal()">Tushundim ✓</button>
      </div>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

// Auto-show floating tip on first mobile visit (after 30s)
function maybeShowMobileTip() {
  if (PWA.isStandalone()) return;
  if (!PWA.isMobile()) return;
  if (localStorage.getItem('lumio_install_tip_dismissed')) return;
  const used = localStorage.getItem('lumio_visits') || '0';
  const visits = parseInt(used) + 1;
  localStorage.setItem('lumio_visits', String(visits));
  if (visits < 2) return; // Only after 2nd visit

  setTimeout(() => {
    const tip = document.createElement('div');
    tip.className = 'pwa-tip-floater';
    tip.innerHTML = `<i class="fa-solid fa-mobile-screen"></i><span>Lumio'ni o'rnatish <small>(home screen'ga qo'shish)</small></span>`;
    tip.onclick = () => {
      tip.remove();
      showInstallGuide();
    };
    document.body.appendChild(tip);
    setTimeout(() => tip.classList.add('show'), 100);
    // Auto-dismiss after 8s
    setTimeout(() => {
      tip.classList.remove('show');
      setTimeout(() => tip.remove(), 400);
      localStorage.setItem('lumio_install_tip_dismissed', '1');
    }, 8000);
  }, 25000);
}

// Smart install banner trigger
function maybeShowInstallBanner() {
  if (PWA.isStandalone()) return;
  if (localStorage.getItem('lumio_install_banner_dismissed')) return;
  const banner = document.getElementById('installBanner');
  if (!banner) return;

  // For Chromium browsers — show only when prompt is available (after 2 min)
  if (window.deferredPrompt) {
    setTimeout(() => banner.classList.add('show'), 60000);
  }
}

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  setTimeout(() => maybeShowInstallBanner(), 30000);
});

// Detect successful install
window.addEventListener('appinstalled', () => {
  toast('🎉 Lumio o\'rnatildi! Endi home screen\'dan oching', 'success');
  try { window.confetti?.celebrate(); } catch {}
  try { fx?.play?.('achievement'); } catch {}
  localStorage.setItem('lumio_installed', '1');
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.remove('show');
});

// Handle banner dismissal — remember it
{
  setTimeout(() => {
    const closeBtn = document.querySelector('#installBanner .icon-btn:last-child');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        localStorage.setItem('lumio_install_banner_dismissed', '1');
      });
    }
  }, 1000);
}

// Override the existing installPWA function with smart routing
window.installPWA = function() {
  showInstallGuide();
};

// Expose
window.showInstallGuide = showInstallGuide;
window.showIOSInstallGuide = showIOSInstallGuide;
window.PWA = PWA;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Mark as standalone if running in PWA mode
  if (PWA.isStandalone()) {
    document.documentElement.classList.add('standalone');
    document.body.classList.add('pwa-mode');
  }

  // Show floating tip on mobile first-time users
  setTimeout(maybeShowMobileTip, 1500);

  // Add an "Install Lumio" item to settings (if not already standalone)
  setTimeout(() => {
    if (PWA.isStandalone()) return;
    const settingsContent = document.querySelector('#page-settings .settings-grid');
    if (settingsContent && !document.getElementById('pwaInstallCard')) {
      const card = document.createElement('div');
      card.id = 'pwaInstallCard';
      card.className = 'card';
      card.innerHTML = `
        <div class="card-head"><h2 class="h2">📱 Ilova sifatida o'rnatish</h2></div>
        <p class="muted mb-2" style="font-size:.86rem;line-height:1.5">
          Lumio'ni telefon yoki kompyuteringizga ilovadek o'rnating. Ofline ishlaydi va tezroq ochiladi.
        </p>
        <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="showInstallGuide()">
          <i class="fa-solid fa-download"></i> O'rnatish bo'yicha ko'rsatma
        </button>
      `;
      settingsContent.insertBefore(card, settingsContent.firstChild);
    }
  }, 2000);
});

console.log('📱 Lumio PWA install module loaded. Standalone:', PWA.isStandalone());



// ════════════════════════════════════════════
// LUMIO v1.2 FINAL — 10 Polish Improvements
// ════════════════════════════════════════════

// ────────────────────────────────────────────
// 1) AUTO STREAK REFRESH — kun o'zgarganda yangilanadi
// ────────────────────────────────────────────
let _lastDateCheck = today();
function checkDateChange() {
  const cur = today();
  if (cur !== _lastDateCheck) {
    _lastDateCheck = cur;
    // Kun o'zgardi — barcha sahifalarni yangilash
    try {
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderHabits === 'function' && document.querySelector('#page-habits.active')) renderHabits();
      if (typeof renderTasks === 'function' && document.querySelector('#page-tasks.active')) renderTasks();
      if (typeof renderQuests === 'function') renderQuests();
      // Achievements check
      const gs = typeof globalStreak === 'function' ? globalStreak() : 0;
      if (gs >= 100) try { unlockAch?.('streak_100'); } catch {}
      else if (gs >= 30) try { unlockAch?.('streak_30'); } catch {}
      else if (gs >= 7) try { unlockAch?.('streak_7'); } catch {}
      else if (gs >= 3) try { unlockAch?.('streak_3'); } catch {}
      // Reset daily quests
      if (typeof ensureDailyQuests === 'function') ensureDailyQuests();
      // Notify
      if (typeof toast === 'function') toast(`✨ Yangi kun! Streak: ${gs} kun`, 'info');
    } catch (e) { console.warn('checkDateChange:', e); }
  }
}

// Har 60 soniyada va focus event'da
setInterval(checkDateChange, 60000);
window.addEventListener('focus', checkDateChange);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkDateChange();
});

// ────────────────────────────────────────────
// 6) STORAGE LIMIT WARNING
// ────────────────────────────────────────────
function checkStorageUsage() {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2; // UTF-16
      }
    }
    const mb = total / (1024 * 1024);
    const percent = (mb / 5) * 100; // ~5MB limit
    return { mb: mb.toFixed(2), percent: Math.round(percent), bytes: total };
  } catch (e) { return { mb: 0, percent: 0, bytes: 0 }; }
}

let _storageWarningShown = false;
function checkStorageAndWarn() {
  const usage = checkStorageUsage();
  if (usage.percent >= 95 && !_storageWarningShown) {
    _storageWarningShown = true;
    showStorageWarning(usage, 'critical');
  } else if (usage.percent >= 80 && !_storageWarningShown) {
    _storageWarningShown = true;
    showStorageWarning(usage, 'warn');
  }
}

function showStorageWarning(usage, level) {
  const c = document.getElementById('modalContent');
  if (!c) return;
  const isCritical = level === 'critical';
  c.innerHTML = `
    <div class="modal-head">
      <div class="modal-title">${isCritical ? '🔴' : '⚠️'} Xotira ${isCritical ? 'to\'lib bormoqda' : 'tugayapti'}</div>
      <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div style="padding:1rem 0">
      <div style="text-align:center;margin-bottom:1.5rem">
        <div style="font-size:3rem;margin-bottom:8px">${isCritical ? '🚨' : '💾'}</div>
        <div style="font-size:1.4rem;font-weight:700;margin-bottom:4px">${usage.mb} MB / ~5 MB</div>
        <div class="muted" style="font-size:.9rem">Foydalanish: ${usage.percent}%</div>
        <div style="height:8px;background:var(--border);border-radius:99px;margin-top:8px;overflow:hidden">
          <div style="height:100%;background:${isCritical ? 'var(--red)' : 'var(--orange)'};border-radius:99px;width:${Math.min(100, usage.percent)}%;transition:width .8s"></div>
        </div>
      </div>
      <p style="font-size:.88rem;line-height:1.6;color:var(--text2);margin-bottom:1rem">
        ${isCritical
          ? "Xotira deyarli to'la! Eski ma'lumotlarni tozalashingiz tavsiya etiladi. Avval backup oling."
          : "Xotira to'lib bormoqda. Hech narsa yo'qolmaydi, lekin tez orada backup olib qo'ying."}
      </p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-primary" style="justify-content:center" onclick="closeModal();exportAll()"><i class="fa-solid fa-download"></i> Backup yuklab olish</button>
        ${isCritical ? '<button class="btn btn-secondary" style="justify-content:center" onclick="cleanOldData()"><i class="fa-solid fa-broom"></i> Eski ma\'lumotlarni tozalash</button>' : ''}
        <button class="btn btn-ghost" style="justify-content:center" onclick="closeModal()">Keyinroq</button>
      </div>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

function cleanOldData() {
  if (!confirm('30 kundan eski mood, water va completion yozuvlari o\'chiriladi. Davom etishni xohlaysizmi?')) return;
  try {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    let cleaned = 0;
    Object.keys(state.completions || {}).forEach(d => { if (d < cutoffStr) { delete state.completions[d]; cleaned++; } });
    Object.keys(state.moods || {}).forEach(d => { if (d < cutoffStr) { delete state.moods[d]; cleaned++; } });
    Object.keys(state.water || {}).forEach(d => { if (d < cutoffStr) { delete state.water[d]; cleaned++; } });
    Object.keys(state.journal || {}).forEach(d => { if (d < cutoffStr) { delete state.journal[d]; cleaned++; } });
    save();
    closeModal();
    toast(`✅ ${cleaned} ta yozuv tozalandi`, 'success');
    _storageWarningShown = false;
  } catch (e) { console.warn(e); toast('Xato yuz berdi', 'error'); }
}

// Har 5 daqiqada storage tekshirish
setInterval(checkStorageAndWarn, 5 * 60 * 1000);
setTimeout(checkStorageAndWarn, 10000); // Birinchi tekshirish 10s keyin

window.checkStorageUsage = checkStorageUsage;
window.cleanOldData = cleanOldData;

// ────────────────────────────────────────────
// 4) PET EVOLUTION ANIMATION
// ────────────────────────────────────────────
let _lastPetStage = null;
function checkPetEvolution() {
  if (typeof getPetStage !== 'function') return;
  const stage = getPetStage();
  if (!stage) return;
  if (_lastPetStage === null) {
    _lastPetStage = stage.min;
    return;
  }
  if (stage.min > _lastPetStage) {
    // Evolutsiya!
    showPetEvolutionModal(stage);
    _lastPetStage = stage.min;
  }
}

function showPetEvolutionModal(stage) {
  const c = document.getElementById('modalContent');
  if (!c) return;
  c.innerHTML = `
    <div style="text-align:center;padding:2rem 1rem">
      <div style="font-size:.85rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);margin-bottom:1rem">✨ EVOLUTSIYA ✨</div>
      <div class="pet-evo-emoji">${stage.emoji}</div>
      <h2 style="font-size:1.5rem;font-weight:700;margin:1rem 0 .5rem">Sizning Lumi'ngiz o'zgardi!</h2>
      <p class="muted" style="margin-bottom:1.5rem">Endi u <strong style="color:var(--text)">${stage.name}</strong> bo'ldi 🎉</p>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="closeModal()">
        <i class="fa-solid fa-sparkles"></i> Ajoyib!
      </button>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  // Confetti burst
  setTimeout(() => {
    try { window.confetti?.celebrate(); } catch {}
    try { window.fx?.play('levelup'); } catch {}
    try { window.fx?.haptic([30, 50, 30, 50, 30]); } catch {}
  }, 300);
}

// Hook into renderPet
{
  const _origRenderPet = window.renderPet;
  if (_origRenderPet) {
    window.renderPet = function() {
      const before = _lastPetStage;
      _origRenderPet();
      checkPetEvolution();
    };
  }
}

setTimeout(() => {
  if (typeof getPetStage === 'function') {
    const stage = getPetStage();
    if (stage) _lastPetStage = stage.min;
  }
}, 3000);



// ────────────────────────────────────────────
// 2) FULL i18n — 3 language translation system
// ────────────────────────────────────────────
const T = {
  uz: {
    // Pages
    dashboard: 'Bosh sahifa', tasks: 'Vazifalar', habits: 'Odatlar', focus: 'Fokus',
    study: "O'qish", goals: 'Maqsadlar', notes: 'Qaydlar', calendar: 'Taqvim',
    workout: 'Sport', meals: 'Ovqatlanish', meditation: 'Meditatsiya', reading: 'Kitoblar',
    insights: 'AI Maslahatlar', analytics: 'Statistika', apps: 'Mini ilovalar',
    achievements: 'Yutuqlar', reminders: 'Eslatmalar', settings: 'Sozlamalar',
    // Common buttons
    save: 'Saqlash', cancel: 'Bekor', delete: 'O\'chirish', edit: 'Tahrirlash',
    add: 'Qo\'shish', confirm: 'Tasdiqlash', close: 'Yopish', export: 'Eksport',
    import: 'Import', search: 'Qidirish', new: 'Yangi', today: 'Bugun',
    yesterday: 'Kecha', tomorrow: 'Ertaga', loading: 'Yuklanmoqda...',
    // Toasts
    saved: 'Saqlandi', deleted: 'O\'chirildi', updated: 'Yangilandi',
    error: 'Xatolik', success: 'Muvaffaqiyatli',
    // Greetings
    morning: 'Xayrli tong', afternoon: 'Xayrli kun', evening: 'Xayrli kech', night: 'Xayrli tun',
    // Actions
    complete: 'Bajarildi', undo: 'Bekor qilish', refresh: 'Yangilash',
    // Stats
    streak: 'Streak', level: 'Daraja', xp: 'XP', score: 'Ball',
    // Misc
    welcome_back: 'Xush kelibsiz', no_data: 'Ma\'lumotlar yo\'q',
    confirm_delete: 'O\'chirilsinmi?', name: 'Ism', description: 'Tavsif',
    category: 'Kategoriya', priority: 'Ustuvorlik', deadline: 'Muddat',
    minutes: 'daqiqa', hours: 'soat', days: 'kun',
    high: 'Yuqori', medium: 'O\'rtacha', low: 'Past', none: 'Yo\'q',
    sound: 'Ovoz', notifications: 'Bildirishnomalar', animations: 'Animatsiyalar',
    profile: 'Profil', theme: 'Mavzu', language: 'Til',
    light: 'Yorug\'', dark: 'Qorong\'i',
  },
  en: {
    dashboard: 'Dashboard', tasks: 'Tasks', habits: 'Habits', focus: 'Focus',
    study: 'Study', goals: 'Goals', notes: 'Notes', calendar: 'Calendar',
    workout: 'Workout', meals: 'Meals', meditation: 'Meditation', reading: 'Reading',
    insights: 'AI Insights', analytics: 'Analytics', apps: 'Mini Apps',
    achievements: 'Achievements', reminders: 'Reminders', settings: 'Settings',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    add: 'Add', confirm: 'Confirm', close: 'Close', export: 'Export',
    import: 'Import', search: 'Search', new: 'New', today: 'Today',
    yesterday: 'Yesterday', tomorrow: 'Tomorrow', loading: 'Loading...',
    saved: 'Saved', deleted: 'Deleted', updated: 'Updated',
    error: 'Error', success: 'Success',
    morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Good night',
    complete: 'Done', undo: 'Undo', refresh: 'Refresh',
    streak: 'Streak', level: 'Level', xp: 'XP', score: 'Score',
    welcome_back: 'Welcome back', no_data: 'No data',
    confirm_delete: 'Delete this?', name: 'Name', description: 'Description',
    category: 'Category', priority: 'Priority', deadline: 'Deadline',
    minutes: 'minutes', hours: 'hours', days: 'days',
    high: 'High', medium: 'Medium', low: 'Low', none: 'None',
    sound: 'Sound', notifications: 'Notifications', animations: 'Animations',
    profile: 'Profile', theme: 'Theme', language: 'Language',
    light: 'Light', dark: 'Dark',
  },
  ru: {
    dashboard: 'Главная', tasks: 'Задачи', habits: 'Привычки', focus: 'Фокус',
    study: 'Учёба', goals: 'Цели', notes: 'Заметки', calendar: 'Календарь',
    workout: 'Спорт', meals: 'Питание', meditation: 'Медитация', reading: 'Книги',
    insights: 'AI Советы', analytics: 'Статистика', apps: 'Мини-приложения',
    achievements: 'Достижения', reminders: 'Напоминания', settings: 'Настройки',
    save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', edit: 'Изменить',
    add: 'Добавить', confirm: 'Подтвердить', close: 'Закрыть', export: 'Экспорт',
    import: 'Импорт', search: 'Поиск', new: 'Новый', today: 'Сегодня',
    yesterday: 'Вчера', tomorrow: 'Завтра', loading: 'Загрузка...',
    saved: 'Сохранено', deleted: 'Удалено', updated: 'Обновлено',
    error: 'Ошибка', success: 'Успех',
    morning: 'Доброе утро', afternoon: 'Добрый день', evening: 'Добрый вечер', night: 'Доброй ночи',
    complete: 'Готово', undo: 'Отменить', refresh: 'Обновить',
    streak: 'Серия', level: 'Уровень', xp: 'XP', score: 'Очки',
    welcome_back: 'С возвращением', no_data: 'Нет данных',
    confirm_delete: 'Удалить?', name: 'Имя', description: 'Описание',
    category: 'Категория', priority: 'Приоритет', deadline: 'Срок',
    minutes: 'минут', hours: 'часов', days: 'дней',
    high: 'Высокий', medium: 'Средний', low: 'Низкий', none: 'Нет',
    sound: 'Звук', notifications: 'Уведомления', animations: 'Анимации',
    profile: 'Профиль', theme: 'Тема', language: 'Язык',
    light: 'Светлая', dark: 'Тёмная',
  }
};

function t(key) {
  const lang = state?.lang || 'uz';
  return T[lang]?.[key] || T.uz[key] || key;
}
window.t = t;

// Apply translations to nav items + visible text
function applyI18n() {
  const lang = state?.lang || 'uz';
  // Sidebar nav labels
  document.querySelectorAll('.nav-item').forEach(n => {
    const page = n.dataset.page;
    const span = n.querySelector('span');
    if (span && T[lang][page]) span.textContent = T[lang][page];
  });
  // Update topbar if present
  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (activePage && T[lang][activePage]) {
    const tt = document.getElementById('topbarTitle');
    if (tt) tt.textContent = T[lang][activePage];
  }
  // Page heads (h1)
  const pageHeadMap = {
    'page-tasks': 'tasks', 'page-habits': 'habits', 'page-focus': 'focus',
    'page-study': 'study', 'page-goals': 'goals', 'page-notes': 'notes',
    'page-calendar': 'calendar', 'page-workout': 'workout', 'page-meals': 'meals',
    'page-meditation': 'meditation', 'page-reading': 'reading', 'page-insights': 'insights',
    'page-analytics': 'analytics', 'page-apps': 'apps', 'page-achievements': 'achievements',
    'page-reminders': 'reminders', 'page-settings': 'settings'
  };
  Object.entries(pageHeadMap).forEach(([id, key]) => {
    const h = document.querySelector(`#${id} .page-head .h1`);
    if (h && T[lang][key]) h.textContent = T[lang][key];
  });
  // Set HTML lang attr
  document.documentElement.setAttribute('lang', lang);
}
window.applyI18n = applyI18n;

// Hook into setLang
{
  const _origSetLang = window.setLang;
  window.setLang = function(lang) {
    if (typeof _origSetLang === 'function') {
      try { _origSetLang(lang); } catch {}
    } else {
      state.lang = lang;
      save();
    }
    applyI18n();
    if (typeof toast === 'function') {
      toast(lang === 'uz' ? 'Til o\'zgartirildi ✓' : lang === 'en' ? 'Language changed ✓' : 'Язык изменён ✓', 'success');
    }
  };
}

// Apply on load
setTimeout(applyI18n, 1500);

// ────────────────────────────────────────────
// 3) PDF + CSV EXPORT
// ────────────────────────────────────────────
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportTasksCSV() {
  const headers = ['Sana', 'Vazifa', 'Kategoriya', 'Ustuvorlik', 'Holat', 'Bajarilgan vaqti'];
  const rows = (state.tasks || []).map(t => [
    t.due || '',
    `"${(t.name || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.priority === 1 ? 'Yuqori' : t.priority === 2 ? 'O\'rta' : t.priority === 3 ? 'Past' : 'Yo\'q',
    t.done ? 'Bajarildi' : 'Faol',
    t.completedAt || ''
  ].join(','));
  const csv = '\ufeff' + [headers.join(','), ...rows].join('\n'); // UTF-8 BOM for Excel
  downloadFile(csv, `lumio-tasks-${today()}.csv`, 'text/csv;charset=utf-8');
  toast('📊 Vazifalar CSV eksport qilindi', 'success');
}

function exportHabitsCSV() {
  const headers = ['Odat', 'Kategoriya', 'Davriylik', 'Maqsad', 'Joriy streak', 'Eng uzun', '30 kun foiz'];
  const rows = (state.habits || []).map(h => [
    `"${(h.name || '').replace(/"/g, '""')}"`,
    `"${(h.category || '').replace(/"/g, '""')}"`,
    h.frequency || 'daily',
    h.target || 1,
    typeof calcStreak === 'function' ? calcStreak(h.id) : 0,
    typeof calcLongest === 'function' ? calcLongest(h.id) : 0,
    typeof compRate === 'function' ? compRate(h.id, 30) + '%' : '0%'
  ].join(','));
  const csv = '\ufeff' + [headers.join(','), ...rows].join('\n');
  downloadFile(csv, `lumio-habits-${today()}.csv`, 'text/csv;charset=utf-8');
  toast('📊 Odatlar CSV eksport qilindi', 'success');
}

function exportNotesPDF() {
  const notes = state.notes || [];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lumio Qaydlar</title>
<style>
body{font-family:'Helvetica',sans-serif;padding:40px;color:#1a1a1a;line-height:1.6;max-width:800px;margin:0 auto}
h1{font-size:28px;border-bottom:2px solid #1a1a1a;padding-bottom:12px;margin-bottom:24px}
.note{margin-bottom:32px;padding:20px;border:1px solid #ddd;border-radius:12px;page-break-inside:avoid}
.note h2{font-size:18px;margin:0 0 8px;color:#1a1a1a}
.note .meta{font-size:11px;color:#888;margin-bottom:12px}
.note .tags span{display:inline-block;background:#f0f0f0;padding:2px 8px;border-radius:99px;font-size:10px;margin-right:4px}
.note .content{font-size:13px;color:#333;white-space:pre-wrap}
.footer{text-align:center;color:#999;font-size:11px;margin-top:40px;border-top:1px solid #eee;padding-top:20px}
</style></head><body>
<h1>📝 Lumio Qaydlar</h1>
<p style="color:#666">Eksport qilingan: ${new Date().toLocaleString('uz-UZ')}</p>
${notes.map(n => `
<div class="note">
  <h2>${escape(n.title || 'Nomsiz')}</h2>
  <div class="meta">${n.updatedAt || n.createdAt || ''}</div>
  ${(n.tags || []).length ? `<div class="tags">${(n.tags || []).map(t => `<span>#${escape(t)}</span>`).join('')}</div>` : ''}
  <div class="content">${escape(n.content || '')}</div>
</div>
`).join('')}
<div class="footer">Made with Lumio · lumio.app</div>
</body></html>`;
  
  // Open print preview in new window
  const win = window.open('', '_blank');
  if (!win) { toast('Pop-up bloklangan', 'error'); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
  toast('📄 PDF tayyorlanmoqda... Print dialogini saqlash uchun "PDF" ni tanlang', 'info');
}

function exportReportPDF() {
  const stats = typeof todayStats === 'function' ? todayStats() : { t: 0, d: 0, r: 0 };
  const gs = typeof globalStreak === 'function' ? globalStreak() : 0;
  const totalTasks = (state.tasks || []).length;
  const doneTasks = (state.tasks || []).filter(t => t.done).length;
  const totalHabits = (state.habits || []).length;
  const totalNotes = (state.notes || []).length;
  const totalGoals = (state.goals || []).length;
  
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lumio Hisobot</title>
<style>
body{font-family:'Helvetica',sans-serif;padding:40px;color:#1a1a1a;line-height:1.6;max-width:800px;margin:0 auto}
h1{font-size:32px;margin-bottom:8px}
.subtitle{color:#666;margin-bottom:32px;font-size:14px}
.section{margin-bottom:32px}
.section h2{font-size:18px;border-bottom:2px solid #1a1a1a;padding-bottom:8px;margin-bottom:16px}
.stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px}
.stat{padding:16px;border:1px solid #ddd;border-radius:12px}
.stat-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em}
.stat-val{font-size:28px;font-weight:700;margin-top:4px}
table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #eee;font-size:12px}
th{background:#f9f9f9;font-weight:600}
.footer{text-align:center;color:#999;font-size:11px;margin-top:40px;border-top:1px solid #eee;padding-top:20px}
.user{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.avatar{width:48px;height:48px;border-radius:50%;background:#1a1a1a;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px}
</style></head><body>

<h1>📊 Lumio Hisobot</h1>
<div class="subtitle">${new Date().toLocaleDateString('uz-UZ', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</div>

<div class="user">
  <div class="avatar">${(state.user?.name || 'U').charAt(0).toUpperCase()}</div>
  <div>
    <div style="font-weight:700;font-size:16px">${escape(state.user?.name || 'Foydalanuvchi')}</div>
    <div style="font-size:12px;color:#666">Daraja ${state.user?.level || 1} · ${state.user?.xp || 0} XP</div>
  </div>
</div>

<div class="section">
  <h2>📈 Asosiy ko'rsatkichlar</h2>
  <div class="stats-grid">
    <div class="stat"><div class="stat-label">Streak</div><div class="stat-val">${gs} kun</div></div>
    <div class="stat"><div class="stat-label">Daraja</div><div class="stat-val">${state.user?.level || 1}</div></div>
    <div class="stat"><div class="stat-label">XP</div><div class="stat-val">${state.user?.xp || 0}</div></div>
    <div class="stat"><div class="stat-label">Yutuqlar</div><div class="stat-val">${(state.achievements || []).length}</div></div>
  </div>
</div>

<div class="section">
  <h2>📋 Vazifalar</h2>
  <table>
    <tr><td>Jami</td><td><strong>${totalTasks}</strong></td></tr>
    <tr><td>Bajarilgan</td><td><strong>${doneTasks}</strong></td></tr>
    <tr><td>Foiz</td><td><strong>${totalTasks ? Math.round(doneTasks/totalTasks*100) : 0}%</strong></td></tr>
  </table>
</div>

<div class="section">
  <h2>⚡ Odatlar (${totalHabits} ta)</h2>
  <table>
    <tr><th>Nomi</th><th>Streak</th><th>30 kun</th></tr>
    ${(state.habits || []).map(h => `
      <tr>
        <td>${escape(h.name)}</td>
        <td>${typeof calcStreak === 'function' ? calcStreak(h.id) : 0} kun</td>
        <td>${typeof compRate === 'function' ? compRate(h.id, 30) : 0}%</td>
      </tr>
    `).join('')}
  </table>
</div>

<div class="section">
  <h2>🎯 Maqsadlar (${totalGoals} ta)</h2>
  <table>
    ${(state.goals || []).map(g => `
      <tr>
        <td>${escape(g.name)}</td>
        <td>${g.milestones ? Math.round(g.milestones.filter(m=>m.done).length/Math.max(1,g.milestones.length)*100) : 0}%</td>
      </tr>
    `).join('')}
  </table>
</div>

<div class="footer">
  Bu hisobot Lumio v1.2 yordamida yaratildi · lumio.app · ${new Date().toLocaleString('uz-UZ')}
</div>
</body></html>`;
  
  const win = window.open('', '_blank');
  if (!win) { toast('Pop-up bloklangan — ruxsat bering', 'error'); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
  toast('📄 Hisobot tayyor — Print dialogida "PDF" ni tanlang', 'info');
}

window.exportTasksCSV = exportTasksCSV;
window.exportHabitsCSV = exportHabitsCSV;
window.exportNotesPDF = exportNotesPDF;
window.exportReportPDF = exportReportPDF;

// Add export options to settings
setTimeout(() => {
  const settingsGrid = document.querySelector('#page-settings .settings-grid');
  if (!settingsGrid || document.getElementById('exportOptionsCard')) return;
  const card = document.createElement('div');
  card.className = 'card';
  card.id = 'exportOptionsCard';
  card.innerHTML = `
    <div class="card-head"><h2 class="h2">📤 Hisobotlar va eksport</h2></div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-secondary" style="justify-content:flex-start" onclick="exportReportPDF()"><i class="fa-solid fa-file-pdf"></i> Umumiy hisobot (PDF)</button>
      <button class="btn btn-secondary" style="justify-content:flex-start" onclick="exportNotesPDF()"><i class="fa-solid fa-note-sticky"></i> Qaydlar (PDF)</button>
      <button class="btn btn-secondary" style="justify-content:flex-start" onclick="exportTasksCSV()"><i class="fa-solid fa-list-check"></i> Vazifalar (CSV)</button>
      <button class="btn btn-secondary" style="justify-content:flex-start" onclick="exportHabitsCSV()"><i class="fa-solid fa-bolt"></i> Odatlar (CSV)</button>
    </div>
    <p class="muted" style="font-size:.78rem;margin-top:.8rem;line-height:1.5">CSV fayllar Excel/Google Sheets'da ochiladi. PDF — print dialogida "Save as PDF" ni tanlang.</p>
  `;
  settingsGrid.appendChild(card);
}, 2500);

// ────────────────────────────────────────────
// 7) VOICE INPUT FALLBACK (Safari-friendly)
// ────────────────────────────────────────────
function isVoiceSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function showVoiceFallback() {
  const c = document.getElementById('modalContent');
  if (!c) return;
  const browser = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS/.test(navigator.userAgent) ? 'Safari' : 'brauzeringiz';
  c.innerHTML = `
    <div class="voice-fallback-modal">
      <i class="fa-solid fa-microphone-slash"></i>
      <h3 style="font-size:1.2rem;margin-bottom:.5rem">Ovozli kiritish ishlamaydi</h3>
      <p class="muted" style="margin-bottom:1rem">Sizning ${browser} ovozli kiritishni qo'llab-quvvatlamaydi.</p>
      <p style="font-size:.85rem;margin-bottom:1.5rem;color:var(--text2);line-height:1.6">
        💡 Maslahat: Chrome yoki Edge'da yaxshi ishlaydi.<br>
        iOS uchun — iOS 14.5+ versiyada qisman ishlaydi.
      </p>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="closeModal();openModal('task')">
        <i class="fa-solid fa-keyboard"></i> Klaviatura bilan kiritish
      </button>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

// Hook into voice button
{
  const _origToggleVoice = window.toggleVoice;
  if (_origToggleVoice) {
    window.toggleVoice = function() {
      if (!isVoiceSupported()) {
        showVoiceFallback();
        return;
      }
      _origToggleVoice();
    };
  }
}

window.isVoiceSupported = isVoiceSupported;
window.showVoiceFallback = showVoiceFallback;



// ────────────────────────────────────────────
// 5) DRAG & DROP — touch event support for mobile
// ────────────────────────────────────────────
let _touchDrag = null;

function setupTouchDragDrop() {
  const board = document.querySelector('.kanban');
  if (!board) return;

  // Setup all current cards and observe new ones
  const setupCard = (card) => {
    if (card._touchSetup) return;
    card._touchSetup = true;

    card.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const rect = card.getBoundingClientRect();
      _touchDrag = {
        card,
        id: card.dataset.id,
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
        startX: touch.clientX,
        startY: touch.clientY,
        ghost: null,
        moved: false
      };
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (!_touchDrag || _touchDrag.card !== card) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - _touchDrag.startX);
      const dy = Math.abs(touch.clientY - _touchDrag.startY);
      
      if (!_touchDrag.moved && (dx > 8 || dy > 8)) {
        _touchDrag.moved = true;
        // Create ghost
        const g = card.cloneNode(true);
        g.style.position = 'fixed';
        g.style.zIndex = '99999';
        g.style.width = card.offsetWidth + 'px';
        g.style.pointerEvents = 'none';
        g.style.opacity = '0.85';
        g.style.transform = 'rotate(2deg) scale(1.03)';
        g.style.boxShadow = '0 12px 40px rgba(0,0,0,.25)';
        g.style.transition = 'none';
        g.classList.add('touch-dragging');
        document.body.appendChild(g);
        _touchDrag.ghost = g;
        card.style.opacity = '0.3';
        try { window.fx?.haptic(20); } catch {}
        e.preventDefault();
      }
      
      if (_touchDrag.moved) {
        e.preventDefault();
        const g = _touchDrag.ghost;
        if (g) {
          g.style.left = (touch.clientX - _touchDrag.offsetX) + 'px';
          g.style.top = (touch.clientY - _touchDrag.offsetY) + 'px';
        }
        // Highlight column under finger
        document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drop-zone-active'));
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const col = target?.closest('.kanban-col');
        if (col) col.classList.add('drop-zone-active');
      }
    }, { passive: false });

    card.addEventListener('touchend', (e) => {
      if (!_touchDrag || _touchDrag.card !== card) return;
      const touch = e.changedTouches[0];
      
      if (_touchDrag.moved) {
        // Find drop target
        if (_touchDrag.ghost) _touchDrag.ghost.style.display = 'none';
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const col = target?.closest('.kanban-col');
        
        if (col && col.dataset.col && _touchDrag.id) {
          const t = (state.tasks || []).find(x => x.id === _touchDrag.id);
          if (t) {
            const colId = col.dataset.col;
            if (colId === 'done') { t.done = true; t.completedAt = today(); }
            else if (colId === 'doing') { t.priority = 1; t.done = false; }
            else if (colId === 'review') { t.due = today(); t.done = false; }
            else { t.priority = 3; t.done = false; }
            try { save(); } catch {}
            try { window.fx?.haptic([20, 30, 20]); } catch {}
            try { window.fx?.play('pop'); } catch {}
            try { renderKanban(); } catch {}
          }
        }
      }
      
      // Cleanup
      if (_touchDrag.ghost) _touchDrag.ghost.remove();
      card.style.opacity = '';
      document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drop-zone-active'));
      _touchDrag = null;
    }, { passive: true });

    card.addEventListener('touchcancel', () => {
      if (!_touchDrag) return;
      if (_touchDrag.ghost) _touchDrag.ghost.remove();
      _touchDrag.card.style.opacity = '';
      document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drop-zone-active'));
      _touchDrag = null;
    });
  };

  document.querySelectorAll('.kanban-card').forEach(setupCard);

  // Observe new cards
  if (!window._kanbanObserver) {
    window._kanbanObserver = new MutationObserver(() => {
      document.querySelectorAll('.kanban-card').forEach(setupCard);
    });
    const kb = document.querySelector('#tasksContainer');
    if (kb) window._kanbanObserver.observe(kb, { childList: true, subtree: true });
  }
}

// Re-setup whenever kanban renders
{
  const _origRenderKanban = window.renderKanban;
  if (_origRenderKanban) {
    window.renderKanban = function() {
      _origRenderKanban();
      setTimeout(setupTouchDragDrop, 50);
    };
  }
}

setTimeout(setupTouchDragDrop, 2000);
window.setupTouchDragDrop = setupTouchDragDrop;

// ────────────────────────────────────────────
// 8) KEYBOARD NAVIGATION + EMPTY STATES
// ────────────────────────────────────────────

// Focus trap for modals (Tab cycles through focusable elements)
function setupModalFocusTrap() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const modal = document.querySelector('.modal-overlay.open .modal');
    if (!modal) return;
    
    const focusable = modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
setupModalFocusTrap();

// Quick keyboard shortcuts on dashboard cards (1-9 to focus stat cards)
document.addEventListener('keydown', (e) => {
  // Skip if in input
  const tag = (document.activeElement?.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag)) return;
  if (document.querySelector('.modal-overlay.open')) return;
  
  // Cmd/Ctrl + S = save (export trigger)
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    try { save(); toast('💾 Saqlandi', 'success'); } catch {}
    return;
  }
  
  // Cmd/Ctrl + E = export
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault();
    try { exportAll(); } catch {}
    return;
  }
});

// Improve empty states with helpful tips
function enhanceEmptyStates() {
  const emptyTips = {
    tasks: [
      { icon: 'fa-keyboard', text: 'N tugmasini bosib tezkor vazifa qo\'shing' },
      { icon: 'fa-microphone', text: 'V tugmasi bilan ovoz orqali kiritish' },
      { icon: 'fa-magnifying-glass', text: '⌘K bilan istalgan joyga o\'tish' }
    ],
    habits: [
      { icon: 'fa-sparkles', text: '12 ta tayyor shabloni mavjud' },
      { icon: 'fa-fire', text: 'Streak yarating va XP oling' },
      { icon: 'fa-chart-line', text: 'Yillik heatmap kuzatuv' }
    ],
    notes: [
      { icon: 'fa-tag', text: 'Teglar bilan tartibga soling' },
      { icon: 'fa-magnifying-glass', text: 'Tezkor qidiruv' },
      { icon: 'fa-file-pdf', text: 'PDF eksport mumkin' }
    ]
  };
  
  // Inject tips into empty states (only if not already present)
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.empty-state').forEach(empty => {
      if (empty._enhanced) return;
      const page = empty.closest('.page')?.id?.replace('page-', '');
      const tips = emptyTips[page];
      if (!tips) return;
      
      empty._enhanced = true;
      const tipsEl = document.createElement('div');
      tipsEl.className = 'empty-tips';
      tipsEl.innerHTML = tips.map(t => `
        <div class="empty-tip">
          <i class="fa-solid ${t.icon}"></i>
          <span>${t.text}</span>
        </div>
      `).join('');
      empty.appendChild(tipsEl);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
setTimeout(enhanceEmptyStates, 2000);

// ────────────────────────────────────────────
// 9) PERFORMANCE — render throttling + lazy load
// ────────────────────────────────────────────

// Throttle expensive renders
function throttleRender(fn, ms = 100) {
  let pending = false;
  let lastArgs;
  return function(...args) {
    lastArgs = args;
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      try { fn.apply(this, lastArgs); } finally { pending = false; }
    });
  };
}

// Throttle the heavy renderers
['renderTasks', 'renderHabits', 'renderHeatmap', 'renderFullCalendar'].forEach(name => {
  const orig = window[name];
  if (typeof orig === 'function') {
    const throttled = throttleRender(orig, 16);
    window[name] = throttled;
  }
});

// Pagination for large task lists (only render first 50, "load more" on scroll)
let _taskRenderLimit = 50;
{
  const _origRenderTasks = window.renderTasks;
  if (_origRenderTasks) {
    window.renderTasks = function() {
      _origRenderTasks();
      // If list view has more than 50 items, add load-more button
      const container = document.getElementById('tasksContainer');
      if (!container) return;
      const list = container.querySelector('.tasks-list');
      if (!list) return;
      const items = list.querySelectorAll('.task-item');
      if (items.length > _taskRenderLimit) {
        // Hide items beyond limit
        items.forEach((item, i) => {
          if (i >= _taskRenderLimit) item.style.display = 'none';
        });
        // Add load more if not already
        if (!list.querySelector('.load-more-btn')) {
          const btn = document.createElement('button');
          btn.className = 'btn btn-secondary load-more-btn';
          btn.style.cssText = 'width:100%;justify-content:center;margin-top:8px';
          btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Yana ${items.length - _taskRenderLimit} ta ko'rish`;
          btn.onclick = () => {
            _taskRenderLimit += 50;
            window.renderTasks();
          };
          list.appendChild(btn);
        }
      }
    };
  }
}

// Lazy loading for charts — only render when visible
function setupLazyCharts() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const canvas = e.target;
        if (canvas.dataset.lazyChart && !canvas.dataset.charted) {
          canvas.dataset.charted = '1';
          // Trigger render
          const fnName = canvas.dataset.lazyChart;
          if (typeof window[fnName] === 'function') {
            try { window[fnName](); } catch (err) { console.warn(err); }
          }
        }
      }
    });
  }, { rootMargin: '100px' });
  document.querySelectorAll('canvas[data-lazy-chart]').forEach(c => obs.observe(c));
}
setTimeout(setupLazyCharts, 2000);

// Reduce render frequency on hidden pages (already partially done, reinforce)
const _heavyRendersList = ['renderHeatmap', 'renderAdvancedAnalytics', 'renderFullCalendar', 'renderInsights'];
_heavyRendersList.forEach(name => {
  const orig = window[name];
  if (typeof orig === 'function' && !orig._wrapped) {
    window[name] = function(...args) {
      if (document.visibilityState === 'hidden') return;
      // Skip if expected page is not visible
      const pageMap = {
        renderHeatmap: 'page-habits',
        renderAdvancedAnalytics: 'page-analytics',
        renderFullCalendar: 'page-calendar',
        renderInsights: 'page-insights'
      };
      const pageId = pageMap[name];
      if (pageId) {
        const page = document.getElementById(pageId);
        if (page && !page.classList.contains('active')) {
          // Don't run on hidden page, but allow if explicitly active in next frame
          return;
        }
      }
      return orig.apply(this, args);
    };
    window[name]._wrapped = true;
  }
});

// Image/icon lazy loading
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img').forEach(img => {
    if (!img.loading) img.loading = 'lazy';
  });
});

console.log('✨ Lumio v1.2 Final — all 10 polish improvements loaded');



// ════════════════════════════════════════════
// SW UPDATE DETECTION (v3) — auto-prompt new version
// ════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.update();
    setInterval(() => reg.update(), 60000);
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(newSW);
        }
      });
    });
  }).catch(() => {});

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

function showUpdateBanner(newSW) {
  const existing = document.getElementById('lumioUpdateBanner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'lumioUpdateBanner';
  banner.style.cssText = 'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%) translateY(150%);background:var(--accent);color:var(--bg);padding:12px 18px;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.25);z-index:8000;display:flex;align-items:center;gap:12px;max-width:90%;transition:transform .35s cubic-bezier(.34,1.56,.64,1);font-family:inherit';
  banner.innerHTML = '<i class="fa-solid fa-arrow-rotate-right" style="font-size:1.2rem"></i><div style="flex:1"><div style="font-weight:700;font-size:.9rem">Yangi versiya tayyor!</div><div style="font-size:.75rem;opacity:.85">Yangilash uchun bosing</div></div><button id="lumioUpdateBtn" style="background:rgba(255,255,255,.2);border:none;color:inherit;padding:7px 14px;border-radius:8px;font-weight:700;font-size:.82rem;cursor:pointer;font-family:inherit">Yangilash</button><button id="lumioUpdateClose" style="background:none;border:none;color:inherit;cursor:pointer;font-size:1rem;padding:4px;opacity:.7">×</button>';
  document.body.appendChild(banner);
  setTimeout(() => banner.style.transform = 'translateX(-50%) translateY(0)', 100);
  document.getElementById('lumioUpdateBtn').onclick = () => {
    newSW.postMessage('SKIP_WAITING');
  };
  document.getElementById('lumioUpdateClose').onclick = () => {
    banner.style.transform = 'translateX(-50%) translateY(150%)';
    setTimeout(() => banner.remove(), 400);
  };
}

window.addEventListener('focus', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(r => r && r.update());
  }
});

console.log('🔄 SW auto-update enabled');



// ════════════════════════════════════════════
// WORKOUT TEMPLATES — Uy mashqlari shablonlari
// ════════════════════════════════════════════
const WORKOUT_TEMPLATES = [
  {
    id: 'wt_morning',
    icon: '🌅',
    name: "Ertalabki uyg'onish (5-10 daq)",
    desc: "Yengil cho'zilish va energiya berish",
    type: 'Cho\'zilish',
    exercises: [
      { name: 'Bo\'yin aylanmasi', sets: '2', reps: '10' },
      { name: 'Yelka aylanasi', sets: '2', reps: '10' },
      { name: 'Cho\'kkalab cho\'zilish', sets: '1', reps: '30s' },
      { name: 'Tovon ko\'tarish', sets: '2', reps: '15' },
      { name: 'Chuqur nafas olish', sets: '1', reps: '5 sikl' }
    ]
  },
  {
    id: 'wt_full_body',
    icon: '💪',
    name: 'To\'liq tana mashqi (15-20 daq)',
    desc: 'Hech qanday jihoz kerak emas',
    type: 'Kuch',
    exercises: [
      { name: 'Push-up (kotaklar)', sets: '3', reps: '10-15' },
      { name: 'Squat (cho\'kkalab turish)', sets: '3', reps: '15' },
      { name: 'Plank (taxta)', sets: '3', reps: '30-60s' },
      { name: 'Lunges (oldinga qadam)', sets: '3', reps: '10/oyoq' },
      { name: 'Mountain climber', sets: '3', reps: '20' }
    ]
  },
  {
    id: 'wt_abs',
    icon: '🔥',
    name: 'Pressga zo\'r mashq (10 daq)',
    desc: 'Qorin mushaklari uchun',
    type: 'Kuch',
    exercises: [
      { name: 'Crunches', sets: '3', reps: '20' },
      { name: 'Leg raises (oyoq ko\'tarish)', sets: '3', reps: '15' },
      { name: 'Russian twists', sets: '3', reps: '20' },
      { name: 'Plank', sets: '3', reps: '45s' },
      { name: 'Bicycle crunches', sets: '3', reps: '20' }
    ]
  },
  {
    id: 'wt_cardio',
    icon: '🏃',
    name: 'HIIT kardio (15 daq)',
    desc: 'Yog\' yoqish uchun yuqori intensiv',
    type: 'Kardio',
    exercises: [
      { name: 'Jumping jacks', sets: '4', reps: '40s' },
      { name: 'High knees', sets: '4', reps: '40s' },
      { name: 'Burpees', sets: '4', reps: '30s' },
      { name: 'Mountain climber', sets: '4', reps: '40s' },
      { name: 'Skater jumps', sets: '4', reps: '40s' },
      { name: 'Dam (rest)', sets: '3', reps: '30s' }
    ]
  },
  {
    id: 'wt_legs',
    icon: '🦵',
    name: 'Oyoq mashqlari (15 daq)',
    desc: 'Oyoqlarni kuchlantirish',
    type: 'Kuch',
    exercises: [
      { name: 'Squats', sets: '4', reps: '20' },
      { name: 'Lunges', sets: '4', reps: '12/oyoq' },
      { name: 'Glute bridges', sets: '4', reps: '15' },
      { name: 'Calf raises', sets: '4', reps: '20' },
      { name: 'Wall sit', sets: '3', reps: '45s' },
      { name: 'Single leg deadlift', sets: '3', reps: '10/oyoq' }
    ]
  },
  {
    id: 'wt_upper',
    icon: '💪',
    name: 'Yuqori tana (12-15 daq)',
    desc: 'Ko\'krak, qo\'l, yelka',
    type: 'Kuch',
    exercises: [
      { name: 'Standard push-up', sets: '3', reps: '12-15' },
      { name: 'Diamond push-up', sets: '3', reps: '8-10' },
      { name: 'Wide push-up', sets: '3', reps: '10-12' },
      { name: 'Pike push-up', sets: '3', reps: '10' },
      { name: 'Tricep dips (stulda)', sets: '3', reps: '12' },
      { name: 'Plank to push-up', sets: '3', reps: '10' }
    ]
  },
  {
    id: 'wt_yoga',
    icon: '🧘',
    name: 'Yoga rejimi (20 daq)',
    desc: 'Tana va aql tinchligi',
    type: 'Yoga',
    exercises: [
      { name: 'Mushuk-sigir pozasi', sets: '1', reps: '10 sikl' },
      { name: 'Pastga tushgan it', sets: '1', reps: '60s' },
      { name: 'Boyuk salomlash (1-sikl)', sets: '5', reps: '1 sikl' },
      { name: 'Jangchi pozasi I', sets: '1', reps: '30s/tomon' },
      { name: 'Bola pozasi', sets: '1', reps: '60s' },
      { name: 'Shavasana (dam)', sets: '1', reps: '3 daq' }
    ]
  },
  {
    id: 'wt_evening',
    icon: '🌙',
    name: 'Kechki cho\'zilish (10 daq)',
    desc: 'Yotishdan oldin tinchlanish',
    type: 'Cho\'zilish',
    exercises: [
      { name: 'Bo\'yin va yelka cho\'zilish', sets: '1', reps: '60s' },
      { name: 'Bel cho\'zilish (egilish)', sets: '1', reps: '45s' },
      { name: 'Hip flexor cho\'zilish', sets: '1', reps: '30s/oyoq' },
      { name: 'Dyusangid cho\'zilish', sets: '1', reps: '30s/oyoq' },
      { name: 'Spinal twist', sets: '1', reps: '45s/tomon' },
      { name: 'Chuqur nafas + meditatsiya', sets: '1', reps: '3 daq' }
    ]
  },
  {
    id: 'wt_quick',
    icon: '⚡',
    name: '7 daqiqalik tezkor (busy days)',
    desc: 'Vaqtingiz kam? Mana shu yetadi',
    type: 'Kardio',
    exercises: [
      { name: 'Jumping jacks', sets: '1', reps: '30s' },
      { name: 'Wall sit', sets: '1', reps: '30s' },
      { name: 'Push-ups', sets: '1', reps: '30s' },
      { name: 'Crunches', sets: '1', reps: '30s' },
      { name: 'Step-ups (stulga)', sets: '1', reps: '30s' },
      { name: 'Squats', sets: '1', reps: '30s' },
      { name: 'Plank', sets: '1', reps: '30s' }
    ]
  },
  {
    id: 'wt_back',
    icon: '🦴',
    name: 'Bel og\'rig\'iga qarshi (10 daq)',
    desc: 'Kompyuter oldida o\'tirganlar uchun',
    type: 'Cho\'zilish',
    exercises: [
      { name: 'Cat-cow stretch', sets: '1', reps: '10 sikl' },
      { name: 'Child\'s pose', sets: '1', reps: '60s' },
      { name: 'Cobra pose', sets: '3', reps: '20s' },
      { name: 'Knee-to-chest', sets: '3', reps: '20s/oyoq' },
      { name: 'Spinal twist', sets: '3', reps: '20s/tomon' },
      { name: 'Bridge pose', sets: '3', reps: '15' }
    ]
  }
];

function renderWorkoutTemplates() {
  const grid = document.getElementById('workoutTemplates');
  if (!grid) return;
  grid.innerHTML = WORKOUT_TEMPLATES.map(tpl => `
    <button class="tpl-card" onclick="useWorkoutTemplate('${tpl.id}')">
      <div class="tpl-icon">${tpl.icon}</div>
      <div class="tpl-name">${tpl.name}</div>
      <div class="tpl-desc">${tpl.desc} · ${tpl.exercises.length} ta mashq</div>
    </button>
  `).join('');
}

function useWorkoutTemplate(id) {
  const tpl = WORKOUT_TEMPLATES.find(w => w.id === id);
  if (!tpl) return;
  ensureV2State();
  state.workouts.push({
    id: uid(),
    name: tpl.name,
    type: tpl.type,
    exercises: tpl.exercises.map(e => ({ ...e })),
    createdAt: today(),
    fromTemplate: tpl.id
  });
  save();
  if (typeof renderWorkouts === 'function') renderWorkouts();
  renderWorkoutTemplates();
  toast(`💪 "${tpl.name}" qo'shildi`, 'success');
  try { fx?.play('complete'); } catch {}
  try { fx?.haptic([20, 30, 20]); } catch {}
  try { window.confetti?.fire({ count: 30 }); } catch {}
}

// Hook into goPage to render templates
{
  const _origGo = window.goPage;
  if (_origGo) {
    window.goPage = function(page) {
      _origGo(page);
      if (page === 'workout') {
        setTimeout(renderWorkoutTemplates, 100);
      }
    };
  }
}
// Also render on initial nav click
setTimeout(() => {
  document.querySelectorAll('.nav-item[data-page="workout"]').forEach(n => {
    n.addEventListener('click', () => setTimeout(renderWorkoutTemplates, 150));
  });
}, 2000);

window.useWorkoutTemplate = useWorkoutTemplate;
window.renderWorkoutTemplates = renderWorkoutTemplates;

// Auto-render on page load if workout page is somehow active
setTimeout(() => {
  if (document.getElementById('page-workout')?.classList.contains('active')) {
    renderWorkoutTemplates();
  }
}, 3000);



// ════════════════════════════════════════════
// ARTICLES — Ilmiy va kerakli mavzular
// ════════════════════════════════════════════
const ARTICLES = [
  {
    id: 'a1',
    cat: 'science',
    icon: '🧠',
    iconBg: 'rgba(99,102,241,0.15)',
    iconColor: '#6366f1',
    title: 'Miya neyroplastikasi: o\'zingni o\'zgartirish kuchi',
    summary: 'Miyaning yangi aloqalar yaratish qobiliyati va uni qanday rivojlantirish mumkin.',
    readTime: 6,
    content: `
      <h2>Neyroplastika nima?</h2>
      <p>Neyroplastika — bu inson miyasining yangi neyron aloqalar yaratish, eski aloqalarni qayta tashkillash va o'zini doimiy ravishda o'zgartirish qobiliyati. Bu hodisa hayot davomida davom etadi.</p>

      <h2>Asosiy printsiplar</h2>
      <ul>
        <li><strong>Foydalanish printsipi:</strong> Doimo ishlatilayotgan neyron aloqalar kuchayadi</li>
        <li><strong>Yo'qotish printsipi:</strong> Foydalanilmagan aloqalar zaiflashadi va yo'qoladi</li>
        <li><strong>Birga ishlash printsipi:</strong> Bir vaqtda yonadigan neyronlar bog'lanadi</li>
      </ul>

      <h2>Qanday mashq qilish kerak?</h2>
      <p>Miyangizni rivojlantirish uchun ushbu odatlarni qabul qiling:</p>
      <ol>
        <li>Yangi til o'rganing — bu eng kuchli mashq</li>
        <li>Musiqa asbobini chaling</li>
        <li>Boshqa qo'l bilan yozing (chap qo'l bo'lsa, o'ng)</li>
        <li>Yangi marshrutlar bilan yuring</li>
        <li>Meditatsiya qiling — kuniga 10 daqiqa</li>
        <li>Sport bilan shug'ullaning</li>
      </ol>

      <blockquote>"Aql — bu paytlik narsa emas. Uni har kuni mashq qilish kerak, xuddi tana mushaklarini." — Doniel Goleman</blockquote>

      <h2>Ilmiy isbotlangan natijalar</h2>
      <p>2017-yilda Massachusetts Texnologiya Institutida o'tkazilgan tadqiqot shuni ko'rsatdiki, doimiy meditatsiya 8 hafta ichida miyaning hippokamp qismini fizik o'zgartiradi. Bu xotira va o'rganish uchun mas'ul bo'lgan qism.</p>

      <p>Eng muhim xulosa: <strong>siz hech qachon o'zgarmoq uchun kech emassiz</strong>. Miya 80-90 yoshda ham yangi narsalar o'rganishi mumkin.</p>
    `
  },
  {
    id: 'a2',
    cat: 'productivity',
    icon: '⚡',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#f59e0b',
    title: 'Pomodoro texnikasi: 25 daqiqa qanday hayotni o\'zgartiradi',
    summary: '1980-yillarda yaratilgan oddiy texnika butun dunyoda mahsuldorlik standarti bo\'ldi.',
    readTime: 5,
    content: `
      <h2>Pomodoro nima?</h2>
      <p>Pomodoro texnikasi — italyan studenti Francesco Cirillo tomonidan 1980-yillarda yaratilgan vaqtni boshqarish usuli. "Pomodoro" italyancha "pomidor" degan ma'noni anglatadi — bu Cirilloning oshxona taymeri shaklida edi.</p>

      <h2>Qanday ishlaydi?</h2>
      <ol>
        <li><strong>25 daqiqa</strong> bir vazifaga to'liq fokus</li>
        <li><strong>5 daqiqa</strong> dam olish (turing, suv iching)</li>
        <li>4 ta sikldan keyin <strong>15-30 daqiqa</strong> uzoq dam</li>
        <li>Takrorlash</li>
      </ol>

      <h2>Nima uchun ishlaydi?</h2>
      <p><strong>1. Miya doimo fokus tutomaydi.</strong> Tadqiqotlar shuni ko'rsatdiki, inson miyasi 25-90 daqiqa siklda eng yaxshi ishlaydi. Bundan keyin samaradorlik tushadi.</p>

      <p><strong>2. Stress kamayadi.</strong> Tugatish kerak bo'lgan katta vazifani 25 daqiqalik bo'laklarga bo'lganda, miya stress qilmasdan ish qiladi.</p>

      <p><strong>3. Procrastination yengiladi.</strong> "Hech bo'lmaganda 25 daqiqa qilaman" — bu psixologik to'siqni buzadi.</p>

      <h2>Maslahatlar</h2>
      <ul>
        <li>Telefon ovozsiz rejimda — bildirishnomalar yo'q</li>
        <li>Brauzer'ni yoping — faqat ish</li>
        <li>Suv stakaningizni yonida tutib turing</li>
        <li>5 daqiqalik dam'da telefon olmang — turing va yuring</li>
        <li>Lo-fi yoki klassik musiqa qo'ying</li>
      </ul>

      <blockquote>"Bir sikl yetadi. Uni boshlang. Qolgani o'zi keladi."</blockquote>

      <p>Lumio'da Fokus rejim mavjud — bir tugma bilan Pomodoro boshlang!</p>
    `
  },
  {
    id: 'a3',
    cat: 'health',
    icon: '💧',
    iconBg: 'rgba(14,165,233,0.15)',
    iconColor: '#0ea5e9',
    title: 'Suv ichish: tana va miya uchun eng oson dori',
    summary: 'Tana 60% suvdan iborat. Lekin biz ko\'pchilik kerakli miqdordan ozroq ichamiz.',
    readTime: 4,
    content: `
      <h2>Suv nega bunchalik muhim?</h2>
      <p>Tananing har bir hujayrasi suv kerak. Miya 75%, qon 92%, mushaklar 75%, hatto suyaklar ham 31% suvdan iborat.</p>

      <h2>Suv yetishmasligining belgilari</h2>
      <ul>
        <li>🤕 Bosh og'riq</li>
        <li>😴 Charchoq va energiya yo'qligi</li>
        <li>🧠 Konsentratsiya pasayishi</li>
        <li>🍽️ Ochlik hissi (aslida tashnalik)</li>
        <li>💀 Quruq teri va lablar</li>
        <li>😤 Asabiylik</li>
      </ul>

      <h2>Qancha suv ichish kerak?</h2>
      <p>Universal qoida: <strong>30 ml × tana vazni (kg)</strong>. Masalan, 70 kg odam uchun 2.1 litr.</p>

      <p>Lekin sport, issiq havo va kasallik holatida ko'proq kerak.</p>

      <h2>Sog'lom odat qilish</h2>
      <ol>
        <li><strong>Ertalab uyg'ongan zahoti</strong> — 1-2 stakan suv (tana 8 soat suvsiz qoldi)</li>
        <li><strong>Har ovqatdan 30 daqiqa oldin</strong> — 1 stakan</li>
        <li><strong>Sport oldidan</strong> — 1 stakan</li>
        <li><strong>Sport vaqtida</strong> — har 15 daqiqada 100-200 ml</li>
        <li><strong>Yotishdan 1 soat oldin</strong> — 1 stakan</li>
      </ol>

      <blockquote>"Ko'pchilik xronik suvsizlikda yashaydi va bunday hayotni odat deb biladi." — Dr. F. Batmanghelidj</blockquote>

      <h2>Maslahat</h2>
      <p>Lumio'da Suv tracker bor — har stakanni belgilab boring. 8 ta stakan = mukammal kun!</p>
    `
  },
  {
    id: 'a4',
    cat: 'psychology',
    icon: '😌',
    iconBg: 'rgba(34,197,94,0.15)',
    iconColor: '#22c55e',
    title: 'Stress va uni yengish — minnetmindfulness yo\'li',
    summary: 'Stress hayotning bir qismi, lekin uni boshqarish — mahorat.',
    readTime: 7,
    content: `
      <h2>Stress nima?</h2>
      <p>Stress — bu tananing tashqi yoki ichki bosimga javob reaksiyasi. U "fight or flight" (jang yoki qoch) holatini keltirib chiqaradi.</p>

      <h2>Stressning 3 turi</h2>
      <ol>
        <li><strong>Akkut stress</strong> — qisqa muddatli, foydali ham bo'lishi mumkin</li>
        <li><strong>Surunkali stress</strong> — uzoq davom etadi, salomatlikga zarar</li>
        <li><strong>Travmatik stress</strong> — katta voqealardan keyin</li>
      </ol>

      <h2>Surunkali stressning oqibatlari</h2>
      <ul>
        <li>Yurak kasalliklari</li>
        <li>Yuqori bosim</li>
        <li>Diabet</li>
        <li>Depressiya va anksietety</li>
        <li>Immunitet pasayishi</li>
        <li>Xotira muammolari</li>
      </ul>

      <h2>Mindfulness — eng kuchli qarshi vosita</h2>
      <p>Mindfulness (mindfulness) — bu hozirgi daqiqada to'liq mavjud bo'lish san'ati. Ilmiy tadqiqotlar shuni ko'rsatdiki, kuniga 10 daqiqa meditatsiya:</p>
      <ul>
        <li>Cortizol (stress gormoni) ni 25% kamaytiradi</li>
        <li>Anksietety belgilarini yarmi qisqartiradi</li>
        <li>Konsentratsiyani 30% oshiradi</li>
        <li>Uyqu sifatini yaxshilaydi</li>
      </ul>

      <h2>4-7-8 nafas texnikasi</h2>
      <p>Stress paytida darhol ishlaydigan oddiy mashq:</p>
      <ol>
        <li>4 sekund <strong>nafas oling</strong> (burun bilan)</li>
        <li>7 sekund <strong>ushlab turing</strong></li>
        <li>8 sekund <strong>chiqaring</strong> (og'iz bilan)</li>
        <li>4 marta takrorlang</li>
      </ol>

      <blockquote>"Siz to'lqinlarni to'xtata olmaysiz, lekin sërfingni o'rganishingiz mumkin." — Jon Kabat-Zinn</blockquote>

      <h2>Lumio bilan stress kamaytirish</h2>
      <ul>
        <li>Meditatsiya sahifasini ishlating — 4-7-8 mavjud</li>
        <li>Kayfiyat tracker — pattern'larni ko'ring</li>
        <li>Kundalik yozing — fikrlarni qog'ozga tushiring</li>
      </ul>
    `
  },
  {
    id: 'a5',
    cat: 'growth',
    icon: '🎯',
    iconBg: 'rgba(168,85,247,0.15)',
    iconColor: '#a855f7',
    title: 'Atomic Habits: Kichik harakatlardan ulkan natijalar',
    summary: 'James Clearning bestseller kitobidan asosiy g\'oyalar va ularni hayotga qanday tatbiq qilish.',
    readTime: 8,
    content: `
      <h2>1% qoidasi</h2>
      <p>Agar har kuni 1% yaxshilansangiz, bir yilda <strong>37 marta yaxshi</strong> bo'lasiz. Aksincha, har kuni 1% yomonlashsangiz, deyarli nolga tushasiz.</p>

      <p>Mukammallik bir kunlik harakat emas — bu kichik harakatlar yig'indisi.</p>

      <h2>Odat shakllantirishning 4 qonuni</h2>

      <h3>1. Aniq qiling (Make it obvious)</h3>
      <ul>
        <li>"Har kuni soat 7:00 da, oshxonada, 1 stakan suv ichaman"</li>
        <li>Habit stacking: "X dan keyin Y qilaman"</li>
        <li>Muhitni o'zgartiring — kitob diqqatga ko'rinadigan joyda</li>
      </ul>

      <h3>2. Jozibali qiling (Make it attractive)</h3>
      <ul>
        <li>Yoqimli narsa bilan birlashtiring</li>
        <li>Sevimli musiqani faqat sport vaqtida tinglang</li>
        <li>Identifikatsiya: "Men sport qilaman" emas, "Men sportchiman"</li>
      </ul>

      <h3>3. Oson qiling (Make it easy)</h3>
      <ul>
        <li>2 daqiqa qoidasi: yangi odat 2 daqiqadan oshmasin</li>
        <li>"Kitob o'qish" emas, "1 sahifa o'qish"</li>
        <li>"Sport zaliga borish" emas, "sport kiyimini kiyish"</li>
      </ul>

      <h3>4. Qoniqarli qiling (Make it satisfying)</h3>
      <ul>
        <li>Darhol mukofot — masalan, belgilash (✓)</li>
        <li>Streak yaratish va saqlash</li>
        <li>Progressni ko'rinarli qilish</li>
      </ul>

      <h2>Identity-based habits</h2>
      <blockquote>"Maqsadingiz emas, maqsadlaringiz darajangizning asosi." — James Clear</blockquote>

      <p>Yutuqqa erishish uchun avval o'zingiz haqida fikringizni o'zgartiring:</p>
      <ul>
        <li>"Men chekishni tashlamoqchiman" → "Men chekmaydigan odamman"</li>
        <li>"Men sport qilishni xohlayman" → "Men sportchi turidagi odam"</li>
        <li>"Men kitob o'qishni xohlayman" → "Men kitobxonman"</li>
      </ul>

      <h2>Lumio bilan tatbiq</h2>
      <p>Lumio'da bu printsiplarning hammasi:</p>
      <ul>
        <li>✅ Aniq odatlar - vaqt va jadval</li>
        <li>✅ Streak — qoniqarli</li>
        <li>✅ Heatmap — ko'rinarli progress</li>
        <li>✅ XP va daraja — mukofot tizimi</li>
        <li>✅ Pet evolutsiyasi — identifikatsiya</li>
      </ul>
    `
  },
  {
    id: 'a6',
    cat: 'health',
    icon: '😴',
    iconBg: 'rgba(99,102,241,0.15)',
    iconColor: '#6366f1',
    title: 'Sog\'lom uyqu: hayotning yashirin asosi',
    summary: 'Uyqu — bu shunchaki dam emas. Bu miyaning yangidan ishga tushishi.',
    readTime: 6,
    content: `
      <h2>Uyqu nima uchun zarur?</h2>
      <p>Uyqu vaqtida sizning miyangiz va tananingiz juda muhim ishlarni amalga oshiradi:</p>
      <ul>
        <li><strong>Toksinlarni tozalash</strong> — glymphatic system ishlaydi</li>
        <li><strong>Xotirani mustahkamlash</strong> — kunlik bilim doimiy xotiraga ko'chiriladi</li>
        <li><strong>Mushaklarni tiklash</strong> — o'sish gormoni ajraladi</li>
        <li><strong>Immunitetni tiklash</strong> — kasalliklarga qarshi himoya</li>
        <li><strong>Hissiy qayta ishlov</strong> — kun voqealarini qabul qilish</li>
      </ul>

      <h2>Qancha uxlash kerak?</h2>
      <ul>
        <li>👶 Chaqaloqlar (0-1 yosh): 14-17 soat</li>
        <li>🧒 Bolalar (6-13): 9-11 soat</li>
        <li>🧑 O'smirlar (14-17): 8-10 soat</li>
        <li>👨 Kattalar (18-64): <strong>7-9 soat</strong></li>
        <li>👴 Keksalar (65+): 7-8 soat</li>
      </ul>

      <h2>Sog'lom uyqu uchun 7 qoida</h2>
      <ol>
        <li><strong>Doimiy jadval</strong> — har kuni bir vaqtda yotish va turish</li>
        <li><strong>Yotishdan 1 soat oldin telefon yo'q</strong> — ko'k yorug'lik melatonin'ni bostiradi</li>
        <li><strong>Xona qorong'i va salqin</strong> — 18-20°C ideal</li>
        <li><strong>Yotishdan 4 soat oldin kofeini yo'q</strong></li>
        <li><strong>Sport, lekin yotishdan 3 soat oldin emas</strong></li>
        <li><strong>Kechki yengil ovqat</strong> — og'ir ovqat uyquni buzadi</li>
        <li><strong>Yotishdan oldin meditatsiya yoki kitob</strong></li>
      </ol>

      <blockquote>"Kim yaxshi uxlamasa, yaxshi yashay olmaydi." — Dr. Matthew Walker</blockquote>

      <h2>Uyqusizlik xavfi</h2>
      <p>5 soatdan kam uxlash:</p>
      <ul>
        <li>Yurak kasalliklari xavfini 200% oshiradi</li>
        <li>Diabet xavfini 50% oshiradi</li>
        <li>Alzheimer xavfini 30% oshiradi</li>
        <li>Depressiyaga olib keladi</li>
        <li>Avtohalokat xavfini 4 marta oshiradi</li>
      </ul>

      <h2>Lumio yordami</h2>
      <p>Lumio'da Uyqu tracker bor — har kuni nechcha soat va sifatini belgilang. Patternni ko'rasiz!</p>
    `
  },
  {
    id: 'a7',
    cat: 'psychology',
    icon: '🎭',
    iconBg: 'rgba(236,72,153,0.15)',
    iconColor: '#ec4899',
    title: 'Tasalli zonasidan chiqish: o\'sishning yagona yo\'li',
    summary: 'Qulaylik dushman emas, lekin u sizni rivojlantirmaydi.',
    readTime: 5,
    content: `
      <h2>Tasalli zonasi nima?</h2>
      <p>Tasalli zonasi (comfort zone) — bu siz o'zingizni xavfsiz va boshqaruvda his qiladigan psixologik holat. Hech qanday qiyinchilik yo'q, lekin... hech qanday o'sish ham yo'q.</p>

      <h2>3 ta zona</h2>
      <ol>
        <li><strong>🛋️ Tasalli zonasi</strong> — qulay, oddiy, bekor</li>
        <li><strong>📈 O'sish zonasi</strong> — qiyin, lekin imkoniyatli — bu sizga kerak!</li>
        <li><strong>😱 Panika zonasi</strong> — juda qiyin, foydali emas</li>
      </ol>

      <h2>Belgilar — sizda problema bor</h2>
      <ul>
        <li>Har kun bir xil kunlar</li>
        <li>Yangi narsa qilishdan qo'rqasiz</li>
        <li>Mahalliy oddiyligingizni "muvaffaqiyat" deb hisoblaysiz</li>
        <li>Uzoq vaqt bir xil ishda qolasiz</li>
        <li>Bashoratli, lekin zerikkansiz</li>
      </ul>

      <h2>Qadamma-qadam chiqish</h2>
      <p>To'liq tashlamang — kichik qadamlarda chiqing:</p>

      <h3>Kuniga 1 ta yangi narsa</h3>
      <ul>
        <li>Yangi yo'l bilan ishga boring</li>
        <li>Notanish odam bilan suhbatlashing</li>
        <li>Yangi taom yeb ko'ring</li>
        <li>Boshqa qo'l bilan tishingizni tozalang</li>
        <li>Yangi maqola o'qing</li>
      </ul>

      <h3>Haftalik 1 ta katta qadam</h3>
      <ul>
        <li>Yangi sport turi sinab ko'ring</li>
        <li>Sahnaga chiqing (gapiring)</li>
        <li>Yangi do'st orttiring</li>
        <li>Loyihani boshlang</li>
      </ul>

      <h3>Oylik 1 ta katta tajriba</h3>
      <ul>
        <li>Yangi joyga sayohat</li>
        <li>Kursga yoziling</li>
        <li>Kitob yozing/blog boshlang</li>
        <li>Yangi til boshlang</li>
      </ul>

      <blockquote>"Hayotning aroming siz uchun qulay bo'lgan joydan tashqarida boshlanadi." — Niel Donald Walsh</blockquote>

      <h2>Qo'rquvni boshqarish</h2>
      <p>Qo'rquv tabiy. Maslahat: <strong>"5 sekund qoidasi"</strong> (Mel Robbins):</p>
      <ol>
        <li>Yangi narsa qilish kerakligini his qildingizmi?</li>
        <li>5...4...3...2...1 — sanang</li>
        <li>QILING. Fikrlamang, faqat qiling</li>
      </ol>

      <p>5 sekund — miya hali "yo'q" demaganida.</p>
    `
  },
  {
    id: 'a8',
    cat: 'science',
    icon: '🧬',
    iconBg: 'rgba(34,197,94,0.15)',
    iconColor: '#22c55e',
    title: 'Dofamin: motivatsiya va baxtning kalitsi',
    summary: 'Bu kichik molekula sizning hayotiz qanday yashashingizni belgilaydi.',
    readTime: 6,
    content: `
      <h2>Dofamin nima?</h2>
      <p>Dofamin — bu miya neyrotransmitteri. U nega mas'ul:</p>
      <ul>
        <li>Motivatsiya va xohish</li>
        <li>Mukofot hissi</li>
        <li>O'rganish va xotira</li>
        <li>Diqqat</li>
        <li>Harakat boshqaruvi</li>
      </ul>

      <h2>Dofamin "tuzog'i"</h2>
      <p>Hozirgi dunyoda biz <strong>tezkor dofamin</strong> bilan bombardimon qilinmoqdamiz:</p>
      <ul>
        <li>📱 Sotsial tarmoqlardagi like va xabar</li>
        <li>🍔 Tez ovqat</li>
        <li>🎮 Video o'yinlar</li>
        <li>🎬 Netflix binge-watching</li>
        <li>📺 Qisqa videolar (TikTok)</li>
      </ul>

      <p>Bu narsalar miyani <strong>doimo dofamin oqibat</strong> qiladi. Natijada normal hayot zerikkan tuyiladi.</p>

      <h2>Dofamin detoksiyasi</h2>
      <p>Doktor Anna Lembke (Stanford) tavsiya etadi:</p>
      <ol>
        <li><strong>30 kun "dofamin pasti"</strong> — bir narsani butunlay tark eting</li>
        <li>Birinchi 1-2 hafta og'ir bo'ladi (lomka)</li>
        <li>3-4 hafta — yangi normal his bo'la boshlaydi</li>
        <li>30 kundan keyin — qaytarish, lekin kam miqdorda</li>
      </ol>

      <h2>Sog'lom dofamin manbalari</h2>
      <ul>
        <li>💪 <strong>Sport</strong> — eng kuchli tabiiy dofamin</li>
        <li>🌅 <strong>Quyosh nuri</strong> — ertalab 10-15 daqiqa</li>
        <li>🎯 <strong>Maqsadga erishish</strong> — kichik yutuqlar</li>
        <li>🤗 <strong>Quchoqlash, sevish</strong></li>
        <li>📚 <strong>O'rganish</strong> — yangi narsa</li>
        <li>🥦 <strong>Sog'lom ovqat</strong> — turshi ovqat</li>
        <li>💧 <strong>Sovuq dush</strong> — dofamin 250% oshadi</li>
        <li>😴 <strong>Yetarli uyqu</strong></li>
        <li>🎵 <strong>Musiqa tinglash</strong></li>
        <li>🧘 <strong>Meditatsiya</strong></li>
      </ul>

      <blockquote>"Hozirgi davrda eng katta motivatsion buzilish — biz juda ko'p mukofot olamiz va kam ishchanamiz." — Dr. Anna Lembke</blockquote>

      <h2>Lumio bu yerda yordam beradi</h2>
      <p>Lumio sizga <strong>sog'lom dofamin manbalari</strong>ni beradi:</p>
      <ul>
        <li>Vazifani bajarish — kichik mukofot</li>
        <li>Streak — uzoq muddatli motivatsiya</li>
        <li>Daraja oshish — yutuq hissi</li>
        <li>Pet evolutsiyasi — ko'rinarli o'sish</li>
      </ul>
    `
  },
  {
    id: 'a9',
    cat: 'productivity',
    icon: '🌅',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#f59e0b',
    title: 'Ertalabki rituallar: dunyoning eng muvaffaqiyatli odamlari sirri',
    summary: "Bill Gates, Elon Musk, Tim Cook — barchasi ertalab nimadir alohida qiladi.",
    readTime: 5,
    content: `
      <h2>Nega ertalab muhim?</h2>
      <p>Ertalab — bu kun davomida eng kuchli iroda kuchi vaqti. Quyidagi sabablar bor:</p>
      <ul>
        <li>Kortizol darajasi yuqori — diqqat yaxshi</li>
        <li>Hech kim sizni bezovta qilmaydi</li>
        <li>Kun boshlanmagan — chalg'itish yo'q</li>
        <li>Bir kun davomida pozitiv kayfiyat</li>
      </ul>

      <h2>Mashhur odamlarning ertalabki rituallari</h2>

      <h3>🍎 Tim Cook (Apple CEO)</h3>
      <ul>
        <li>3:45 da uyg'onadi</li>
        <li>1 soat email o'qiydi</li>
        <li>Sport zaliga boradi (45 daq)</li>
        <li>Kofe ichadi</li>
      </ul>

      <h3>💻 Bill Gates</h3>
      <ul>
        <li>1 soat sport (kardio + kuch)</li>
        <li>Kitob o'qiydi yarim soat</li>
        <li>Ish boshlashdan oldin yangiliklar</li>
      </ul>

      <h3>🚀 Elon Musk</h3>
      <ul>
        <li>7:00 da uyg'onadi</li>
        <li>Email tekshiradi (30 daq)</li>
        <li>Du-shi yeydi</li>
        <li>Bolalari bilan vaqt o'tkazadi</li>
      </ul>

      <h2>Sizning oddiy ertalabki ritualingiz</h2>
      <p><strong>5-8-10 formulasi</strong>:</p>

      <h3>5 daqiqa — Tana</h3>
      <ul>
        <li>2 stakan suv iching</li>
        <li>Yengil cho'zilish</li>
        <li>Yuvinish</li>
      </ul>

      <h3>8 daqiqa — Aql</h3>
      <ul>
        <li>5 daqiqa meditatsiya</li>
        <li>3 daqiqa kundalik (3 ta minnatdor narsa)</li>
      </ul>

      <h3>10 daqiqa — Reja</h3>
      <ul>
        <li>Bugungi 3 ta MIT (Most Important Tasks)</li>
        <li>Maqsadlarni ko'rib chiqish</li>
        <li>Birinchi vazifaga kirishish</li>
      </ul>

      <h2>Nima qilish KERAK EMAS?</h2>
      <ul>
        <li>📱 Telefon olish (eng birinchi 30 daq ichida)</li>
        <li>📧 Email tekshirish (boshqa odamlar prioriteti)</li>
        <li>🎬 Sotsial tarmoqlar</li>
        <li>📺 Yangiliklar (negativ kayfiyat)</li>
      </ul>

      <blockquote>"Ertalab qanday boshlasangiz, kun shunday bo'ladi." — Hal Elrod, "Miracle Morning"</blockquote>

      <h2>Kichik kichikdan boshlang</h2>
      <p>Hozir 7-da turuasizmi? Ertaga 6:50 da turing. Keyingi hafta 6:40. Sekin-asta 1 soat oldin uyg'onasiz.</p>

      <p>Lumio'da ertalabki odatlarni kuzating — har kun bir xil vaqtda eslatma keladi!</p>
    `
  },
  {
    id: 'a10',
    cat: 'growth',
    icon: '📚',
    iconBg: 'rgba(99,102,241,0.15)',
    iconColor: '#6366f1',
    title: 'Kitob o\'qish: xayrli odat va miyaning eng yaxshi mashqi',
    summary: "5 daqiqa kitob o'qish — bu bir kun stress kamaytiradi 68%.",
    readTime: 6,
    content: `
      <h2>Kitob o'qishning kuchi</h2>
      <p>Kitob o'qish — bu eng yaxshi miya mashqi. U nega zo'r:</p>
      <ul>
        <li>🧠 Miyaga yangi neyron aloqalar</li>
        <li>📚 Dunyoning eng aqlli odamlari bilan suhbat</li>
        <li>🎯 Diqqatni rivojlantiradi</li>
        <li>💭 Tasavvurni boyitadi</li>
        <li>😌 Stress kamaytiradi</li>
        <li>📝 So'z boyligini kengaytiradi</li>
      </ul>

      <h2>Ilmiy isbotlangan foydalar</h2>
      <p>Yale Universitetining 12 yillik tadqiqoti shuni ko'rsatdi: kuniga 30 daqiqa kitob o'qiganlar:</p>
      <ul>
        <li>O'qimaganlardan o'rtacha <strong>23 oy ortiq yashaydi</strong></li>
        <li>Alzheimer xavfini 32% kamaytiradi</li>
        <li>Empatiya darajasi yuqoriroq</li>
        <li>Ish samaradorligi 25% yuqoriroq</li>
      </ul>

      <h2>Kitobxonlik problemasi</h2>
      <p>Ko'p odamlar kitob o'qishni tark qilishadi chunki:</p>
      <ul>
        <li>"Vaqtim yo'q" (lekin Instagram'ga 3 soat sarflashadi)</li>
        <li>"Zerikarli" (kitob noto'g'ri tanlangan)</li>
        <li>"Tushunmayman" (juda murakkab kitob bilan boshlangan)</li>
        <li>"Diqqatim yo'q" (telefon bilan parallel o'qiydi)</li>
      </ul>

      <h2>Kitobxon bo'lish — 5 qadam</h2>

      <h3>1. Sevimli janrni toping</h3>
      <p>Roman, biografiya, ilmiy, fantastika, tarix... — birini sinab ko'ring.</p>

      <h3>2. 25 sahifalik qoida</h3>
      <p>Birinchi 25 sahifa zerikkan tuyilsa — kitobni almashtiring. Hayot juda qisqa yoqmaydigan kitob uchun.</p>

      <h3>3. Telefon boshqa xonada</h3>
      <p>Diqqat — toza bo'lishi kerak. Telefon yonida bo'lsa, miya darhol uni o'ylaydi.</p>

      <h3>4. Doimiy vaqt</h3>
      <p>Yotishdan oldin 30 daqiqa, ertalab kofe bilan, transportda...</p>

      <h3>5. Kitobxonlik klubiga qo'shiling</h3>
      <p>Birgalikda o'qish — motivatsiya beradi.</p>

      <h2>Tavsiya etilgan kitoblar</h2>

      <h3>O'zini rivojlantirish</h3>
      <ul>
        <li>"Atomic Habits" — James Clear</li>
        <li>"Deep Work" — Cal Newport</li>
        <li>"The 7 Habits..." — Stephen Covey</li>
        <li>"Mindset" — Carol Dweck</li>
      </ul>

      <h3>Psixologiya</h3>
      <ul>
        <li>"Thinking, Fast and Slow" — Daniel Kahneman</li>
        <li>"Man's Search for Meaning" — Viktor Frankl</li>
        <li>"The Power of Now" — Eckhart Tolle</li>
      </ul>

      <h3>Klassika</h3>
      <ul>
        <li>"Meditations" — Marcus Aurelius</li>
        <li>"Tao Te Ching" — Lao Tzu</li>
        <li>"Sapiens" — Yuval Harari</li>
      </ul>

      <blockquote>"Bir yilda 1 ta kitob o'qigan odam, 1 yilda 0 ta o'qigan odamdan ulkan farqda bo'ladi. 1 oyda 1 ta kitob — bu boshqa daraja." — Charlie Munger</blockquote>

      <p><strong>Lumio'da</strong> Kitoblar sahifasi bor — o'qilayotgan kitoblar va ularning progressini kuzating!</p>
    `
  },
  {
    id: 'a11',
    cat: 'health',
    icon: '🏃',
    iconBg: 'rgba(239,68,68,0.15)',
    iconColor: '#ef4444',
    title: 'Sport: tana, miya va kayfiyat uchun yagona dori',
    summary: "Hech bir dori sport kabi ko'p kasalliklarga qarshi ishlay olmaydi.",
    readTime: 5,
    content: `
      <h2>Sportning hayratlanarli foydalari</h2>
      <p>Tadqiqotlarda sport quyidagilarni ko'rsatadi:</p>
      <ul>
        <li><strong>Antidepressant</strong> — Prozac kabi samaradorlik (lekin yon ta'sirsiz)</li>
        <li><strong>Yurak kasalliklari</strong> — 30% kamayadi</li>
        <li><strong>Diabet</strong> — 50% kamayadi</li>
        <li><strong>Saraton</strong> — ba'zi turlari 25% kamayadi</li>
        <li><strong>Alzheimer</strong> — 40% kamayadi</li>
        <li><strong>Uyqu sifati</strong> — 65% yaxshi</li>
        <li><strong>Energiya</strong> — 65% oshadi</li>
        <li><strong>Diqqat va xotira</strong> — sezilarli yaxshi</li>
      </ul>

      <h2>Hech bir dori bunday ko'p ish qila olmaydi!</h2>

      <h2>Qancha sport kerak?</h2>
      <p>Jahon Sog'liqni saqlash tashkiloti tavsiyalari:</p>
      <ul>
        <li><strong>Haftada 150 daqiqa</strong> o'rta intensiv sport (yurish, yengil yugurish)</li>
        <li>Yoki <strong>haftada 75 daqiqa</strong> qattiq intensiv (yugurish, HIIT)</li>
        <li>Plus <strong>haftada 2 marta</strong> kuch mashqlari</li>
      </ul>

      <p>Bu ko'p tuyiladimi? <strong>Kuniga 22 daqiqa</strong> — bu hammasi.</p>

      <h2>Eng oson boshlash uslubi</h2>

      <h3>1-hafta: Yurish</h3>
      <p>Kuniga 10 daqiqa yuring. Hech narsa kerak emas — faqat ko'cha va eski krossovkalar.</p>

      <h3>2-hafta: 20 daqiqa</h3>
      <p>Yurishni 20 daqiqaga oshiring. Tezroq qadam bilan.</p>

      <h3>3-hafta: Yugurish-yurish</h3>
      <p>1 daqiqa yugurish, 2 daqiqa yurish. 5 marta takrorlang.</p>

      <h3>4-hafta: Aralashtirish</h3>
      <p>3 kun yurish/yugurish, 2 kun uy mashqlari (Lumio'da shablonlar bor!)</p>

      <h2>Uy mashqlari</h2>
      <p>Sport zaliga bormaslik mumkin! Uyda:</p>
      <ul>
        <li>Push-ups, squats, lunges</li>
        <li>Plank, burpees</li>
        <li>YouTube'da bepul videolar</li>
        <li>Lumio Sport bo'limi - 10 ta tayyor shablon</li>
      </ul>

      <h2>Eng katta xatolar</h2>
      <ul>
        <li>❌ Hammasini bir kunda qilmoqchi bo'lish — charchashlik</li>
        <li>❌ Ko'p maqsad qo'yish — "Tomarrow yana boshlayman"</li>
        <li>❌ Faqat tarozi raqamiga qarash — natijalar boshqa joylarda</li>
        <li>❌ Yetarli dam olmaslik — mushaklar dam'da o'sadi</li>
      </ul>

      <blockquote>"Sport sizni yengmaydi — siz yenggandagina jiddiy ishlaydi." — Nelson Mandela</blockquote>

      <h2>Lumio bilan</h2>
      <p>Lumio'da Sport sahifasi:</p>
      <ul>
        <li>10 ta tayyor uy mashqlari shablonlari</li>
        <li>Workout streak — motivatsiya</li>
        <li>Eslatmalar — sport vaqti unutilmasin</li>
      </ul>
    `
  },
  {
    id: 'a12',
    cat: 'psychology',
    icon: '💎',
    iconBg: 'rgba(168,85,247,0.15)',
    iconColor: '#a855f7',
    title: 'Minnatdorlik kuchi: oddiy odat, ulkan natija',
    summary: "Har kuni 3 ta minnatdor narsa yozish — hayotni o'zgartiradi.",
    readTime: 4,
    content: `
      <h2>Minnatdorlik nima?</h2>
      <p>Minnatdorlik (gratitude) — bu hayotdagi yaxshi narsalarni ko'rish va qadrlash qobiliyati.</p>

      <h2>Ilmiy isbotlangan foydalari</h2>
      <p>Pennsylvania Universitetida 10 yillik tadqiqot natijasi:</p>
      <ul>
        <li><strong>Baxt darajasi</strong> 25% yuqori</li>
        <li><strong>Depressiya</strong> 35% kamroq</li>
        <li><strong>Yaxshiroq uyqu</strong> — 8% chuqurroq</li>
        <li><strong>Immunitet</strong> kuchliroq</li>
        <li><strong>Munosabatlar</strong> chuqurroq</li>
        <li><strong>Mahsuldorlik</strong> 12% yuqori</li>
        <li><strong>Empatiya</strong> rivojlanadi</li>
      </ul>

      <h2>Minnatdorlik mashqi — 3 ta yaxshi narsa</h2>
      <p>Eng oddiy va eng kuchli mashq:</p>
      <ol>
        <li>Har kuni (kechqurun) <strong>3 ta yaxshi narsani yozing</strong></li>
        <li>Ular kichik bo'lishi mumkin: "Quyoshli kun edi", "Onam qo'ng'iroq qildi"</li>
        <li>Har biri uchun <strong>"Nega bu yaxshi?"</strong> deb javob bering</li>
        <li>Bunda 5-7 daqiqa ketadi</li>
      </ol>

      <p>Tadqiqot: bu odat 30 kundan keyin <strong>baxt darajasini doimiy 12% oshiradi</strong>.</p>

      <h2>Minnatdorlik xati</h2>
      <p>Ko'proq kuchli mashq:</p>
      <ol>
        <li>Sizga ta'sir o'tkazgan odamni eslang</li>
        <li>Unga xat yozing — uni qanday ta'sir qilgani haqida</li>
        <li>Ko'p tafsilot bering, samimiy bo'ling</li>
        <li>Imkon bo'lsa — yuzma-yuz o'qib bering</li>
      </ol>

      <p>Tadqiqotda: bu 1 marta qiling — natija <strong>1 oy davom etadi</strong>.</p>

      <h2>Minnatdorlik xayolan</h2>
      <p>Ertalab uyg'onganda 1 daqiqa:</p>
      <ol>
        <li>Tana uchun minnatdorlik (sog'liq, ko'rish, eshitish)</li>
        <li>Aql uchun minnatdorlik (fikrlay olish, his qilish)</li>
        <li>Atrof uchun minnatdorlik (oila, do'stlar, uy)</li>
      </ol>

      <h2>Eng katta minnatdorlik manzili</h2>

      <h3>"Negatif vizualizatsiya" — stoik usuli</h3>
      <p>Marcus Aurelius o'rgatgan:</p>
      <ol>
        <li>Sizdagi narsalar yo'q bo'lsa, qanday bo'lardi?</li>
        <li>Ko'zingiz ko'rmasa? Oilangiz yo'q bo'lsa?</li>
        <li>Bu narsalar borligini hozir minnatdor bo'ling</li>
      </ol>

      <p>Bu sizni bor narsalarga qaytaradi.</p>

      <blockquote>"Mavjud bo'lgan narsalarning qadrini bilmasangiz, kelgusi narsalar sizni baxtli qila olmaydi." — Buddha</blockquote>

      <h2>Lumio'da minnatdorlik</h2>
      <ul>
        <li>Kundalik bo'limi — 3 ta minnatdor narsa</li>
        <li>Kayfiyat tracker — pattern'larni ko'rasiz</li>
        <li>Eslatma — har kechqurun yodga solinadi</li>
      </ul>

      <p>Bu eng oson, lekin eng kuchli o'zgarish — bugundan boshlang!</p>
    `
  },
  {
    id: 'a13',
    cat: 'finance',
    icon: '💵',
    iconBg: 'rgba(34,197,94,0.15)',
    iconColor: '#22c55e',
    title: '50/30/20 qoidasi: pulni boshqarishning eng oddiy usuli',
    summary: 'Daromadingizni 3 qismga bo\'ling — moliyaviy hayotingiz 5 daqiqada o\'zgaradi.',
    readTime: 5,
    content: `
      <h2>Bu nima?</h2>
      <p>50/30/20 qoidasi — Elizabeth Warren tomonidan taklif qilingan oddiy byudjet sxemasi. Daromadingizni quyidagicha bo'lasiz:</p>

      <h2>Ulush bo'lib taqsimot</h2>
      <ul>
        <li><strong>50%</strong> — Zaruriy xarajatlar (uy, ovqat, transport, kommunal)</li>
        <li><strong>30%</strong> — Xohishlar (ko'ngilochar, restoran, sayohat, sovg'alar)</li>
        <li><strong>20%</strong> — Jamg'arma va investitsiya (kelajak)</li>
      </ul>

      <h2>Misol — 5,000,000 so'm daromad</h2>
      <ul>
        <li>Zaruriy: 2,500,000 so'm</li>
        <li>Xohish: 1,500,000 so'm</li>
        <li>Jamg'arma: 1,000,000 so'm</li>
      </ul>

      <h2>Nega bu ishlaydi?</h2>
      <ol>
        <li><strong>Soddaligi</strong> — faqat 3 ta kategoriya, esda qoladi</li>
        <li><strong>Balans</strong> — bugungi rohat va kelajak orasida</li>
        <li><strong>Avtomatlashtirish</strong> — daromad kelishi bilan ajratasiz</li>
        <li><strong>Stress kamayadi</strong> — har xarid uchun fikrlamaysiz</li>
      </ol>

      <h2>Amaliyotga qo'llash</h2>
      <ol>
        <li>Daromadingizni hisoblang (oylik o'rtacha)</li>
        <li>3 ta hisob/konvert oching</li>
        <li>Daromad kelishi bilan darhol bo'ling</li>
        <li>Har hisobdan faqat o'sha maqsadda harxa qiling</li>
      </ol>

      <blockquote>"Xarajatlaringiz daromadingizdan kam bo'lsa, siz boy. Ko'p bo'lsa — kambag'al, daromadning miqdoridan qat'i nazar." — Charles Dickens</blockquote>

      <h2>Maslahatlar</h2>
      <ul>
        <li>Ish haqi tushar zahoti 20% jamg'armaga ko'chiring</li>
        <li>Karta'da emas, naqd pulda saqlasangiz tejash osonroq</li>
        <li>Subscription'larni tekshiring — ko'pi keraksiz</li>
        <li>Lumio'da Xarajatlar mini-ilovasi bor — kuzating!</li>
      </ul>
    `
  },
  {
    id: 'a14',
    cat: 'finance',
    icon: '🏦',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#f59e0b',
    title: 'Compound interest: dunyodagi 8-mo\'jiza',
    summary: "Albert Eynshteyn aytganidek — bu mo'jiza. Uni tushunganlar foyda ko'radi, tushunmaganlar to'laydi.",
    readTime: 6,
    content: `
      <h2>Compound interest nima?</h2>
      <p>Murakkab foiz — bu pul ustidan foiz ham foiz olishingiz. Vaqt o'tgan sari, foydangiz <strong>eksponensial</strong> o'sib boradi.</p>

      <h2>Sodda misol</h2>
      <p>1,000,000 so'm joyladingiz, yiliga 10% foiz:</p>
      <ul>
        <li><strong>Yil 1:</strong> 1,100,000 so'm (+100,000)</li>
        <li><strong>Yil 5:</strong> 1,610,510 so'm (+510,510)</li>
        <li><strong>Yil 10:</strong> 2,593,742 so'm</li>
        <li><strong>Yil 20:</strong> 6,727,500 so'm</li>
        <li><strong>Yil 30:</strong> 17,449,402 so'm</li>
        <li><strong>Yil 40:</strong> 45,259,256 so'm</li>
      </ul>

      <p>Faqat 1 mln'dan — 45 mln! Boshqa hech narsa qo'shmadingiz!</p>

      <h2>2 ta kuchli printsip</h2>

      <h3>1. Vaqt — eng kuchli omil</h3>
      <p>20 yoshda 100,000/oy yotqizgan odam, 30 yoshda 200,000/oy yotqizgan odamdan boyroq bo'ladi! Vaqt foizdan ham muhim.</p>

      <h3>2. 72 qoidasi</h3>
      <p>Pulingiz qancha vaqtda ikki barobarga oshadi? <strong>72 ÷ foiz darajasi</strong></p>
      <ul>
        <li>10% foiz: 72/10 = 7.2 yil</li>
        <li>15% foiz: 72/15 = 4.8 yil</li>
        <li>20% foiz: 72/20 = 3.6 yil</li>
      </ul>

      <h2>Qanday boshlash mumkin?</h2>
      <ol>
        <li>Bank depozit (UZB: ~20-22% yiliga)</li>
        <li>Davlat obligatsiyalari</li>
        <li>Aksiyalar (S&P 500 — yiliga 10% o'rtacha)</li>
        <li>Kripto (yuqori risk, yuqori daromad)</li>
        <li>Ko'chmas mulk</li>
      </ol>

      <blockquote>"Murakkab foiz — koinotning eng kuchli kuchi. Uni tushuningan ishlaydi, tushunmagan to'laydi." — Albert Eynshteyn</blockquote>

      <h2>Aksincha ham ishlaydi (yomon)</h2>
      <p>Kredit kartalari aynan shunday ishlaydi — siz to'lashingiz kerak! 20% foizli qarz 4 yilda ikki barobar oshadi.</p>

      <p><strong>Maslahat:</strong> Avval qarzlardan qutuling, keyin investitsiya qiling.</p>
    `
  },
  {
    id: 'a15',
    cat: 'career',
    icon: '🚀',
    iconBg: 'rgba(99,102,241,0.15)',
    iconColor: '#6366f1',
    title: "Karyera o'sishi: ish haqini 2x oshirishning haqiqiy yo'llari",
    summary: "Yillik 5% oshish emas — yangi imkoniyatlar va aniq ko'nikmalar.",
    readTime: 7,
    content: `
      <h2>Real karyera o'sishi nimaga bog'liq?</h2>
      <p>Sizning ish haqingiz 3 narsadan iborat:</p>
      <ol>
        <li><strong>Sizning qiymatingiz</strong> (skills + tajriba)</li>
        <li><strong>Bozor talabi</strong> (qancha kompaniya kerak)</li>
        <li><strong>Sizning ko'rinarliligingiz</strong> (kim biladi sizni)</li>
      </ol>

      <h2>3 ta yo'l — qaysisi sizniki?</h2>

      <h3>🐢 1. Sekin: Bir kompaniyada o'sish</h3>
      <ul>
        <li>+5-10% har yili</li>
        <li>20 yilda taxminan 2x ish haqi</li>
        <li>Eng xavfsiz, lekin eng sekin</li>
      </ul>

      <h3>🚂 2. O'rta: Ishni almashtirish</h3>
      <ul>
        <li>Har 2-3 yilda yangi ish</li>
        <li>+15-25% har almashishda</li>
        <li>10 yilda 3-4x ish haqi</li>
        <li>Ko'p networking talab qiladi</li>
      </ul>

      <h3>🚀 3. Tezkor: O'z biznesi yoki freelance</h3>
      <ul>
        <li>Cheksiz potentsial</li>
        <li>Lekin yuqori risk</li>
        <li>5 yilda 5-10x ham mumkin</li>
      </ul>

      <h2>Aniq qadamlar</h2>

      <h3>1-yil: O'rganish</h3>
      <ul>
        <li>Sohangizda eng yaxshi 3 odamni toping</li>
        <li>Ular o'rgatadigan narsalarni o'rganing</li>
        <li>Soft skills: kommunikatsiya, lider</li>
        <li>Ingliz tilini puxta qiling</li>
      </ul>

      <h3>2-yil: Portfolio yaratish</h3>
      <ul>
        <li>GitHub/Behance/portfolio sayt</li>
        <li>3-5 ta zo'r loyiha</li>
        <li>LinkedIn aktivlashtirish</li>
        <li>Kichik freelance loyihalar</li>
      </ul>

      <h3>3-yil: Networking</h3>
      <ul>
        <li>Konferensiyalar, meetup'lar</li>
        <li>Twitter/LinkedIn'da yozish</li>
        <li>Mentorlar topish</li>
        <li>Open source contributions</li>
      </ul>

      <h2>Eng qimmatli ko'nikmalar (2025)</h2>
      <ol>
        <li>AI integratsiya (ChatGPT, Claude, etc)</li>
        <li>Data analysis</li>
        <li>Cloud (AWS, GCP)</li>
        <li>Programming (Python, JS)</li>
        <li>Product management</li>
        <li>UX/UI design</li>
        <li>Digital marketing</li>
        <li>Soft skills: kommunikatsiya</li>
      </ol>

      <blockquote>"Sizning ish haqingiz — sizning eng kichik qiymatingiz. Eng katta qiymat — siz tanlamagan imkoniyatlar." — Naval Ravikant</blockquote>

      <h2>Negotiation</h2>
      <p>Yangi ish haqi taklifi olganda:</p>
      <ol>
        <li>Hech qachon birinchi raqamni siz aytmang</li>
        <li>Bozorni o'rganing (Glassdoor, salary surveys)</li>
        <li>15-20% ko'proq so'rang</li>
        <li>Faqat baseline emas, paket — bonus, opsiya, dam olish</li>
      </ol>
    `
  },
  {
    id: 'a16',
    cat: 'relationships',
    icon: '❤️',
    iconBg: 'rgba(236,72,153,0.15)',
    iconColor: '#ec4899',
    title: 'Mustahkam munosabatlar: ilm-fan nima deydi?',
    summary: "75 yillik Garvard tadqiqoti baxtning siri nima ekanligini ko'rsatadi.",
    readTime: 6,
    content: `
      <h2>Garvard'ning eng katta tadqiqoti</h2>
      <p>1938-yildan beri davom etayotgan tadqiqot — 75 yil mobaynida 700+ odamni kuzatdi. Savol: <strong>nima inson hayotini baxtli qiladi?</strong></p>

      <h2>Asosiy xulosa</h2>
      <blockquote>"Yaxshi munosabatlar — bizni baxtli qiladi va sog'lom saqlaydi. Bu hammasi." — Robert Waldinger, tadqiqot direktori</blockquote>

      <p>Pul, shuhrat, lavozim emas. <strong>Munosabatlar.</strong></p>

      <h2>Tadqiqot natijalari</h2>
      <ul>
        <li>Yaqin do'stga ega odamlar 50% ko'proq yashaydi</li>
        <li>Yolg'izlik chekishdan kam zararli emas</li>
        <li>Munosabatlar sifati 50 yoshdagi sog'liqni 80 yoshdagiga qaraganda yaxshiroq bashorat qiladi</li>
      </ul>

      <h2>Sog'lom munosabatning 5 belgisi</h2>

      <h3>1. Ishonch</h3>
      <ul>
        <li>"Men sizga aytishim mumkin"</li>
        <li>Sirlar saqlanadi</li>
        <li>Va'dalar bajariladi</li>
      </ul>

      <h3>2. Hurmat</h3>
      <ul>
        <li>Farqlarni qabul qilish</li>
        <li>Vaqt va chegaralarni hurmat</li>
        <li>Pasaytirib gapirish yo'q</li>
      </ul>

      <h3>3. Aloqa</h3>
      <ul>
        <li>Halol gapirish (lekin yumshoq)</li>
        <li>Tinglash — eshitish emas</li>
        <li>Hisn-tuyg'ularni baham ko'rish</li>
      </ul>

      <h3>4. Qo'llab-quvvatlash</h3>
      <ul>
        <li>Yaxshi va yomon kunlarda</li>
        <li>Xohishlaringga rag'batlantirish</li>
        <li>Hech kim mukammal emas — sabr</li>
      </ul>

      <h3>5. O'sish</h3>
      <ul>
        <li>Birga rivojlanish</li>
        <li>Bir-biringizni yaxshilash</li>
        <li>Yangi tajribalar</li>
      </ul>

      <h2>Yomon munosabatdan qutulish</h2>
      <p>Ba'zan eng muhim qadam — chiqib ketish:</p>
      <ul>
        <li>Doimo tanqid qilinadi</li>
        <li>Sizni yomon his qilasiz</li>
        <li>Hurmat yo'q</li>
        <li>Manipulyatsiya bor</li>
        <li>Jismoniy yoki hissiy zo'rlik</li>
      </ul>

      <h2>Sog'lom chegaralar</h2>
      <p>"YO'Q" — bu to'liq jumla. Uchun sabab kerak emas.</p>
      <ul>
        <li>O'z vaqtingizni himoya qiling</li>
        <li>Energiyangizni saqlang</li>
        <li>Hammasi uchun mavjud bo'lmang</li>
      </ul>

      <h2>Yolg'izlikdan qutulish</h2>
      <ol>
        <li>Sevimli mashg'ulot guruhlari (sport, kitobxonlik)</li>
        <li>Eski do'stlarga qo'ng'iroq qiling</li>
        <li>Volonterlik</li>
        <li>Onlayn klublar</li>
        <li>Notanish odamga "Salom" deb gapiring</li>
      </ol>

      <blockquote>"Eng katta sovg'a — bu vaqt. Sevganlaringga uni bering." — Anonim</blockquote>
    `
  },
  {
    id: 'a17',
    cat: 'mindfulness',
    icon: '🧘',
    iconBg: 'rgba(34,197,94,0.15)',
    iconColor: '#22c55e',
    title: 'Hozirgi daqiqada yashash: aql tinchligining sirri',
    summary: "Past + Kelajak haqida o'ylash = stress. Hozirda bo'lish = tinchlik.",
    readTime: 5,
    content: `
      <h2>Bizning aql qaerda?</h2>
      <p>Tadqiqotlar shuni ko'rsatadiki, oddiy odam <strong>vaqtning 47%</strong> da hozirgi daqiqada bo'lmaydi. Aqli o'tmish yoki kelajak haqida o'ylaydi.</p>

      <h2>Bu nega yomon?</h2>
      <ul>
        <li>O'tmish haqida fikr → afsus, tushkunlik</li>
        <li>Kelajak haqida fikr → tashvish, qo'rquv</li>
        <li>Hozir = sizning yagona haqiqiy hayotingiz</li>
      </ul>

      <h2>Mindfulness — bu nima?</h2>
      <p>Hozirgi daqiqaga to'liq diqqat — fikrlamasdan, hukm qilmasdan, qabul qilib.</p>

      <h2>5-4-3-2-1 mashqi</h2>
      <p>Stress paytida, eng oson texnika:</p>
      <ol>
        <li><strong>5 narsani</strong> ko'ring</li>
        <li><strong>4 narsani</strong> teging</li>
        <li><strong>3 ovozni</strong> eshiting</li>
        <li><strong>2 hidni</strong> his qiling</li>
        <li><strong>1 ta'mni</strong> tatib ko'ring</li>
      </ol>
      <p>Bu darhol sizni hozirga qaytaradi.</p>

      <h2>Kunlik mindfulness</h2>

      <h3>🍵 Choy mashqi</h3>
      <p>Choyni ichganda, faqat <strong>choy</strong> ichish:</p>
      <ul>
        <li>Issiqlikni his qiling</li>
        <li>Hidini tinglang</li>
        <li>Ta'mini sezing</li>
        <li>Telefonsiz, suhbatsiz</li>
      </ul>

      <h3>🚿 Dush mashqi</h3>
      <p>Suvni terige tegishini his qiling. Issiqlikni, kelishini, ovozini.</p>

      <h3>🚶 Yurish mashqi</h3>
      <p>Har qadamingizni his qiling. Tovonlar, oyoqlar, nafas. Telefonsiz.</p>

      <h3>🍽️ Ovqatlanish</h3>
      <p>Birinchi 3 luqmani sekin yeb ko'ring. Tikish, ta'm, tuzlanish.</p>

      <h2>Fikrlardan qutulish</h2>
      <p>Buddist o'rgatadi: fikrlar bulut kabi — keladi va ketadi.</p>
      <ol>
        <li>Fikr keldimi? Tan oling: "Bu fikr"</li>
        <li>Unga qarshi turmang</li>
        <li>Lekin uni ushlab ham qolmang</li>
        <li>Yana hozirga qayting</li>
      </ol>

      <blockquote>"Aql — yaxshi xizmatkor, lekin yomon xo'jayin." — Robert Frost</blockquote>

      <h2>Kichik kunlik amaliyot</h2>
      <ul>
        <li>Ertalab — 3 ta chuqur nafas (uyg'onishdan oldin)</li>
        <li>Kun davomida — har soatda 1 daqiqa to'xtab qarab turish</li>
        <li>Yotishdan oldin — tana skanerlash</li>
      </ul>

      <p><strong>Lumio'da</strong> Meditatsiya bo'limida 4-7-8 nafas mashqi mavjud — sinab ko'ring!</p>
    `
  },
  {
    id: 'a18',
    cat: 'creativity',
    icon: '🎨',
    iconBg: 'rgba(168,85,247,0.15)',
    iconColor: '#a855f7',
    title: "Ijodkorlik: tug'ma qobiliyat emas, mashq qilinadigan ko'nikma",
    summary: "Pikasso aytdi: 'Har bir bola san'atkor — muammo qachon bu bolaligini saqlash.'",
    readTime: 5,
    content: `
      <h2>Ijodkorlik haqidagi 3 yolg'on</h2>
      <ol>
        <li>"Ba'zi odamlar — ijodkor, ba'zilari yo'q" ❌</li>
        <li>"Ijodkorlik — ilhom kelishi" ❌</li>
        <li>"Ijodkorlikni o'rganib bo'lmaydi" ❌</li>
      </ol>

      <h2>Haqiqat — ijodkorlik mashqdir</h2>
      <p>Tadqiqotlar: ijodkorlik <strong>ko'nikma</strong>. Mashq qilsangiz, kuchayadi.</p>

      <h2>Ijodkorlikni rivojlantirish</h2>

      <h3>1. Birlashtirish</h3>
      <p>Ijodkorlik = mavjud g'oyalarni yangi tarzda birlashtirish.</p>
      <p>Apple = telefon + kompyuter + iPod.<br>YouTube = video + sotsial tarmoq + qidiruv.</p>

      <h3>2. Cheklov</h3>
      <p>Cheklov ijodkorlikni kuchaytiradi:</p>
      <ul>
        <li>Twitter — 280 belgi</li>
        <li>Haiku — 17 bo'g'in</li>
        <li>50 dollarda kun yashash chaqiriqlari</li>
      </ul>

      <h3>3. Boshqa sohalardan o'rganish</h3>
      <p>Eng yaxshi g'oyalar boshqa sohadan:</p>
      <ul>
        <li>Steve Jobs — kalligrafiya → typography</li>
        <li>Elon Musk — fizika → kosmik raketalar</li>
        <li>Pixar — anime → 3D filmlar</li>
      </ul>

      <h2>Kunlik ijodiy mashqlar</h2>

      <h3>📝 Morning Pages</h3>
      <p>Julia Cameron usulida: ertalab 3 sahifa erkin yozing. Hech nima haqida emas — shunchaki yozing. Aql tozalanadi.</p>

      <h3>💡 10 g'oya</h3>
      <p>James Altucher metodi: har kuni 10 ta g'oya. Mavzu bir xil emas:</p>
      <ul>
        <li>Bugun: 10 ta yangi biznes g'oyalari</li>
        <li>Ertaga: 10 ta kitob g'oyalari</li>
        <li>Indinga: 10 ta sayohat joyi</li>
      </ul>

      <p>Sifat muhim emas. Miqdor muhim. 6 oydan keyin g'oyalar darajasi keskin oshadi.</p>

      <h3>🎨 Erkin chizish</h3>
      <p>Hech nima haqida o'ylamasdan, qog'ozga chiziq tortib turish. 10 daqiqa.</p>

      <h2>Ilhom uchun joylar</h2>
      <ul>
        <li>🚿 Dush — eng ko'p insight</li>
        <li>🚶 Yurish — Steve Jobs ham qilardi</li>
        <li>🌳 Tabiat — miya yangilanadi</li>
        <li>😴 Uyqu — REM bosqichida ulanishlar</li>
        <li>📖 Boshqa sohalar haqida o'qish</li>
      </ul>

      <h2>Block bilan kurashish</h2>
      <p>Ijodiy block (ijodga qiyinchilik):</p>
      <ol>
        <li>Mukammal bo'lishni tark eting — birinchi versiya yomon bo'lishi normal</li>
        <li>Boshlang — ish hatto yomon bo'lsa ham</li>
        <li>Boshqa narsa qiling — miyani aylantiring</li>
        <li>Constraint qo'ying — vaqt yoki resurs cheklang</li>
      </ol>

      <blockquote>"Ilhom kelishini kutmang. Uni o'lja kabi haydang." — Jack London</blockquote>
    `
  },
  {
    id: 'a19',
    cat: 'philosophy',
    icon: '🏛️',
    iconBg: 'rgba(99,102,241,0.15)',
    iconColor: '#6366f1',
    title: 'Stoitsizm: 2000 yillik hayot falsafasi',
    summary: "Marcus Aurelius, Seneca, Epiktet — Roma imperatorlari va qullar bir xil falsafani qo'lladilar.",
    readTime: 7,
    content: `
      <h2>Stoitsizm nima?</h2>
      <p>Stoitsizm — eramizdan oldingi 3-asrda Yunonistonda paydo bo'lgan amaliy falsafa. Markaziy g'oya: <strong>baxt nazoratimizdagi narsalardan, nazoratimizda emasidan emas.</strong></p>

      <h2>2 ta toifa qoidasi</h2>
      <p>Hayotni 2 ga bo'ling:</p>

      <h3>✅ Mening nazoratimda</h3>
      <ul>
        <li>Mening fikrlarim</li>
        <li>Mening harakatlarim</li>
        <li>Mening reaksiyalarim</li>
        <li>Mening so'zlarim</li>
        <li>Mening xulqim</li>
      </ul>

      <h3>❌ Mening nazoratimda EMAS</h3>
      <ul>
        <li>Boshqa odamlarning fikrlari</li>
        <li>Ob-havo</li>
        <li>O'tmish</li>
        <li>Boshqalarning harakatlari</li>
        <li>Tabiat ofatlari</li>
        <li>Iqtisodiy holat</li>
      </ul>

      <p><strong>Asosiy printsip:</strong> Faqat 1-toifaga energiya sarflang.</p>

      <h2>Memento Mori — "Sen o'lsang yodingda bo'lsin"</h2>
      <p>Bu g'amgin emas — bu ozodlik. Hayot qisqa bo'lsa, har daqiqa qadrli bo'ladi.</p>
      <ul>
        <li>Hozir sevganingizni quchoqlang</li>
        <li>Bugun ham sodir bo'lishi mumkin</li>
        <li>Vaqtni isrof qilmang</li>
      </ul>

      <h2>Negativ vizualizatsiya</h2>
      <p>Stoiklar har kuni ertalab xayolan:</p>
      <ol>
        <li>Hammasini yo'qotish — pul, sog'liq, oila</li>
        <li>Bu chinakam yuz bersa, qanday his qilardik?</li>
        <li>Endi minnatdorlik bilan kunni boshlang</li>
      </ol>

      <p>Bu sizni minnatdor qiladi va kelajakdagi muammolarga tayyorlaydi.</p>

      <h2>Marcus Aurelius'ning 5 ta hikmati</h2>

      <ol>
        <li><strong>"Sizning hayotingiz — sizning fikrlaringiz."</strong>
          <br>Fikrlangiz hayotingizni shakllantiradi.</li>

        <li><strong>"Ertalab qiyinchilikda yashash uchun bilan uyg'oning."</strong>
          <br>Hayot oson bo'lmaydi — qabul qiling.</li>

        <li><strong>"Sizga tegmaslik kerak narsa — boshqalarning fikri."</strong>
          <br>Boshqalar haqida fikrlamang.</li>

        <li><strong>"Birinchi navbatda yaxshi inson bo'ling, keyin amal qiling."</strong>
          <br>Identifikatsiya — eng kuchlisi.</li>

        <li><strong>"Vaqt cheksiz emas. Yashang."</strong>
          <br>Bugun — yagona haqiqiy kun.</li>
      </ol>

      <h2>Stoik kunlik amaliyot</h2>

      <h3>🌅 Ertalab</h3>
      <ul>
        <li>5 daq mediatsiya</li>
        <li>"Bugun nima nazaratimda?"</li>
        <li>Bugungi qiyinchiliklarga tayyorlanish</li>
      </ul>

      <h3>🌆 Kechqurun</h3>
      <ul>
        <li>3 ta minnatdor narsa</li>
        <li>"Bugun nimani yaxshi qildim?"</li>
        <li>"Nimani yaxshilashim mumkin?"</li>
      </ul>

      <blockquote>"Siz sizga nima sodir bo'lganini boshqara olmaysiz, lekin unga qanday javob berishingizni boshqara olasiz." — Epiktet</blockquote>

      <h2>Tavsiya etilgan kitoblar</h2>
      <ul>
        <li>"Meditations" — Marcus Aurelius (eng asosiy)</li>
        <li>"Letters from a Stoic" — Seneca</li>
        <li>"Discourses" — Epiktet</li>
        <li>"The Daily Stoic" — Ryan Holiday (zamonaviy)</li>
      </ul>
    `
  },
  {
    id: 'a20',
    cat: 'tech',
    icon: '🤖',
    iconBg: 'rgba(99,102,241,0.15)',
    iconColor: '#6366f1',
    title: 'AI bilan ishlash: kelajakdagi eng muhim ko\'nikma',
    summary: "Sun'iy intellekt sizni almashtirmaydi — undan foydalana oladigan odam almashtiradi.",
    readTime: 6,
    content: `
      <h2>AI — yangi reallik</h2>
      <p>2022-yildan beri AI hayotimizni o'zgartirmoqda. ChatGPT, Claude, Gemini, Midjourney — bu shunchaki boshlanish.</p>

      <h2>Asosiy haqiqat</h2>
      <blockquote>"AI sizni almashtirmaydi. Lekin AI'dan foydalana oladigan odam — almashtiradi." — Sotsial tarmoqlar</blockquote>

      <h2>AI qanday ishlaydi (sodda)</h2>
      <p>Hozirgi AI'lar — <strong>Large Language Models (LLM)</strong>. Ular millionlab matn o'qib, "keyingi so'z nima bo'lishi kerak"ni bashorat qiladi.</p>

      <p>Misol: "Quyosh sharqdan ___" → "ko'tariladi" (eng ko'p uchragan)</p>

      <h2>AI bilan nima qilish mumkin?</h2>

      <h3>📝 Yozish</h3>
      <ul>
        <li>Email yaratish</li>
        <li>Maqolalar yozish</li>
        <li>Tarjima qilish</li>
        <li>Resume yaratish</li>
        <li>Muharrirlik</li>
      </ul>

      <h3>💻 Kod</h3>
      <ul>
        <li>Kod yozish</li>
        <li>Bug topish</li>
        <li>Tushuntirish</li>
        <li>O'rganish</li>
      </ul>

      <h3>🎨 Ijod</h3>
      <ul>
        <li>Rasm chizish (Midjourney, DALL-E)</li>
        <li>Video yaratish (Runway, Sora)</li>
        <li>Musiqa (Suno, Udio)</li>
        <li>Logo dizayn</li>
      </ul>

      <h3>📊 Tahlil</h3>
      <ul>
        <li>Ma'lumotlar tahlili</li>
        <li>Tadqiqot</li>
        <li>Hujjatlar xulosasi</li>
      </ul>

      <h2>Prompt engineering — yangi savod</h2>
      <p>AI bilan yaxshi gaplashish — alohida ko'nikma. Asosiy printsiplar:</p>

      <h3>1. Kontekst bering</h3>
      <p>❌ "Email yoz"<br>
      ✅ "Men marketing menejeri. Mijozga yangi kampaniya haqida professional, lekin do'stona email yoz. 100 so'z."</p>

      <h3>2. Rol bering</h3>
      <p>"Sen tajribali professional yozuvchisan..."<br>
      "Sen 10 yillik marketing tajribasi bor expert..."</p>

      <h3>3. Format ko'rsating</h3>
      <p>"Javobni quyidagi tarzda ber:<br>
      1. Asosiy g'oya<br>
      2. 3 ta tafsilot<br>
      3. Xulosa"</p>

      <h3>4. Misollar bering</h3>
      <p>"Masalan, agar so'rasam: 'Olma' → senda javob: 'Meva'"</p>

      <h2>Maslahat</h2>
      <ul>
        <li>AI'ni shaxsiy <strong>mentor</strong> deb tasavvur qiling</li>
        <li>Faqat narsa <strong>so'rashning oldida emas</strong> — keyin ham</li>
        <li>Doim tekshirib turing — AI xato qilishi mumkin</li>
        <li>AI sizning fikringizni almashtirmasin — kuchaytirsin</li>
      </ul>

      <h2>Eng yaxshi AI vositalari (2025)</h2>
      <ul>
        <li><strong>ChatGPT (OpenAI)</strong> — eng mashhur</li>
        <li><strong>Claude (Anthropic)</strong> — uzun matnlar uchun zo'r</li>
        <li><strong>Gemini (Google)</strong> — bepul, kuchli</li>
        <li><strong>Perplexity</strong> — qidiruv + AI</li>
        <li><strong>Midjourney</strong> — rasm</li>
        <li><strong>Cursor</strong> — kod yozish</li>
        <li><strong>NotebookLM</strong> — hujjatlar bilan ishlash</li>
      </ul>

      <h2>Xavotirlar</h2>
      <p>"AI hammani ishsiz qoldiradi" — qisman to'g'ri. Lekin tarix ko'rsatadi: yangi texnologiya yangi ishlar yaratadi.</p>

      <p>Eng muhimi — <strong>o'rganish</strong>. Hozirdan AI'ni ishlashga o'rganing.</p>
    `
  },
  {
    id: 'a21',
    cat: 'health',
    icon: '🥗',
    iconBg: 'rgba(34,197,94,0.15)',
    iconColor: '#22c55e',
    title: "Sog'lom ovqatlanish: oddiy 7 qoida",
    summary: "Diet emas — hayot tarzi. Murakkab emas, oddiy.",
    readTime: 5,
    content: `
      <h2>Salomatlik = ovqat</h2>
      <p>Hippokrat 2500 yil oldin aytdi: <strong>"Ovqat — sizning dorongiz, dori — sizning ovqatingiz."</strong></p>

      <p>Zamonaviy tadqiqotlar bu fikrni isbotladi.</p>

      <h2>7 ta oddiy qoida</h2>

      <h3>1. Haqiqiy ovqat yeb keling</h3>
      <p>Michael Pollan'ning 7 so'zli qoidasi:</p>
      <blockquote>"Ovqat yeb. Ko'p emas. Asosan o'simlik."</blockquote>

      <p><strong>Haqiqiy ovqat</strong> = bobongiz tanigan narsa. Qadoqlangan emas.</p>

      <h3>2. Ranglar — sog'lik belgisi</h3>
      <p>Sizning tarelkangizda:</p>
      <ul>
        <li>🟢 Yashil — palak, ko'k karam, brokoli</li>
        <li>🔴 Qizil — pomidor, qulupnay, qizil bolg'or qalam</li>
        <li>🟡 Sariq — limon, banan, sariq qalam</li>
        <li>🟣 Binafsha — uzum, ko'kat, baqlajon</li>
        <li>⚫ Qora — qora bug'doy, kunjut</li>
      </ul>

      <p>Har xil rang = har xil vitamin va antioksidant.</p>

      <h3>3. Suv — birinchi navbatda</h3>
      <ul>
        <li>Ertalab uyg'onganda — 2 stakan</li>
        <li>Ovqat oldidan — 1 stakan</li>
        <li>Tana vazni × 30 ml = kunlik</li>
      </ul>

      <h3>4. Jarayonlangan ovqatdan saqlaning</h3>
      <p>Eng zararli:</p>
      <ul>
        <li>🍔 Fast food</li>
        <li>🍟 Chips va kraker</li>
        <li>🥤 Shirin ichimliklar (kola)</li>
        <li>🍩 Shirinliklar va donalar</li>
        <li>🌭 Qiyma kolbasalar</li>
      </ul>

      <h3>5. Oqsil hayot quvvati</h3>
      <p>Tana vazningizning <strong>1 kg = 1g oqsil</strong> kuniga.</p>
      <ul>
        <li>Tuxum (6g/dona)</li>
        <li>Tovuq go'shti (30g/100g)</li>
        <li>Baliq</li>
        <li>Yog'siz qaymoq</li>
        <li>Lobiya</li>
        <li>Yong'oqlar</li>
      </ul>

      <h3>6. Sekin yeb keling</h3>
      <p>Miyaga ovqat yetishi 20 daqiqa. Tez yeyilsa — ortiqcha yeyiladi.</p>
      <ul>
        <li>Telefonsiz yeb keling</li>
        <li>Har luqmani 20 marta chaynang</li>
        <li>Vilkani har luqmadan keyin qo'yib yuboring</li>
      </ul>

      <h3>7. 80/20 qoidasi</h3>
      <p>80% sog'lom + 20% nimani xohlasangiz:</p>
      <ul>
        <li>Iztirobsiz yashash mumkin</li>
        <li>Diet siz hech narsani taqiqlamasin</li>
        <li>Hayot zavqi — muhim</li>
      </ul>

      <h2>Oddiy menyu (1 kun)</h2>

      <h3>🌅 Nonushta</h3>
      <ul>
        <li>2 ta tuxum</li>
        <li>Avokado</li>
        <li>Yashil chol</li>
      </ul>

      <h3>🌞 Tushlik</h3>
      <ul>
        <li>Tovuq go'shti</li>
        <li>Yashil salat</li>
        <li>Choy bug'doy</li>
      </ul>

      <h3>🌆 Kechki ovqat</h3>
      <ul>
        <li>Baliq</li>
        <li>Sabzavotlar</li>
        <li>Yong'oq</li>
      </ul>

      <p><strong>Lumio'da</strong> Ovqatlanish bo'limi mavjud — ovqatlaringizni kuzating!</p>
    `
  },
  {
    id: 'a22',
    cat: 'productivity',
    icon: '🎯',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#f59e0b',
    title: 'Eisenhower matritsasi: ustuvor narsalarni topishning sirri',
    summary: "AQSh prezidenti Eisenhower kunlik 100+ qaror qilardi. U bu usulni ishlatardi.",
    readTime: 4,
    content: `
      <h2>Muammo</h2>
      <p>Hammamiz buni bilamiz:</p>
      <ul>
        <li>Vaqt yetmaydi</li>
        <li>Narsalar tugamaydi</li>
        <li>Qaysi biri muhim — bilmaymiz</li>
        <li>Hammasi muhim ko'rinadi</li>
      </ul>

      <h2>Eisenhower'ning yechimi</h2>
      <p>Har vazifani 2 savol bilan tahlil qiling:</p>
      <ol>
        <li><strong>Muhimmi?</strong></li>
        <li><strong>Shoshilinchmi?</strong></li>
      </ol>

      <p>4 ta kategoriya:</p>

      <h2>📋 Matritsa</h2>

      <h3>🟥 1-Quadrant: Muhim VA Shoshilinch</h3>
      <p><strong>HOZIR QILING!</strong></p>
      <ul>
        <li>Inqirozlar</li>
        <li>Bugungi muhim deadline'lar</li>
        <li>Salomatlik muammosi</li>
      </ul>

      <h3>🟩 2-Quadrant: Muhim, lekin shoshilinch EMAS</h3>
      <p><strong>REJALANGAN VAQT BERING!</strong></p>
      <ul>
        <li>Sport</li>
        <li>Oila bilan vaqt</li>
        <li>Yangi narsa o'rganish</li>
        <li>Maqsadlar ustida ish</li>
        <li>Munosabatlar</li>
      </ul>

      <p><strong>Bu eng muhim quadrant!</strong> Lekin ko'pchilik buni e'tibordan chiqarib yuboradi, chunki shoshilinch emas.</p>

      <h3>🟦 3-Quadrant: Shoshilinch, lekin muhim EMAS</h3>
      <p><strong>BOSHQALARGA TOPSHIRING!</strong></p>
      <ul>
        <li>Ko'p uchrashuvlar</li>
        <li>Email javoblari</li>
        <li>Telefon qo'ng'iroqlari</li>
        <li>Kichik so'rovlar</li>
      </ul>

      <h3>🟫 4-Quadrant: Muhim ham, shoshilinch ham EMAS</h3>
      <p><strong>O'CHIRING!</strong></p>
      <ul>
        <li>Sotsial tarmoqlar</li>
        <li>Maqsadsiz internet</li>
        <li>TV</li>
        <li>Maqsadsiz "vaqt o'tkazuvchilar"</li>
      </ul>

      <h2>Asosiy xulosa</h2>
      <p>Ko'pchilik vaqtni 1 va 3 da o'tkazadi. Lekin haqiqiy yutuq <strong>2-quadrant</strong>da yotadi.</p>

      <p>Sport, kitob o'qish, dam olish, oila — shoshilinch emas. Lekin eng muhim narsalar.</p>

      <blockquote>"Eng muhim narsalar hech qachon eng shoshilinch narsalar bo'lmasligi kerak." — Stephen Covey</blockquote>

      <h2>Amaliyotga tatbiq</h2>
      <ol>
        <li>Bugun barcha vazifalarni yozing</li>
        <li>Har biri uchun 2 savol bering</li>
        <li>Kategoriyalarga ajrating</li>
        <li>2-quadrant uchun vaqt rejalashtiring</li>
        <li>4-quadrantni butunlay tashlang</li>
      </ol>

      <p><strong>Lumio'da</strong> Vazifalar ustuvorligi bor — Yuqori, O'rta, Past, Yo'q. Aynan shu printsip!</p>
    `
  },
  {
    id: 'a23',
    cat: 'learning',
    icon: '🎓',
    iconBg: 'rgba(99,102,241,0.15)',
    iconColor: '#6366f1',
    title: 'Tezkor o\'rganish: yangi narsani 20 soatda o\'rganing',
    summary: "Josh Kaufman'ning kitobida — muvaffaqiyatli o'rganishning 4 qadami.",
    readTime: 6,
    content: `
      <h2>Eski yolg'on</h2>
      <p>"Biror narsada usta bo'lish uchun 10,000 soat kerak" (Malcolm Gladwell).</p>

      <p>Bu <strong>yolg'on</strong>. Aslida bu — <strong>professional darajaga</strong> chiqish uchun.</p>

      <h2>Yangi haqiqat</h2>
      <blockquote>"Yetarlicha yaxshi" darajaga chiqish uchun atigi 20 soat kerak. — Josh Kaufman</blockquote>

      <p>Sizga professional bo'lish kerak emas. Sizga <strong>foydali daraja</strong> kerak.</p>

      <h2>4 ta qadam</h2>

      <h3>1. Ko'nikmani parchalang</h3>
      <p>"Gitara o'rganish" emas — juda umumiy.</p>
      <p>"3 ta sevimli qo'shiqni chala olish" — aniq.</p>

      <p>Boshqa misollar:</p>
      <ul>
        <li>"Frantsuz tili" → "Mehmonxona suhbatini olib bora olish"</li>
        <li>"Programming" → "Oddiy veb-sayt yaratish"</li>
        <li>"Rasm chizish" → "Oddiy portret chiza olish"</li>
        <li>"Cooking" → "5 ta ovqat tayyorlay olish"</li>
      </ul>

      <h3>2. Yetarlicha o'rganing — boshlang</h3>
      <p>3-5 ta resursga e'tibor bering:</p>
      <ul>
        <li>1-2 ta kitob</li>
        <li>1-2 ta YouTube kursi</li>
        <li>1 ta odam (mentor yoki dust)</li>
      </ul>

      <p><strong>Muhim:</strong> ortiqcha o'qib o'tirmang. Faqat boshlash uchun yetarlicha.</p>

      <h3>3. To'siqlarni olib tashlang</h3>
      <p>Mashq qilishingizga to'sqinlik qiluvchi narsalarni topib bartaraf eting:</p>
      <ul>
        <li>Asbob yo'qmi? — Sotib oling yoki ijaraga oling</li>
        <li>Vaqt yo'qmi? — 20 daqiqa kunda toping</li>
        <li>Joy yo'qmi? — Burjak/stol toping</li>
        <li>Internetda chalg'iyapsizmi? — Olib qo'ying</li>
      </ul>

      <h3>4. Mashq — kuniga 45 daqiqa</h3>
      <p>27 kun × 45 daqiqa = 20 soat.</p>

      <p>Asosiy printsip: <strong>maqsadli mashq</strong>.</p>
      <ul>
        <li>Aniq maqsad bilan</li>
        <li>To'liq diqqat</li>
        <li>Telefonsiz</li>
        <li>Xato qilsangiz tuzating</li>
      </ul>

      <h2>20 soatlik kurves</h2>
      <p>Birinchi 1-5 soat — eng qiyin, lekin eng tez o'sish:</p>
      <ul>
        <li>Soat 0-2: Hech narsa qila olmaysiz</li>
        <li>Soat 2-5: Ba'zi narsalar ishlay boshlaydi</li>
        <li>Soat 5-10: Boshlovchi darajaga chiqasiz</li>
        <li>Soat 10-20: Mustaqil ishlay olasiz</li>
        <li>Soat 20: Yaxshi darajada — boshqalarga o'rgata olasiz</li>
      </ul>

      <h2>Chuqur o'rganish (kelajak)</h2>
      <p>Ko'p ko'nikmalar uchun 20 soat yetadi. Lekin chuqur professional bo'lmoqchi bo'lsangiz, davom eting.</p>

      <h2>Misollar</h2>
      <p>20 soatda o'rgangan haqiqiy odamlar:</p>
      <ul>
        <li>Josh Kaufman — yoga (kitobning muallifi)</li>
        <li>Tim Ferriss — tilshunoslik</li>
        <li>Tony Robbins — gitara</li>
      </ul>

      <h2>Bugun boshlang</h2>
      <ol>
        <li>1 ta o'rganmoqchi bo'lgan ko'nikma tanlang</li>
        <li>Aniq maqsadni yozing</li>
        <li>20 soatlik vaqt bloki rejalashtiring (27 kun × 45 daqiqa)</li>
        <li>Birinchi mashq — bugun!</li>
      </ol>

      <blockquote>"Mukammallik — dushman. Yaxshi — yetarli." — Voltaire</blockquote>
    `
  },
  {
    id: 'a24',
    cat: 'mindfulness',
    icon: '🌬️',
    iconBg: 'rgba(14,165,233,0.15)',
    iconColor: '#0ea5e9',
    title: "Nafas — eng kuchli vosita: aql va tana orasidagi ko'prik",
    summary: "Nafas — aksiyamiz ko'p qismi avtomatik ishlaydi, lekin uni ongli boshqarishimiz mumkin.",
    readTime: 5,
    content: `
      <h2>Nafas — sehrli vosita</h2>
      <p>Nafas — yagona avtonom funksiya, biz uni <strong>ham avtomatik, ham ongli</strong> boshqara olamiz.</p>

      <p>Bu juda muhim, chunki nafas orqali tana va aqlni boshqara olamiz.</p>

      <h2>Nafas qanday ta'sir qiladi?</h2>

      <h3>Sekin nafas</h3>
      <ul>
        <li>Stress kamayadi</li>
        <li>Yurak tezligi pasayadi</li>
        <li>Bosim normallashadi</li>
        <li>Aql tinchlanadi</li>
        <li>Uxlash osonroq</li>
      </ul>

      <h3>Tez nafas</h3>
      <ul>
        <li>Energiya oshadi</li>
        <li>Diqqat o'tkirlashadi</li>
        <li>Tana isiyadi</li>
        <li>Sport uchun yaxshi</li>
      </ul>

      <h2>5 ta kuchli texnika</h2>

      <h3>1. 4-7-8 nafas (uxlash uchun)</h3>
      <ol>
        <li>4 sekund — burun bilan nafas oling</li>
        <li>7 sekund — ushlab turing</li>
        <li>8 sekund — og'iz bilan chiqaring</li>
        <li>4 marta takrorlang</li>
      </ol>
      <p>Dr. Andrew Weil yaratgan. 60 sekundda uyqu keladi.</p>

      <h3>2. Box nafas (stress uchun)</h3>
      <ol>
        <li>4 sekund — nafas oling</li>
        <li>4 sekund — ushlang</li>
        <li>4 sekund — chiqaring</li>
        <li>4 sekund — bo'sh ushlang</li>
      </ol>
      <p>Navy SEAL'lar ishlatadigan texnika.</p>

      <h3>3. Wim Hof texnikasi (energiya)</h3>
      <ol>
        <li>30 marta tez chuqur nafas</li>
        <li>Oxirgi nafasni butunlay chiqaring</li>
        <li>30-60 sekund nafassiz turing</li>
        <li>Chuqur nafas oling, 15 sekund ushlang</li>
        <li>3-4 sikl takrorlang</li>
      </ol>

      <h3>4. Nadi Shodhana (yoga)</h3>
      <ol>
        <li>O'ng burunni barmoq bilan yoping</li>
        <li>Chap burundan nafas oling</li>
        <li>Chap burunni yoping, o'ngdan chiqaring</li>
        <li>O'ngdan nafas oling, chapdan chiqaring</li>
        <li>5-10 sikl</li>
      </ol>

      <h3>5. Coherent breathing (umumiy)</h3>
      <p>Eng oddiy:</p>
      <ul>
        <li>5 sekund nafas oling</li>
        <li>5 sekund chiqaring</li>
        <li>10 daqiqa</li>
      </ul>

      <h2>Qachon ishlatish?</h2>

      <h3>🌅 Ertalab — Wim Hof</h3>
      <p>Energiya berish uchun</p>

      <h3>📊 Stress paytida — Box</h3>
      <p>Tez tinchlanish uchun</p>

      <h3>📚 Ish oldidan — Nadi Shodhana</h3>
      <p>Diqqatni jamlash uchun</p>

      <h3>🌙 Yotishdan oldin — 4-7-8</h3>
      <p>Tez uxlash uchun</p>

      <h3>♾️ Har vaqt — Coherent</h3>
      <p>Umumiy balans uchun</p>

      <h2>Burun nafas afzalligi</h2>
      <p>Ko'pchilik og'iz bilan nafas oladi — bu yomon!</p>

      <p>Burun bilan nafas:</p>
      <ul>
        <li>Havoni filtrlaydi</li>
        <li>Isitadi</li>
        <li>Namlaydi</li>
        <li>Azot oksidi ishlab chiqaradi (immunitet)</li>
        <li>Yaxshi uyqu</li>
      </ul>

      <p><strong>Yotishda</strong> agiz lentasi ishlatib ko'ring (Mouth tape).</p>

      <blockquote>"Nafas — siz va dunyo orasidagi ko'prik. Uni boshqaring — hayotingizni boshqarasiz." — Tich Nhat Hanh</blockquote>

      <p><strong>Lumio'da</strong> Meditatsiya bo'limi 3 ta nafas mashqi bor: 4-7-8, Box, Deep. Sinab ko'ring!</p>
    `
  }
];

const ARTICLE_CATS = {
  all: { name: 'Hammasi', icon: '📚' },
  science: { name: 'Ilm-fan', icon: '🔬' },
  psychology: { name: 'Psixologiya', icon: '🧠' },
  health: { name: 'Salomatlik', icon: '💪' },
  growth: { name: 'Rivojlanish', icon: '🌱' },
  productivity: { name: 'Mahsuldorlik', icon: '⚡' },
  finance: { name: 'Moliya', icon: '💰' },
  career: { name: 'Karyera', icon: '💼' },
  relationships: { name: 'Munosabatlar', icon: '🤝' },
  mindfulness: { name: 'Mindfulness', icon: '🧘' },
  creativity: { name: 'Ijod', icon: '🎨' },
  learning: { name: "O'qish", icon: '📖' },
  tech: { name: 'Texnologiya', icon: '💻' },
  philosophy: { name: 'Falsafa', icon: '📜' }
};

let _currentArticleCat = 'all';

function setArticleCategory(cat) {
  _currentArticleCat = cat;
  document.querySelectorAll('#articleTabs .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cat === cat);
  });
  renderArticles();
}

function renderArticles() {
  const list = document.getElementById('articlesList');
  if (!list) return;
  let filtered = ARTICLES;
  if (_currentArticleCat !== 'all') {
    filtered = ARTICLES.filter(a => a.cat === _currentArticleCat);
  }
  list.innerHTML = filtered.map(a => `
    <button class="article-card" onclick="openArticle('${a.id}')">
      <div class="article-card-header">
        <div class="article-icon" style="background:${a.iconBg};color:${a.iconColor}">${a.icon}</div>
        <div class="article-cat-badge">${ARTICLE_CATS[a.cat]?.icon || ''} ${ARTICLE_CATS[a.cat]?.name || a.cat}</div>
      </div>
      <div class="article-title">${a.title}</div>
      <div class="article-summary">${a.summary}</div>
      <div class="article-meta">
        <span class="article-read-time"><i class="fa-regular fa-clock"></i> ${a.readTime} daq o'qish</span>
        <span><i class="fa-solid fa-arrow-right"></i></span>
      </div>
    </button>
  `).join('');
}

function openArticle(id) {
  const article = ARTICLES.find(a => a.id === id);
  if (!article) return;
  const c = document.getElementById('modalContent');
  if (!c) return;
  c.innerHTML = `
    <div class="article-reader">
      <div class="modal-head">
        <div class="modal-title">${ARTICLE_CATS[article.cat]?.icon || ''} ${ARTICLE_CATS[article.cat]?.name || article.cat}</div>
        <button class="icon-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="article-reader-header">
        <div class="article-icon" style="background:${article.iconBg};color:${article.iconColor};width:56px;height:56px;font-size:1.7rem">${article.icon}</div>
        <div>
          <h1>${article.title}</h1>
          <div class="muted" style="font-size:.82rem"><i class="fa-regular fa-clock"></i> ${article.readTime} daq o'qish</div>
        </div>
      </div>
      <div class="article-content">${article.content}</div>
      <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border);text-align:center">
        <p class="muted" style="font-size:.82rem;margin-bottom:1rem">O'qishni tugatdingizmi?</p>
        <button class="btn btn-primary" onclick="closeModal();markArticleRead('${article.id}')">
          <i class="fa-solid fa-check"></i> Tugatdim! (+10 XP)
        </button>
      </div>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  // Track read
  if (!state.articleViews) state.articleViews = {};
  state.articleViews[id] = (state.articleViews[id] || 0) + 1;
  save();
}

function markArticleRead(id) {
  if (!state.articlesRead) state.articlesRead = [];
  if (!state.articlesRead.includes(id)) {
    state.articlesRead.push(id);
    if (typeof addXp === 'function') addXp(10, 'Maqola o\'qish');
    try { fx?.play('complete'); } catch {}
    save();
    if (state.articlesRead.length === 1) {
      setTimeout(() => toast('🎉 Birinchi maqolani tugatdingiz!', 'success'), 600);
    } else if (state.articlesRead.length === 5) {
      setTimeout(() => toast('🌟 5 ta maqola — chinakam o\'quvchisiz!', 'success'), 600);
    } else if (state.articlesRead.length === ARTICLES.length) {
      setTimeout(() => {
        toast('🏆 Hammasini o\'qidingiz! Ajoyib!', 'success');
        try { window.confetti?.celebrate(); } catch {}
      }, 600);
    }
  } else {
    toast('✅ Tugatildi', 'info');
  }
}

// Hook into navigation
{
  const _origGoArt = window.goPage;
  if (_origGoArt) {
    window.goPage = function(page) {
      _origGoArt(page);
      if (page === 'articles') {
        setTimeout(renderArticles, 100);
      }
    };
  }
}
setTimeout(() => {
  document.querySelectorAll('.nav-item[data-page="articles"]').forEach(n => {
    n.addEventListener('click', () => setTimeout(renderArticles, 150));
  });
}, 2000);

window.setArticleCategory = setArticleCategory;
window.renderArticles = renderArticles;
window.openArticle = openArticle;
window.markArticleRead = markArticleRead;

// Auto-render if articles page is somehow active
setTimeout(() => {
  if (document.getElementById('page-articles')?.classList.contains('active')) {
    renderArticles();
  }
}, 3000);

console.log('📚 Lumio v1.3 — 12 articles + 10 workout templates loaded');
