import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import coursesRouter from './routes/courses.js';
import lessonsRouter from './routes/lessons.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.locals.user = null;
  next();
});

app.get('/', (req, res) => {
  res.redirect('/courses');
});

app.use('/', authRouter);
app.use('/courses', coursesRouter);
app.use('/lessons', lessonsRouter);
app.use('/admin', adminRouter);

app.get('/error-test', (req, res, next) => {
  next(new Error('Test error'));
});

app.use(notFoundHandler);
app.use(errorHandler);

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`LMS server running on http://localhost:${port}`);
  });
}

export default app;
