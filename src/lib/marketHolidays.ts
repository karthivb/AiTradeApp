// ============================================================================
// US Stock & Options Market (NYSE / NASDAQ) Holiday & Open Trading Day Engine
// ============================================================================

export interface MarketHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

function formatYmd(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Adjusts a fixed-date US holiday for weekend observation:
 * - Saturday -> observed Friday
 * - Sunday -> observed Monday
 */
function getObservedDate(year: number, monthIndex: number, day: number): Date {
  const dt = new Date(year, monthIndex, day);
  const dow = dt.getDay();
  if (dow === 6) {
    return new Date(year, monthIndex, day - 1);
  }
  if (dow === 0) {
    return new Date(year, monthIndex, day + 1);
  }
  return dt;
}

/**
 * Returns the Nth occurrence (1-based) of a weekday (0=Sun..6=Sat) in a given month.
 */
function getNthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekday: number,
  n: number
): Date {
  const first = new Date(year, monthIndex, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(year, monthIndex, day);
}

/**
 * Returns the last occurrence of a weekday (0=Sun..6=Sat) in a given month.
 */
function getLastWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekday: number
): Date {
  const last = new Date(year, monthIndex + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, monthIndex, last.getDate() - offset);
}

/**
 * Anonymous Gregorian Easter algorithm -> returns Good Friday (Easter Sunday - 2 days).
 */
function getGoodFriday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day - 2);
}

const yearCache = new Map<number, Record<string, string>>();

/**
 * Returns a map of YYYY-MM-DD -> Holiday Name for all full NYSE/NASDAQ market closures in `year`.
 */
export function getMarketHolidaysForYear(year: number): Record<string, string> {
  const cached = yearCache.get(year);
  if (cached) return cached;

  const holidays: Record<string, string> = {};
  const add = (dt: Date, name: string) => {
    if (dt.getFullYear() === year) {
      holidays[formatYmd(dt.getFullYear(), dt.getMonth(), dt.getDate())] = name;
    }
  };

  // 1. New Year's Day (Jan 1; if Sunday -> Jan 2. Note: if Jan 1 is Sat, NYSE does not close Dec 31 of prior year, only if Jan 1 is Sun)
  const jan1 = new Date(year, 0, 1);
  if (jan1.getDay() === 0) {
    add(new Date(year, 0, 2), "New Year's Day (Observed)");
  } else if (jan1.getDay() !== 6) {
    add(jan1, "New Year's Day");
  }

  // 2. Martin Luther King Jr. Day (3rd Monday in Jan)
  add(getNthWeekdayOfMonth(year, 0, 1, 3), 'MLK Jr. Day');

  // 3. Presidents' Day (3rd Monday in Feb)
  add(getNthWeekdayOfMonth(year, 1, 1, 3), "Presidents' Day");

  // 4. Good Friday (Friday before Easter)
  add(getGoodFriday(year), 'Good Friday');

  // 5. Memorial Day (Last Monday in May)
  add(getLastWeekdayOfMonth(year, 4, 1), 'Memorial Day');

  // 6. Juneteenth National Independence Day (June 19, observed since 2022)
  if (year >= 2022) {
    const juneteenth = getObservedDate(year, 5, 19);
    add(
      juneteenth,
      juneteenth.getDate() === 19 ? 'Juneteenth' : 'Juneteenth (Observed)'
    );
  }

  // 7. Independence Day (July 4)
  const july4 = getObservedDate(year, 6, 4);
  add(
    july4,
    july4.getDate() === 4 ? 'Independence Day' : 'Independence Day (Observed)'
  );

  // 8. Labor Day (1st Monday in Sep)
  add(getNthWeekdayOfMonth(year, 8, 1, 1), 'Labor Day');

  // 9. Thanksgiving Day (4th Thursday in Nov)
  add(getNthWeekdayOfMonth(year, 10, 4, 4), 'Thanksgiving Day');

  // 10. Christmas Day (Dec 25)
  const xmas = getObservedDate(year, 11, 25);
  add(
    xmas,
    xmas.getDate() === 25 ? 'Christmas Day' : 'Christmas Day (Observed)'
  );

  yearCache.set(year, holidays);
  return holidays;
}

export function getMarketHolidayName(
  year: number,
  monthIndex: number,
  day: number
): string | null {
  const map = getMarketHolidaysForYear(year);
  return map[formatYmd(year, monthIndex, day)] || null;
}

export function isMarketOpenDate(dt: Date): boolean {
  const dow = dt.getDay();
  if (dow === 0 || dow === 6) return false;
  return !getMarketHolidayName(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/**
 * Counts future available market open days (strictly after `referenceDate` calendar day)
 * and total open days for a given month, excluding weekends and US market holidays.
 */
export function getMonthMarketSchedule(
  year: number,
  monthIndex: number,
  referenceDate: Date = new Date()
): {
  futureOpenDays: number;
  totalOpenDaysInMonth: number;
  holidaysInMonth: MarketHoliday[];
} {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const refDayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  let futureOpenDays = 0;
  let totalOpenDaysInMonth = 0;
  const holidaysInMonth: MarketHoliday[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, monthIndex, d);
    const holidayName = getMarketHolidayName(year, monthIndex, d);
    if (holidayName) {
      holidaysInMonth.push({
        date: formatYmd(year, monthIndex, d),
        name: holidayName,
      });
    }
    if (isMarketOpenDate(dt)) {
      totalOpenDaysInMonth++;
      if (dt.getTime() > refDayStart) {
        futureOpenDays++;
      }
    }
  }

  return { futureOpenDays, totalOpenDaysInMonth, holidaysInMonth };
}

/**
 * Counts future available market open days (strictly after `referenceDate` calendar day)
 * and total open days for an entire year, excluding weekends and US market holidays.
 */
export function getYearMarketSchedule(
  year: number,
  referenceDate: Date = new Date()
): {
  futureOpenDays: number;
  totalOpenDaysInYear: number;
  remainingHolidaysCount: number;
} {
  const refDayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  let futureOpenDays = 0;
  let totalOpenDaysInYear = 0;
  let remainingHolidaysCount = 0;

  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, m, d);
      const holidayName = getMarketHolidayName(year, m, d);
      if (holidayName && dt.getTime() > refDayStart) {
        remainingHolidaysCount++;
      }
      if (isMarketOpenDate(dt)) {
        totalOpenDaysInYear++;
        if (dt.getTime() > refDayStart) {
          futureOpenDays++;
        }
      }
    }
  }

  return { futureOpenDays, totalOpenDaysInYear, remainingHolidaysCount };
}
