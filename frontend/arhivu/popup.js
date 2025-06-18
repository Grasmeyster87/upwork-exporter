
document.getElementById('export').addEventListener('click', async () => {
  const format = document.querySelector('input[name="format"]:checked')?.value || 'json';
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Processing...';

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: extractJobsFromPage
    }).then(async (results) => {
      const jobs = results[0].result;
      console.log('Extracted jobs:', jobs);

      if (!jobs?.length) {
        statusEl.textContent = 'No jobs found.';
        return;
      }

      if (format === 'save-db') {
        try {
          const response = await fetch('http://localhost:3003/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobs)
          });

          if (!response.ok) throw new Error('Server error');

          statusEl.textContent = '✅ Jobs saved to database';
          console.log('✅ Successfully saved to DB');
        } catch (err) {
          statusEl.textContent = `❌ ${err.message}`;
          console.error('❌ Failed to save to DB:', err);
        }
      } else {
        const fileName = `upwork_jobs_export.${format}`;
        let blob;

        if (format === 'json') {
          blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
        } else {
          const headers = Object.keys(jobs[0]);
          const csv = [headers.join(",")].concat(
            jobs.map(row => headers.map(h => `"${(row[h] || "").replace(/"/g, '""')}"`).join(","))
          ).join("\n");

          blob = new Blob([csv], { type: 'text/csv' });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        statusEl.textContent = `📁 File exported as ${format.toUpperCase()}`;
      }
    }).catch(err => {
      statusEl.textContent = '❌ Script execution failed';
      console.error('❌ Scripting error:', err);
    });
  });
});

function extractJobsFromPage() {
  const jobs = document.querySelectorAll('[data-test="JobTile"]');
  const results = [];

  jobs.forEach(job => {
    const titleAnchor = job.querySelector('h2 a.air3-link');
    const title = titleAnchor?.innerText.trim() || '';
    const url = titleAnchor ? 'https://www.upwork.com' + titleAnchor.getAttribute('href') : '';
    const posted = job.querySelector('[data-test="job-pubilshed-date"] span:nth-child(2)')?.innerText.trim() || '';
    const price = job.querySelector('[data-test="is-fixed-price"] strong:last-child')?.innerText.trim() || '';
    const summary = job.querySelector('[data-test="UpCLineClamp JobDescription"] p')?.innerText.trim() || '';
    const technologies = Array.from(job.querySelectorAll('[data-test="token"] span'))
      .map(el => el.innerText.trim()).join(' | ');

    results.push({ title, url, posted, price, summary, technologies });
  });

  return results;
}