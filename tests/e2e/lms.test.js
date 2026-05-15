import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';

import { resetTestDatabase } from './helpers/db.js';
import { responseText, TestClient } from './helpers/http.js';
import { startTestServer } from './helpers/server.js';

let server;
let baseUrl;

describe('LMS end-to-end', () => {
  before(async () => {
    await resetTestDatabase();
    server = await startTestServer();
    baseUrl = server.baseUrl;
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  after(async () => {
    await server.close();
  });

  test('login page returns 200', async () => {
    const client = new TestClient(baseUrl);
    const response = await client.get('/login');
    const html = await responseText(response);

    assert.equal(response.status, 200);
    assert.match(html, /Login/);
    assert.match(html, /data-email="admin@example.com"/);
    assert.match(html, /data-email="teacher@example.com"/);
    assert.match(html, /data-email="student@example.com"/);
  });

  test('valid student login redirects to dashboard', async () => {
    const client = new TestClient(baseUrl);
    await client.login('student@example.com');

    const dashboard = await client.get('/dashboard');
    const html = await responseText(dashboard);

    assert.equal(dashboard.status, 200);
    assert.match(html, /Welcome, Student User/);
    assert.match(html, /Role:<\/strong> student/);
  });

  test('invalid login returns 401 and shows an error', async () => {
    const client = new TestClient(baseUrl);
    const response = await client.postForm('/login', {
      email: 'student@example.com',
      password: 'wrong-password',
    });

    assert.equal(response.status, 401);
    assert.match(await responseText(response), /Invalid email or password/);
  });

  test('logout clears the auth cookie and redirects to login', async () => {
    const client = new TestClient(baseUrl);
    await client.login('student@example.com');

    const logout = await client.postForm('/logout', {});

    assert.equal(logout.status, 302);
    assert.equal(logout.headers.get('location'), '/login');
    assert.equal(client.cookies.has('token'), false);
  });

  test('logged-out user visiting dashboard redirects to login', async () => {
    const client = new TestClient(baseUrl);
    const response = await client.get('/dashboard');

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/login');
  });

  test('student cannot access teacher or admin routes', async () => {
    const client = new TestClient(baseUrl);
    await client.login('student@example.com');

    const newCourse = await client.get('/courses/new');
    const adminUsers = await client.get('/admin/users');

    assert.equal(newCourse.status, 403);
    assert.equal(adminUsers.status, 403);
  });

  test('teacher can access course management routes', async () => {
    const client = new TestClient(baseUrl);
    await client.login('teacher@example.com');

    const response = await client.get('/courses/new');

    assert.equal(response.status, 200);
    assert.match(await responseText(response), /Create course/);
  });

  test('admin can access user management route', async () => {
    const client = new TestClient(baseUrl);
    await client.login('admin@example.com');

    const response = await client.get('/admin/users');
    const html = await responseText(response);

    assert.equal(response.status, 200);
    assert.match(html, /Admin User/);
    assert.match(html, /teacher@example.com/);
  });

  test('course list renders seeded courses', async () => {
    const client = new TestClient(baseUrl);
    await client.login('student@example.com');

    const response = await client.get('/courses');
    const html = await responseText(response);

    assert.equal(response.status, 200);
    assert.match(html, /JavaScript Basics/);
    assert.match(html, /Express LMS Project/);
  });

  test('teacher can create, edit, and delete a course', async () => {
    const client = new TestClient(baseUrl);
    await client.login('teacher@example.com');

    const create = await client.postForm('/courses', {
      title: 'Node Testing',
      description: 'Test the LMS with Node.',
    });
    assert.equal(create.status, 302);

    const createdPath = create.headers.get('location');
    const created = await client.get(createdPath);
    assert.match(await responseText(created), /Node Testing/);

    const edit = await client.postForm(`${createdPath}/edit`, {
      title: 'Node E2E Testing',
      description: 'Updated description.',
    });
    assert.equal(edit.status, 302);

    const updated = await client.get(createdPath);
    assert.match(await responseText(updated), /Node E2E Testing/);

    const deleted = await client.postForm(`${createdPath}/delete`, {});
    assert.equal(deleted.status, 302);
    assert.equal(deleted.headers.get('location'), '/courses');

    const missing = await client.get(createdPath);
    assert.equal(missing.status, 404);
  });

  test('student can view courses but cannot create, edit, or delete', async () => {
    const client = new TestClient(baseUrl);
    await client.login('student@example.com');

    const view = await client.get('/courses/1');
    const create = await client.postForm('/courses', {
      title: 'Student Course',
      description: 'Should not save.',
    });
    const edit = await client.postForm('/courses/1/edit', {
      title: 'Hacked',
      description: 'Nope.',
    });
    const deleted = await client.postForm('/courses/1/delete', {});

    assert.equal(view.status, 200);
    assert.equal(create.status, 403);
    assert.equal(edit.status, 403);
    assert.equal(deleted.status, 403);
  });

  test('course detail page renders lessons', async () => {
    const client = new TestClient(baseUrl);
    await client.login('student@example.com');

    const response = await client.get('/courses/1');
    const html = await responseText(response);

    assert.equal(response.status, 200);
    assert.match(html, /Variables/);
    assert.match(html, /Functions/);
  });

  test('teacher can create, edit, and delete a lesson', async () => {
    const client = new TestClient(baseUrl);
    await client.login('teacher@example.com');

    const create = await client.postMultipart(
      '/lessons',
      {
        course_id: '1',
        title: 'Arrays',
        content: 'Arrays store lists.',
      },
      {
        name: 'arrays.txt',
        type: 'text/plain',
        content: 'array notes',
      }
    );
    assert.equal(create.status, 302);

    const lessonPath = create.headers.get('location');
    const created = await client.get(lessonPath);
    let html = await responseText(created);
    assert.match(html, /Arrays/);
    assert.match(html, /Open lesson file/);

    const uploadHref = html.match(/href="([^"]*arrays\.txt)"/)[1];
    const fileResponse = await client.get(uploadHref);
    assert.equal(fileResponse.status, 200);
    assert.equal(await responseText(fileResponse), 'array notes');

    const edit = await client.postMultipart(`${lessonPath}/edit`, {
      title: 'Arrays Updated',
      content: 'Updated lesson content.',
    });
    assert.equal(edit.status, 302);

    const updated = await client.get(lessonPath);
    html = await responseText(updated);
    assert.match(html, /Arrays Updated/);

    const deleted = await client.postForm(`${lessonPath}/delete`, {});
    assert.equal(deleted.status, 302);
    assert.equal(deleted.headers.get('location'), '/courses/1');

    const missing = await client.get(lessonPath);
    assert.equal(missing.status, 404);
  });

  test('missing lesson returns 404', async () => {
    const client = new TestClient(baseUrl);
    await client.login('student@example.com');

    const response = await client.get('/lessons/999');

    assert.equal(response.status, 404);
    assert.match(await responseText(response), /Lesson not found/);
  });

  test('invalid lesson upload request returns validation error', async () => {
    const client = new TestClient(baseUrl);
    await client.login('teacher@example.com');

    const response = await client.postMultipart('/lessons', {
      course_id: '1',
      title: '',
      content: '',
    });

    assert.equal(response.status, 400);
    assert.match(await responseText(response), /Lesson title is required/);
  });

  test('empty course title returns 400', async () => {
    const client = new TestClient(baseUrl);
    await client.login('teacher@example.com');

    const response = await client.postForm('/courses', {
      title: '',
      description: 'Missing title.',
    });

    assert.equal(response.status, 400);
    assert.match(await responseText(response), /Course title is required/);
  });

  test('unknown route returns 404', async () => {
    const client = new TestClient(baseUrl);
    const response = await client.get('/missing-page');

    assert.equal(response.status, 404);
    assert.match(await responseText(response), /Page not found/);
  });

  test('unexpected app errors return a shared error response', async () => {
    const client = new TestClient(baseUrl);
    const response = await client.get('/error-test');

    assert.equal(response.status, 500);
    assert.match(await responseText(response), /Something went wrong/);
  });
});
