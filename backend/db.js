const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/jobs.db');
const db = new sqlite3.Database(dbPath);

// Создание таблицы при первом запуске
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      url TEXT,
      posted TEXT,
      price TEXT,
      summary TEXT,
      technologies TEXT
    )
  `);
});

module.exports = db;