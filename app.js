'use strict';
// ═══════════════ STATE ═══════════════
let habits = [], completions = {}, settings = { theme:'dark', reminderTime:'09:00', enableReminders:false };
let charts = {}, selectedColor = '#7c6af7', confirmCallback = null;

const CAT_ICON  = { health:'🏥', fitness:'💪', learning:'📚', mindfulness:'🧘', productivity:'⚡', social:'👥', other:'✨' };
const CAT_LABEL = { health:"Sog'liq", fitness:'Sport', learning:"O'rganish", mindfulness:'Mindfulness', productivity:'Samaradorlik', social:'Ijtimoiy', other:'Boshqa' };
const CHART_DEFAULTS = {
  color: { text:'#7c85b3', grid:'rgba(255,255,255,0.06)', tick:'#7c85b3' }
};

// ═══════════════ STORAGE ═══════════════
function save(){ localStorage.setItem('hf2_h',JSON.stringify(habits)); localStorage.setItem('hf2_c',JSON.stringify(completions)); localStorage.setItem('hf2_s',JSON.stringify(settings)); }
function load(){
  try{ habits=JSON.parse(localStorage.getItem('hf2_h'))||[]; }catch{ habits=[]; }
  try{ completions=JSON.parse(localStorage.getItem('hf2_c'))||{}; }catch{ completions={}; }
  try{ settings={...settings,...JSON.parse(localStorage.getItem('hf2_s'))}; }catch{}
}

// ═══════════════ HELPERS ═══════════════
const today   = ()=> new Date().toISOString().split('T')[0];
const dstr    = d => d.toISOString().split('T')[0];
const uid     = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2);
const getCmp  = (hid,date)=> (completions[date]&&completions[date][hid])||0;
const setCmp  = (hid,date,v)=>{ if(!completions[date])completions[date]={}; completions[date][hid]=v; };
const isDone  = hid=>{ const h=habits.find(x=>x.id===hid); return h?getCmp(hid,today())>=h.target:false; };

function calcStreak(hid){
  const h=habits.find(x=>x.id===hid); if(!h) return 0;
  let s=0, d=new Date();
  if(!isDone(hid)) d.setDate(d.getDate()-1);
  while(getCmp(hid,dstr(d))>=h.target){ s++; d.setDate(d.getDate()-1); }
  return s;
}
function calcLongest(hid){
  const h=habits.find(x=>x.id===hid); if(!h) return 0;
  const dates=Object.keys(completions).sort(); let max=0,cur=0,prev=null;
  dates.forEach(ds=>{ if(getCmp(hid,ds)>=h.target){ cur= prev&&(new Date(ds)-new Date(prev))/86400000===1?cur+1:1; if(cur>max)max=cur; prev=ds; }else prev=null; });
  return max;
}
function globalStreak(){
  if(!habits.length) return 0;
  let s=0,d=new Date();
  while(true){ const ds=dstr(d); if(habits.some(h=>getCmp(h.id,ds)>=h.target)){ s++; d.setDate(d.getDate()-1); }else break; }
  return s;
}
function compRate(hid,days=30){
  const h=habits.find(x=>x.id===hid); if(!h) return 0;
  let done=0;
  for(let i=0;i<days;i++){ const d=new Date(); d.setDate(d.getDate()-i); if(getCmp(hid,dstr(d))>=h.target)done++; }
  return Math.round((done/days)*100);
}
function todayStats(){ const t=habits.length,d=habits.filter(h=>isDone(h.id)).length; return{t,d,r:t?Math.round((d/t)*100):0}; }


// ═══════════════ TOAST ═══════════════
function toast(msg,type='info'){
  const ic={success:'fa-circle-check',error:'fa-circle-xmark',info:'fa-circle-info'};
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  el.innerHTML=`<i class="fa-solid ${ic[type]}"></i><span>${msg}</span>`;
  document.getElementById('toastWrap').appendChild(el);
  setTimeout(()=>{ el.style.cssText='opacity:0;transform:translateX(20px);transition:.3s'; setTimeout(()=>el.remove(),300); },2800);
}

