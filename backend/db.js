// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');

// const dbPath = path.join(__dirname, '../database/jobs.db');
// const db = new sqlite3.Database(dbPath);

// // Создание таблицы при первом запуске
// db.serialize(() => {
//     db.run(`
//     CREATE TABLE IF NOT EXISTS jobs (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       title TEXT,
//       url TEXT,
//       posted TEXT,
//       price TEXT,
//       summary TEXT,
//       technologies TEXT
//     )
//   `);
// });

// module.exports = db;

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Путь к директории и базе данных
const dbDir = path.join(__dirname, './database');
const dbPath = path.join(dbDir, 'jobs.db');

// Проверяем, существует ли директория. Если нет — создаем.
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Создаем подключение к базе данных (создаст файл, если его нет)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message);
  } else {
    console.log('Успешное подключение к базе данных.');
  }
});

// Создаем таблицу, если она не существует
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