
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'process') {
        const { format, jobs } = message;

        if (format === 'save-db') {
            fetch('http://localhost:3003/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobs)
            })
                .then(res => res.ok
                    ? sendResponse({ success: true, message: '✅ Jobs saved to database' })
                    : sendResponse({ success: false, message: '❌ Server error' }))
                .catch(err => sendResponse({ success: false, message: err.message }));

            return true; // <---- ВАЖЛИВО!
        }

        // Збереження в файл
        try {
            const fileName = `upwork_jobs.${format}`;
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

            const reader = new FileReader();
            reader.onload = () => {
                chrome.downloads.download({
                    url: reader.result,
                    filename: fileName,
                    saveAs: true
                }, () => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, message: chrome.runtime.lastError.message });
                    } else {
                        sendResponse({ success: true, message: `📁 Saved as ${format.toUpperCase()}` });
                    }
                });
            };
            reader.readAsDataURL(blob);

            return true; // <---- ВАЖЛИВО!
        } catch (err) {
            sendResponse({ success: false, message: err.message });
        }
    }
});
