import { api, WORK_STATUS, GRADE_LABELS } from '../js/store.js';
import { esc } from '../js/ui.js';

export async function init({ container, state }) {
  const root = container.querySelector('#works');
  const works = await api.listStudentWorks(state.currentUser.id);
  if (!works.length) {
    root.innerHTML = '<div class="empty">Вы ещё не сдавали работы.</div>';
    return;
  }
  root.innerHTML = works
    .map((w) => {
      const preview = w.content.length > 60 ? w.content.slice(0, 60) + '…' : w.content;
      if (w.status === 'graded') {
        return `
          <div class="card">
            <div class="card-title">${esc(preview)}</div>
            <div class="row"><span class="tag tag-green">${esc(WORK_STATUS[w.status])}</span></div>
            <div class="detail"><strong>Оценка:</strong> ${esc(GRADE_LABELS[w.grade] || w.grade)}</div>
            ${w.comment ? `<div class="detail"><strong>Комментарий:</strong> ${esc(w.comment)}</div>` : ''}
          </div>`;
      }
      return `
        <div class="card">
          <div class="card-title">${esc(preview)}</div>
          <div class="row"><span class="tag tag-blue">${esc(WORK_STATUS[w.status])}</span></div>
          <div class="muted">Ожидает проверки…</div>
        </div>`;
    })
    .join('');
}