// ═══════════════ MODAL ═══════════════
function openModal(hid=null){
  document.getElementById('habitForm').reset();
  selectedColor='#7c6af7';
  document.querySelectorAll('.c-opt').forEach(c=>c.classList.remove('sel'));
  document.querySelector('.c-opt[data-c="#7c6af7"]').classList.add('sel');
  if(hid){
    const h=habits.find(x=>x.id===hid);
    document.getElementById('modalTitle').textContent='Odatni Tahrirlash';
    document.getElementById('editHabitId').value=h.id;
    document.getElementById('habitName').value=h.name;
    document.getElementById('habitCategory').value=h.category;
    document.getElementById('habitTarget').value=h.target;
    document.getElementById('habitUnit').value=h.unit||'';
    document.getElementById('habitDesc').value=h.desc||'';
    document.getElementById('habitReminder').value=h.reminder||'';
    selectedColor=h.color;
    document.querySelectorAll('.c-opt').forEach(c=>c.classList.toggle('sel',c.dataset.c===h.color));
  } else {
    document.getElementById('modalTitle').textContent="Yangi Odat Qo'shish";
    document.getElementById('editHabitId').value='';
  }
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('habitName').focus(),100);
}
const closeModal = ()=> document.getElementById('modalOverlay').classList.remove('open');

function showConfirm(title,msg,cb){
  document.getElementById('confirmTitle').textContent=title;
  document.getElementById('confirmMsg').textContent=msg;
  document.getElementById('confirmOverlay').classList.add('open');
  confirmCallback=cb;
}
const closeConfirm = ()=>{ document.getElementById('confirmOverlay').classList.remove('open'); confirmCallback=null; };

// ═══════════════ HABIT CRUD ═══════════════
function saveHabit(e){
  e.preventDefault();
  const id=document.getElementById('editHabitId').value;
  const name=document.getElementById('habitName').value.trim();
  if(!name) return toast('Odat nomini kiriting!','error');
  const data={ name, category:document.getElementById('habitCategory').value, color:selectedColor,
    target:parseInt(document.getElementById('habitTarget').value)||1,
    unit:document.getElementById('habitUnit').value.trim(),
    desc:document.getElementById('habitDesc').value.trim(),
    reminder:document.getElementById('habitReminder').value };
  if(id){ const i=habits.findIndex(h=>h.id===id); habits[i]={...habits[i],...data}; toast('Odat yangilandi!','success'); }
  else{ habits.push({...data,id:uid(),createdAt:today()}); toast("Yangi odat qo'shildi! 🎉",'success'); }
  save(); closeModal(); renderAll();
}
function deleteHabit(id){
  const h=habits.find(x=>x.id===id);
  showConfirm("Odatni o'chirish",`"${h.name}" odatini o'chirmoqchimisiz?`,()=>{
    habits=habits.filter(x=>x.id!==id); save(); renderAll(); toast("O'chirildi",'info'); closeConfirm();
  });
}
function toggleHabit(hid){
  const h=habits.find(x=>x.id===hid); if(!h) return;
  const cur=getCmp(hid,today());
  if(cur>=h.target){ setCmp(hid,today(),0); toast('Bekor qilindi','info'); }
  else{ setCmp(hid,today(),cur+1); if(cur+1>=h.target) toast(`✅ "${h.name}" — ${calcStreak(hid)} kun seriya!`,'success'); }
  save(); renderAll();
}


