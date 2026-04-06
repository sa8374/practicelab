# Схема базы данных PracticeLab

## Таблицы

### platforms
- **id** UUID PRIMARY KEY
- **name** VARCHAR(255) NOT NULL
- **url** VARCHAR(500) NOT NULL
- **created_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **updated_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### users
- **id** UUID PRIMARY KEY
- **email** VARCHAR(255) UNIQUE NOT NULL
- **first_name** VARCHAR(100)
- **last_name** VARCHAR(100)
- **role** VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'author', 'admin', 'reviewer'))
- **created_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **updated_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### courses
- **id** UUID PRIMARY KEY
- **platform_id** UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE
- **author_id** UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
- **title** VARCHAR(255) NOT NULL
- **description** TEXT
- **status** VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'review', 'published', 'archived', 'hidden'))
- **order_position** INTEGER
- **created_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **updated_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### lessons
- **id** UUID PRIMARY KEY
- **course_id** UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE
- **author_id** UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
- **title** VARCHAR(255) NOT NULL
- **description** TEXT
- **status** VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'review', 'published', 'hidden', 'locked'))
- **order_position** INTEGER NOT NULL
- **has_review** BOOLEAN DEFAULT FALSE
- **is_current** BOOLEAN DEFAULT FALSE
- **is_completed** BOOLEAN DEFAULT FALSE
- **created_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **updated_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### steps
- **id** UUID PRIMARY KEY
- **lesson_id** UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE
- **author_id** UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
- **title** VARCHAR(255) NOT NULL
- **content** TEXT NOT NULL
- **type** VARCHAR(50) CHECK (type IN ('read', 'answer', 'execute', 'submit'))
- **status** VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'review', 'published', 'hidden', 'locked'))
- **order_position** INTEGER NOT NULL
- **has_checklist** BOOLEAN DEFAULT FALSE
- **has_illustration** BOOLEAN DEFAULT FALSE
- **created_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **updated_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### checklists
- **id** UUID PRIMARY KEY
- **step_id** UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE
- **title** VARCHAR(255) NOT NULL
- **description** TEXT
- **order_position** INTEGER NOT NULL
- **created_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **updated_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### checklist_items
- **id** UUID PRIMARY KEY
- **checklist_id** UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE
- **text** TEXT NOT NULL
- **order_position** INTEGER NOT NULL
- **created_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **updated_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### student_works
- **id** UUID PRIMARY KEY
- **step_id** UUID REFERENCES steps(id) ON DELETE SET NULL
- **lesson_id** UUID REFERENCES lessons(id) ON DELETE SET NULL
- **course_id** UUID REFERENCES courses(id) ON DELETE SET NULL
- **student_id** UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- **title** VARCHAR(255)
- **content** TEXT
- **content_type** VARCHAR(50) CHECK (content_type IN ('text', 'image', 'audio', 'video', 'mixed'))
- **execution_form** VARCHAR(50) CHECK (execution_form IN ('oral', 'written'))
- **completion_time** VARCHAR(50) CHECK (completion_time IN ('in_lesson', 'homework', 'long_term'))
- **difficulty_level** VARCHAR(50) CHECK (difficulty_level IN ('basic', 'advanced', 'creative'))
- **student_goal** VARCHAR(100)
- **engagement_level** VARCHAR(50) CHECK (engagement_level IN ('formal', 'interested', 'motivated'))
- **independence_level** VARCHAR(50) CHECK (independence_level IN ('independent', 'with_teacher', 'group', 'with_resources'))
- **processing_status** VARCHAR(50) CHECK (processing_status IN ('uploaded', 'reviewing', 'graded', 'archived'))
- **data_size** VARCHAR(50) CHECK (data_size IN ('small', 'medium', 'large'))
- **access_level** VARCHAR(50) CHECK (access_level IN ('student_only', 'student_teacher', 'public', 'group'))
- **storage_period** VARCHAR(50) CHECK (storage_period IN ('temporary', 'long_term', 'permanent'))
- **learning_status** VARCHAR(50) CHECK (learning_status IN ('entry_task', 'current_work', 'final_work', 'additional_task'))
- **service_quality** VARCHAR(50) CHECK (service_quality IN ('meets_standards', 'needs_improvement', 'exemplary'))
- **student_progress** VARCHAR(50) CHECK (student_progress IN ('beginner', 'progress', 'regress', 'stable'))
- **created_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **updated_at** TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## Связи
1. platforms (1) → courses (N)
2. users (1) → courses (N) - автор курса
3. users (1) → lessons (N) - автор урока
4. users (1) → steps (N) - автор шага
5. users (1) → student_works (N) - ученик
6. courses (1) → lessons (N)
7. lessons (1) → steps (N)
8. steps (1) → checklists (N)
9. checklists (1) → checklist_items (N)
10. steps (0..1) → student_works (N) - работа может быть привязана к шагу
11. lessons (0..1) → student_works (N) - работа может быть привязана к уроку
12. courses (0..1) → student_works (N) - работа может быть привязана к курсу

