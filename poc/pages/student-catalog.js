import { api, db } from '../js/store.js';
import { esc, toast } from '../js/ui.js';

export async function init({ container, state }) {
  const root = container.querySelector('#catalog');
  const courses = await api.listPublishedCourses();
  if (!courses.length) {
    root.innerHTML = '<div class="empty">Пока нет опубликованных курсов.</div>';
    return;
  }
  const enrolled = new Set(db.enrollments.filter((e) => e.userId === state.currentUser.id).map((e) => e.courseId));

  root.innerHTML = courses
    .map((c) => {
      const already = enrolled.has(c.id);
      return `
        <div class="card" data-id="${c.id}">
          <div class="card-title">${esc(c.title)}</div>
          <div class="card-desc">${esc(c.description || '')}</div>
          <button class="btn ${already ? 'btn-success' : ''}" data-action="enroll" ${already ? 'disabled' : ''}>${already ? 'Вы записаны' : 'Записаться'}</button>
        </div>`;
    })
    .join('');

  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="enroll"]');
    if (!btn) return;
    const card = btn.closest('.card');
    btn.disabled = true;
    btn.textContent = 'Запись…';
    try {
      await api.enroll(state.currentUser.id, card.dataset.id);
      toast('Вы записались на курс!', 'success');
      btn.textContent = 'Вы записаны';
      btn.classList.add('btn-success');
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Записаться';
    }
  });
}
