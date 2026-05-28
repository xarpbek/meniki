// ===== HABITFLOW APP =====
'use strict';

// ===== STATE =====
let habits = [];
let completions = {}; // { 'YYYY-MM-DD': { habitId: count } }
let settings = { theme: 'dark', reminderTime: '09:00', enableReminders: false };
let charts = {};
let selectedColor = '#6366f1';
let confirmCallback = null;

// ===== CONSTANTS =====
const CATEGORY_ICONS = {
  health: '🏥', fitness: '💪', learning: '📚',
  mindfulness: '🧘', productivity: '⚡', social: '👥', other: '✨'
};
const CATEGORY_LABELS = {
  health: "Sog'liq", fitness: 'Sport', learning: "O'rganish",
  mindfulness: 'Mindfulness', productivity: 'Samaradorlik', social: 'Ijtimoiy', other: 'Boshqa'
};

// ===== STORAGE =====
function saveData() {
  localStorage.setItem('hf_habits', JSON.stringify(habits));
  localStorage.setItem('hf_completions', JSON.stringify(completions));
  localStorage.setItem('hf_settings', JSON.stringify(settings));
}
function loadData() {
  try { habits = JSON.parse(localStorage.getItem('hf_habits')) || []; } catch { habits = []; }
  try { completions = JSON.parse(localStorage.getItem('hf_completions')) || {}; } catch { completions = {}; }
  try { settings = { ...settings, ...JSON.parse(localStorage.getItem('hf_settings')) }; } catch {}
}

// ===== HELPERS =====
function today() {
  return new Date().toISOString().split('T')[0];
}
function dateStr(d) {
  return d.toISOString().split('T')[0];
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function getCompletion(habitId, date) {
  return (completions[date] && completions[date][habitId]) || 0;
}
function setCompletion(habitId, date, val) {
  if (!completions[date]) completions[date] = {};
  completions[date][habitId] = val;
}
function isCompletedToday(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return false;
  return getCompletion(habitId, today()) >= h.target;
}

// Streak calculation
function calcStreak(habitId) {
  let streak = 0;
  const h = habits.find(x => x.id === habitId);
  if (!h) return 0;
  let d = new Date();
  // if not completed today, start from yesterday
  if (!isCompletedToday(habitId)) d.setDate(d.getDate() - 1);
  while (true) {
    const ds = dateStr(d);
    if (getCompletion(habitId, ds) >= h.target) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
function calcLongestStreak(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return 0;
  const dates = Object.keys(completions).sort();
  if (!dates.length) return 0;
  let max = 0, cur = 0;
  let prev = null;
  dates.forEach(ds => {
    if (getCompletion(habitId, ds) >= h.target) {
      if (prev) {
        const p = new Date(prev), c = new Date(ds);
        const diff = (c - p) / 86400000;
        if (diff === 1) cur++;
        else cur = 1;
      } else cur = 1;
      if (cur > max) max = cur;
      prev = ds;
    } else prev = null;
  });
  return max;
}
function globalStreak() {
  if (!habits.length) return 0;
  let d = new Date();
  let streak = 0;
  while (true) {
    const ds = dateStr(d);
    const anyDone = habits.some(h => getCompletion(h.id, ds) >= h.target);
    if (anyDone) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}
function completionRate(habitId, days = 30) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (getCompletion(habitId, dateStr(d)) >= h.target) done++;
  }
  return Math.round((done / days) * 100);
}
function todayStats() {
  const total = habits.length;
  const done = habits.filter(h => isCompletedToday(h.id)).length;
  return { total, done, rate: total ? Math.round((done / total) * 100) : 0 };
}


// ===== NAVIGATION =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  const titles = { dashboard:'Dashboard', habits:'Odatlar', analytics:'Tahlil', heatmap:'Faollik Xaritasi', settings:'Sozlamalar' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  // close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
  // refresh page content
  if (page === 'dashboard') renderDashboard();
  if (page === 'habits') renderHabitsGrid();
  if (page === 'analytics') renderAnalytics();
  if (page === 'heatmap') renderHeatmap();
  if (page === 'settings') renderSettings();
}

// ===== TOAST =====
function toast(msg, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 2800);
}

