import express from 'express';
import multer from 'multer';
import path from 'node:path';

import { db } from '../config/db.js';
import { authCheck } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/role.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 2 },
});

function validateLesson(body) {
  const title = body.title?.trim();
  const content = body.content?.trim();
  const errors = [];

  if (!title) {
    errors.push('Lesson title is required.');
  }

  if (!content) {
    errors.push('Lesson content is required.');
  }

  return {
    errors,
    values: { title, content },
  };
}

async function findCourse(id) {
  const [rows] = await db.query('SELECT * FROM courses WHERE id = ?', [id]);
  return rows[0];
}

async function findLesson(id) {
  const [rows] = await db.query(
    `SELECT lessons.*, courses.teacher_id
     FROM lessons
     JOIN courses ON courses.id = lessons.course_id
     WHERE lessons.id = ?`,
    [id]
  );
  return rows[0];
}

function canManage(user, item) {
  return user.role === 'admin' || item.teacher_id === user.id;
}

router.get('/new', authCheck, roleCheck('teacher', 'admin'), async (req, res, next) => {
  try {
    const course = await findCourse(req.query.course_id);

    if (!course) {
      return res.status(404).render('error', {
        title: 'Course not found',
        message: 'Course not found',
      });
    }

    if (!canManage(req.user, course)) {
      return res.status(403).render('forbidden', { title: 'Forbidden' });
    }

    res.render('lessons/form', {
      title: 'Create lesson',
      action: '/lessons',
      errors: [],
      values: { course_id: course.id },
      course,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authCheck,
  roleCheck('teacher', 'admin'),
  upload.single('file'),
  async (req, res, next) => {
    const { errors, values } = validateLesson(req.body);

    try {
      const course = await findCourse(req.body.course_id);

      if (!course) {
        return res.status(404).render('error', {
          title: 'Course not found',
          message: 'Course not found',
        });
      }

      if (!canManage(req.user, course)) {
        return res.status(403).render('forbidden', { title: 'Forbidden' });
      }

      if (errors.length > 0) {
        return res.status(400).render('lessons/form', {
          title: 'Create lesson',
          action: '/lessons',
          errors,
          values: { ...values, course_id: course.id },
          course,
        });
      }

      const [result] = await db.query(
        'INSERT INTO lessons (course_id, title, content, file_name) VALUES (?, ?, ?, ?)',
        [course.id, values.title, values.content, req.file?.filename || null]
      );

      res.redirect(`/lessons/${result.insertId}`);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/uploads/:fileName', authCheck, (req, res) => {
  const filePath = path.resolve('uploads', req.params.fileName);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).render('error', {
        title: 'File not found',
        message: 'File not found',
      });
    }
  });
});

router.get('/:id', authCheck, async (req, res, next) => {
  try {
    const lesson = await findLesson(req.params.id);

    if (!lesson) {
      return res.status(404).render('error', {
        title: 'Lesson not found',
        message: 'Lesson not found',
      });
    }

    res.render('lessons/show', {
      title: lesson.title,
      lesson,
      canManage: canManage(req.user, lesson),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', authCheck, roleCheck('teacher', 'admin'), async (req, res, next) => {
  try {
    const lesson = await findLesson(req.params.id);

    if (!lesson) {
      return res.status(404).render('error', {
        title: 'Lesson not found',
        message: 'Lesson not found',
      });
    }

    if (!canManage(req.user, lesson)) {
      return res.status(403).render('forbidden', { title: 'Forbidden' });
    }

    res.render('lessons/form', {
      title: 'Edit lesson',
      action: `/lessons/${lesson.id}/edit`,
      errors: [],
      values: lesson,
      course: { id: lesson.course_id },
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:id/edit',
  authCheck,
  roleCheck('teacher', 'admin'),
  upload.single('file'),
  async (req, res, next) => {
    const { errors, values } = validateLesson(req.body);

    try {
      const lesson = await findLesson(req.params.id);

      if (!lesson) {
        return res.status(404).render('error', {
          title: 'Lesson not found',
          message: 'Lesson not found',
        });
      }

      if (!canManage(req.user, lesson)) {
        return res.status(403).render('forbidden', { title: 'Forbidden' });
      }

      if (errors.length > 0) {
        return res.status(400).render('lessons/form', {
          title: 'Edit lesson',
          action: `/lessons/${lesson.id}/edit`,
          errors,
          values: { ...lesson, ...values },
          course: { id: lesson.course_id },
        });
      }

      const fileName = req.file?.filename || lesson.file_name;
      await db.query('UPDATE lessons SET title = ?, content = ?, file_name = ? WHERE id = ?', [
        values.title,
        values.content,
        fileName,
        lesson.id,
      ]);

      res.redirect(`/lessons/${lesson.id}`);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/:id/delete', authCheck, roleCheck('teacher', 'admin'), async (req, res, next) => {
  try {
    const lesson = await findLesson(req.params.id);

    if (!lesson) {
      return res.status(404).render('error', {
        title: 'Lesson not found',
        message: 'Lesson not found',
      });
    }

    if (!canManage(req.user, lesson)) {
      return res.status(403).render('forbidden', { title: 'Forbidden' });
    }

    await db.query('DELETE FROM lessons WHERE id = ?', [lesson.id]);
    res.redirect(`/courses/${lesson.course_id}`);
  } catch (err) {
    next(err);
  }
});

export default router;
