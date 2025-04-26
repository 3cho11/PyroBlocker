// Add an export button to the page for testing purposes
const exportButton = document.getElementById('export-btn');

// Handle click event to export the data
exportButton.addEventListener('click', () => {
    chrome.storage.local.get(null, (data) => {
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create a download link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'page-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Revoke the object URL
        URL.revokeObjectURL(url);
    });
});
