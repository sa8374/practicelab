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
  card.innerHTML = `<div class="card-title">${esc(course.title)}</div><div class="card-body"></div>`;
  const body = card.querySelector('.card-body');

  function renderLessons() {
    const completed = new Set(enrollment.completedLessons);
    let prevDone = true;
    body.innerHTML =
      '<div class="lesson-list">' +
      lessons
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
              ${work}
            </div>`;
        })
        .join('') +
      '</div>';
  }

  renderLessons();

  card.addEventListener('click', async (e) => {
    const completeBtn = e.target.closest('[data-action="complete"]');
    const submitBtn = e.target.closest('[data-action="submit"]');
    if (completeBtn) {
      completeBtn.disabled = true;
      completeBtn.textContent = 'Прохождение…';
      try {
        await api.completeLesson(state.currentUser.id, course.id, completeBtn.dataset.lesson);
        toast('Урок пройден!', 'success');
        renderLessons();
      } catch (err) {
        toast(err.message, 'error');
        completeBtn.disabled = false;
        completeBtn.textContent = 'Пройти урок';
      }
    }
    if (submitBtn) {
      const ta = body.querySelector(`[data-work="${submitBtn.dataset.lesson}"]`);
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

  return card;
}
