import { db } from '../js/store.js';

export async function init({ container }) {
  const stats = container.querySelector('#stats');
  const published = db.courses.filter((c) => c.status === 'published').length;
  const draft = db.courses.filter((c) => c.status === 'draft').length;
  const submitted = db.works.filter((w) => w.status === 'submitted').length;
  const graded = db.works.filter((w) => w.status === 'graded').length;
  stats.innerHTML = `
    <div class="stat"><div class="stat-num">${published}</div><div class="stat-label">опубликованных курсов</div></div>
    <div class="stat"><div class="stat-num">${draft}</div><div class="stat-label">курсов в черновике</div></div>
    <div class="stat"><div class="stat-num">${submitted}</div><div class="stat-label">работ на проверке</div></div>
    <div class="stat"><div class="stat-num">${graded}</div><div class="stat-label">проверенных работ</div></div>
  `;
}
