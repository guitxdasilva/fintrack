export function parseBrazilianDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();

  let match = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    let year = parseInt(match[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const d = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export function parseBrazilianAmount(amountStr: string): number | null {
  let cleaned = amountStr
    .trim()
    .replace(/^R\$\s*/, "")
    .replace(/\s/g, "");

  const hasCommaDec = /,\d{1,2}$/.test(cleaned);
  const hasDotDec = /\.\d{1,2}$/.test(cleaned);

  if (hasCommaDec) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasDotDec && cleaned.includes(",")) {
    cleaned = cleaned.replace(/,/g, "");
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function splitCsvLines(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function parseCsvLine(line: string, separator = ","): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

export function detectCsvSeparator(content: string): string {
  const firstLines = content.split(/\r?\n/).slice(0, 5).join("\n");

  const semicolonCount = (firstLines.match(/;/g) || []).length;
  const commaCount = (firstLines.match(/,/g) || []).length;
  const tabCount = (firstLines.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) return ";";
  if (tabCount > commaCount && tabCount > semicolonCount) return "\t";
  return ",";
}
