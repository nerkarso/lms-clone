import bcrypt from 'bcrypt';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const seedPath = path.join(rootDir, 'seed.sql');

try {
  const seedSql = await fs.readFile(seedPath, 'utf8');
  const passwordHash = await bcrypt.hash('password123', 10);
  await db.query(seedSql, [passwordHash, passwordHash, passwordHash]);
  console.log('Seed data inserted.');
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('No seed.sql found, nothing to seed.');
  } else {
    throw err;
  }
} finally {
  await db.end();
}
