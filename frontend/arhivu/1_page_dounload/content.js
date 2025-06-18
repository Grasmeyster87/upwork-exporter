
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'extract') {
        const jobs = extractJobsFromPage();
        sendResponse({ jobs });
    }
});