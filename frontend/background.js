//------------------------------------------------ основной код

// Глобальные переменные для хранения собранных вакансий
let allCollectedJobs = [];
let currentParsingTabId = null;
let currentParsingFormat = 'json';
let initialUrl = ''; // Для хранения базового URL без параметров страницы

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 1. Обработка начального запроса из popup.js
    if (message.type === 'start-multi-page-extract') {
        currentParsingTabId = message.tabId;
        currentParsingFormat = message.format;

        // Создаем объект URL для удобной работы с параметрами
        const urlObj = new URL(message.url);

        // Устанавливаем или обновляем параметр per_page
        urlObj.searchParams.set('per_page', '50');
        // Удаляем существующий параметр page, чтобы initialUrl всегда начинался с чистой базы
        urlObj.searchParams.delete('page');

        // Сохраняем базовый URL для дальнейшей навигации по страницам
        initialUrl = urlObj.toString();
        // Upwork может добавлять '&page=1' автоматически, поэтому мы будем его добавлять сами,
        // чтобы контролировать URL.
        // Например, https://www.upwork.com/nx/search/jobs/?q=parsing%20scraping&sort=recency&t=1&per_page=50

        allCollectedJobs = []; // Очищаем список перед новым парсингом

        // Начинаем парсинг с первой страницы, явно указывая ее
        parsePage(1);
        sendResponse({ success: true, message: 'Начинаем многостраничный парсинг...' });
        return true;
    }

    // 2. Обработка полученных данных с одной страницы (из content.js)
    if (message.type === 'page-data-extracted') {
        const { jobs, totalPages, currentPage } = message;
        allCollectedJobs.push(...jobs);

        console.log(`[Background] Страница ${currentPage} обработана. Всего собрано: ${allCollectedJobs.length} вакансий.`);

        if (currentPage < totalPages) {
            // Переходим на следующую страницу
            parsePage(currentPage + 1);
        } else {
            // Все страницы обработаны, теперь обрабатываем все собранные вакансии
            processAllCollectedJobs(currentParsingFormat, allCollectedJobs);
            // Сбрасываем состояние после завершения
            allCollectedJobs = [];
            currentParsingTabId = null;
            initialUrl = '';
            // Фоновый скрипт не может напрямую отправлять сообщения в popup,
            // поэтому popup должен отслеживать статус через свои запросы или
            // мы можем отправить сообщение для уведомления popup (см. ниже).
        }
        sendResponse({ success: true }); // Подтверждаем получение данных
        return true; // Важно для асинхронных ответов
    }

    // 3. Обработка данных (сохранение в Firebase, SQLite или файл) -
    //    Это будет вызываться после сбора всех данных.
    if (message.type === 'process') {
        const { format, jobs } = message;

        if (format === 'save-firebase') {
            fetch('http://localhost:3003/api/jobs/firebase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobs)
            })
                .then(res => res.ok
                    ? sendResponse({ success: true, message: '✅ Вакансии сохранены в Firebase' })
                    : sendResponse({ success: false, message: '❌ Ошибка сервера при сохранении в Firebase' }))
                .catch(err => sendResponse({ success: false, message: '❌ Ошибка при отправке в Firebase: ' + err.message }));
            return true;
        }

        if (format === 'save-db') {
            fetch('http://localhost:3003/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobs)
            })
                .then(res => res.ok
                    ? sendResponse({ success: true, message: '✅ Вакансии сохранены в SQLite' })
                    : sendResponse({ success: false, message: '❌ Ошибка сервера при сохранении в SQLite' }))
                .catch(err => sendResponse({ success: false, message: '❌ Ошибка при отправке в SQLite: ' + err.message }));
            return true;
        }

        // Сохранение в файл (JSON/CSV)
        try {
            const fileName = `upwork_jobs.${format}`;
            let blob;

            if (format === 'json') {
                blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
            } else { // CSV
                if (!jobs.length) {
                    sendResponse({ success: false, message: 'Нет данных для экспорта в CSV.' });
                    return false;
                }
                const headers = Object.keys(jobs[0]);
                const csv = [headers.join(",")].concat(
                    jobs.map(row => headers.map(h => `"${(row[h] || "").replace(/"/g, '""')}"`).join(","))
                ).join("\n");
                blob = new Blob([csv], { type: 'text/csv' });
            }

            const reader = new FileReader();
            reader.onload = () => {
                chrome.downloads.download({
                    url: reader.result,
                    filename: fileName,
                    saveAs: true
                }, () => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, message: 'Ошибка загрузки файла: ' + chrome.runtime.lastError.message });
                    } else {
                        sendResponse({ success: true, message: `📁 Сохранено как ${format.toUpperCase()}` });
                    }
                });
            };
            reader.readAsDataURL(blob);
            return true; // Асинхронная операция
        } catch (err) {
            sendResponse({ success: false, message: 'Ошибка при сохранении файла: ' + err.message });
        }
    }
});

