/* =====================================================
   Les P'tites Cuisines — Page Compte (account.js)
   ===================================================== */

const API = '/api';

let currentUser   = null;
let allEvents     = [];
let myEventIds    = new Set();
let calendarYear  = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-based

document.addEventListener('DOMContentLoaded', () => {
  initAuthTabs();
  initMobileMenu();
  const token = localStorage.getItem('ptites_token');
  if (token) {
    loadDashboard(token);
  }
  document.getElementById('navLoginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('authSection').scrollIntoView({ behavior: 'smooth' });
  });
});

function initAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('loginForm').classList.toggle('auth-form--hidden', target !== 'login');
      document.getElementById('registerForm').classList.toggle('auth-form--hidden', target !== 'register');
    });
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button');
  clearError('loginError');

  btn.disabled    = true;
  btn.textContent = 'Connexion…';
  try {
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        email:    form.email.value.trim(),
        password: form.password.value,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);

    localStorage.setItem('ptites_token', json.token);
    loadDashboard(json.token, json.user);
  } catch (err) {
    setError('loginError', err.message);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Se connecter';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button');
  clearError('registerError');

  btn.disabled    = true;
  btn.textContent = 'Création du compte…';
  try {
    const res  = await fetch(`${API}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        first_name: form.first_name.value.trim(),
        email:      form.email.value.trim(),
        password:   form.password.value,
        university: form.university.value || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);

    localStorage.setItem('ptites_token', json.token);
    loadDashboard(json.token, json.user);
  } catch (err) {
    setError('registerError', err.message);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Créer mon compte';
  }
}

function handleLogout() {
  localStorage.removeItem('ptites_token');
  currentUser = null;
  allEvents   = [];
  myEventIds  = new Set();
  document.getElementById('authSection').style.display = '';
  document.getElementById('dashboard').style.display   = 'none';
  document.getElementById('navLoginBtn').textContent    = 'Se connecter';
}

async function loadDashboard(token, user = null) {
  try {
    if (!user) {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { handleLogout(); return; }
      user = await res.json();
    }
    currentUser = user;

    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboard').style.display   = '';

    const initials = user.first_name.slice(0, 2).toUpperCase();
    document.getElementById('dashAvatar').textContent    = initials;
    document.getElementById('dashName').textContent      = `Bonjour, ${user.first_name} 👋`;
    document.getElementById('dashUniversity').textContent = user.university || '';
    const badge = document.getElementById('dashBadge');
    badge.textContent = user.role === 'admin' ? '⚙️ Administrateur' : '🌱 Membre';
    badge.className   = `dashboard__badge${user.role === 'admin' ? ' dashboard__badge--admin' : ''}`;

    document.getElementById('navLoginBtn').textContent = user.first_name;

    if (user.role === 'admin') {
      document.getElementById('adminCard').style.display = '';
    }

    await Promise.all([loadAllEvents(token), loadMyEvents(token)]);
    renderCalendar();
  } catch (err) {
    console.error(err);
  }
}

async function loadAllEvents(token) {
  try {
    const res = await fetch(`${API}/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    allEvents = await res.json();
    renderAllEvents();
  } catch (err) {
    console.error('Erreur chargement événements:', err);
  }
}

async function loadMyEvents(token) {
  try {
    const res  = await fetch(`${API}/events/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mine = await res.json();
    myEventIds = new Set(mine.map((e) => e.id));
    renderMyEvents(mine);
  } catch (err) {
    console.error('Erreur chargement mes événements:', err);
  }
}

function renderAllEvents() {
  const container = document.getElementById('allEvents');
  if (allEvents.length === 0) {
    container.innerHTML = '<p class="events-list__empty">Aucune session à venir pour le moment.</p>';
    return;
  }
  container.innerHTML = allEvents.map((ev) => eventCardHTML(ev, true)).join('');
}

function renderMyEvents(mine) {
  const container = document.getElementById('myEvents');
  if (mine.length === 0) {
    container.innerHTML = '<p class="events-list__empty">Tu n\'es inscrit·e à aucune session pour l\'instant.</p>';
    return;
  }
  container.innerHTML = mine.map((ev) => eventCardHTML(ev, false)).join('');
}

function eventCardHTML(ev, showRegisterBtn) {
  const date      = new Date(ev.starts_at);
  const end       = new Date(ev.ends_at);
  const day       = date.getDate();
  const month     = date.toLocaleString('fr-CA', { month: 'short' });
  const timeStart = date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  const timeEnd   = end.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  const spots     = ev.capacity - (ev.registrations_count || 0);
  const isReg     = myEventIds.has(ev.id);
  const isFull    = spots <= 0;

  let actionHTML = '';
  if (showRegisterBtn) {
    if (isReg) {
      actionHTML = `
        <span class="pill--registered">✓ Inscrit·e</span>
        <button class="btn btn--ghost btn--sm" onclick="cancelRegistration(${ev.id})">Annuler</button>`;
    } else if (isFull) {
      actionHTML = `<span class="pill--full">Complet</span>`;
    } else {
      actionHTML = `<button class="btn btn--primary btn--sm" onclick="registerEvent(${ev.id})">S'inscrire</button>`;
    }
  }

  return `
    <div class="event-card ${isReg ? 'event-card--registered' : ''}" id="event-${ev.id}">
      <div class="event-card__date">
        <span class="day">${day}</span>
        <span class="month">${month}</span>
      </div>
      <div class="event-card__body">
        <div class="event-card__title">${ev.title}</div>
        <div class="event-card__meta">
          <span>🕐 ${timeStart}–${timeEnd}</span>
          ${ev.location ? `<span>📍 ${ev.location}</span>` : ''}
          <span>👥 ${spots > 0 ? spots + ' place(s) restante(s)' : 'Complet'}</span>
        </div>
        ${actionHTML ? `<div class="event-card__actions">${actionHTML}</div>` : ''}
      </div>
    </div>`;
}