// ===== MODAL =====
function openModal(habitId = null) {
  const modal = document.getElementById('modalOverlay');
  const form = document.getElementById('habitForm');
  form.reset();
  selectedColor = '#6366f1';
  document.querySelectorAll('.color-opt').forEach(c => c.classList.remove('selected'));
  document.querySelector('.color-opt[data-color="#6366f1"]').classList.add('selected');
  if (habitId) {
    const h = habits.find(x => x.id === habitId);
    document.getElementById('modalTitle').textContent = 'Odatni Tahrirlash';
    document.getElementById('editHabitId').value = h.id;
    document.getElementById('habitName').value = h.name;
    document.getElementById('habitCategory').value = h.category;
    document.getElementById('habitTarget').value = h.target;
    document.getElementById('habitUnit').value = h.unit || '';
    document.getElementById('habitDesc').value = h.desc || '';
    document.getElementById('habitReminder').value = h.reminder || '';
    selectedColor = h.color;
    document.querySelectorAll('.color-opt').forEach(c => {
      c.classList.toggle('selected', c.dataset.color === h.color);
    });
  } else {
    document.getElementById('modalTitle').textContent = "Yangi Odat Qo'shish";
    document.getElementById('editHabitId').value = '';
  }
  modal.classList.add('open');
  document.getElementById('habitName').focus();
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}
function showConfirm(title, msg, cb) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmOverlay').classList.add('open');
  confirmCallback = cb;
}
function closeConfirm() {
  document.getElementById('confirmOverlay').classList.remove('open');
  confirmCallback = null;
}

// ===== HABIT CRUD =====
function addOrEditHabit(e) {
  e.preventDefault();
  const id = document.getElementById('editHabitId').value;
  const name = document.getElementById('habitName').value.trim();
  if (!name) return toast('Odat nomini kiriting!', 'error');
  const data = {
    name,
    category: document.getElementById('habitCategory').value,
    color: selectedColor,
    target: parseInt(document.getElementById('habitTarget').value) || 1,
    unit: document.getElementById('habitUnit').value.trim(),
    desc: document.getElementById('habitDesc').value.trim(),
    reminder: document.getElementById('habitReminder').value,
  };
  if (id) {
    const idx = habits.findIndex(h => h.id === id);
    habits[idx] = { ...habits[idx], ...data };
    toast('Odat yangilandi!', 'success');
  } else {
    habits.push({ ...data, id: uid(), createdAt: today() });
    toast("Yangi odat qo'shildi! 🎉", 'success');
  }
  saveData();
  closeModal();
  renderAll();
}
function deleteHabit(id) {
  const h = habits.find(x => x.id === id);
  showConfirm("Odatni o'chirish", `"${h.name}" odatini o'chirishni xohlaysizmi?`, () => {
    habits = habits.filter(x => x.id !== id);
    saveData();
    renderAll();
    toast("Odat o'chirildi", 'info');
    closeConfirm();
  });
}
function completeHabit(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return;
  const cur = getCompletion(habitId, today());
  if (cur >= h.target) {
    // undo
    setCompletion(habitId, today(), 0);
    toast('Bajarish bekor qilindi', 'info');
  } else {
    setCompletion(habitId, today(), cur + 1);
    if (cur + 1 >= h.target) {
      const streak = calcStreak(habitId);
      toast(`✅ "${h.name}" bajarildi! 🔥 ${streak} kun seriya`, 'success');
    }
  }
  saveData();
  renderAll();
}


// ===== RENDER DASHBOARD =====
function renderDashboard() {
  const stats = todayStats();
  const gs = globalStreak();
  document.getElementById('statTotal').textContent = stats.total;
  document.getElementById('statToday').textContent = stats.done;
  document.getElementById('statStreak').textContent = gs;
  document.getElementById('statRate').textContent = stats.rate + '%';
  document.getElementById('sidebarStreak').textContent = gs;
  document.getElementById('todayProgress').textContent = `${stats.done}/${stats.total}`;
  const pct = stats.total ? (stats.done / stats.total) * 100 : 0;
  document.getElementById('todayProgressBar').style.width = pct + '%';

  // Today's habit list
  const list = document.getElementById('todayHabitList');
  if (!habits.length) {
    list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-seedling"></i><p>Hali odat qo'shilmagan</p></div>`;
  } else {
    list.innerHTML = habits.map(h => {
      const done = isCompletedToday(h.id);
      const streak = calcStreak(h.id);
      return `<div class="today-item ${done ? 'done' : ''}" onclick="completeHabit('${h.id}')">
        <div class="check-circle" style="border-color:${h.color};${done ? `background:${h.color}` : ''}">
          ${done ? '<i class="fa-solid fa-check"></i>' : ''}
        </div>
        <span class="today-name">${h.name}</span>
        ${streak > 0 ? `<span class="today-streak"><i class="fa-solid fa-fire"></i>${streak}</span>` : ''}
      </div>`;
    }).join('');
  }

  renderWeeklyBarChart();
  renderTrendLineChart();
  renderCategoryDonutChart();
}

