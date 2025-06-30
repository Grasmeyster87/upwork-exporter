// popup.js

// Функция для скачивания JSON
function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Функция для конвертации вакансий в CSV и скачивания
function downloadCsv(jobs, filename) {
    if (!jobs || jobs.length === 0) {
        return;
    }

    // Получаем заголовки из первого объекта вакансии
    const headers = Object.keys(jobs[0]);
    const csvRows = [];

    // Добавляем строку заголовков
    csvRows.push(headers.join(','));

    // Добавляем строки данных
    for (const job of jobs) {
        const values = headers.map(header => {
            const value = job[header];
            // Обрабатываем запятые и кавычки в значениях
            return typeof value === 'string' && value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// Слушатель для сообщений ОТ background.js (в частности, для parsing-finished)
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    const statusEl = document.getElementById('status');
    if (message.type === 'parsing-finished') {
        if (message.success) {
            statusEl.textContent = message.message;

            const { jobs, format } = message;

            if (jobs && jobs.length > 0) {
                if (format === 'json') {
                    downloadJson(jobs, 'upwork_jobs.json');
                    statusEl.textContent += ' (JSON скачан)';
                } else if (format === 'csv') {
                    downloadCsv(jobs, 'upwork_jobs.csv');
                    statusEl.textContent += ' (CSV скачан)';
                } else if (format === 'save-db' || format === 'save-firebase') {
                    // Отправляем еще одно сообщение ОБРАТНО в background.js для выполнения fetch-запросов
                    statusEl.textContent = 'Отправка данных на сервер...';
                    try {
                        const saveResult = await chrome.runtime.sendMessage({
                            type: 'process', // Используем существующий тип 'process' для сохранения
                            format: format,
                            jobs: jobs
                        });
                        if (saveResult.success) {
                            statusEl.textContent = saveResult.message;
                        } else {
                            statusEl.textContent = '❌ ' + saveResult.message;
                        }
                    } catch (error) {
                        statusEl.textContent = '❌ Ошибка при отправке данных на сервер: ' + error.message;
                        console.error('Ошибка при отправке данных на сервер:', error);
                    }
                }
            } else {
                statusEl.textContent = message.message + ' (Вакансии не найдены для сохранения/скачивания).';
            }
        } else {
            statusEl.textContent = '❌ ' + message.message;
        }
    }
});

// Существующий слушатель клика по кнопке экспорта (он запускает весь процесс)
document.getElementById('export').addEventListener('click', async () => {
    const format = document.querySelector('input[name="format"]:checked')?.value || 'json';
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'Обработка...';

    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
        if (!tabs[0]?.url.startsWith("https://www.upwork.com/nx/search/jobs/")) {
            statusEl.textContent = 'Пожалуйста, перейдите на страницу поиска вакансий Upwork.';
            return;
        }

        try {
            // Отправляем сообщение в background скрипт для запуска многостраничного процесса
            const result = await chrome.runtime.sendMessage({
                type: 'start-multi-page-extract',
                format: format,
                tabId: tabs[0].id,
                url: tabs[0].url // Передаем начальный URL
            });

            // Этот результат относится к начальному вызову 'start-multi-page-extract'.
            // Окончательное обновление статуса будет приходить через слушатель 'parsing-finished'.
            if (!result.success) { // Если сразу произошла ошибка при запуске парсинга
                statusEl.textContent = '❌ ' + result.message;
            } else {
                // Изначальное сообщение об успехе, фактический статус парсинга будет обновлен слушателем
                statusEl.textContent = 'Парсинг запущен...';
            }

        } catch (error) {
            statusEl.textContent = '❌ Ошибка при запуске парсинга: ' + error.message;
            console.error('Ошибка при запуске парсинга из popup:', error);
        }
    });
});