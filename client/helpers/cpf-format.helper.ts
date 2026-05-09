const MAX_CPF_DIGITS = 11;

export function cpfDigitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, MAX_CPF_DIGITS);
}

export function formatCpfMask(digitsOrRaw: string): string {
  const d = cpfDigitsOnly(digitsOrRaw);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function cpfPayloadFromInput(value: string): string | null {
  const d = cpfDigitsOnly(value);
  return d.length ? d : null;
}

export function formatCpfForDisplay(cpf: string | null | undefined): string {
  if (cpf == null || !String(cpf).trim()) return "—";
  const d = cpfDigitsOnly(String(cpf));
  if (d.length === MAX_CPF_DIGITS) return formatCpfMask(d);
  return String(cpf).trim();
}

export function cpfInputValueFromStored(
  cpf: string | null | undefined,
): string {
  if (cpf == null || !String(cpf).trim()) return "";
  const d = cpfDigitsOnly(String(cpf));
  if (!d) return String(cpf).trim();
  return formatCpfMask(d);
}
