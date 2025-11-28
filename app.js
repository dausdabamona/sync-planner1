/**
 * Sync Planner PWA - Complete JavaScript
 */

// ========== CONFIG ==========
const CONFIG = {
  API_URL: localStorage.getItem('sp_api_url') || 'https://script.google.com/macros/s/AKfycbyYpBEfiyizFuLvBwyUyQ0lN_z4MeUiE4pDgkaJiLmhI0UYt4hHeYb9dmKiFCuW8U_Q/exec',
  USER_ID: localStorage.getItem('sp_user_id') || '7b53f70b-2793-4b64-98de-32188223c0dc'
};

// ========== STATE ==========
let state = {
  dailySync: null,
  goals: [],
  pomodoroStats: null,
  activePomodoro: null,
  timerInterval: null,
  timerSeconds: 0,
  distractions: 0
};

// ========== API ==========
async function apiGet(action, params = {}) {
  const url = new URL(CONFIG.API_URL);
  url.searchParams.append('action', action);
  url.searchParams.append('user_id', CONFIG.USER_ID);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  
  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Error');
    return data.data;
  } catch (e) {
    console.error('GET Error:', e);
    showToast(e.message, 'error');
    throw e;
  }
}

async function apiPost(action, body = {}) {
  try {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, user_id: CONFIG.USER_ID, ...body })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Error');
    return data.data;
  } catch (e) {
    console.error('POST Error:', e);
    showToast(e.message, 'error');
    throw e;
  }
}

// ========== UI HELPERS ==========
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === name);
  });
  
  if (name === 'goals') loadGoals();
  if (name === 'stats') loadStats();
  if (name === 'settings') loadSettings();
}

function openModal(name) {
  document.getElementById(`modal-${name}`).classList.add('active');
  if (name === 'journal') {
    const now = new Date();
    document.getElementById('journalTime').value = now.toTimeString().slice(0,5);
  }
  if (name === 'goal') {
    document.getElementById('goalQuarter').value = Math.ceil((new Date().getMonth()+1)/3);
    document.getElementById('goalYear').value = new Date().getFullYear();
  }
  if (name === 'pomodoro' || name === 'task') {
    populateGoalSelects();
  }
}

function closeModal(name) {
  document.getElementById(`modal-${name}`).classList.remove('active');
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function switchTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('goalsTab').style.display = tab === 'goals' ? 'block' : 'none';
  document.getElementById('tasksTab').style.display = tab === 'tasks' ? 'block' : 'none';
  if (tab === 'tasks') renderAllTasks();
}

