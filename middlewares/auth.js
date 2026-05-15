import jwt from 'jsonwebtoken';

export function authCheck(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    res.locals.user = req.user;
    next();
  } catch {
    res.clearCookie('token');
    return res.redirect('/login');
  }
}
