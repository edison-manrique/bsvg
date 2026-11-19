/**
 * Descarga datos en el navegador como un archivo.
 */
export function downloadFile(data, mimeType, filename) {
    const blob = typeof data === 'string'
        ? new Blob([data], { type: mimeType })
        : new Blob([new Uint8Array(data)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
