# LMS Clone

A small Learning Management System built with Node.js, Express, EJS, and MySQL.

This project is meant for learning how a full-stack application works with:

- routes
- views
- middleware
- database queries
- authentication
- authorization
- file uploads
- end-to-end tests

## Requirements

Install these before starting:

- Node.js 24 or newer
- npm
- MySQL server

## Install Dependencies

From the project folder, run:

```bash
npm install
```

## Environment Setup

Create a `.env` file in the project root.

Update the database username and password if your MySQL setup is different.

## Database Setup

Create the development database and run the schema from `db/schema.sql`:

```bash
npm run db:setup
```

Seed the database with initial data:

```bash
npm run db:seed
```

The seed command uses the database connection from `.env`. It creates `DB_NAME` if it does not exist.

## Start The App

For development with auto-restart:

```bash
npm run dev
```

For normal start:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Project Structure

```text
server.js              Express app setup and server entrypoint
config/db.js           MySQL connection pool
middlewares/           Auth, role, and error middleware
routes/                App routes
views/                 EJS templates
public/style.css       CSS
uploads/               Uploaded lesson files
db/schema.sql              Database schema
scripts/db-setup.js    Sets up the database schema
scripts/db-seed.js     Seeds initial data
tests/e2e/             End-to-end tests
```

## Test Setup

The tests use a separate database so they do not delete development data.

Create a `.env.test` file.

The test database name must include `test`. The test reset helper will refuse to run otherwise.

Create the test database:

```sql
CREATE DATABASE lms_clone_test;
```

## Run Tests

Run all tests:

```bash
npm test
```

Or run the E2E suite directly:

```bash
npm run test:e2e
```

The E2E tests will:

- reset the test database
- seed admin, teacher, and student users
- start the Express app on a random port
- test login, logout, roles, courses, lessons, uploads, validation, and error pages

Seeded test users all use this password:

```text
password123
```

Test users:

```text
admin@example.com
teacher@example.com
student@example.com
```

## Notes

- Do not commit `.env`.
- Uploaded files are ignored by git, except `uploads/.gitkeep`.
- Use parameterized SQL queries when adding database code.
- Keep the code simple and readable because this project is for learning.
