/**
 * Minimal CSV writer for the seller export.
 *
 * Everything is quoted and internal quotes doubled, which is the one set of
 * rules every spreadsheet (Excel, LibreOffice, Google Sheets) agrees on. A
 * UTF-8 BOM is prepended because Excel otherwise reads non-ASCII names as
 * mojibake.
 */

export function csvField(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvField).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