// ═══════════════ NAVIGATION ═══════════════
function go(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+page)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  const titles={dashboard:'Dashboard',habits:'Odatlar',analytics:'Statistika',heatmap:'Faollik Xaritasi',settings:'Sozlamalar'};
  const bc={dashboard:'Ana sahifa',habits:'Odatlar ro\'yxati',analytics:'Tahlil va statistika',heatmap:'Yillik faollik',settings:'Sozlamalar'};
  document.getElementById('pageTitle').textContent=titles[page]||page;
  document.getElementById('breadcrumb').textContent=bc[page]||page;
  document.getElementById('sidebar').classList.remove('open');
  if(page==='dashboard') renderDashboard();
  if(page==='habits') renderHabits();
  if(page==='analytics') renderAnalytics();
  if(page==='heatmap') renderHeatmap();
  if(page==='settings') renderSettings();
}

// ═══════════════ THEME ═══════════════
function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  settings.theme=t; save();
  document.querySelectorAll('.theme-opt').forEach(b=>b.classList.toggle('active',b.dataset.theme===t));
  // update chart grid color
  CHART_DEFAULTS.color.grid = t==='light'?'rgba(0,0,0,0.07)':'rgba(255,255,255,0.06)';
  CHART_DEFAULTS.color.text = t==='light'?'#5a6080':'#7c85b3';
}

// ═══════════════ RENDER DASHBOARD ═══════════════
function renderDashboard(){
  const s=todayStats(), gs=globalStreak();
  document.getElementById('statTotal').textContent=s.t;
  document.getElementById('statToday').textContent=s.d;
  document.getElementById('statStreak').textContent=gs;
  document.getElementById('statRate').textContent=s.r+'%';
  document.getElementById('sidebarStreak').textContent=gs;
  document.getElementById('streakBarFill').style.width=Math.min(100,(gs/30)*100)+'%';
  document.getElementById('todayProgress').textContent=`${s.d}/${s.t}`;
  document.getElementById('todayBar').style.width=(s.t?s.d/s.t*100:0)+'%';

  const list=document.getElementById('todayList');
  if(!habits.length){
    list.innerHTML=`<div class="empty"><div class="empty-icon"><i class="fa-solid fa-seedling"></i></div><p>Hali odat qo'shilmagan</p></div>`;
  } else {
    list.innerHTML=habits.map(h=>{
      const done=isDone(h.id), streak=calcStreak(h.id);
      return `<div class="t-item ${done?'done':''}" onclick="toggleHabit('${h.id}')">
        <div class="t-check" style="border-color:${h.color};${done?`background:${h.color}`:''}">
          ${done?'<i class="fa-solid fa-check"></i>':''}
        </div>
        <span class="t-name">${CAT_ICON[h.category]||'✨'} ${h.name}</span>
        ${streak>0?`<span class="t-streak">🔥${streak}</span>`:''}
      </div>`;
    }).join('');
  }
  renderWeeklyChart(); renderTrendChart(); renderCatDonut();
}

