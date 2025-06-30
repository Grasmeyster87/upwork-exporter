// content.js
// Эти функции будут вызываться из background.js
function extractJobsFromPage() {
    // ... (код функции остался прежним)
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

function getTotalPagesFromDOM() {
    // ... (код функции остался прежним)
    const el = document.querySelector('[data-test="pagination-mobile"]');
    if (!el) return 1;

    const match = el.textContent.match(/of (\d+)/);
    return match ? parseInt(match[1], 10) : 1;
}

// *** АКТИВИРУЙТЕ И ИЗМЕНИТЕ ЭТОТ СЛУШАТЕЛЬ ***
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'extract-data-from-page') { // ИЗМЕНЕНО: теперь слушаем новое сообщение от background.js
        const jobs = extractJobsFromPage();
        const totalPages = getTotalPagesFromDOM(); // Получаем общее количество страниц
        sendResponse({ jobs, totalPages }); // Отправляем ОБА значения обратно
        return true; // Важно для асинхронного ответа
    }
});

/*
// Предыдущие закомментированные блоки можно оставить как есть или удалить,
// они не влияют на текущую логику.
*/