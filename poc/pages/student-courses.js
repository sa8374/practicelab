import { api } from '../js/store.js';
import { esc, toast } from '../js/ui.js';

export async function init({ container, state }) {
  const root = container.querySelector('#courses');

  async function renderAll() {
    root.innerHTML = '<div class="loading">Загрузка…</div>';
    const items = await api.listEnrolledCourses(state.currentUser.id);
    if (!items.length) {
      root.innerHTML = '<div class="empty">Вы ещё не записаны ни на один курс. Загляните в каталог.</div>';
      return;
    }
    root.innerHTML = '';
    for (const { enrollment, course } of items) {
      const card = await buildCourseCard(enrollment, course, state);
      root.appendChild(card);
    }
  }

  await renderAll();
}

async function buildCourseCard(enrollment, course, state) {
  const lessons = await api.listLessons(course.id);
  const card = document.createElement('div');
  card.className = 'card';

  function renderCard() {
    const completed = new Set(enrollment.completedLessons);
    const checked = new Set(enrollment.checkedItems || []);
    const total = lessons.length;
    const doneCount = lessons.filter((l) => completed.has(l.id)).length;
    const allDone = total > 0 && doneCount === total;
    const pct = total ? Math.round((doneCount / total) * 100) : 0;

    let prevDone = true;
    const lessonsHtml = lessons
      .map((lesson) => {
        const done = completed.has(lesson.id);
        const available = prevDone;
        prevDone = done;
        let status, actions = '';
        if (done) {
          status = '<span class="tag tag-green">Пройден</span>';
        } else if (available) {
          status = '<span class="tag tag-blue">Текущий</span>';
          actions = `<button class="btn" data-action="complete" data-lesson="${lesson.id}">Пройти урок</button>`;
        } else {
          status = '<span class="tag tag-gray">Заблокирован</span>';
        }

        let checklistHtml = '';
        if (lesson.checklist && lesson.checklist.length && (done || available)) {
          const checkedCount = lesson.checklist.filter((c) => checked.has(c.id)).length;
          const allChecked = checkedCount === lesson.checklist.length;
          checklistHtml = `
            <div class="checklist">
              <div class="checklist-title">Чеклист самопроверки</div>
              ${lesson.checklist
                .map(
                  (c) => `
                <label class="check-item ${checked.has(c.id) ? 'checked' : ''}">
                  <input type="checkbox" data-check="${c.id}" ${checked.has(c.id) ? 'checked' : ''}>
                  <span>${esc(c.text)}</span>
                </label>`
                )
                .join('')}
              <div class="check-summary ${allChecked ? 'ok' : ''}">${allChecked ? 'Все пункты выполнены — можно сдавать работу' : `Отмечено ${checkedCount} из ${lesson.checklist.length} пунктов`}</div>
            </div>`;
        }

        let work = '';
        if (lesson.hasReview && done) {
          work = `
            <div class="work-form">
              <textarea data-work="${lesson.id}" placeholder="Текст вашей работы…"></textarea>
              <button class="btn" data-action="submit" data-lesson="${lesson.id}">Отправить работу на проверку</button>
            </div>`;
        }
        return `
          <div class="lesson">
            <div class="lesson-head">
              <div class="lesson-title">${esc(lesson.title)} ${status}</div>
              <div>${actions}</div>
            </div>
            ${checklistHtml}
            ${work}
          </div>`;
      })
      .join('');

    card.innerHTML = `
      <div class="card-title">${esc(course.title)} ${allDone ? '<span class="tag tag-green">Курс пройден</span>' : ''}</div>
      <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="muted">Пройдено ${doneCount} из ${total} уроков</div>
      <div class="lesson-list">${lessonsHtml}</div>
    `;
  }

  renderCard();

  card.addEventListener('click', async (e) => {
    const completeBtn = e.target.closest('[data-action="complete"]');
    const submitBtn = e.target.closest('[data-action="submit"]');
    if (completeBtn) {
      completeBtn.disabled = true;
      completeBtn.textContent = 'Прохождение…';
      try {
        await api.completeLesson(state.currentUser.id, course.id, completeBtn.dataset.lesson);
        toast('Урок пройден!', 'success');
        renderCard();
      } catch (err) {
        toast(err.message, 'error');
        completeBtn.disabled = false;
        completeBtn.textContent = 'Пройти урок';
      }
    }
    if (submitBtn) {
      const ta = card.querySelector(`[data-work="${submitBtn.dataset.lesson}"]`);
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка…';
      try {
        await api.submitWork({
          studentId: state.currentUser.id,
          courseId: course.id,
          lessonId: submitBtn.dataset.lesson,
          content: ta ? ta.value : '',
        });
        toast('Работа отправлена на проверку!', 'success');
        if (ta) ta.value = '';
        submitBtn.textContent = 'Работа отправлена';
      } catch (err) {
        toast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить работу на проверку';
      }
    }
  });

  card.addEventListener('change', async (e) => {
    const cb = e.target.closest('[data-check]');
    if (!cb) return;
    try {
      await api.toggleChecklistItem(state.currentUser.id, course.id, cb.dataset.check);
      renderCard();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  return card;
}
