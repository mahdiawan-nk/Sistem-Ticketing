export const INDO_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const CATEGORIES = [
  'Semua',
  'Jaringan & Internet',
  'Hardware & Komputer',
  'Sistem & Aplikasi',
  'Printer & Scanner',
  'Akun & Akses Email',
  'Keamanan Siber & Antivirus',
  'Telepon & PABX',
];

export interface WorkdayInfo {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Senin, Selasa, dll.
  dayNumber: number; // 1..31
  formattedShort: string; // Senin, 05 Okt 2026
}

/**
 * Returns strictly weekdays (Monday to Friday) in the specified month and year.
 */
export function getWorkdaysInMonth(year: number, month: number): WorkdayInfo[] {
  const days: WorkdayInfo[] = [];
  const totalDays = new Date(year, month, 0).getDate();

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const yyyy = year.toString();
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dayName = INDO_DAYS[dayOfWeek];
      const monthShort = INDO_MONTHS[month - 1].substring(0, 3);
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayName,
        dayNumber: day,
        formattedShort: `${dayName}, ${dd} ${monthShort} ${yyyy}`,
      });
    }
  }
  return days;
}

export function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  const dayName = INDO_DAYS[d.getDay()] || '';
  const monthName = INDO_MONTHS[month] || '';
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} Menit`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours} Jam ${rem} Menit` : `${hours} Jam`;
}
