
document.getElementById('export').addEventListener('click', async () => {
  const format = document.querySelector('input[name="format"]:checked')?.value || 'json';
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Processing...';

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'extract' }, response => {
      const jobs = response?.jobs;
      if (!jobs?.length) {
        statusEl.textContent = 'No jobs found.';
        return;
      }

      chrome.runtime.sendMessage({ type: 'process', format, jobs }, result => {
        if (result.success) {
          statusEl.textContent = result.message;
        } else {
          statusEl.textContent = '❌ ' + result.message;
        }
      });
    });
  });
});