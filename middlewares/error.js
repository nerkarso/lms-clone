export function notFoundHandler(req, res) {
  res.status(404).render('error', {
    title: 'Not found',
    message: 'Page not found',
  });
}

export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.message);
  }

  res.status(500).render('error', {
    title: 'Server error',
    message: 'Something went wrong',
  });
}