// Функция для обработки всех собранных вакансий после завершения парсинга
async function processAllCollectedJobs(format, jobs) {
    if (jobs.length === 0) {
        // Уведомляем popup, что работы не найдены, если нужно
        chrome.tabs.sendMessage(currentParsingTabId, {
            type: 'parsing-finished',
            success: false,
            message: 'Вакансии не найдены после многостраничного парсинга.'
        }).catch(() => { }); // catch, если вкладка закрыта
        return;
    }

    // Отправляем собранные данные обратно в фоновый скрипт для обработки
    // или сразу вызываем логику сохранения
    chrome.runtime.sendMessage({ type: 'process', format, jobs }, response => {
        if (response.success) {
            console.log('[Background] Final processing successful:', response.message);
            // Уведомляем popup о завершении и результате
            chrome.tabs.sendMessage(currentParsingTabId, {
                type: 'parsing-finished',
                success: true,
                message: response.message
            }).catch(() => { });
        } else {
            console.error('[Background] Final processing failed:', response.message);
            // Уведомляем popup об ошибке
            chrome.tabs.sendMessage(currentParsingTabId, {
                type: 'parsing-finished',
                success: false,
                message: response.message
            }).catch(() => { });
        }
    });
}


// Функция для перехода на страницу и извлечения данных
async function parsePage(pageNum) {
    const urlObj = new URL(initialUrl);
    urlObj.searchParams.set('page', pageNum.toString());
    const targetUrl = urlObj.toString();
    console.log(`[Background] Переходим на страницу: ${targetUrl}`);

    return new Promise((resolve, reject) => {
        const listener = (tabId, changeInfo, tab) => {
            console.log(`[Background] Обновление вкладки ${tabId}: ${changeInfo.status}, URL: ${tab.url}`);

            // --- СУЩЕСТВУЮЩИЕ ДЕБАГ ЛОГИ ---
            console.log(`[Background DEBUG] tabId: ${tabId}, currentParsingTabId: ${currentParsingTabId}`);
            console.log(`[Background DEBUG] changeInfo.status: ${changeInfo.status}, expected: 'complete'`);
            console.log(`[Background DEBUG] tab.url: ${tab.url}`);
            console.log(`[Background DEBUG] targetUrl: ${targetUrl}`);
            // console.log(`[Background DEBUG] URL startsWith match: ${tab.url.startsWith(targetUrl)}`); // Эту строку можно убрать, так как она не учитывает нормализацию

            // --- НОВОЕ ДОБАВЛЕНИЕ ДЛЯ НОРМАЛИЗАЦИИ ---
            let normalizedTargetUrl = targetUrl;
            // Проверяем, если в targetUrl есть '+' и tab.url использует '%20'
            // Более надежный способ - всегда нормализовать URL перед сравнением.
            if (normalizedTargetUrl.includes('+') && tab.url.includes('%20')) {
                normalizedTargetUrl = normalizedTargetUrl.replace(/\+/g, '%20');
            }
            console.log(`[Background DEBUG] Normalized targetUrl: ${normalizedTargetUrl}`);
            console.log(`[Background DEBUG] URL startsWith match (normalized): ${tab.url.startsWith(normalizedTargetUrl)}`);
            // --- КОНЕЦ НОВОГО ДОБАВЛЕНИЯ ---


            // Изменено: теперь используем normalizedTargetUrl для сравнения
            if (tabId === currentParsingTabId && changeInfo.status === 'complete' && tab.url.startsWith(normalizedTargetUrl)) {
                chrome.tabs.onUpdated.removeListener(listener);
                console.log(`[Background] Страница ${pageNum} полностью загружена: ${normalizedTargetUrl}.`); // Изменил здесь тоже
                console.log("[Background] ПЕРЕД ВЫЗОВОМ executeScript БЛОКА.");

                (async () => {
                    console.log("[Background] ВНУТРИ executeScript БЛОКА.");
                    try {
                        console.log(`[Background] Попытка извлечения данных со страницы ${pageNum} через content.js...`);
                        
                        // *** ИЗМЕНЕНИЕ ЗДЕСЬ: УДАЛИТЕ СТРОКУ 'function: extractJobsFromPage' ***
                        const injectionResults = await chrome.scripting.executeScript({
                            target: { tabId: currentParsingTabId },
                            files: ['content.js'] // ОСТАВЬТЕ ТОЛЬКО ЭТУ СТРОКУ для инъекции файла
                        });

                        // После инъекции content.js, отправляем ему сообщение для выполнения функций
                        // Обратите внимание: content.js должен иметь слушатель для этого сообщения!
                        const results = await chrome.tabs.sendMessage(currentParsingTabId, {
                            type: 'extract-data-from-page' // Уникальный тип сообщения, который content.js будет слушать
                        });

                        // console.log("[Background] Результаты из content.js:", results); // Для дополнительного дебага

                        if (results && results.jobs && results.totalPages !== undefined) {
                            allCollectedJobs.push(...results.jobs);
                            totalPages = results.totalPages; // Обновляем общее количество страниц

                            console.log(`[Background] Собрано ${results.jobs.length} вакансий на странице ${pageNum}. Всего вакансий: ${allCollectedJobs.length}. Всего страниц: ${totalPages}`);

                            // Переходим к следующей странице, если есть
                            if (pageNum < totalPages && pageNum < 5) { // Ограничение на 5 страниц для теста
                                console.log(`[Background] Переходим на страницу ${pageNum + 1} из ${totalPages}...`);
                                await parsePage(pageNum + 1, totalPages);
                            } else {
                                console.log("[Background] Парсинг завершен.");
                                console.log("[Background] Всего собрано вакансий:", allCollectedJobs.length);
                                // Отправляем все собранные данные обратно в popup.js
                                const finalMessage = await chrome.runtime.sendMessage({
                                    type: 'parsing-finished',
                                    success: true,
                                    message: `✅ Парсинг завершен. Собрано ${allCollectedJobs.length} вакансий.`,
                                    jobs: allCollectedJobs, // Передаем все собранные вакансии
                                    format: currentParsingFormat
                                });
                                // console.log("Final message response from popup:", finalMessage);
                                resolve();
                            }
                        } else {
                            console.error(`[Background] content.js выполнился, но не вернул ожидаемых данных на странице ${pageNum}. Результат:`, results);
                            reject(new Error(`content.js не вернул данных на странице ${pageNum}.`));
                        }

                    } catch (error) {
                        console.error(`[Background] Ошибка при инъекции/выполнении content.js на странице ${pageNum}:`, error);
                        chrome.tabs.sendMessage(currentParsingTabId, {
                            type: 'parsing-finished',
                            success: false,
                            message: `Ошибка при парсинге страницы ${pageNum}: ${error.message}`
                        }).catch(() => { }); // catch для предотвращения ошибок, если popup закрыт
                        reject(error);
                    }
                })(); // Немедленный вызов асинхронной функции
            }
            // else if (tabId === currentParsingTabId && changeInfo.status === 'loading') {
            //     console.log(`[Background] Загрузка страницы ${pageNum} (статус: loading)`);
            // }\
        };

        chrome.tabs.onUpdated.addListener(listener);
        chrome.tabs.update(currentParsingTabId, { url: targetUrl }).catch(err => {
            console.error("[Background] Ошибка при обновлении вкладки:", err);
            reject(err);
        });
    });
}