async function registerEvent(eventId) {
  const token = localStorage.getItem('ptites_token');
  try {
    const res  = await fetch(`${API}/events/${eventId}/register`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    showToast('Inscription confirmée ! 🎉');
    await Promise.all([loadAllEvents(token), loadMyEvents(token)]);
    renderCalendar();
  } catch (err) {
    showToast(`Erreur : ${err.message}`, 'error');
  }
}

async function cancelRegistration(eventId) {
  if (!confirm('Annuler ton inscription à cette session ?')) return;
  const token = localStorage.getItem('ptites_token');
  try {
    const res  = await fetch(`${API}/events/${eventId}/register`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    showToast('Inscription annulée.');
    await Promise.all([loadAllEvents(token), loadMyEvents(token)]);
    renderCalendar();
  } catch (err) {
    showToast(`Erreur : ${err.message}`, 'error');
  }
}

async function handleCreateEvent(e) {
  e.preventDefault();
  const form  = e.target;
  const btn   = form.querySelector('button[type="submit"]');
  const token = localStorage.getItem('ptites_token');
  clearError('eventError');

  btn.disabled    = true;
  btn.textContent = 'Création…';
  try {
    const res  = await fetch(`${API}/events`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify({
        title:       form.title.value.trim(),
        description: form.description.value.trim() || null,
        location:    form.location.value.trim() || null,
        starts_at:   form.starts_at.value,
        ends_at:     form.ends_at.value,
        capacity:    parseInt(form.capacity.value),
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    showToast('Session créée avec succès ! 🍳');
    form.reset();
    await loadAllEvents(token);
    renderCalendar();
  } catch (err) {
    setError('eventError', err.message);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Créer la session';
  }
}

function renderCalendar() {
  const titleEl = document.getElementById('calendarTitle');
  const daysEl  = document.getElementById('calendarDays');

  const monthName = new Date(calendarYear, calendarMonth, 1)
    .toLocaleString('fr-CA', { month: 'long', year: 'numeric' });
  titleEl.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay  = new Date(calendarYear, calendarMonth + 1, 0);
  const today    = new Date();

  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const eventsByDay = {};
  allEvents.forEach((ev) => {
    const d = new Date(ev.starts_at);
    if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    }
  });

  let html = '';

  for (let i = 0; i < startOffset; i++) {
    html += `<div class="calendar__day calendar__day--other-month"></div>`;
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const isToday   = d === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
    const events    = eventsByDay[d] || [];
    const hasEvent  = events.length > 0;
    const isReg     = hasEvent && events.some((ev) => myEventIds.has(ev.id));

    let cls = 'calendar__day';
    if (isToday)   cls += ' calendar__day--today';
    if (isReg)     cls += ' calendar__day--registered';
    else if (hasEvent) cls += ' calendar__day--has-event';

    const onclick = hasEvent
      ? `onclick="scrollToEvent(${events[0].id})"`
      : '';
    const dot = hasEvent ? '<span class="event-dot"></span>' : '';

    html += `<div class="${cls}" ${onclick} title="${hasEvent ? events.map(e => e.title).join(', ') : ''}">${d}${dot}</div>`;
  }

  const totalCells = startOffset + lastDay.getDate();
  const remainder  = totalCells % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      html += `<div class="calendar__day calendar__day--other-month"></div>`;
    }
  }

  daysEl.innerHTML = html;
}

function prevMonth() {
  calendarMonth--;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  renderCalendar();
}

function nextMonth() {
  calendarMonth++;
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  renderCalendar();
}

function scrollToEvent(eventId) {
  const el = document.getElementById(`event-${eventId}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setError(id, msg)   { const el = document.getElementById(id); if (el) el.textContent = msg; }
function clearError(id)      { const el = document.getElementById(id); if (el) el.textContent = ''; }

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast toast--${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 5000);
}

function initMobileMenu() {
  const burger   = document.querySelector('.nav__burger');
  const navLinks = document.querySelector('.nav__links');
  if (!burger) return;
  burger.addEventListener('click', () => {
    const isOpen = navLinks.dataset.open === 'true';
    if (isOpen) {
      navLinks.removeAttribute('style');
      navLinks.dataset.open = 'false';
    } else {
      Object.assign(navLinks.style, {
        display: 'flex', flexDirection: 'column', position: 'absolute',
        top: '68px', left: '0', right: '0', background: 'white',
        padding: '24px', borderBottom: '1px solid #e8f0eb',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)', gap: '16px',
      });
      navLinks.dataset.open = 'true';
    }
  });
}
