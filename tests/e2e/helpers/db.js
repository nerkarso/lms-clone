import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';

function requireSafeTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Refusing to reset database because NODE_ENV is not test.');
  }

  if (!process.env.DB_NAME?.toLowerCase().includes('test')) {
    throw new Error('Refusing to reset database because DB_NAME does not include test.');
  }
}

export async function resetTestDatabase() {
  requireSafeTestDatabase();
  await resetUploads();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT || 3306),
    multipleStatements: true,
  });

  const databaseName = process.env.DB_NAME;
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await connection.query(`USE \`${databaseName}\``);

  await connection.query(`
    SET FOREIGN_KEY_CHECKS = 0;
    DROP TABLE IF EXISTS lessons;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS users;
    SET FOREIGN_KEY_CHECKS = 1;
  `);

  const dbSqlPath = path.resolve('db', 'db.sql');
  const dbSql = await fs.readFile(dbSqlPath, 'utf8');
  await connection.query(dbSql);

  const passwordHash = await bcrypt.hash('password123', 10);

  const seedSqlPath = path.resolve('db', 'seed.sql');
  const seedSql = await fs.readFile(seedSqlPath, 'utf8');
  await connection.query(seedSql, [passwordHash, passwordHash, passwordHash]);

  await connection.end();
}

async function resetUploads() {
  const uploadsDir = path.resolve('uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const entries = await fs.readdir(uploadsDir);

  await Promise.all(
    entries
      .filter((entry) => entry !== '.gitkeep')
      .map((entry) => fs.rm(path.join(uploadsDir, entry), { force: true }))
  );
}