// ===== RENDER HABITS GRID =====
function renderHabitsGrid() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const catFilter = document.getElementById('filterCategory')?.value || 'all';
  const statusFilter = document.getElementById('filterStatus')?.value || 'all';

  let filtered = habits.filter(h => {
    if (search && !h.name.toLowerCase().includes(search)) return false;
    if (catFilter !== 'all' && h.category !== catFilter) return false;
    if (statusFilter === 'completed' && !isCompletedToday(h.id)) return false;
    if (statusFilter === 'active' && isCompletedToday(h.id)) return false;
    return true;
  });

  const grid = document.getElementById('habitsGrid');
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state full">
      <i class="fa-solid fa-clipboard-list"></i>
      <p>${habits.length ? 'Hech narsa topilmadi' : 'Hali odat qo\'shilmagan'}</p>
      ${!habits.length ? `<button class="btn-primary" onclick="openModal()"><i class="fa-solid fa-plus"></i> Birinchi odatni qo'shing</button>` : ''}
    </div>`;
    return;
  }
  grid.innerHTML = filtered.map(h => {
    const cur = getCompletion(h.id, today());
    const pct = Math.min(100, (cur / h.target) * 100);
    const done = cur >= h.target;
    const streak = calcStreak(h.id);
    const rate = completionRate(h.id, 30);
    const icon = CATEGORY_ICONS[h.category] || '✨';
    const catLabel = CATEGORY_LABELS[h.category] || 'Boshqa';
    return `<div class="habit-card" style="--card-color:${h.color};border-left:4px solid ${h.color}">
      <div style="content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:${h.color}"></div>
      <div class="habit-card-header">
        <div class="habit-title-row">
          <div class="habit-icon" style="background:${h.color}22;color:${h.color}">${icon}</div>
          <div>
            <div class="habit-name">${h.name}</div>
            ${h.desc ? `<div class="habit-desc">${h.desc}</div>` : ''}
          </div>
        </div>
        <div class="habit-actions">
          <button class="icon-btn" onclick="openModal('${h.id}')" title="Tahrirlash"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn delete" onclick="deleteHabit('${h.id}')" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="habit-meta">
        <span class="tag tag-cat">${catLabel}</span>
        ${h.unit ? `<span class="tag" style="background:${h.color}22;color:${h.color}">${h.target} ${h.unit}</span>` : ''}
        ${streak > 0 ? `<span class="tag" style="background:rgba(245,158,11,0.15);color:#f59e0b"><i class="fa-solid fa-fire"></i> ${streak} kun</span>` : ''}
      </div>
      <div class="habit-progress-row">
        <div class="habit-progress-wrap">
          <div class="habit-progress-fill" style="width:${pct}%;background:${h.color}"></div>
        </div>
        <span class="habit-progress-text" style="color:${h.color}">${cur}/${h.target}</span>
      </div>
      <div class="habit-stats-row">
        <span><i class="fa-solid fa-calendar-check"></i> 30 kun: ${rate}%</span>
        <span><i class="fa-solid fa-medal"></i> En uzun: ${calcLongestStreak(h.id)}</span>
      </div>
      <button class="complete-btn ${done ? 'completed' : ''}" 
        style="border-color:${h.color};${done ? `background:${h.color}` : `color:${h.color}`}"
        onclick="completeHabit('${h.id}')">
        <i class="fa-solid ${done ? 'fa-rotate-left' : 'fa-check'}"></i>
        ${done ? 'Bekor qilish' : "Bajarildi deb belgilash"}
      </button>
    </div>`;
  }).join('');
}


// ===== CHARTS =====
function destroyChart(key) {
  if (charts[key]) { charts[key].destroy(); charts[key] = null; }
}

function renderWeeklyBarChart() {
  destroyChart('weeklyBar');
  const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  const labels = [], data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    labels.push(days[d.getDay() === 0 ? 6 : d.getDay() - 1]);
    const ds = dateStr(d);
    const done = habits.filter(h => getCompletion(h.id, ds) >= h.target).length;
    const total = habits.length;
    data.push(total ? Math.round((done / total) * 100) : 0);
  }
  const ctx = document.getElementById('weeklyBarChart');
  if (!ctx) return;
  charts['weeklyBar'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Bajarish %',
        data,
        backgroundColor: data.map(v => v >= 80 ? 'rgba(34,197,94,0.8)' : v >= 50 ? 'rgba(99,102,241,0.8)' : 'rgba(239,68,68,0.6)'),
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: '#8892b0', callback: v => v + '%' }, grid: { color: '#2a2d3e' } },
        x: { ticks: { color: '#8892b0' }, grid: { display: false } }
      }
    }
  });
}

function renderTrendLineChart() {
  destroyChart('trendLine');
  const labels = [], data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    labels.push(i % 5 === 0 ? ds.slice(5) : '');
    const done = habits.filter(h => getCompletion(h.id, ds) >= h.target).length;
    const total = habits.length;
    data.push(total ? Math.round((done / total) * 100) : 0);
  }
  const ctx = document.getElementById('trendLineChart');
  if (!ctx) return;
  charts['trendLine'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Bajarish %',
        data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: '#8892b0', callback: v => v + '%' }, grid: { color: '#2a2d3e' } },
        x: { ticks: { color: '#8892b0' }, grid: { display: false } }
      }
    }
  });
}

function renderCategoryDonutChart() {
  destroyChart('catDonut');
  const cats = {};
  habits.forEach(h => { cats[h.category] = (cats[h.category] || 0) + 1; });
  const labels = Object.keys(cats).map(k => CATEGORY_LABELS[k] || k);
  const data = Object.values(cats);
  const colors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
  const ctx = document.getElementById('categoryDonutChart');
  if (!ctx) return;
  charts['catDonut'] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, data.length), borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: true, cutout: '65%',
      plugins: { legend: { position: 'right', labels: { color: '#8892b0', boxWidth: 12, padding: 10 } } }
    }
  });
}


// ===== ANALYTICS PAGE CHARTS =====
function renderAnalytics() {
  renderHabitCompareChart();
  renderCategoryPieChart();
  renderTopHabits();
  renderMonthlyCompareChart();
  renderTimeDistributionChart();
  renderStreakRanking();
}

function renderHabitCompareChart() {
  destroyChart('habitCompare');
  if (!habits.length) return;
  const labels = habits.map(h => h.name.length > 14 ? h.name.slice(0, 14) + '…' : h.name);
  const data = habits.map(h => completionRate(h.id, 30));
  const colors = habits.map(h => h.color);
  const ctx = document.getElementById('habitCompareChart');
  if (!ctx) return;
  charts['habitCompare'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '30 kunlik bajarish %',
        data,
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: '#8892b0', callback: v => v + '%' }, grid: { color: '#2a2d3e' } },
        x: { ticks: { color: '#8892b0' }, grid: { display: false } }
      }
    }
  });
}

function renderCategoryPieChart() {
  destroyChart('catPie');
  const cats = {};
  habits.forEach(h => { cats[h.category] = (cats[h.category] || 0) + 1; });
  if (!Object.keys(cats).length) return;
  const labels = Object.keys(cats).map(k => `${CATEGORY_ICONS[k]} ${CATEGORY_LABELS[k]}`);
  const data = Object.values(cats);
  const colors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
  const ctx = document.getElementById('categoryPieChart');
  if (!ctx) return;
  charts['catPie'] = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, data.length), borderWidth: 0, hoverOffset: 10 }] },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom', labels: { color: '#8892b0', boxWidth: 14, padding: 12 } } }
    }
  });
}

function renderTopHabits() {
  const sorted = [...habits].sort((a, b) => completionRate(b.id, 30) - completionRate(a.id, 30)).slice(0, 5);
  const rankIcons = ['gold', 'silver', 'bronze', '', ''];
  const el = document.getElementById('topHabitsList');
  if (!el) return;
  el.innerHTML = sorted.length ? sorted.map((h, i) => `
    <div class="top-habit-item">
      <div class="rank-num ${rankIcons[i]}">${i + 1}</div>
      <div class="rank-info">
        <div class="rank-name">${h.name}</div>
        <div class="rank-sub">${CATEGORY_LABELS[h.category]}</div>
      </div>
      <span class="rank-score" style="color:${h.color}">${completionRate(h.id, 30)}%</span>
    </div>`).join('') : '<div class="empty-state"><i class="fa-solid fa-trophy"></i><p>Ma\'lumot yo\'q</p></div>';
}

function renderMonthlyCompareChart() {
  destroyChart('monthlyCompare');
  const months = [];
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let total = 0, done = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      if (new Date(ds) > new Date()) continue;
      habits.forEach(h => {
        total++;
        if (getCompletion(h.id, ds) >= h.target) done++;
      });
    }
    months.push(['Yan','Feb','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'][month]);
    data.push(total ? Math.round((done / total) * 100) : 0);
  }
  const ctx = document.getElementById('monthlyCompareChart');
  if (!ctx) return;
  charts['monthlyCompare'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Oylik bajarish %',
        data,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22c55e',
        pointRadius: 5,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: '#8892b0', callback: v => v + '%' }, grid: { color: '#2a2d3e' } },
        x: { ticks: { color: '#8892b0' }, grid: { display: false } }
      }
    }
  });
}

function renderTimeDistributionChart() {
  destroyChart('timeDist');
  // Count completions per hour (using reminder times as proxy, or random based on cat)
  const timeSlots = { 'Ertalab (6-12)': 0, 'Tushdan keyin (12-18)': 0, 'Kechqurun (18-22)': 0, 'Kech kechqurun (22-6)': 0 };
  habits.forEach(h => {
    const r = h.reminder;
    if (r) {
      const hr = parseInt(r.split(':')[0]);
      if (hr >= 6 && hr < 12) timeSlots['Ertalab (6-12)']++;
      else if (hr >= 12 && hr < 18) timeSlots['Tushdan keyin (12-18)']++;
      else if (hr >= 18 && hr < 22) timeSlots['Kechqurun (18-22)']++;
      else timeSlots['Kech kechqurun (22-6)']++;
    } else timeSlots['Ertalab (6-12)']++;
  });
  const ctx = document.getElementById('timeDistributionChart');
  if (!ctx) return;
  charts['timeDist'] = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: Object.keys(timeSlots),
      datasets: [{ data: Object.values(timeSlots), backgroundColor: ['rgba(99,102,241,0.7)','rgba(34,197,94,0.7)','rgba(245,158,11,0.7)','rgba(168,85,247,0.7)'], borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom', labels: { color: '#8892b0', boxWidth: 12, padding: 8, font: { size: 11 } } } },
      scales: { r: { ticks: { display: false }, grid: { color: '#2a2d3e' } } }
    }
  });
}

function renderStreakRanking() {
  const sorted = [...habits].sort((a, b) => calcStreak(b.id) - calcStreak(a.id));
  const el = document.getElementById('streakRankingList');
  if (!el) return;
  el.innerHTML = sorted.length ? sorted.map((h, i) => {
    const streak = calcStreak(h.id);
    return `<div class="streak-item">
      <div class="rank-num">${i+1}</div>
      <div class="rank-info"><div class="rank-name">${h.name}</div><div class="rank-sub">${calcLongestStreak(h.id)} kun eng uzun</div></div>
      <span class="rank-score" style="color:#f59e0b"><i class="fa-solid fa-fire"></i> ${streak}</span>
    </div>`;
  }).join('') : '<div class="empty-state"><i class="fa-solid fa-fire"></i><p>Ma\'lumot yo\'q</p></div>';
}


// ===== HEATMAP =====
function renderHeatmap() {
  const select = document.getElementById('heatmapHabitSelect');
  const selectedHabit = select ? select.value : 'all';

  // Populate select
  if (select) {
    const currentVal = select.value;
    select.innerHTML = '<option value="all">Barcha odatlar</option>' +
      habits.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
    select.value = habits.find(h => h.id === currentVal) ? currentVal : 'all';
  }

  const container = document.getElementById('heatmapContainer');
  if (!container) return;

  // Build 53 weeks of data (1 year)
  const cellsData = {};
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  startDate.setDate(startDate.getDate() + 1);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const ds = dateStr(d);
    if (selectedHabit === 'all') {
      const total = habits.length;
      const done = habits.filter(h => getCompletion(h.id, ds) >= h.target).length;
      cellsData[ds] = total ? done / total : 0;
    } else {
      const h = habits.find(x => x.id === selectedHabit);
      cellsData[ds] = h ? Math.min(1, getCompletion(h.id, ds) / h.target) : 0;
    }
  }

  // Group into weeks
  const weeks = [];
  let week = [];
  let cur = new Date(startDate);
  // pad first week
  for (let i = 0; i < cur.getDay(); i++) week.push(null);
  while (cur <= endDate) {
    week.push(new Date(cur));
    if (week.length === 7) { weeks.push(week); week = []; }
    cur.setDate(cur.getDate() + 1);
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

  container.innerHTML = weeks.map(wk => `
    <div class="heatmap-week">
      ${wk.map(d => {
        if (!d) return `<div class="heatmap-cell" style="visibility:hidden"></div>`;
        const ds = dateStr(d);
        const val = cellsData[ds] || 0;
        const level = val === 0 ? 0 : val < 0.25 ? 1 : val < 0.5 ? 2 : val < 0.85 ? 3 : 4;
        const pct = Math.round(val * 100);
        return `<div class="heatmap-cell" data-level="${level}" title="${ds}: ${pct}% bajarildi"></div>`;
      }).join('')}
    </div>`).join('');

  // Stats
  const activeDays = Object.values(cellsData).filter(v => v > 0).length;
  let curStreak = 0, longestStreak = 0, tempStreak = 0;
  const today2 = today();
  let d2 = new Date();
  while (true) {
    const ds = dateStr(d2);
    if ((cellsData[ds] || 0) > 0) { curStreak++; d2.setDate(d2.getDate() - 1); }
    else break;
  }
  Object.keys(cellsData).sort().forEach(ds => {
    if ((cellsData[ds] || 0) > 0) tempStreak++;
    else tempStreak = 0;
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  });
  const total365 = Object.keys(cellsData).length;
  const totalDone = Object.values(cellsData).filter(v => v > 0).length;
  document.getElementById('heatTotalDays').textContent = activeDays;
  document.getElementById('heatCurrentStreak').textContent = curStreak;
  document.getElementById('heatLongestStreak').textContent = longestStreak;
  document.getElementById('heatCompletionRate').textContent = total365 ? Math.round((totalDone / total365) * 100) + '%' : '0%';
}

// ===== SETTINGS =====
function renderSettings() {
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === settings.theme);
  });
  const rt = document.getElementById('reminderTime');
  if (rt) rt.value = settings.reminderTime;
  const er = document.getElementById('enableReminders');
  if (er) er.checked = settings.enableReminders;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  settings.theme = theme;
  saveData();
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
}

// ===== EXPORT / IMPORT =====
function exportData() {
  const blob = new Blob([JSON.stringify({ habits, completions, settings }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `habitflow-backup-${today()}.json`;
  a.click();
  toast('Ma\'lumotlar eksport qilindi!', 'success');
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.habits) habits = data.habits;
      if (data.completions) completions = data.completions;
      if (data.settings) settings = { ...settings, ...data.settings };
      saveData();
      applyTheme(settings.theme);
      renderAll();
      toast('Ma\'lumotlar import qilindi!', 'success');
    } catch { toast('Fayl noto\'g\'ri format!', 'error'); }
  };
  reader.readAsText(file);
}


// ===== RENDER ALL =====
function renderAll() {
  const activePage = document.querySelector('.page.active');
  const pageId = activePage ? activePage.id.replace('page-', '') : 'dashboard';
  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'habits') renderHabitsGrid();
  if (pageId === 'analytics') renderAnalytics();
  if (pageId === 'heatmap') renderHeatmap();
  if (pageId === 'settings') renderSettings();
}

// ===== SEED DEMO DATA =====
function seedDemoData() {
  if (habits.length > 0) return;
  const demoHabits = [
    { name: 'Ertalabki yugurish', category: 'fitness', color: '#22c55e', target: 1, unit: 'marta', desc: '30 daqiqa yugurish' },
    { name: 'Kitob o\'qish', category: 'learning', color: '#6366f1', target: 20, unit: 'sahifa', desc: 'Har kuni o\'qish' },
    { name: 'Meditatsiya', category: 'mindfulness', color: '#06b6d4', target: 10, unit: 'daqiqa', desc: 'Tinchlanish va fokus' },
    { name: 'Suv ichish', category: 'health', color: '#f59e0b', target: 8, unit: 'stakan', desc: '2 litr suv' },
    { name: 'Ko\'niqishlar', category: 'productivity', color: '#ec4899', target: 1, unit: 'marta', desc: 'Kunlik vazifalarni bajarish' },
  ];
  demoHabits.forEach(d => habits.push({ ...d, id: uid(), createdAt: today() }));

  // Add some past completions
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    habits.forEach(h => {
      const rand = Math.random();
      if (rand > 0.25) setCompletion(h.id, ds, h.target);
    });
  }
  saveData();
  toast('Demo ma\'lumotlar yuklandi! 🚀', 'info');
}

// ===== DATE DISPLAY =====
function updateDateDisplay() {
  const d = new Date();
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const days = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  document.getElementById('todayDate').textContent = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

// ===== INIT =====
function init() {
  loadData();
  applyTheme(settings.theme);
  updateDateDisplay();
  seedDemoData();
  renderDashboard();

  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => { e.preventDefault(); navigateTo(item.dataset.page); });
  });

  // Sidebar toggle
  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.getElementById('sidebarClose').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });

  // Add habit buttons
  document.getElementById('openAddModal').addEventListener('click', () => openModal());
  document.getElementById('emptyAddBtn')?.addEventListener('click', () => openModal());

  // Modal controls
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  document.getElementById('habitForm').addEventListener('submit', addOrEditHabit);
  document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

  // Color picker
  document.querySelectorAll('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.color-opt').forEach(c => c.classList.remove('selected'));
      opt.classList.add('selected');
      selectedColor = opt.dataset.color;
    });
  });

  // Confirm modal
  document.getElementById('confirmCancel').addEventListener('click', closeConfirm);
  document.getElementById('confirmOk').addEventListener('click', () => { if (confirmCallback) confirmCallback(); });
  document.getElementById('confirmOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeConfirm(); });

  // Search & filter
  document.getElementById('searchInput').addEventListener('input', renderHabitsGrid);
  document.getElementById('filterCategory').addEventListener('change', renderHabitsGrid);
  document.getElementById('filterStatus').addEventListener('change', renderHabitsGrid);

  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });

  // Settings
  document.getElementById('reminderTime').addEventListener('change', e => {
    settings.reminderTime = e.target.value; saveData();
  });
  document.getElementById('enableReminders').addEventListener('change', e => {
    settings.enableReminders = e.target.checked; saveData();
    if (e.target.checked && 'Notification' in window) Notification.requestPermission();
  });

  // Export / Import
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); });

  // Clear all
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    showConfirm("Barcha ma'lumotlarni o'chirish", "Bu amalni ortga qaytarib bo'lmaydi. Barcha odatlar va ma'lumotlar o'chib ketadi!", () => {
      habits = []; completions = {};
      saveData(); renderAll(); closeConfirm();
      toast("Barcha ma'lumotlar o'chirildi", 'info');
    });
  });

  // Heatmap habit select
  document.getElementById('heatmapHabitSelect').addEventListener('change', renderHeatmap);

  // Reminder check every minute
  setInterval(() => {
    if (!settings.enableReminders || !('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    habits.forEach(h => {
      if (h.reminder === cur && !isCompletedToday(h.id)) {
        new Notification('HabitFlow', { body: `"${h.name}" odatini bajarishni unutmang!`, icon: '' });
      }
    });
  }, 60000);
}

document.addEventListener('DOMContentLoaded', init);
