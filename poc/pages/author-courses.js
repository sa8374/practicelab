import { api, db, COURSE_STATUS } from '../js/store.js';
import { esc, toast } from '../js/ui.js';

const nameOf = (id) => (db.users.find((u) => u.id === id) || {}).name || '—';

export async function init({ container, state }) {
  const root = container.querySelector('#courses');
  const form = container.querySelector('#create-form');

  async function renderCourses() {
    root.innerHTML = '<div class="loading">Загрузка…</div>';
    const [courses, reviewers] = await Promise.all([
      api.listAuthorCourses(state.currentUser.id),
      api.listReviewers(),
    ]);
    if (!courses.length) {
      root.innerHTML = '<div class="empty">У вас пока нет курсов. Создайте первый выше.</div>';
      return;
    }
    root.innerHTML = '';
    for (const c of courses) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-title">${esc(c.title)}
          <span class="tag ${c.status === 'published' ? 'tag-green' : 'tag-gray'}">${esc(COURSE_STATUS[c.status] || c.status)}</span>
        </div>
        <div class="card-desc">${esc(c.description || '')}</div>
        <div class="detail"><strong>Проверяющий:</strong> ${c.reviewerId ? esc(nameOf(c.reviewerId)) : '— не назначен —'}</div>
        <div class="actions" data-actions></div>
      `;
      const actions = card.querySelector('[data-actions]');
      setupActions(actions, c, reviewers, renderCourses);
      root.appendChild(card);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('#f-submit');
    const title = form.querySelector('#f-title').value;
    const description = form.querySelector('#f-desc').value;
    btn.disabled = true;
    btn.textContent = 'Создание…';
    try {
      const course = await api.createCourse(state.currentUser.id, { title, description });
      toast(`Курс «${course.title}» создан (черновик).`, 'success');
      form.reset();
      await renderCourses();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Создать курс';
    }
  });

  await renderCourses();
}

function setupActions(actions, course, reviewers, rerender) {
  actions.innerHTML = `
    ${course.status !== 'published' ? '<button class="btn" data-action="publish">Опубликовать курс</button>' : ''}
    <div class="assign">
      <select class="select" data-action="reviewer">
        ${reviewers.map((r) => `<option value="${r.id}" ${course.reviewerId === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}
      </select>
      <button class="btn" data-action="assign">Назначить проверяющего</button>
    </div>
  `;

  actions.addEventListener('click', async (e) => {
    const publish = e.target.closest('[data-action="publish"]');
    const assign = e.target.closest('[data-action="assign"]');
    if (publish) {
      publish.disabled = true;
      publish.textContent = 'Публикация…';
      try {
        await api.publishCourse(course.id);
        toast('Курс опубликован!', 'success');
        await rerender();
      } catch (err) {
        toast(err.message, 'error');
        publish.disabled = false;
        publish.textContent = 'Опубликовать курс';
      }
    }
    if (assign) {
      const sel = actions.querySelector('[data-action="reviewer"]');
      assign.disabled = true;
      assign.textContent = 'Назначение…';
      try {
        await api.assignReviewer(course.id, sel.value);
        toast('Проверяющий назначен.', 'success');
        await rerender();
      } catch (err) {
        toast(err.message, 'error');
        assign.disabled = false;
        assign.textContent = 'Назначить проверяющего';
      }
    }
  });
}
