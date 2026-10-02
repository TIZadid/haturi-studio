const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const dotDate = (d: Date) => `${d.getFullYear()}.${MONTHS[d.getMonth()]}`;
export const bracket = (s: string) => `[${s.toUpperCase()}]`;
export const pad2 = (n: number) => String(n).padStart(2, '0');
