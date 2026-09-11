import { api, db, COURSE_STATUS, LESSON_STATUS } from '../js/store.js';
import { esc, toast } from '../js/ui.js';

const nameOf = (id) => (db.users.find((u) => u.id === id) || {}).name || '—';
const statusClass = { draft: 'tag-gray', review: 'tag-blue', published: 'tag-green' };

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
        <div class="lessons-box" data-lessons></div>
        <div class="students-box" data-students></div>
      `;
      const actions = card.querySelector('[data-actions]');
      setupActions(actions, c, reviewers, renderCourses);
      const lessonsBox = card.querySelector('[data-lessons]');
      await renderLessonsPanel(lessonsBox, c, renderCourses);
      const studentsBox = card.querySelector('[data-students]');
      await renderProgress(studentsBox, c);
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

async function renderLessonsPanel(box, course, rerender) {
  const lessons = await api.listAuthorLessons(course.id);
  box.innerHTML = `
    <div class="panel-title">Уроки (${lessons.length})</div>
    <div class="lesson-rows">
      ${
        lessons.length
          ? lessons
              .map(
                (l) => `
        <div class="lesson-row">
          <span class="lesson-row-title">${esc(l.title)}
            <span class="tag ${statusClass[l.status] || 'tag-gray'}">${esc(LESSON_STATUS[l.status] || l.status)}</span>
            <span class="muted">v${l.version}</span>
            ${l.reviewComment ? `<span class="muted">— ${esc(l.reviewComment)}</span>` : ''}
          </span>
          <span class="lesson-row-actions">
            ${l.status === 'draft' || l.status === 'review' ? `<button class="btn" data-action="send-review" data-id="${l.id}">Отправить на проверку</button>` : ''}
            ${l.status === 'published' ? `<button class="btn" data-action="new-version" data-id="${l.id}">Создать новую версию</button>` : ''}
          </span>
        </div>`
              )
              .join('')
          : '<div class="muted">Пока нет уроков.</div>'
      }
    </div>
    <div class="add-lesson">
      <div class="panel-title">Добавить урок</div>
      <input type="text" data-add-title placeholder="Название урока">
      <label class="check-label"><input type="checkbox" data-add-review> Есть ревью</label>
      <textarea data-add-checklist placeholder="Чеклист самопроверки (по пункту на строку)"></textarea>
      <button class="btn" data-action="add-lesson">Добавить урок</button>
    </div>
  `;

  box.addEventListener('click', async (e) => {
    const send = e.target.closest('[data-action="send-review"]');
    const ver = e.target.closest('[data-action="new-version"]');
    const add = e.target.closest('[data-action="add-lesson"]');
    if (send) {
      send.disabled = true;
      send.textContent = 'Отправка…';
      try {
        await api.sendLessonToReview(send.dataset.id);
        toast('Урок отправлен на проверку.', 'success');
        await rerender();
      } catch (err) {
        toast(err.message, 'error');
        send.disabled = false;
        send.textContent = 'Отправить на проверку';
      }
    }
    if (ver) {
      ver.disabled = true;
      ver.textContent = 'Создание…';
      try {
        await api.createLessonVersion(ver.dataset.id, {});
        toast('Создана новая версия урока.', 'success');
        await rerender();
      } catch (err) {
        toast(err.message, 'error');
        ver.disabled = false;
        ver.textContent = 'Создать новую версию';
      }
    }
    if (add) {
      const title = box.querySelector('[data-add-title]').value;
      const hasReview = box.querySelector('[data-add-review]').checked;
      const checklist = box.querySelector('[data-add-checklist]').value.split('\n');
      add.disabled = true;
      add.textContent = 'Добавление…';
      try {
        await api.addLesson(course.id, { title, hasReview, checklist });
        toast('Урок добавлен.', 'success');
        await rerender();
      } catch (err) {
        toast(err.message, 'error');
        add.disabled = false;
        add.textContent = 'Добавить урок';
      }
    }
  });
}

async function renderProgress(box, course) {
  const rows = await api.listCourseProgress(course.id);
  if (!rows.length) {
    box.innerHTML = '<div class="muted">Пока нет записавшихся учеников.</div>';
    return;
  }
  box.innerHTML = `
    <div class="panel-title">Ученики</div>
    <div class="lesson-rows">
      ${rows
        .map(
          (r) => `<div class="lesson-row"><span class="lesson-row-title">${esc(r.studentName)}</span><span class="muted">${r.done} из ${r.total} уроков</span></div>`
        )
        .join('')}
    </div>
  `;
}
