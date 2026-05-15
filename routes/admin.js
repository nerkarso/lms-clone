import express from 'express';

import { db } from '../config/db.js';
import { authCheck } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/role.js';

const router = express.Router();

router.get('/users', authCheck, roleCheck('admin'), async (req, res, next) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role FROM users ORDER BY id ASC');

    res.render('admin/users', {
      title: 'Users',
      users,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
