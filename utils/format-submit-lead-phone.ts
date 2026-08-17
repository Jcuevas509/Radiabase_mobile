const PHONE_PATTERN = /^\(\d{3}\)\s\d{3}-\d{4}$/;

/**
 * Formats digits into the Submit Lead phone mask (555) 555-5555.
 */
export function formatSubmitLeadPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) {
    return '';
  }
  if (digits.length < 4) {
    return `(${digits}`;
  }
  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Returns true when the phone matches the web Submit Lead format.
 */
export function isValidSubmitLeadPhone(value: string): boolean {
  return PHONE_PATTERN.test(value);
}

/**
 * Strips a formatted phone down to the 10 digits the API stores.
 */
export function toSubmitLeadPhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}
