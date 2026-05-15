import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const databaseName = process.env.DB_NAME;

if (!databaseName) {
  throw new Error('DB_NAME is required. Add it to your .env file.');
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT || 3306),
  multipleStatements: true,
});

try {
  const schema = await fs.readFile(path.join(rootDir, 'db', 'db.sql'), 'utf8');

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await connection.query(`USE \`${databaseName}\``);
  await connection.query(schema);

  try {
    const seedSql = await fs.readFile(path.join(rootDir, 'db', 'seed.sql'), 'utf8');
    const passwordHash = await bcrypt.hash('password123', 10);
    await connection.query(seedSql, [passwordHash, passwordHash, passwordHash]);
    console.log('Seed data inserted.');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  console.log(`Database "${databaseName}" is ready.`);
} finally {
  await connection.end();
}