function selectPomoType(el, type) {
  document.querySelectorAll('.pomo-type-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('pomodoroType').value = type;
}

// ========== DATA LOADING ==========
async function loadDailySync() {
  try {
    state.dailySync = await apiGet('getDailySync');
    renderDailySync();
  } catch (e) { console.error(e); }
}

async function loadGoals() {
  try {
    state.goals = await apiGet('getGoals') || [];
    renderGoals();
  } catch (e) { console.error(e); }
}

async function loadStats() {
  try {
    state.pomodoroStats = await apiGet('getPomodoroStats', { period: 'week' });
    renderStats();
  } catch (e) { console.error(e); }
}

function loadSettings() {
  document.getElementById('settingsUserId').value = CONFIG.USER_ID;
  document.getElementById('settingsApiUrl').value = CONFIG.API_URL;
}

async function refreshAllData() {
  showToast('Memuat ulang...', 'info');
  await loadDailySync();
  showToast('Data diperbarui', 'success');
}

// ========== RENDERING ==========
function renderDailySync() {
  const d = state.dailySync;
  if (!d) return;
  
  // Header
  document.getElementById('currentDate').textContent = `${d.day}, ${formatDate(d.date)}`;
  document.getElementById('sholatCount').textContent = `${d.stats.sholat_completed}/5`;
  document.getElementById('habitCount').textContent = `${d.stats.habits_completed}/${d.habits?.length || 0}`;
  document.getElementById('pomodoroCount').textContent = d.stats.pomodoros_completed || 0;
  document.getElementById('focusMinutes').textContent = `${d.stats.focus_minutes || 0} mnt`;
  
  // Sholat
  renderSholat(d.sholat);
  
  // Habits
  renderHabits(d.habits);
  
  // Journal
  renderJournal(d.logs?.journal || []);
  
  // Check running pomodoro
  checkRunningPomodoro();
}

function renderSholat(sholat) {
  const list = ['SUBUH','DZUHUR','ASHAR','MAGHRIB','ISYA','TAHAJUD','DHUHA','WITIR'];
  const icons = { SUBUH:'🌅', DZUHUR:'🌞', ASHAR:'🌇', MAGHRIB:'🌆', ISYA:'🌃', TAHAJUD:'🌙', DHUHA:'☀️', WITIR:'⭐' };
  
  document.getElementById('sholatGrid').innerHTML = list.map(w => {
    const s = sholat?.[w] || { done: false };
    return `<div class="sholat-item ${s.done?'done':''}" onclick="toggleSholat('${w}')">
      <span class="icon">${icons[w]}</span>
      <span class="name">${w}</span>
      ${s.jam_pelaksanaan ? `<span class="time">${s.jam_pelaksanaan}</span>` : ''}
    </div>`;
  }).join('');
}

function renderHabits(habits) {
  if (!habits || !habits.length) {
    document.getElementById('habitList').innerHTML = '<div class="empty-state"><span class="icon">📋</span><p>Tidak ada ritual</p></div>';
    return;
  }
  
  const pagi = habits.filter(h => h.waktu === 'PAGI');
  const malam = habits.filter(h => h.waktu === 'MALAM');
  
  let html = '';
  if (pagi.length) {
    html += '<div style="font-size:11px;color:var(--gray-500);margin-bottom:8px">🌅 Pagi</div>';
    html += pagi.map(h => habitItem(h)).join('');
  }
  if (malam.length) {
    html += '<div style="font-size:11px;color:var(--gray-500);margin:12px 0 8px">🌙 Malam</div>';
    html += malam.map(h => habitItem(h)).join('');
  }
  
  document.getElementById('habitList').innerHTML = html;
}

function habitItem(h) {
  const done = h.completed ? 'done' : '';
  const badge = h.bagian ? `badge-${h.bagian.toLowerCase()}` : 'badge-spiritual';
  return `<div class="habit-item ${done}" onclick="toggleHabit('${h.habit_id}',${h.completed})">
    <div class="habit-checkbox">${h.completed?'✓':''}</div>
    <div class="habit-info"><div class="habit-name">${h.name}</div><div class="habit-meta">${h.frequency||'daily'}</div></div>
    <span class="habit-badge ${badge}">${h.bagian||''}</span>
  </div>`;
}

function renderJournal(journals) {
  if (!journals || !journals.length) {
    document.getElementById('journalList').innerHTML = '<div class="empty-state"><span class="icon">📝</span><p>Belum ada jurnal</p></div>';
    return;
  }
  
  journals.sort((a,b) => (a.time||'').localeCompare(b.time||''));
  document.getElementById('journalList').innerHTML = journals.map(j => `
    <div class="journal-entry">
      <div class="journal-time">${j.time||'--:--'}</div>
      <div class="journal-content">${j.content}</div>
    </div>
  `).join('');
}

function renderGoals() {
  const container = document.getElementById('goalsList');
  if (!state.goals || !state.goals.length) {
    container.innerHTML = '<div class="empty-state"><span class="icon">🎯</span><p>Belum ada goal</p></div>';
    return;
  }
  
  container.innerHTML = state.goals.map(g => {
    const tasks = g.tasks || [];
    const done = tasks.filter(t => t.status === 'done').length;
    const pct = tasks.length ? Math.round(done/tasks.length*100) : 0;
    return `<div class="goal-card" onclick="showGoalDetail('${g.goal_id}')">
      <div class="goal-title">${g.title}</div>
      <div class="goal-desc">${g.description || 'Tidak ada deskripsi'}</div>
      <div class="goal-progress"><div class="goal-progress-bar" style="width:${pct}%"></div></div>
      <div class="goal-stats"><span>${done}/${tasks.length} task</span><span>Q${g.quarter} ${g.year}</span></div>
    </div>`;
  }).join('');
}

function renderAllTasks() {
  let allTasks = [];
  state.goals.forEach(g => {
    (g.tasks||[]).forEach(t => {
      allTasks.push({ ...t, goal_title: g.title, goal_id: g.goal_id });
    });
  });
  
  if (!allTasks.length) {
    document.getElementById('tasksList').innerHTML = '<div class="empty-state"><span class="icon">📋</span><p>Belum ada task</p></div>';
    return;
  }
  
  // Group by status
  const grouped = { backlog: [], todo: [], progress: [], done: [] };
  allTasks.forEach(t => grouped[t.status]?.push(t));
  
  let html = '';
  ['todo','progress','backlog','done'].forEach(status => {
    const tasks = grouped[status];
    if (!tasks.length) return;
    const label = { backlog:'📥 Backlog', todo:'📋 To Do', progress:'⏳ Progress', done:'✅ Done' };
    html += `<div style="font-size:12px;font-weight:600;color:var(--gray-500);margin:14px 0 8px">${label[status]} (${tasks.length})</div>`;
    html += tasks.map(t => `
      <div class="habit-item" onclick="cycleTaskStatus('${t.goal_id}','${t.id}','${t.status}')" style="border-left:3px solid ${priorityColor(t.priority)}">
        <div class="habit-info">
          <div class="habit-name">${t.title}</div>
          <div class="habit-meta">${t.goal_title}</div>
        </div>
      </div>
    `).join('');
  });
  
  document.getElementById('tasksList').innerHTML = html;
}

function priorityColor(p) {
  return { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--gray-400)' }[p] || 'var(--gray-300)';
}

function renderStats() {
  const s = state.pomodoroStats;
  if (!s) {
    document.getElementById('statsGrid').innerHTML = '<div class="empty-state"><p>Tidak ada data</p></div>';
    return;
  }
  
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-value">${s.completed_sessions||0}</div><div class="stat-label">Sesi Selesai</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--success)">${s.total_focus_hours||0}h</div><div class="stat-label">Total Fokus</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--warning)">${s.completion_rate||0}%</div><div class="stat-label">Completion Rate</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--spiritual)">${s.streak||0}</div><div class="stat-label">Hari Streak</div></div>
  `;
  
  const bt = s.by_type || {};
  document.getElementById('statsDetail').innerHTML = `
    <div style="font-size:13px">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px"><span>🍅 Pomodoro 25m</span><span>${bt.POMODORO_25?.count||0} sesi</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px"><span>🧠 Deep Work 60m</span><span>${bt.DEEP_WORK_60?.count||0} sesi</span></div>
      <div style="display:flex;justify-content:space-between"><span>🚀 Deep Work 90m</span><span>${bt.DEEP_WORK_90?.count||0} sesi</span></div>
    </div>
  `;
}

function populateGoalSelects() {
  const opts = state.goals.map(g => `<option value="${g.goal_id}">${g.title}</option>`).join('');
  const selects = ['pomodoroGoal', 'taskGoal'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">-- Pilih --</option>' + opts;
  });
}

// ========== ACTIONS ==========
async function toggleSholat(waktu) {
  const s = state.dailySync?.sholat?.[waktu];
  if (s?.done) { showToast(`${waktu} sudah dicatat`); return; }
  
  try {
    await apiPost('logSholat', { waktu_sholat: waktu, options: { jam: new Date().toTimeString().slice(0,5) } });
    showToast(`${waktu} ✓`, 'success');
    loadDailySync();
  } catch (e) {}
}

async function toggleHabit(habitId, isDone) {
  try {
    if (isDone) {
      await apiPost('uncheckHabit', { habit_id: habitId });
      showToast('Dibatalkan');
    } else {
      await apiPost('checkHabit', { habit_id: habitId });
      showToast('Selesai ✓', 'success');
    }
    loadDailySync();
  } catch (e) {}
}

async function submitJournal() {
  const time = document.getElementById('journalTime').value;
  const content = document.getElementById('journalContent').value.trim();
  if (!content) { showToast('Isi jurnal dulu', 'error'); return; }
  
  try {
    await apiPost('addJournal', { content, time });
    showToast('Tersimpan ✓', 'success');
    closeModal('journal');
    document.getElementById('journalContent').value = '';
    loadDailySync();
  } catch (e) {}
}

async function submitBrainDump() {
  const content = document.getElementById('braindumpContent').value.trim();
  if (!content) { showToast('Isi dulu', 'error'); return; }
  
  try {
    await apiPost('addBrainDump', { content });
    showToast('Tersimpan ✓', 'success');
    closeModal('braindump');
    document.getElementById('braindumpContent').value = '';
  } catch (e) {}
}

async function submitGoal() {
  const title = document.getElementById('goalTitle').value.trim();
  const desc = document.getElementById('goalDesc').value.trim();
  const quarter = parseInt(document.getElementById('goalQuarter').value);
  const year = parseInt(document.getElementById('goalYear').value);
  
  if (!title) { showToast('Judul harus diisi', 'error'); return; }
  
  try {
    await apiPost('createGoal', { data: { title, description: desc, quarter, year } });
    showToast('Goal tersimpan ✓', 'success');
    closeModal('goal');
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalDesc').value = '';
    loadGoals();
  } catch (e) {}
}

async function submitTask() {
  const goalId = document.getElementById('taskGoal').value;
  const title = document.getElementById('taskTitle').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const status = document.getElementById('taskStatus').value;
  
  if (!goalId) { showToast('Pilih goal dulu', 'error'); return; }
  if (!title) { showToast('Judul harus diisi', 'error'); return; }
  
  try {
    await apiPost('addTask', { goal_id: goalId, title, options: { priority, status } });
    showToast('Task tersimpan ✓', 'success');
    closeModal('task');
    document.getElementById('taskTitle').value = '';
    loadGoals();
    renderAllTasks();
  } catch (e) {}
}

async function cycleTaskStatus(goalId, taskId, currentStatus) {
  const next = { backlog: 'todo', todo: 'progress', progress: 'done', done: 'todo' };
  const newStatus = next[currentStatus] || 'todo';
  
  try {
    await apiPost('moveTask', { goal_id: goalId, task_id: taskId, status: newStatus, position: 1 });
    showToast(`→ ${newStatus}`, 'success');
    await loadGoals();
    renderAllTasks();
  } catch (e) {}
}

function showGoalDetail(goalId) {
  const g = state.goals.find(x => x.goal_id === goalId);
  if (!g) return;
  
  document.getElementById('goalDetailTitle').textContent = g.title;
  
  const tasks = g.tasks || [];
  const milestones = g.milestones || [];
  
  let html = `<p style="color:var(--gray-600);margin-bottom:14px">${g.description || '-'}</p>`;
  html += `<p style="font-size:12px;color:var(--gray-500)">Q${g.quarter} ${g.year}</p>`;
  
  if (milestones.length) {
    html += `<div style="margin-top:16px;font-weight:600;font-size:13px">📌 Milestones</div>`;
    html += milestones.map(m => `<div style="padding:8px 0;border-bottom:1px solid var(--gray-200);font-size:13px">${m.done?'✅':'⬜'} ${m.title}</div>`).join('');
  }
  
  if (tasks.length) {
    html += `<div style="margin-top:16px;font-weight:600;font-size:13px">📋 Tasks (${tasks.length})</div>`;
    html += tasks.map(t => `<div style="padding:8px 0;border-bottom:1px solid var(--gray-200);font-size:13px;display:flex;justify-content:space-between">
      <span>${t.status==='done'?'✅':'⬜'} ${t.title}</span>
      <span style="font-size:11px;color:var(--gray-500)">${t.status}</span>
    </div>`).join('');
  }
  
  html += `<button class="btn-submit" style="margin-top:20px" onclick="addTaskToGoal('${goalId}')">+ Tambah Task</button>`;
  
  document.getElementById('goalDetailBody').innerHTML = html;
  openModal('goaldetail');
}

function addTaskToGoal(goalId) {
  closeModal('goaldetail');
  openModal('task');
  setTimeout(() => document.getElementById('taskGoal').value = goalId, 100);
}

// ========== POMODORO ==========
async function startPomodoro() {
  const type = document.getElementById('pomodoroType').value;
  const task = document.getElementById('pomodoroTask').value.trim();
  const goalId = document.getElementById('pomodoroGoal').value;
  
  if (!task) { showToast('Isi task dulu', 'error'); return; }
  
  try {
    const result = await apiPost('startPomodoro', { options: { type, planned_task: task, goal_id: goalId } });
    state.activePomodoro = result;
    state.distractions = 0;
    
    const mins = { POMODORO_25: 25, DEEP_WORK_60: 60, DEEP_WORK_90: 90 }[type] || 25;
    state.timerSeconds = mins * 60;
    
    showToast('Sesi dimulai! 🍅', 'success');
    closeModal('pomodoro');
    document.getElementById('pomodoroTask').value = '';
    
    showActivePomodoro(task);
    startTimer();
  } catch (e) {}
}

function showActivePomodoro(task) {
  document.getElementById('pomodoroActive').style.display = 'block';
  document.getElementById('timerTask').textContent = task;
  document.getElementById('distractionCount').textContent = '0';
}

function startTimer() {
  clearInterval(state.timerInterval);
  updateTimerDisplay();
  
  state.timerInterval = setInterval(() => {
    state.timerSeconds--;
    updateTimerDisplay();
    
    if (state.timerSeconds <= 0) {
      clearInterval(state.timerInterval);
      showToast('⏰ Waktu habis!', 'success');
      // Play sound if available
      try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp+fn5yclpKQi4N7d3R3e4GIjZGWlpmZl5WUkY6KhoN/fX1+gIOIi46QkpSUlZSSkI6LiIWCgH9+fn+Ag4aJi46QkZKSkZCPjYqHhIKAgH+AgIGDhoiKjI2Oj46NjIqIhoSDgoGBgoOFh4mKi4yNjY2Mi4qIh4WEg4KCgoOEhoiJi4yMjIyLioiHhoWEg4ODg4SFh4iKi4uLi4qJiIeGhYSEhIOEhIWHiImKioqKiYiHhoWFhISDg4SEhYaHiIiJiYiIh4aFhYSEhINDQ0NDQ0NDQ0NDAA==').play(); } catch(e) {}
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  document.getElementById('timerDisplay').textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  document.getElementById('timerLabel').textContent = state.timerSeconds > 0 ? 'FOKUS' : 'SELESAI!';
}

async function completePomodoro() {
  clearInterval(state.timerInterval);
  
  if (state.activePomodoro) {
    try {
      await apiPost('completePomodoro', {
        session_id: state.activePomodoro.session_id,
        result: { distraction_count: state.distractions }
      });
      showToast('Sesi selesai! 🎉', 'success');
    } catch (e) {}
  }
  
  hideActivePomodoro();
  loadDailySync();
}

async function cancelPomodoro() {
  clearInterval(state.timerInterval);
  
  if (state.activePomodoro) {
    try {
      await apiPost('cancelPomodoro', { session_id: state.activePomodoro.session_id, reason: 'Dibatalkan' });
      showToast('Sesi dibatalkan');
    } catch (e) {}
  }
  
  hideActivePomodoro();
}

function hideActivePomodoro() {
  document.getElementById('pomodoroActive').style.display = 'none';
  state.activePomodoro = null;
  state.timerInterval = null;
}

function addDistraction() {
  state.distractions++;
  document.getElementById('distractionCount').textContent = state.distractions;
  showToast('Distraksi +1');
}

async function checkRunningPomodoro() {
  try {
    const running = await apiGet('getRunningSession');
    if (running && running.session_id) {
      state.activePomodoro = running;
      
      // Calculate remaining time
      const start = new Date(running.start_time);
      const now = new Date();
      const elapsed = Math.floor((now - start) / 1000);
      const total = (running.focus_minutes || 25) * 60;
      state.timerSeconds = Math.max(0, total - elapsed);
      state.distractions = running.distraction_count || 0;
      
      showActivePomodoro(running.planned_task || 'Fokus');
      document.getElementById('distractionCount').textContent = state.distractions;
      startTimer();
    }
  } catch (e) {}
}

// ========== SETTINGS ==========
function saveSettings() {
  const userId = document.getElementById('settingsUserId').value.trim();
  const apiUrl = document.getElementById('settingsApiUrl').value.trim();
  
  if (!apiUrl) { showToast('API URL harus diisi', 'error'); return; }
  
  localStorage.setItem('sp_user_id', userId);
  localStorage.setItem('sp_api_url', apiUrl);
  CONFIG.USER_ID = userId;
  CONFIG.API_URL = apiUrl;
  
  showToast('Pengaturan tersimpan ✓', 'success');
  loadDailySync();
}

// ========== HELPERS ==========
function formatDate(str) {
  const d = new Date(str);
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  loadDailySync();
});

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(e => console.log('SW error:', e));
}
