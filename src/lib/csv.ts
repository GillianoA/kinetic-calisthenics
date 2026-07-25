type CsvValue = string | number | boolean | null | undefined;

function protectSpreadsheetFormula(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function escapeCell(value: CsvValue) {
  const text = protectSpreadsheetFormula(value == null ? "" : String(value));
  return `"${text.replaceAll('"', '""')}"`;
}

export function rowsToCsv(rows: Record<string, CsvValue>[]) {
  if (rows.length === 0) return "";
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
  ].join("\r\n");
}
