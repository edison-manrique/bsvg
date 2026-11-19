/**
 * Formatea un array de bytes a una representación hexadecimal estilo visor binario (hexdump).
 */
export function formatHexDump(bytes, maxBytes = 1024) {
    if (!bytes || bytes.length === 0)
        return '(Vacío)';
    const lines = [];
    const limit = Math.min(bytes.length, maxBytes);
    for (let i = 0; i < limit; i += 16) {
        const offset = i.toString(16).padStart(6, '0');
        const chunk = bytes.subarray(i, Math.min(i + 16, limit));
        const hexParts = [];
        let asciiPart = '';
        for (let j = 0; j < 16; j++) {
            if (j < chunk.length) {
                const b = chunk[j];
                hexParts.push(b.toString(16).padStart(2, '0'));
                asciiPart += b >= 32 && b <= 126 ? String.fromCharCode(b) : '·';
            }
            else {
                hexParts.push('  ');
            }
        }
        const hex1 = hexParts.slice(0, 8).join(' ');
        const hex2 = hexParts.slice(8).join(' ');
        lines.push(`${offset}  ${hex1}  ${hex2}  |${asciiPart}|`);
    }
    if (bytes.length > maxBytes) {
        lines.push(`... (+${bytes.length - maxBytes} bytes restantes)`);
    }
    return lines.join('\n');
}
