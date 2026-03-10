import therapyApi from './therapyApi';

function getFilenameFromDisposition(disposition) {
    if (!disposition) return '';
    const match = disposition.match(/filename="?([^"]+)"?/i);
    return match?.[1] || '';
}

export async function downloadAnalysisReport(role, analysisId) {
    const response = await therapyApi.get(`/api/${role}/analyses/${analysisId}/report`, {
        responseType: 'blob'
    });

    const filename = getFilenameFromDisposition(response.headers['content-disposition']) || `analysis-report-${analysisId}.html`;
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}
