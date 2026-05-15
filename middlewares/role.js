export function roleCheck(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).render('forbidden', {
        title: 'Forbidden',
      });
    }

    next();
  };
}
