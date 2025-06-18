// cd upwork-job-exporter/backend
// npm init -y
// npm install express sqlite3 cors sqlite

const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');

const app = express();
const PORT = 3003;

app.use(cors());
// app.use(express.json());
app.use(express.json({ limit: '5mb' })); // або '10mb' — залежно від кількості вакансій


let db;

const initDb = async () => {
  db = await open({
    filename: './database/jobs.db',
    driver: sqlite3.Database
  });

  await db.exec(`
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
      await db.run(insertStmt, [job.title, job.url, job.posted, job.price, job.summary, job.technologies]);
    }

    res.status(200).json({ message: 'Jobs saved to DB' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save jobs' });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
