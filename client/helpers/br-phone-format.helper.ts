const MAX_BR_PHONE_DIGITS = 11;

export function brPhoneDigitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, 13);
}

function stripBrazilCountryCode(digits: string): string {
  if (digits.length >= 12 && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

export function formatBrPhoneMask(digitsOrRaw: string): string {
  const digits = stripBrazilCountryCode(brPhoneDigitsOnly(digitsOrRaw));
  if (!digits) return "";
  if (digits.length <= 2) return digits.length === 2 ? `(${digits})` : digits;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatBrPhoneForDisplay(
  phone: string | null | undefined,
): string {
  if (phone == null || !String(phone).trim()) return "—";
  const digits = stripBrazilCountryCode(brPhoneDigitsOnly(String(phone)));
  if (digits.length < 10) return String(phone).trim();
  return formatBrPhoneMask(digits);
}

export function brPhoneInputValueFromStored(
  phone: string | null | undefined,
): string {
  if (phone == null || !String(phone).trim()) return "";
  const digits = stripBrazilCountryCode(brPhoneDigitsOnly(String(phone)));
  if (!digits) return String(phone).trim();
  return formatBrPhoneMask(digits);
}

export function brPhonePayloadFromInput(value: string): string | null {
  const digits = stripBrazilCountryCode(brPhoneDigitsOnly(value));
  if (!digits) return null;
  if (digits.length < 10 || digits.length > MAX_BR_PHONE_DIGITS) return null;
  return digits;
}
