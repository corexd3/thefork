/**
 * Parse Spanish date strings to ISO format (YYYY-MM-DD)
 * Handles formats like "3 de diciembre", "21 de noviembre"
 */

const MONTHS_ES: { [key: string]: string } = {
  'enero': '01',
  'febrero': '02',
  'marzo': '03',
  'abril': '04',
  'mayo': '05',
  'junio': '06',
  'julio': '07',
  'agosto': '08',
  'septiembre': '09',
  'octubre': '10',
  'noviembre': '11',
  'diciembre': '12'
};

export function parseSpanishDate(dateStr: string): string | null {
  // Already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try to parse "3 de diciembre", "21 de noviembre", etc.
  const match = dateStr.match(/(\d{1,2})\s+de\s+(\w+)/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase();
    const month = MONTHS_ES[monthName];

    if (month) {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${month}-${day}`;
    }
  }

  // Try to parse just month name "diciembre"
  const monthName = dateStr.toLowerCase().trim();
  if (MONTHS_ES[monthName]) {
    // Can't determine day, return null
    console.warn('Date string contains only month name, no day:', dateStr);
    return null;
  }

  return null;
}
