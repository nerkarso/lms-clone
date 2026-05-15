import assert from 'node:assert/strict';

export class TestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
  }

  cookieHeader() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  storeCookies(response) {
    const setCookie = response.headers.getSetCookie?.() || [];

    for (const cookie of setCookie) {
      const [pair] = cookie.split(';');
      const [name, value] = pair.split('=');

      if (value === '') {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const cookie = this.cookieHeader();

    if (cookie) {
      headers.set('cookie', cookie);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      redirect: 'manual',
      ...options,
      headers,
    });

    this.storeCookies(response);
    return response;
  }

  async get(path) {
    return this.request(path);
  }

  async postForm(path, values) {
    const body = new URLSearchParams(values);

    return this.request(path, {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async postMultipart(path, values, file) {
    const body = new FormData();

    for (const [key, value] of Object.entries(values)) {
      body.set(key, value);
    }

    if (file) {
      body.set('file', new Blob([file.content], { type: file.type }), file.name);
    }

    return this.request(path, {
      method: 'POST',
      body,
    });
  }

  async login(email, password = 'password123') {
    const response = await this.postForm('/login', { email, password });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/dashboard');
    assert.ok(this.cookies.has('token'));
    return response;
  }
}

export async function responseText(response) {
  return response.text();
}
