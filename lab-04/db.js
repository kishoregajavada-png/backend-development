
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbPath = require('path').join(__dirname, 'users.db');

const initializeDB = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      name TEXT,
      password TEXT
    );
  `);

  return db;
};

module.exports = initializeDB;
