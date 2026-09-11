import { api, db, GRADE_LABELS, LESSON_STATUS, COURSE_STATUS } from '../js/store.js';
import { esc, toast } from '../js/ui.js';

const userName = (id) => (db.users.find((u) => u.id === id) || {}).name || '—';
const courseTitle = (id) => (db.courses.find((c) => c.id === id) || {}).title || '—';
const lessonTitle = (id) => (db.lessons.find((l) => l.id === id) || {}).title || '—';
const statusClass = { draft: 'tag-gray', review: 'tag-blue', published: 'tag-green' };

export async function init({ container, state }) {
  const assignedBox = container.querySelector('#assigned-courses');
  const lessonsBox = container.querySelector('#lessons-review');
  const worksBox = container.querySelector('#works-queue');

  async function renderAssigned() {
    assignedBox.innerHTML = '<div class="loading">Загрузка…</div>';
    const courses = await api.listAssignedCourses(state.currentUser.id);
    if (!courses.length) {
      assignedBox.innerHTML = '<div class="empty">Вы пока не назначены проверяющим ни на один курс.</div>';
      return;
    }
    assignedBox.innerHTML = courses
      .map(
        (c) => `
        <div class="card">
          <div class="card-title">${esc(c.title)}
            <span class="tag ${c.status === 'published' ? 'tag-green' : 'tag-gray'}">${esc(COURSE_STATUS[c.status] || c.status)}</span>
          </div>
        </div>`
      )
      .join('');
  }

  async function renderLessons() {
    lessonsBox.innerHTML = '<div class="loading">Загрузка…</div>';
    const lessons = await api.listLessonsForReview();
    if (!lessons.length) {
      lessonsBox.innerHTML = '<div class="empty">Нет уроков на проверке.</div>';
      return;
    }
    lessonsBox.innerHTML = '';
    for (const l of lessons) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-title">${esc(l.title)}
          <span class="tag ${statusClass[l.status] || 'tag-gray'}">${esc(LESSON_STATUS[l.status] || l.status)}</span>
        </div>
        <div class="detail"><strong>Курс:</strong> ${esc(courseTitle(l.courseId))}</div>
        <div class="review-form">
          <label>Комментарий (при возврате на доработку)
            <textarea data-comment placeholder="Что доработать…"></textarea>
          </label>
          <div class="actions">
            <button class="btn" data-action="approve">Одобрить и опубликовать</button>
            <button class="btn btn-danger" data-action="reject">Вернуть на доработку</button>
          </div>
        </div>
      `;
      card.querySelector('[data-action="approve"]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Публикация…';
        try {
          await api.approveLesson(l.id);
          toast('Урок опубликован.', 'success');
          await renderLessons();
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false;
          btn.textContent = 'Одобрить и опубликовать';
        }
      });
      card.querySelector('[data-action="reject"]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const comment = card.querySelector('[data-comment]').value;
        btn.disabled = true;
        btn.textContent = 'Возврат…';
        try {
          await api.rejectLesson(l.id, comment);
          toast('Урок возвращён на доработку.', 'success');
          await renderLessons();
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false;
          btn.textContent = 'Вернуть на доработку';
        }
      });
      lessonsBox.appendChild(card);
    }
  }

  async function renderWorks() {
    worksBox.innerHTML = '<div class="loading">Загрузка…</div>';
    const works = await api.listReviewerQueue(state.currentUser.id);
    if (!works.length) {
      worksBox.innerHTML = '<div class="empty">Нет работ на проверке.</div>';
      return;
    }
    worksBox.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'muted';
    header.innerHTML = `В очереди ${works.length} работ — в порядке поступления.`;
    worksBox.appendChild(header);
    for (const w of works) {
      worksBox.appendChild(buildWorkCard(w, renderWorks));
    }
  }

  await Promise.all([renderAssigned(), renderLessons(), renderWorks()]);
}

function buildWorkCard(w, rerender) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-title">Работа ученика</div>
    <div class="detail"><strong>Ученик:</strong> ${esc(userName(w.studentId))}</div>
    <div class="detail"><strong>Курс:</strong> ${esc(courseTitle(w.courseId))}</div>
    <div class="detail"><strong>Урок:</strong> ${esc(lessonTitle(w.lessonId))}</div>
    <pre class="work-content">${esc(w.content)}</pre>
    <div class="review-form">
      <label>Оценка
        <select class="select" data-grade>
          ${Object.entries(GRADE_LABELS).map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}
        </select>
      </label>
      <label>Комментарий для ученика
        <textarea data-comment placeholder="Что хорошо, что доработать…"></textarea>
      </label>
      <button class="btn" data-action="review">Завершить проверку</button>
    </div>
  `;

  card.querySelector('[data-action="review"]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const grade = card.querySelector('[data-grade]').value;
    const comment = card.querySelector('[data-comment]').value;
    btn.disabled = true;
    btn.textContent = 'Проверка…';
    try {
      await api.reviewWork(w.id, { grade, comment });
      toast('Проверка завершена, результат сохранён.', 'success');
      await rerender();
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Завершить проверку';
    }
  });

  return card;
}
