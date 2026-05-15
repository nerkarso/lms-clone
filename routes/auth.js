import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';

import { db } from '../config/db.js';
import { authCheck } from '../middlewares/auth.js';

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    error: null,
    values: {},
  });
});

router.post('/login', async (req, res, next) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !email.includes('@') || !password) {
    return res.status(401).render('auth/login', {
      title: 'Login',
      error: 'Invalid email or password.',
      values: { email },
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password.',
        values: { email },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60,
    });

    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', authCheck, async (req, res, next) => {
  try {
    const [courses] = await db.query(
      `SELECT courses.id, courses.title, users.name AS teacher_name
       FROM courses
       JOIN users ON users.id = courses.teacher_id
       ORDER BY courses.id ASC
       LIMIT 5`
    );

    res.render('dashboard', {
      title: 'Dashboard',
      courses,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

export default router;