## Индексы
- idx_users_email ON users(email)
- idx_courses_platform_id ON courses(platform_id)
- idx_courses_author_id ON courses(author_id)
- idx_lessons_course_id ON lessons(course_id)
- idx_lessons_author_id ON lessons(author_id)
- idx_steps_lesson_id ON steps(lesson_id)
- idx_steps_author_id ON steps(author_id)
- idx_checklists_step_id ON checklists(step_id)
- idx_checklist_items_checklist_id ON checklist_items(checklist_id)
- idx_student_works_step_id ON student_works(step_id)
- idx_student_works_lesson_id ON student_works(lesson_id)
- idx_student_works_course_id ON student_works(course_id)
- idx_student_works_student_id ON student_works(student_id)

## Примеры данных

### Пользователь (автор/учитель)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174010",
  "email": "author@example.com",
  "first_name": "Иван",
  "last_name": "Петров",
  "role": "author",
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-10T09:00:00Z"
}
```

### Пользователь (ученик)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "student@example.com",
  "first_name": "Анна",
  "last_name": "Сидорова",
  "role": "student",
  "created_at": "2024-01-12T11:30:00Z",
  "updated_at": "2024-01-12T11:30:00Z"
}
```

### Платформа
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "PracticeLab Platform",
  "url": "https://dvmn.org",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Курс
```json
{
  "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "platform_id": "550e8400-e29b-41d4-a716-446655440000",
  "author_id": "123e4567-e89b-12d3-a456-426614174010",
  "title": "Python для начинающих",
  "description": "Курс по основам программирования на Python",
  "status": "published",
  "order_position": 1,
  "created_at": "2024-01-20T14:00:00Z",
  "updated_at": "2024-01-20T14:00:00Z"
}
```

### Урок
```json
{
  "id": "6ba7b811-9dad-11d1-80b4-00c04fd430c9",
  "course_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "author_id": "123e4567-e89b-12d3-a456-426614174010",
  "title": "Основы Python: переменные и типы данных",
  "description": "Введение в базовые концепты Python",
  "status": "published",
  "order_position": 1,
  "has_review": true,
  "is_current": true,
  "is_completed": false,
  "created_at": "2024-01-25T09:15:00Z",
  "updated_at": "2024-01-25T09:15:00Z"
}
```

### Шаг
```json
{
  "id": "6ba7b812-9dad-11d1-80b4-00c04fd430ca",
  "lesson_id": "6ba7b811-9dad-11d1-80b4-00c04fd430c9",
  "author_id": "123e4567-e89b-12d3-a456-426614174010",
  "title": "Создайте первую программу на Python",
  "content": "Напишите программу, которая выводит 'Hello, World!'",
  "type": "execute",
  "status": "published",
  "order_position": 1,
  "has_checklist": true,
  "has_illustration": false,
  "created_at": "2024-01-25T09:20:00Z",
  "updated_at": "2024-01-25T09:20:00Z"
}
```

### Чеклист
```json
{
  "id": "6ba7b815-9dad-11d1-80b4-00c04fd430cd",
  "step_id": "6ba7b812-9dad-11d1-80b4-00c04fd430ca",
  "title": "Проверка программы Hello World",
  "description": "Чеклист для самопроверки программы",
  "order_position": 1,
  "created_at": "2024-01-25T09:25:00Z",
  "updated_at": "2024-01-25T09:25:00Z"
}
```

### Элемент чеклиста
```json
{
  "id": "6ba7b816-9dad-11d1-80b4-00c04fd430ce",
  "checklist_id": "6ba7b815-9dad-11d1-80b4-00c04fd430cd",
  "text": "Программа выводит текст 'Hello, World!'",
  "order_position": 1,
  "created_at": "2024-01-25T09:26:00Z",
  "updated_at": "2024-01-25T09:26:00Z"
}
```

### Работа ученика
```json
{
  "id": "6ba7b813-9dad-11d1-80b4-00c04fd430cb",
  "step_id": "6ba7b812-9dad-11d1-80b4-00c04fd430ca",
  "lesson_id": "6ba7b811-9dad-11d1-80b4-00c04fd430c9",
  "course_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "student_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Домашняя работа: Hello World",
  "content": "print('Hello, World!')",
  "content_type": "text",
  "execution_form": "written",
  "completion_time": "homework",
  "difficulty_level": "basic",
  "student_goal": "закрепить материал",
  "engagement_level": "interested",
  "independence_level": "independent",
  "processing_status": "graded",
  "data_size": "small",
  "access_level": "student_teacher",
  "storage_period": "temporary",
  "learning_status": "current_work",
  "service_quality": "meets_standards",
  "student_progress": "progress",
  "created_at": "2024-01-26T18:30:00Z",
  "updated_at": "2024-01-27T10:00:00Z"
}
```

### Крайний случай: Работа без привязки к шагу (общее задание)
```json
{
  "id": "6ba7b814-9dad-11d1-80b4-00c04fd430cc",
  "step_id": null,
  "lesson_id": null,
  "course_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "student_id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Итоговый проект курса",
  "content": "Полный проект на Python",
  "content_type": "mixed",
  "execution_form": "written",
  "completion_time": "long_term",
  "difficulty_level": "creative",
  "student_goal": "подготовиться к экзамену",
  "engagement_level": "motivated",
  "independence_level": "with_resources",
  "processing_status": "reviewing",
  "data_size": "medium",
  "access_level": "student_teacher",
  "storage_period": "permanent",
  "learning_status": "final_work",
  "service_quality": "exemplary",
  "student_progress": "progress",
  "created_at": "2024-02-01T12:00:00Z",
  "updated_at": "2024-02-01T12:00:00Z"
}
```