// ═══════════════ RENDER HABITS ═══════════════
function renderHabits(){
  const q=(document.getElementById('searchInput')?.value||'').toLowerCase();
  const cat=document.querySelector('.filter-pill.active[data-cat]')?.dataset.cat||'all';
  const status=document.getElementById('filterStatus')?.value||'all';
  const filtered=habits.filter(h=>{
    if(q&&!h.name.toLowerCase().includes(q)) return false;
    if(cat!=='all'&&h.category!==cat) return false;
    if(status==='completed'&&!isDone(h.id)) return false;
    if(status==='active'&&isDone(h.id)) return false;
    return true;
  });
  const grid=document.getElementById('habitsGrid');
  if(!filtered.length){
    grid.innerHTML=`<div class="empty full"><div class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></div>
      <p>${habits.length?'Hech narsa topilmadi':"Hali odat qo'shilmagan"}</p>
      ${!habits.length?`<button class="btn-primary" onclick="openModal()" style="margin-top:.8rem"><i class="fa-solid fa-plus"></i> Qo'shish</button>`:''}
    </div>`; return;
  }
  grid.innerHTML=filtered.map(h=>{
    const cur=getCmp(h.id,today()), pct=Math.min(100,(cur/h.target)*100);
    const done=cur>=h.target, streak=calcStreak(h.id), rate=compRate(h.id,30);
    return `<div class="habit-card">
      <div class="hc-glow" style="background:${h.color}"></div>
      <div class="hc-top">
        <div class="hc-left">
          <div class="hc-icon" style="background:${h.color}22;color:${h.color}">${CAT_ICON[h.category]||'✨'}</div>
          <div><div class="hc-name">${h.name}</div>${h.desc?`<div class="hc-desc">${h.desc}</div>`:''}</div>
        </div>
        <div class="hc-actions">
          <button class="ic-btn" onclick="openModal('${h.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="ic-btn del" onclick="deleteHabit('${h.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="hc-tags">
        <span class="tag" style="background:${h.color}20;color:${h.color}">${CAT_LABEL[h.category]||'Boshqa'}</span>
        ${h.unit?`<span class="tag" style="background:rgba(255,255,255,.06);color:var(--text2)">${h.target} ${h.unit}</span>`:''}
        ${streak>0?`<span class="tag" style="background:rgba(255,150,64,.15);color:#ff9640">🔥 ${streak} kun</span>`:''}
      </div>
      <div class="hc-progress">
        <div class="hc-prog-wrap"><div class="hc-prog-fill" style="width:${pct}%;background:${h.color}"></div></div>
        <span class="hc-prog-text" style="color:${h.color}">${cur}/${h.target}</span>
      </div>
      <div class="hc-stats">
        <span><i class="fa-solid fa-calendar-check"></i> 30 kun: ${rate}%</span>
        <span><i class="fa-solid fa-medal"></i> Rekord: ${calcLongest(h.id)}</span>
      </div>
      <button class="hc-btn ${done?'done':''}" onclick="toggleHabit('${h.id}')"
        style="border-color:${h.color};color:${done?'#fff':h.color};${done?`background:${h.color}`:''}">
        <i class="fa-solid ${done?'fa-rotate-left':'fa-check'}"></i>
        ${done?'Bekor qilish':'Bajarildi deb belgilash'}
      </button>
    </div>`;
  }).join('');
}


// ═══════════════ CHART HELPERS ═══════════════
const gc = ()=> CHART_DEFAULTS.color;
function killChart(k){ if(charts[k]){ charts[k].destroy(); charts[k]=null; } }
const chartOpts = (extra={})=>({
  responsive:true, maintainAspectRatio:true,
  plugins:{ legend:{display:false}, ...extra.plugins },
  scales:{
    y:{ beginAtZero:true, max:100, ticks:{color:gc().text,callback:v=>v+'%'}, grid:{color:gc().grid} },
    x:{ ticks:{color:gc().text}, grid:{display:false} }
  }, ...extra
});

// ═══════════════ DASHBOARD CHARTS ═══════════════
function renderWeeklyChart(){
  killChart('weekly');
  const days=['Du','Se','Ch','Pa','Ju','Sh','Ya'], labels=[], data=[];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    labels.push(days[d.getDay()===0?6:d.getDay()-1]);
    const ds=dstr(d), done=habits.filter(h=>getCmp(h.id,ds)>=h.target).length;
    data.push(habits.length?Math.round((done/habits.length)*100):0);
  }
  const ctx=document.getElementById('weeklyBarChart'); if(!ctx) return;
  charts['weekly']=new Chart(ctx,{
    type:'bar',
    data:{ labels, datasets:[{ data, backgroundColor:data.map(v=>v>=80?'rgba(34,216,122,.8)':v>=50?'rgba(124,106,247,.8)':'rgba(255,95,109,.6)'), borderRadius:10, borderSkipped:false }] },
    options:chartOpts()
  });
}

function renderTrendChart(){
  killChart('trend');
  const labels=[], data=[];
  for(let i=29;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    labels.push(i%7===0?dstr(d).slice(5):'');
    const done=habits.filter(h=>getCmp(h.id,dstr(d))>=h.target).length;
    data.push(habits.length?Math.round((done/habits.length)*100):0);
  }
  const ctx=document.getElementById('trendLineChart'); if(!ctx) return;
  charts['trend']=new Chart(ctx,{
    type:'line',
    data:{ labels, datasets:[{ data, borderColor:'#7c6af7', backgroundColor:'rgba(124,106,247,.08)', fill:true, tension:.4, pointRadius:0, pointHoverRadius:5 }] },
    options:chartOpts()
  });
}

function renderCatDonut(){
  killChart('catd');
  const cats={};
  habits.forEach(h=>{ cats[h.category]=(cats[h.category]||0)+1; });
  const labels=Object.keys(cats).map(k=>CAT_ICON[k]+' '+CAT_LABEL[k]);
  const data=Object.values(cats);
  const colors=['#7c6af7','#22d87a','#ff9640','#ff5f6d','#38d9f5','#f066c6','#a3e635'];
  const ctx=document.getElementById('categoryDonutChart'); if(!ctx) return;
  charts['catd']=new Chart(ctx,{
    type:'doughnut',
    data:{ labels, datasets:[{ data, backgroundColor:colors.slice(0,data.length), borderWidth:0, hoverOffset:10 }] },
    options:{ responsive:true, cutout:'68%', plugins:{ legend:{ position:'right', labels:{ color:gc().text, boxWidth:12, padding:10, font:{size:11} } } } }
  });
}


// ═══════════════ ANALYTICS ═══════════════
function renderAnalytics(){ renderCompareChart(); renderCatPie(); renderTopHabits(); renderMonthly(); renderTimeDist(); renderStreakRank(); }

function renderCompareChart(){
  killChart('compare');
  if(!habits.length) return;
  const ctx=document.getElementById('habitCompareChart'); if(!ctx) return;
  charts['compare']=new Chart(ctx,{
    type:'bar',
    data:{ labels:habits.map(h=>h.name.length>14?h.name.slice(0,14)+'…':h.name),
      datasets:[{ data:habits.map(h=>compRate(h.id,30)), backgroundColor:habits.map(h=>h.color+'bb'), borderColor:habits.map(h=>h.color), borderWidth:2, borderRadius:10, borderSkipped:false }] },
    options:chartOpts()
  });
}

function renderCatPie(){
  killChart('catp');
  const cats={};
  habits.forEach(h=>{ cats[h.category]=(cats[h.category]||0)+1; });
  if(!Object.keys(cats).length) return;
  const ctx=document.getElementById('categoryPieChart'); if(!ctx) return;
  const colors=['#7c6af7','#22d87a','#ff9640','#ff5f6d','#38d9f5','#f066c6','#a3e635'];
  charts['catp']=new Chart(ctx,{
    type:'pie',
    data:{ labels:Object.keys(cats).map(k=>CAT_ICON[k]+' '+CAT_LABEL[k]),
      datasets:[{ data:Object.values(cats), backgroundColor:colors.slice(0,Object.keys(cats).length), borderWidth:0, hoverOffset:12 }] },
    options:{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ color:gc().text, boxWidth:13, padding:12 } } } }
  });
}

function renderTopHabits(){
  const el=document.getElementById('topHabitsList'); if(!el) return;
  const sorted=[...habits].sort((a,b)=>compRate(b.id,30)-compRate(a.id,30)).slice(0,5);
  const cls=['rb-1','rb-2','rb-3','rb-n','rb-n'];
  el.innerHTML=sorted.length?sorted.map((h,i)=>`
    <div class="rank-item">
      <div class="rank-badge ${cls[i]}">${i+1}</div>
      <div class="rank-info"><div class="rank-name">${h.name}</div><div class="rank-sub">${CAT_LABEL[h.category]}</div></div>
      <span class="rank-score" style="color:${h.color}">${compRate(h.id,30)}%</span>
    </div>`).join(''):`<div class="empty"><div class="empty-icon"><i class="fa-solid fa-trophy"></i></div><p>Ma'lumot yo'q</p></div>`;
}

function renderMonthly(){
  killChart('monthly');
  const months=[],data=[];
  for(let i=5;i>=0;i--){
    const d=new Date(); d.setMonth(d.getMonth()-i);
    const y=d.getFullYear(),m=d.getMonth(), dim=new Date(y,m+1,0).getDate();
    let t=0,dn=0;
    for(let day=1;day<=dim;day++){
      const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      if(new Date(ds)>new Date()) continue;
      habits.forEach(h=>{ t++; if(getCmp(h.id,ds)>=h.target)dn++; });
    }
    months.push(['Yan','Feb','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'][m]);
    data.push(t?Math.round((dn/t)*100):0);
  }
  const ctx=document.getElementById('monthlyCompareChart'); if(!ctx) return;
  charts['monthly']=new Chart(ctx,{
    type:'line',
    data:{ labels:months, datasets:[{ data, borderColor:'#22d87a', backgroundColor:'rgba(34,216,122,.08)', fill:true, tension:.4, pointBackgroundColor:'#22d87a', pointRadius:5, pointHoverRadius:8 }] },
    options:chartOpts()
  });
}

function renderTimeDist(){
  killChart('time');
  const slots={'Ertalab':0,'Kunduz':0,'Kechqurun':0,'Kech':0};
  habits.forEach(h=>{ const r=h.reminder; if(r){ const hr=parseInt(r); if(hr>=6&&hr<12)slots['Ertalab']++; else if(hr>=12&&hr<18)slots['Kunduz']++; else if(hr>=18&&hr<22)slots['Kechqurun']++; else slots['Kech']++; }else slots['Ertalab']++; });
  const ctx=document.getElementById('timeDistributionChart'); if(!ctx) return;
  charts['time']=new Chart(ctx,{
    type:'polarArea',
    data:{ labels:Object.keys(slots), datasets:[{ data:Object.values(slots), backgroundColor:['rgba(124,106,247,.7)','rgba(34,216,122,.7)','rgba(255,150,64,.7)','rgba(240,102,198,.7)'], borderWidth:0 }] },
    options:{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ color:gc().text, boxWidth:12, padding:8, font:{size:11} } } }, scales:{ r:{ ticks:{display:false}, grid:{color:gc().grid} } } }
  });
}

function renderStreakRank(){
  const el=document.getElementById('streakRankingList'); if(!el) return;
  const sorted=[...habits].sort((a,b)=>calcStreak(b.id)-calcStreak(a.id));
  el.innerHTML=sorted.length?sorted.map((h,i)=>`
    <div class="rank-item">
      <div class="rank-badge rb-n">${i+1}</div>
      <div class="rank-info"><div class="rank-name">${h.name}</div><div class="rank-sub">Rekord: ${calcLongest(h.id)} kun</div></div>
      <span class="rank-score" style="color:#ff9640">🔥 ${calcStreak(h.id)}</span>
    </div>`).join(''):`<div class="empty"><div class="empty-icon"><i class="fa-solid fa-fire"></i></div><p>Ma'lumot yo'q</p></div>`;
}


// ═══════════════ HEATMAP ═══════════════
function renderHeatmap(){
  const sel=document.getElementById('heatmapSelect');
  if(sel){ sel.innerHTML='<option value="all">Barcha odatlar</option>'+habits.map(h=>`<option value="${h.id}">${h.name}</option>`).join(''); }
  const selectedHabit=sel?sel.value:'all';
  const grid=document.getElementById('heatmapGrid'); if(!grid) return;

  const end=new Date(), start=new Date();
  start.setFullYear(start.getFullYear()-1); start.setDate(start.getDate()+1);
  const cells={};
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const ds=dstr(d);
    if(selectedHabit==='all'){
      const t=habits.length,dn=habits.filter(h=>getCmp(h.id,ds)>=h.target).length;
      cells[ds]=t?dn/t:0;
    } else {
      const h=habits.find(x=>x.id===selectedHabit);
      cells[ds]=h?Math.min(1,getCmp(h.id,ds)/h.target):0;
    }
  }

  const weeks=[];let week=[];let cur=new Date(start);
  for(let i=0;i<cur.getDay();i++) week.push(null);
  while(cur<=end){ week.push(new Date(cur)); if(week.length===7){weeks.push(week);week=[];} cur.setDate(cur.getDate()+1); }
  if(week.length){while(week.length<7)week.push(null);weeks.push(week);}

  grid.innerHTML=weeks.map(wk=>`<div class="hm-week">${wk.map(d=>{
    if(!d) return `<div class="hm-cell" style="visibility:hidden"></div>`;
    const ds=dstr(d),v=cells[ds]||0;
    const l=v===0?0:v<.25?1:v<.5?2:v<.85?3:4;
    return `<div class="hm-cell" data-l="${l}" title="${ds}: ${Math.round(v*100)}%"></div>`;
  }).join('')}</div>`).join('');

  // stats
  const active=Object.values(cells).filter(v=>v>0).length;
  let cur2=0,longest=0,tmp=0;
  const d2=new Date();
  while((cells[dstr(d2)]||0)>0){ cur2++; d2.setDate(d2.getDate()-1); }
  Object.keys(cells).sort().forEach(ds=>{ if((cells[ds]||0)>0){tmp++;}else tmp=0; if(tmp>longest)longest=tmp; });
  const total=Object.keys(cells).length;
  document.getElementById('heatDays').textContent=active;
  document.getElementById('heatCurrent').textContent=cur2;
  document.getElementById('heatLongest').textContent=longest;
  document.getElementById('heatRate').textContent=total?Math.round((active/total)*100)+'%':'0%';
}

// ═══════════════ SETTINGS ═══════════════
function renderSettings(){
  document.querySelectorAll('.theme-opt').forEach(b=>b.classList.toggle('active',b.dataset.theme===settings.theme));
  const rt=document.getElementById('reminderTime'); if(rt) rt.value=settings.reminderTime;
  const er=document.getElementById('enableReminders'); if(er) er.checked=settings.enableReminders;
}

// ═══════════════ EXPORT / IMPORT ═══════════════
function exportData(){
  const blob=new Blob([JSON.stringify({habits,completions,settings},null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`habitflow-${today()}.json`; a.click();
  toast("Ma'lumotlar eksport qilindi!",'success');
}
function importData(file){
  const r=new FileReader();
  r.onload=e=>{ try{ const d=JSON.parse(e.target.result); if(d.habits)habits=d.habits; if(d.completions)completions=d.completions; if(d.settings)settings={...settings,...d.settings}; save(); applyTheme(settings.theme); renderAll(); toast("Import muvaffaqiyatli!",'success'); }catch{ toast("Fayl noto'g'ri!",'error'); } };
  r.readAsText(file);
}

// ═══════════════ RENDER ALL ═══════════════
function renderAll(){
  const p=document.querySelector('.page.active')?.id?.replace('page-','');
  if(p==='dashboard') renderDashboard();
  if(p==='habits') renderHabits();
  if(p==='analytics') renderAnalytics();
  if(p==='heatmap') renderHeatmap();
  if(p==='settings') renderSettings();
}

// ═══════════════ DEMO SEED ═══════════════
function seedDemo(){
  if(habits.length>0) return;
  const demo=[
    {name:'Ertalabki yugurish',category:'fitness',color:'#22d87a',target:1,unit:'marta',desc:'30 daqiqa yugurish'},
    {name:"Kitob o'qish",category:'learning',color:'#7c6af7',target:20,unit:'sahifa',desc:'Har kuni o\'qish'},
    {name:'Meditatsiya',category:'mindfulness',color:'#38d9f5',target:10,unit:'daqiqa',desc:'Tinchlanish va fokus'},
    {name:'Suv ichish',category:'health',color:'#ff9640',target:8,unit:'stakan',desc:'2 litr suv'},
    {name:"Ko'nikishlar",category:'productivity',color:'#f066c6',target:1,unit:'marta',desc:'Kunlik vazifalar'},
  ];
  demo.forEach(d=>habits.push({...d,id:uid(),createdAt:today()}));
  for(let i=0;i<60;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=dstr(d);
    habits.forEach(h=>{ if(Math.random()>0.22) setCmp(h.id,ds,h.target); });
  }
  save(); toast("Demo ma'lumotlar yuklandi! 🚀",'info');
}

// ═══════════════ DATE DISPLAY ═══════════════
function setDate(){
  const d=new Date();
  const months=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const days=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  document.getElementById('todayDate').textContent=`${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

// ═══════════════ INIT ═══════════════
function init(){
  load(); applyTheme(settings.theme); setDate(); seedDemo();

  // nav
  document.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click',e=>{ e.preventDefault(); go(n.dataset.page); }));
  document.getElementById('menuBtn').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('sidebarClose').addEventListener('click',()=>document.getElementById('sidebar').classList.remove('open'));

  // add modal
  document.getElementById('openAddModal').addEventListener('click',()=>openModal());
  document.getElementById('emptyAddBtn')?.addEventListener('click',()=>openModal());
  document.getElementById('modalClose').addEventListener('click',closeModal);
  document.getElementById('cancelModal').addEventListener('click',closeModal);
  document.getElementById('modalOverlay').addEventListener('click',e=>{ if(e.target===e.currentTarget)closeModal(); });
  document.getElementById('habitForm').addEventListener('submit',saveHabit);

  // color picker
  document.querySelectorAll('.c-opt').forEach(o=>o.addEventListener('click',()=>{
    document.querySelectorAll('.c-opt').forEach(c=>c.classList.remove('sel'));
    o.classList.add('sel'); selectedColor=o.dataset.c;
  }));

  // confirm
  document.getElementById('confirmCancel').addEventListener('click',closeConfirm);
  document.getElementById('confirmOk').addEventListener('click',()=>{ if(confirmCallback)confirmCallback(); });
  document.getElementById('confirmOverlay').addEventListener('click',e=>{ if(e.target===e.currentTarget)closeConfirm(); });

  // search & filter pills
  document.getElementById('searchInput').addEventListener('input',renderHabits);
  document.getElementById('filterStatus').addEventListener('change',renderHabits);
  document.querySelectorAll('.filter-pill[data-cat]').forEach(p=>p.addEventListener('click',()=>{
    document.querySelectorAll('.filter-pill[data-cat]').forEach(x=>x.classList.remove('active'));
    p.classList.add('active'); renderHabits();
  }));

  // themes
  document.querySelectorAll('.theme-opt').forEach(b=>b.addEventListener('click',()=>applyTheme(b.dataset.theme)));

  // settings
  document.getElementById('reminderTime').addEventListener('change',e=>{ settings.reminderTime=e.target.value; save(); });
  document.getElementById('enableReminders').addEventListener('change',e=>{ settings.enableReminders=e.target.checked; save(); if(e.target.checked&&'Notification'in window)Notification.requestPermission(); });

  // data
  document.getElementById('exportBtn').addEventListener('click',exportData);
  document.getElementById('importBtn').addEventListener('click',()=>document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change',e=>{ if(e.target.files[0])importData(e.target.files[0]); });
  document.getElementById('clearAllBtn').addEventListener('click',()=>{
    showConfirm("Barcha ma'lumotlarni o'chirish","Barcha odatlar va ma'lumotlar o'chib ketadi!",()=>{ habits=[];completions={}; save();renderAll();closeConfirm();toast("O'chirildi",'info'); });
  });

  // heatmap
  document.getElementById('heatmapSelect').addEventListener('change',renderHeatmap);

  renderDashboard();
}
document.addEventListener('DOMContentLoaded',init);
