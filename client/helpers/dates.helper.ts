function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const SAO_PAULO_TZ = "America/Sao_Paulo";

function formatDatePartsSaoPaulo(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function formatTimePartsSaoPaulo(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(", ", "");
}

export function formatDateToPtBr(
  input: string | Date | undefined | null,
): string {
  if (input === undefined || input === null) return "";

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return "";
    return formatDatePartsSaoPaulo(input);
  }

  const str = String(input).trim();
  if (!str) return "";

  const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return `${pad2(Number(slash[1]))}/${pad2(Number(slash[2]))}/${slash[3]}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [year, month, day] = str.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatDatePartsSaoPaulo(parsed);
  }

  return str;
}

export function formatTimePtBr(d: Date): string {
  if (isNaN(d.getTime())) return "";
  return formatTimePartsSaoPaulo(d);
}

export function formatDateTimePtBr(
  input: string | Date | undefined | null,
): string {
  if (input === undefined || input === null) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return `${formatDatePartsSaoPaulo(d)} ${formatTimePartsSaoPaulo(d)}`;
}

export function formatDateOrDateTimePtBr(
  input: string | Date | undefined | null,
): string {
  if (input === undefined || input === null) return "";
  if (input instanceof Date) {
    return formatDateTimePtBr(input);
  }
  const s = String(input).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return formatDateToPtBr(s);
  return formatDateTimePtBr(s);
}

export const parseYearMonthToDate = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

export function formatValidityDate(
  input: string | Date | undefined | null,
): string {
  if (input == null || input === "") return "-";
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? "-" : formatDateToPtBr(input);
  }
  const str = String(input).trim();
  if (!str) return "-";

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const out = formatDateToPtBr(str);
    return out || "-";
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    return formatDateToPtBr(str) || "-";
  }
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return "-";
  return formatDateToPtBr(parsed);
}
