/**
 * Sync Planner PWA - Main JavaScript
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyYpBEfiyizFuLvBwyUyQ0lN_z4MeUiE4pDgkaJiLmhI0UYt4hHeYb9dmKiFCuW8U_Q/exec',
  USER_ID: '7b53f70b-2793-4b64-98de-32188223c0dc'
};

// Load from localStorage if exists
const savedConfig = localStorage.getItem('syncPlannerConfig');
if (savedConfig) {
  const parsed = JSON.parse(savedConfig);
  CONFIG.API_URL = parsed.apiUrl || CONFIG.API_URL;
  CONFIG.USER_ID = parsed.userId || CONFIG.USER_ID;
}

// ============================================
// STATE
// ============================================
let state = {
  dailySync: null,
  habits: [],
  goals: [],
  pomodoroStats: null,
  runningPomodoro: null
};

// ============================================
// API FUNCTIONS
// ============================================
async function apiGet(action, params = {}) {
  const url = new URL(CONFIG.API_URL);
  url.searchParams.append('action', action);
  url.searchParams.append('user_id', CONFIG.USER_ID);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  
  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'API Error');
    return data.data;
  } catch (err) {
    console.error('API GET Error:', err);
    showToast(err.message, 'error');
    throw err;
  }
}

async function apiPost(action, body = {}) {
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        user_id: CONFIG.USER_ID,
        ...body
      })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'API Error');
    return data.data;
  } catch (err) {
    console.error('API POST Error:', err);
    showToast(err.message, 'error');
    throw err;
  }
}

// ============================================
// UI FUNCTIONS
// ============================================
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  document.getElementById(`page-${pageName}`).classList.add('active');
  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.target.closest('.nav-item')?.classList.add('active');
  
  // Load page data
  if (pageName === 'goals') loadGoals();
  if (pageName === 'stats') loadPomodoroStats();
  if (pageName === 'settings') loadSettings();
}

function openModal(name) {
  document.getElementById(`modal-${name}`).classList.add('active');
  
  // Set default time for journal
  if (name === 'journal') {
    const now = new Date();
    document.getElementById('journalTime').value = 
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  
  // Set default quarter
  if (name === 'goal') {
    const quarter = Math.ceil((new Date().getMonth() + 1) / 3);
    document.getElementById('goalQuarter').value = quarter;
    document.getElementById('goalYear').value = new Date().getFullYear();
  }
}

function closeModal(name) {
  document.getElementById(`modal-${name}`).classList.remove('active');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// DATA LOADING
// ============================================
async function loadDailySync() {
  try {
    state.dailySync = await apiGet('getDailySync');
    renderDailySync();
  } catch (err) {
    console.error('Failed to load daily sync:', err);
  }
}

async function loadHabits() {
  try {
    state.habits = await apiGet('getHabits');
    renderHabits();
  } catch (err) {
    console.error('Failed to load habits:', err);
  }
}

async function loadGoals() {
  try {
    state.goals = await apiGet('getGoals');
    renderGoals();
  } catch (err) {
    console.error('Failed to load goals:', err);
  }
}

async function loadPomodoroStats() {
  try {
    state.pomodoroStats = await apiGet('getPomodoroStats', { period: 'week' });
    renderPomodoroStats();
  } catch (err) {
    console.error('Failed to load pomodoro stats:', err);
  }
}

function loadSettings() {
  document.getElementById('settingsUserId').value = CONFIG.USER_ID;
  document.getElementById('settingsApiUrl').value = CONFIG.API_URL;
}

// ============================================
// RENDERING
// ============================================
function renderDailySync() {
  const data = state.dailySync;
  if (!data) return;
  
  // Update header
  document.getElementById('currentDate').textContent = `${data.day}, ${formatDate(data.date)}`;
  document.getElementById('sholatCount').textContent = `${data.stats.sholat_completed}/5`;
  document.getElementById('habitCount').textContent = `${data.stats.habits_completed}/${data.habits.length}`;
  document.getElementById('pomodoroCount').textContent = data.stats.pomodoros_completed;
  
  // Render sholat grid
  renderSholatGrid(data.sholat);
  
  // Render habits with completion status
  state.habits = data.habits;
  renderHabits();
  
  // Render journal
  renderJournal(data.logs.journal);
}

function renderSholatGrid(sholatData) {
  const mainSholat = ['SUBUH', 'DZUHUR', 'ASHAR', 'MAGHRIB', 'ISYA', 'TAHAJUD', 'DHUHA', 'WITIR'];
  const sholatIcons = {
    'TAHAJUD': '🌙', 'SUBUH': '🌅', 'DHUHA': '☀️', 'DZUHUR': '🌞',
    'ASHAR': '🌇', 'MAGHRIB': '🌆', 'ISYA': '🌃', 'WITIR': '⭐'
  };
  
  const grid = document.getElementById('sholatGrid');
  grid.innerHTML = mainSholat.map(waktu => {
    const data = sholatData[waktu] || { done: false };
    const doneClass = data.done ? 'done' : '';
    const time = data.jam_pelaksanaan || '';
    
    return `
      <div class="sholat-item ${doneClass}" onclick="toggleSholat('${waktu}')">
        <span class="icon">${sholatIcons[waktu] || '🕌'}</span>
        <span class="name">${waktu}</span>
        ${time ? `<span class="time">${time}</span>` : ''}
      </div>
    `;
  }).join('');
}

function renderHabits() {
  const habitList = document.getElementById('habitList');
  
  if (!state.habits || state.habits.length === 0) {
    habitList.innerHTML = '<div class="empty-state"><p>Tidak ada habit</p></div>';
    return;
  }
  
  // Group by waktu
  const pagi = state.habits.filter(h => h.waktu === 'PAGI');
  const malam = state.habits.filter(h => h.waktu === 'MALAM');
  
  let html = '';
  
  if (pagi.length > 0) {
    html += '<div style="font-size: 12px; color: var(--gray-500); margin-bottom: 8px;">🌅 Ritual Pagi</div>';
    html += pagi.map(h => renderHabitItem(h)).join('');
  }
  
  if (malam.length > 0) {
    html += '<div style="font-size: 12px; color: var(--gray-500); margin: 12px 0 8px;">🌙 Ritual Malam</div>';
    html += malam.map(h => renderHabitItem(h)).join('');
  }
  
  habitList.innerHTML = html;
}

function renderHabitItem(habit) {
  const doneClass = habit.completed ? 'done' : '';
  const checkIcon = habit.completed ? '✓' : '';
  const badgeClass = `badge-${habit.bagian?.toLowerCase() || 'spiritual'}`;
  
  return `
    <div class="habit-item ${doneClass}" onclick="toggleHabit('${habit.habit_id}', ${habit.completed})">
      <div class="habit-checkbox">${checkIcon}</div>
      <div class="habit-info">
        <div class="habit-name">${habit.name}</div>
        <div class="habit-meta">${habit.frequency}</div>
      </div>
      <span class="habit-badge ${badgeClass}">${habit.bagian || ''}</span>
    </div>
  `;
}

function renderJournal(journals) {
  const container = document.getElementById('journalList');
  
  if (!journals || journals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="icon">📝</span>
        <p>Belum ada jurnal hari ini</p>
      </div>
    `;
    return;
  }
  
  // Sort by time
  journals.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  
  container.innerHTML = journals.map(j => `
    <div class="journal-entry">
      <div class="journal-time">${j.time || '??:??'}</div>
      <div class="journal-content">${j.content}</div>
    </div>
  `).join('');
}

function renderGoals() {
  const container = document.getElementById('goalsList');
  
  if (!state.goals || state.goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="icon">🎯</span>
        <p>Belum ada goal aktif</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = state.goals.map(goal => {
    const tasks = goal.tasks || [];
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
    
    return `
      <div class="card" style="cursor: pointer;" onclick="showGoalDetail('${goal.goal_id}')">
        <div class="card-header">
          <span class="card-title">${goal.title}</span>
          <span style="font-size: 12px; color: var(--gray-500);">Q${goal.quarter} ${goal.year}</span>
        </div>
        <div style="font-size: 13px; color: var(--gray-700); margin-bottom: 12px;">
          ${goal.description || 'Tidak ada deskripsi'}
        </div>
        <div style="background: var(--gray-200); border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background: var(--success); height: 100%; width: ${progress}%;"></div>
        </div>
        <div style="font-size: 12px; color: var(--gray-500); margin-top: 8px;">
          ${doneTasks}/${tasks.length} task selesai
        </div>
      </div>
    `;
  }).join('');
}

function renderPomodoroStats() {
  const stats = state.pomodoroStats;
  const container = document.getElementById('pomodoroStats');
  
  if (!stats) {
    container.innerHTML = '<div class="empty-state"><p>Tidak ada data</p></div>';
    return;
  }
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: center;">
      <div>
        <div style="font-size: 32px; font-weight: 700; color: var(--primary);">${stats.completed_sessions}</div>
        <div style="font-size: 12px; color: var(--gray-500);">Sesi Selesai</div>
      </div>
      <div>
        <div style="font-size: 32px; font-weight: 700; color: var(--success);">${stats.total_focus_hours}h</div>
        <div style="font-size: 12px; color: var(--gray-500);">Total Fokus</div>
      </div>
      <div>
        <div style="font-size: 32px; font-weight: 700; color: var(--warning);">${stats.completion_rate}%</div>
        <div style="font-size: 12px; color: var(--gray-500);">Completion Rate</div>
      </div>
      <div>
        <div style="font-size: 32px; font-weight: 700; color: var(--spiritual);">${stats.streak}</div>
        <div style="font-size: 12px; color: var(--gray-500);">Hari Streak</div>
      </div>
    </div>
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
      <div style="font-size: 13px; font-weight: 500; margin-bottom: 12px;">Minggu Ini</div>
      <div style="font-size: 13px; color: var(--gray-700);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>🍅 Pomodoro (25m)</span>
          <span>${stats.by_type?.POMODORO_25?.count || 0} sesi</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>🧠 Deep Work (60m)</span>
          <span>${stats.by_type?.DEEP_WORK_60?.count || 0} sesi</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>🚀 Deep Work (90m)</span>
          <span>${stats.by_type?.DEEP_WORK_90?.count || 0} sesi</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// ACTIONS
// ============================================
async function toggleSholat(waktu) {
  try {
    const current = state.dailySync?.sholat?.[waktu];
    
    if (current?.done) {
      showToast(`${waktu} sudah dicatat`, 'info');
      return;
    }
    
    await apiPost('logSholat', {
      waktu_sholat: waktu,
      options: {
        jam: new Date().toTimeString().slice(0, 5)
      }
    });
    
    showToast(`${waktu} tercatat ✓`, 'success');
    loadDailySync();
  } catch (err) {
    console.error('Failed to log sholat:', err);
  }
}

async function toggleHabit(habitId, isCompleted) {
  try {
    if (isCompleted) {
      await apiPost('uncheckHabit', { habit_id: habitId });
      showToast('Habit dibatalkan', 'info');
    } else {
      await apiPost('checkHabit', { habit_id: habitId });
      showToast('Habit selesai ✓', 'success');
    }
    loadDailySync();
  } catch (err) {
    console.error('Failed to toggle habit:', err);
  }
}

async function submitJournal() {
  const time = document.getElementById('journalTime').value;
  const content = document.getElementById('journalContent').value.trim();
  
  if (!content) {
    showToast('Isi jurnal tidak boleh kosong', 'error');
    return;
  }
  
  try {
    await apiPost('addJournal', { content, time });
    showToast('Jurnal tersimpan ✓', 'success');
    closeModal('journal');
    document.getElementById('journalContent').value = '';
    loadDailySync();
  } catch (err) {
    console.error('Failed to submit journal:', err);
  }
}

async function submitBrainDump() {
  const content = document.getElementById('braindumpContent').value.trim();
  
  if (!content) {
    showToast('Isi brain dump tidak boleh kosong', 'error');
    return;
  }
  
  try {
    await apiPost('addBrainDump', { content });
    showToast('Brain dump tersimpan ✓', 'success');
    closeModal('braindump');
    document.getElementById('braindumpContent').value = '';
  } catch (err) {
    console.error('Failed to submit brain dump:', err);
  }
}

async function startPomodoro() {
  const type = document.getElementById('pomodoroType').value;
  const task = document.getElementById('pomodoroTask').value.trim();
  
  if (!task) {
    showToast('Isi task yang akan dikerjakan', 'error');
    return;
  }
  
  try {
    const result = await apiPost('startPomodoro', {
      options: { type, planned_task: task }
    });
    
    showToast('Pomodoro dimulai! 🍅', 'success');
    closeModal('pomodoro');
    document.getElementById('pomodoroTask').value = '';
    
    // Show timer (simplified - just notification)
    const duration = type === 'POMODORO_25' ? 25 : type === 'DEEP_WORK_60' ? 60 : 90;
    alert(`Timer ${duration} menit dimulai untuk:\n${task}\n\nSession ID: ${result.session_id}`);
    
  } catch (err) {
    console.error('Failed to start pomodoro:', err);
  }
}

async function submitGoal() {
  const title = document.getElementById('goalTitle').value.trim();
  const description = document.getElementById('goalDesc').value.trim();
  const quarter = parseInt(document.getElementById('goalQuarter').value);
  const year = parseInt(document.getElementById('goalYear').value);
  
  if (!title) {
    showToast('Judul goal tidak boleh kosong', 'error');
    return;
  }
  
  try {
    await apiPost('createGoal', {
      data: { title, description, quarter, year }
    });
    
    showToast('Goal tersimpan ✓', 'success');
    closeModal('goal');
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalDesc').value = '';
    loadGoals();
  } catch (err) {
    console.error('Failed to create goal:', err);
  }
}

function showGoalDetail(goalId) {
  // TODO: Implement goal detail view with tasks/kanban
  const goal = state.goals.find(g => g.goal_id === goalId);
  if (goal) {
    alert(`Goal: ${goal.title}\n\nTasks: ${(goal.tasks || []).length}\nMilestones: ${(goal.milestones || []).length}`);
  }
}

function saveSettings() {
  const userId = document.getElementById('settingsUserId').value.trim();
  const apiUrl = document.getElementById('settingsApiUrl').value.trim();
  
  if (!userId || !apiUrl) {
    showToast('Semua field harus diisi', 'error');
    return;
  }
  
  localStorage.setItem('syncPlannerConfig', JSON.stringify({
    userId, apiUrl
  }));
  
  CONFIG.USER_ID = userId;
  CONFIG.API_URL = apiUrl;
  
  showToast('Pengaturan tersimpan ✓', 'success');
  loadDailySync();
}

// ============================================
// HELPERS
// ============================================
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadDailySync();
  
  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('SW registered:', reg.scope))
    .catch(err => console.log('SW registration failed:', err));
}
