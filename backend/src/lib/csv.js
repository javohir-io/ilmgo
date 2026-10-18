/**
 * CSV helpers. Cells that start with a spreadsheet formula trigger
 * (= + - @ tab CR) are prefixed with an apostrophe so Excel/Sheets treat
 * them as text (CSV/formula injection guard).
 */

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * @param {string[]} headers column titles
 * @param {Array<Array<*>>} rows
 * @returns {string} CRLF-separated CSV with a trailing newline
 */
function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n') + '\r\n';
}

module.exports = { escapeCell, toCsv };
