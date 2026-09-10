// Оболочка приложения: роутер, навигация, переключение роли.

import { db, ROLE_LABELS } from './store.js';
import { esc, toast } from './ui.js';

const state = {
  currentUser: null,
};

const routes = {
  home: { roles: ['*'] },
  'student-catalog': { roles: ['student'] },
  'student-courses': { roles: ['student'] },
  'student-works': { roles: ['student'] },
  'author-courses': { roles: ['author'] },
  'reviewer-queue': { roles: ['reviewer'] },
};

const NAV = {
  student: [
    ['student-catalog', 'Каталог курсов'],
    ['student-courses', 'Мои курсы'],
    ['student-works', 'Мои работы'],
  ],
  author: [['author-courses', 'Мои курсы']],
  reviewer: [['reviewer-queue', 'Проверка работ']],
};

function renderNav() {
  const nav = document.getElementById('nav-links');
  const role = state.currentUser ? state.currentUser.role : null;
  const current = location.hash.replace('#/', '') || 'home';
  const links = [['home', 'Главная'], ...(NAV[role] || [])];
  nav.innerHTML = links
    .map(([id, label]) => `<a href="#/${id}" class="${id === current ? 'active' : ''}">${esc(label)}</a>`)
    .join('');
}

function renderUser() {
  document.getElementById('user-name').textContent = state.currentUser ? state.currentUser.name : '';
  document.getElementById('user-role').textContent = state.currentUser ? (ROLE_LABELS[state.currentUser.role] || '') : '';
}

function populateRoleSelect() {
  const sel = document.getElementById('role-select');
  sel.innerHTML = db.users
    .map((u) => `<option value="${u.id}">${esc(u.name)} (${esc(ROLE_LABELS[u.role] || u.role)})</option>`)
    .join('');
  sel.value = state.currentUser ? state.currentUser.id : '';
}

async function loadPage(name) {
  const container = document.getElementById('view');
  container.innerHTML = '<div class="loading">Загрузка страницы…</div>';
  try {
    const res = await fetch(`views/${name}.html`);
    if (!res.ok) throw new Error(`Шаблон «${name}» не найден`);
    const html = await res.text();
    container.innerHTML = html;
    const mod = await import(`../pages/${name}.js`);
    await mod.init({ container, state });
  } catch (err) {
    container.innerHTML = `<div class="error">Не удалось загрузить страницу: ${esc(err.message)}</div>`;
  }
}

function navigate() {
  const name = location.hash.replace('#/', '') || 'home';
  const route = routes[name];
  if (!route) {
    location.hash = '#/home';
    return;
  }
  const role = state.currentUser ? state.currentUser.role : null;
  if (!route.roles.includes('*') && !route.roles.includes(role)) {
    toast('Эта страница недоступна для текущей роли.', 'warn');
    location.hash = '#/home';
    return;
  }
  renderNav();
  loadPage(name);
}

function setup() {
  state.currentUser = db.users.find((u) => u.id === 'u-student-1') || db.users[0];
  renderUser();
  populateRoleSelect();

  document.getElementById('role-select').addEventListener('change', (e) => {
    state.currentUser = db.users.find((u) => u.id === e.target.value) || db.users[0];
    renderUser();
    toast(`Вы переключились на: ${state.currentUser.name}`, 'info');
    navigate();
  });

  window.addEventListener('hashchange', navigate);
  navigate();
}

setup();
