# AGENTS.md

## Project Overview

This repository is a small Learning Management System built for teaching full-stack application concepts with plain Node.js and Express.

Key technologies:

- Node.js ESM modules
- Express 5
- EJS server-rendered views
- MySQL via `mysql2/promise`
- JWT authentication stored in an `httpOnly` cookie
- `bcrypt` password hashing
- `multer` lesson file uploads
- Node's built-in `node:test` runner for E2E tests

The app is intentionally simple and readable for students. Prefer direct Express routes, clear middleware, parameterized SQL, and small EJS templates over extra abstractions.

## Setup Commands

- Install dependencies: `npm install`
- Create the configured development database and run `db/schema.sql`: `npm run db:setup`
- Create local environment: copy from `.env.example` and create `.env`.
- Create test environment: `.env.test` should point to a separate database whose name includes `test`.
- Database schema reference: `db/schema.sql`

## Development Workflow

- Start the development server: `npm run dev`
- Start without watch mode: `npm start`
- Set up the development database: `npm run db:setup`
- Main Express app and server entrypoint: `server.js`
- Database pool: `config/db.js`
- Routes live in `routes/`
- Middleware lives in `middlewares/`
- EJS templates live in `views/`
- Static CSS lives in `public/style.css`
- Uploaded files are written to `uploads/`

Keep `server.js` importable. It should only call `app.listen()` when run directly with Node; tests import it and start the app on a random port.

## Testing Instructions

- Run all tests: `npm test`
- Run E2E tests directly: `npm run test:e2e`
- Test files live in `tests/e2e/`
- Test helpers live in `tests/e2e/helpers/`

The E2E suite:

- Starts the Express app on a random local port
- Uses real HTTP requests with built-in `fetch`
- Resets and seeds the MySQL test database before tests
- Tests authentication, authorization, courses, lessons, uploads, validation, 404s, and error handling

Database safety rules:

- Tests must use `.env.test`, not `.env`
- `NODE_ENV` must be `test`
- `DB_NAME` must include `test`
- The reset helper should keep refusing to run if those checks fail

If a test run fails with a local MySQL connection permission error, rerun `npm test` with permission to access `localhost:3306`.

## Code Style

- Use ESM `import` / `export`.
- Use `async` route handlers with `try/catch` and `next(err)` for database work.
- Use parameterized SQL queries for all user input.
- Validate form input before inserting or updating rows.
- Use redirects after successful form posts.
- Render EJS views for validation errors with clear status codes such as `400`, `403`, or `404`.
- Keep user-facing pages simple; this project is a teaching app, not a component-heavy frontend.

## Security Notes

- Never commit `.env`.
- Do not store plaintext passwords; use `bcrypt`.
- Keep JWT payloads small and never include password data.
- Protect authenticated pages with `authCheck`.
- Protect role-specific pages with `roleCheck`.
- Hiding links in EJS is not enough; routes must enforce authorization on the server.
- Keep generated upload files out of git. `uploads/.gitkeep` is tracked so the directory exists.

## Pull Request / Change Guidelines

- Before finishing code changes, run `npm test` when MySQL is available.
- Add or update E2E coverage when changing user flows, auth, authorization, database behavior, or uploads.
- Keep changes scoped and avoid introducing ORMs, frontend frameworks, or complex architecture unless explicitly requested.
- Preserve the beginner-friendly teaching style: direct routes, clear file names, and readable SQL.
