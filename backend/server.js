// cd upwork-job-exporter/backend
// npm init -y
// npm install express sqlite3 cors sqlite dotenv firebase-admin
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');

const { db: firestore } = require('./firebaseAdmin'); // ✅ перейменували Firestore

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

let db_SQLite;

const initDb = async () => {
  db_SQLite = await open({
    filename: './database/jobs.db',
    driver: sqlite3.Database
  });

  await db_SQLite.exec(`
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
};

app.post('/api/jobs', async (req, res) => {
  const jobs = req.body;
  try {
    const insertStmt = `INSERT INTO jobs (title, url, posted, price, summary, technologies) VALUES (?, ?, ?, ?, ?, ?)`;

    for (const job of jobs) {
      await db_SQLite.run(insertStmt, [
        job.title, job.url, job.posted, job.price, job.summary, job.technologies
      ]);
    }

    res.status(200).json({ message: 'Jobs saved to SQLite DB' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save jobs to SQLite' });
  }
});

app.post('/api/jobs/firebase', async (req, res) => {
  try {
    const jobs = req.body;

    if (!Array.isArray(jobs)) {
      return res.status(400).json({ error: 'Expected an array of job objects' });
    }

    const col = firestore.collection('jobs'); // ✅ це Firestore, не SQLite

    for (const job of jobs) {
      if (
        !job.title || !job.url || !job.posted ||
        !job.price || !job.summary || !job.technologies
      ) {
        console.warn("⛔ Пропущено job через відсутні поля:", job);
        continue;
      }

      const doc = {
        title: String(job.title),
        url: String(job.url),
        posted: String(job.posted),
        price: String(job.price),
        summary: String(job.summary),
        technologies: String(job.technologies)
      };

      console.log("➡️ Додаю документ до Firebase:", doc);

      await col.add(doc);
    }

    res.status(200).json({ message: 'Jobs saved to Firebase' });

  } catch (err) {
    console.error('❌ Firebase Error:', err.message);
    res.status(500).json({ error: 'Failed to save to Firebase', details: err.message });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});

