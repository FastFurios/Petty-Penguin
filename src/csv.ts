// Sniffs the delimiter from the first line: ';' only if that line has
// semicolons but no (unquoted) commas, otherwise defaults to ','.
export function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] ?? '';
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;
  for (const ch of firstLine) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (ch === ',') commas += 1;
    else if (ch === ';') semicolons += 1;
  }
  return commas === 0 && semicolons > 0 ? ';' : ',';
}

export function parseCsv(text: string, delimiter: string = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === delimiter) {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\r') {
      i += 1;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function needsQuoting(s: string): boolean {
  return /[",\r\n]/.test(s);
}

function quoteField(s: string): string {
  if (!needsQuoting(s)) return s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export function stringifyCsv(rows: string[][]): string {
  return rows.map((r) => r.map(quoteField).join(',')).join('\n') + '\n';
}
