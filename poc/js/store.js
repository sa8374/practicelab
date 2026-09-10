// In-memory «база данных» и мок-API с задержками и валидацией.

export const ROLE_LABELS = {
  author: 'Автор курса',
  reviewer: 'Проверяющий',
  student: 'Ученик',
};

export const COURSE_STATUS = {
  draft: 'Черновик',
  published: 'Опубликован',
};

export const WORK_STATUS = {
  submitted: 'На проверке',
  graded: 'Проверено',
};

export const GRADE_LABELS = {
  meets: 'Соответствует требованиям',
  needs_work: 'Требует доработки',
  exceeds: 'Превышает ожидания',
};

export const db = {
  users: [
    { id: 'u-author', name: 'Анна Смирнова', role: 'author' },
    { id: 'u-reviewer-1', name: 'Иван Петров', role: 'reviewer' },
    { id: 'u-reviewer-2', name: 'Мария Козлова', role: 'reviewer' },
    { id: 'u-student-1', name: 'Пётр Иванов', role: 'student' },
    { id: 'u-student-2', name: 'Ольга Сидорова', role: 'student' },
  ],
  courses: [
    { id: 'c-py', title: 'Python для начинающих', description: 'Основы программирования на Python с нуля.', authorId: 'u-author', reviewerId: 'u-reviewer-1', status: 'published' },
    { id: 'c-web', title: 'Веб-разработка', description: 'HTML, CSS и JavaScript для создания сайтов.', authorId: 'u-author', reviewerId: null, status: 'draft' },
  ],
  lessons: [
    { id: 'l-py-1', courseId: 'c-py', title: 'Введение в Python', order: 1, hasReview: false },
    { id: 'l-py-2', courseId: 'c-py', title: 'Переменные и типы данных', order: 2, hasReview: false },
    { id: 'l-py-3', courseId: 'c-py', title: 'Практика: Hello World', order: 3, hasReview: true },
    { id: 'l-web-1', courseId: 'c-web', title: 'Введение в HTML', order: 1, hasReview: false },
  ],
  enrollments: [
    { id: 'e-1', userId: 'u-student-1', courseId: 'c-py', completedLessons: ['l-py-1'] },
  ],
  works: [
    { id: 'w-1', studentId: 'u-student-1', courseId: 'c-py', lessonId: 'l-py-3', reviewerId: 'u-reviewer-1', content: "print('Hello, World!')", status: 'submitted', grade: null, comment: null, createdAt: Date.now() - 3600000 },
    { id: 'w-2', studentId: 'u-student-1', courseId: 'c-py', lessonId: 'l-py-2', reviewerId: 'u-reviewer-1', content: "a = 5\nb = 10\nprint(a + b)", status: 'graded', grade: 'meets', comment: 'Хорошая работа, всё верно!', createdAt: Date.now() - 7200000 },
  ],
};

const DELAY = 500;
function wait() { return new Promise((res) => setTimeout(res, DELAY + Math.random() * 200)); }
function uid(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; }

export const api = {
  listUsers: () => wait().then(() => [...db.users]),

  listReviewers: () => wait().then(() => db.users.filter((u) => u.role === 'reviewer')),

  listPublishedCourses: () => wait().then(() => db.courses.filter((c) => c.status === 'published')),

  listAuthorCourses: (authorId) => wait().then(() => db.courses.filter((c) => c.authorId === authorId)),

  createCourse(authorId, { title, description }) {
    return wait().then(() => {
      const t = (title || '').trim();
      if (!t) throw new Error('Название курса обязательно.');
      const course = { id: uid('c'), title: t, description: (description || '').trim(), authorId, reviewerId: null, status: 'draft' };
      db.courses.push(course);
      return course;
    });
  },

  publishCourse(courseId) {
    return wait().then(() => {
      const course = db.courses.find((c) => c.id === courseId);
      if (!course) throw new Error('Курс не найден.');
      course.status = 'published';
      return course;
    });
  },

  assignReviewer(courseId, reviewerId) {
    return wait().then(() => {
      const course = db.courses.find((c) => c.id === courseId);
      if (!course) throw new Error('Курс не найден.');
      if (!db.users.some((u) => u.id === reviewerId && u.role === 'reviewer')) throw new Error('Проверяющий не найден.');
      course.reviewerId = reviewerId;
      return course;
    });
  },

  enroll(studentId, courseId) {
    return wait().then(() => {
      if (db.enrollments.some((e) => e.userId === studentId && e.courseId === courseId)) {
        throw new Error('Вы уже записаны на этот курс.');
      }
      const enrollment = { id: uid('e'), userId: studentId, courseId, completedLessons: [] };
      db.enrollments.push(enrollment);
      return enrollment;
    });
  },

  listEnrolledCourses(studentId) {
    return wait().then(() =>
      db.enrollments
        .filter((e) => e.userId === studentId)
        .map((e) => ({ enrollment: e, course: db.courses.find((c) => c.id === e.courseId) }))
        .filter((x) => x.course)
    );
  },

  listLessons(courseId) {
    return wait().then(() => db.lessons.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order));
  },

  completeLesson(studentId, courseId, lessonId) {
    return wait().then(() => {
      const e = db.enrollments.find((x) => x.userId === studentId && x.courseId === courseId);
      if (!e) throw new Error('Вы не записаны на этот курс.');
      if (!e.completedLessons.includes(lessonId)) e.completedLessons.push(lessonId);
      return e;
    });
  },

  submitWork({ studentId, courseId, lessonId, content }) {
    return wait().then(() => {
      const text = (content || '').trim();
      if (!text) throw new Error('Текст работы не может быть пустым.');
      const course = db.courses.find((c) => c.id === courseId);
      if (!course) throw new Error('Курс не найден.');
      if (!course.reviewerId) throw new Error('На курс не назначен проверяющий — сдать работу пока нельзя.');
      const work = { id: uid('w'), studentId, courseId, lessonId, reviewerId: course.reviewerId, content: text, status: 'submitted', grade: null, comment: null, createdAt: Date.now() };
      db.works.push(work);
      return work;
    });
  },

  listStudentWorks(studentId) {
    return wait().then(() => db.works.filter((w) => w.studentId === studentId).sort((a, b) => b.createdAt - a.createdAt));
  },

  listReviewerQueue(reviewerId) {
    return wait().then(() => db.works.filter((w) => w.reviewerId === reviewerId && w.status === 'submitted').sort((a, b) => a.createdAt - b.createdAt));
  },

  reviewWork(workId, { grade, comment }) {
    return wait().then(() => {
      const work = db.works.find((w) => w.id === workId);
      if (!work) throw new Error('Работа не найдена.');
      if (!GRADE_LABELS[grade]) throw new Error('Некорректная оценка.');
      work.grade = grade;
      work.comment = (comment || '').trim();
      work.status = 'graded';
      return work;
    });
  },
};
