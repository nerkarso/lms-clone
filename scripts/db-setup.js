import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../config/db.js';

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
  const schemaPath = path.join(rootDir, 'db/schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await connection.query(`USE \`${databaseName}\``);

  await db.query(schema);
  console.log(`Database "${databaseName}" schema applied.`);
} finally {
  await connection.end();
  await db.end();
}
