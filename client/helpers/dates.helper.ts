export function formatDateToPtBr(
  input: string | Date | undefined | null,
): string {
  if (!input) return "";

  if (input instanceof Date && !isNaN(input.getTime())) {
    const iso = input.toISOString().split("T")[0];
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  }

  const str = String(input).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [year, month, day] = str.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  }

  return str;
}

export const parseYearMonthToDate = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

/**
 * Format a date that may be only year/month/day (no time).
 * Returns "-" for null, undefined, or invalid date strings to avoid "Invalid Date" in tables.
 */
export function formatValidityDate(
  input: string | Date | undefined | null,
): string {
  if (input == null || input === "") return "-";
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? "-" : formatDateToPtBr(input);
  }
  const str = String(input).trim();
  if (!str) return "-";
  // YYYY-MM-DD (with optional time part)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const numY = Number(y);
    const numM = Number(m);
    const numD = Number(d);
    if (numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
      return `${String(numD).padStart(2, "0")}/${String(numM).padStart(2, "0")}/${numY}`;
    }
  }
  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str;
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? "-" : formatDateToPtBr(parsed);
}
