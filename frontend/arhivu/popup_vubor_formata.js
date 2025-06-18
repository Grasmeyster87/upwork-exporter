//npm install --global web-ext  для упаковка в .XPI
// web-ext build  - команда для создания дополнения для браузера в формате .XPI


document.getElementById('export').addEventListener('click', async () => {
  const format = document.querySelector('input[name="format"]:checked').value;

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: extractAndDownload,
      args: [format]
    });
  });

  function extractAndDownload(format) {
    function extractJobs() {
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

    const jobs = extractJobs();
    const fileName = `upwork_jobs_export.${format}`;
    let blob;

    if (format === 'json') {
      blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
    } else if (format === 'csv') {
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
  }
});
