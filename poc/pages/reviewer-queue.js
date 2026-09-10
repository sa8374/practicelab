import { api, db, GRADE_LABELS } from '../js/store.js';
import { esc, toast } from '../js/ui.js';

const userName = (id) => (db.users.find((u) => u.id === id) || {}).name || '—';
const courseTitle = (id) => (db.courses.find((c) => c.id === id) || {}).title || '—';
const lessonTitle = (id) => (db.lessons.find((l) => l.id === id) || {}).title || '—';

export async function init({ container, state }) {
  const root = container.querySelector('#queue');

  async function render() {
    root.innerHTML = '<div class="loading">Загрузка…</div>';
    const works = await api.listReviewerQueue(state.currentUser.id);
    if (!works.length) {
      root.innerHTML = '<div class="empty">Нет работ на проверке.</div>';
      return;
    }
    root.innerHTML = '';
    for (const w of works) {
      root.appendChild(buildCard(w, render));
    }
  }

  await render();
}

function buildCard(w, rerender) {
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
