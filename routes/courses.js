import express from 'express';

import { db } from '../config/db.js';
import { authCheck } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/role.js';

const router = express.Router();

function validateCourse(body) {
  const title = body.title?.trim();
  const description = body.description?.trim() || '';
  const errors = [];

  if (!title) {
    errors.push('Course title is required.');
  }

  return {
    errors,
    values: { title, description },
  };
}

async function findCourse(id) {
  const [rows] = await db.query(
    `SELECT courses.id, courses.title, courses.description, courses.teacher_id,
            users.name AS teacher_name
     FROM courses
     JOIN users ON users.id = courses.teacher_id
     WHERE courses.id = ?`,
    [id]
  );

  return rows[0];
}

function canManageCourse(user, course) {
  return user.role === 'admin' || course.teacher_id === user.id;
}

router.get('/', authCheck, async (req, res, next) => {
  try {
    const [courses] = await db.query(
      `SELECT courses.id, courses.title, courses.description, users.name AS teacher_name
       FROM courses
       JOIN users ON users.id = courses.teacher_id
       ORDER BY courses.id ASC`
    );

    res.render('courses/index', {
      title: 'Courses',
      courses,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/new', authCheck, roleCheck('teacher', 'admin'), (req, res) => {
  res.render('courses/form', {
    title: 'Create course',
    action: '/courses',
    errors: [],
    values: {},
  });
});

router.post('/', authCheck, roleCheck('teacher', 'admin'), async (req, res, next) => {
  const { errors, values } = validateCourse(req.body);

  if (errors.length > 0) {
    return res.status(400).render('courses/form', {
      title: 'Create course',
      action: '/courses',
      errors,
      values,
    });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO courses (title, description, teacher_id) VALUES (?, ?, ?)',
      [values.title, values.description, req.user.id]
    );

    res.redirect(`/courses/${result.insertId}`);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authCheck, async (req, res, next) => {
  try {
    const course = await findCourse(req.params.id);

    if (!course) {
      return res.status(404).render('error', {
        title: 'Course not found',
        message: 'Course not found',
      });
    }

    const [lessons] = await db.query(
      'SELECT id, title, file_name FROM lessons WHERE course_id = ? ORDER BY id ASC',
      [course.id]
    );

    res.render('courses/show', {
      title: course.title,
      course,
      lessons,
      canManage: canManageCourse(req.user, course),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', authCheck, roleCheck('teacher', 'admin'), async (req, res, next) => {
  try {
    const course = await findCourse(req.params.id);

    if (!course) {
      return res.status(404).render('error', {
        title: 'Course not found',
        message: 'Course not found',
      });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).render('forbidden', { title: 'Forbidden' });
    }

    res.render('courses/form', {
      title: 'Edit course',
      action: `/courses/${course.id}/edit`,
      errors: [],
      values: course,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/edit', authCheck, roleCheck('teacher', 'admin'), async (req, res, next) => {
  const { errors, values } = validateCourse(req.body);

  try {
    const course = await findCourse(req.params.id);

    if (!course) {
      return res.status(404).render('error', {
        title: 'Course not found',
        message: 'Course not found',
      });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).render('forbidden', { title: 'Forbidden' });
    }

    if (errors.length > 0) {
      return res.status(400).render('courses/form', {
        title: 'Edit course',
        action: `/courses/${course.id}/edit`,
        errors,
        values,
      });
    }

    await db.query('UPDATE courses SET title = ?, description = ? WHERE id = ?', [
      values.title,
      values.description,
      course.id,
    ]);

    res.redirect(`/courses/${course.id}`);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', authCheck, roleCheck('teacher', 'admin'), async (req, res, next) => {
  try {
    const course = await findCourse(req.params.id);

    if (!course) {
      return res.status(404).render('error', {
        title: 'Course not found',
        message: 'Course not found',
      });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).render('forbidden', { title: 'Forbidden' });
    }

    await db.query('DELETE FROM courses WHERE id = ?', [course.id]);
    res.redirect('/courses');
  } catch (err) {
    next(err);
  }
});

export default router;
