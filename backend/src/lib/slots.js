/**
 * Interview slot rules. Slots are fixed 30-minute blocks on weekdays.
 * Dates are plain "YYYY-MM-DD" strings and times "HH:mm"; both are interpreted
 * in the server's local time zone (set TZ to pin it). `now` is injectable for tests.
 */

const SLOT_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];
const SLOT_DURATION_MIN = 30;

/** True for a real calendar day written as YYYY-MM-DD (rejects 2026-02-30). */
function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const pad = (n) => String(n).padStart(2, '0');

/** Formats a Date as local YYYY-MM-DD. */
function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Formats a Date as local HH:mm. */
function toTimeString(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isSlotTime(time) {
  return SLOT_TIMES.includes(time);
}

/** Monday-Friday check on the calendar day itself (time-zone independent). */
function isWeekday(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day >= 1 && day <= 5;
}

/** True if the slot starts before `now`. */
function isSlotInPast(dateString, time, now = new Date()) {
  const [y, m, d] = dateString.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime() < now.getTime();
}

/** True if the whole calendar day is before today. */
function isDayInPast(dateString, now = new Date()) {
  return dateString < toDateString(now);
}

/**
 * Builds the slot grid for a day.
 * Weekends and past days yield []; for today, slots already started are unavailable.
 * @param {string} dateString YYYY-MM-DD
 * @param {Iterable<string>} bookedTimes times already taken for the job that day
 */
function buildSlots(dateString, bookedTimes = [], now = new Date()) {
  if (!isValidDateString(dateString) || !isWeekday(dateString) || isDayInPast(dateString, now)) {
    return [];
  }
  const booked = new Set(bookedTimes);
  return SLOT_TIMES.map((time) => ({
    time,
    available: !booked.has(time) && !isSlotInPast(dateString, time, now),
  }));
}

/** First weekday that is at least `minDaysAhead` days after `from` (as YYYY-MM-DD). */
function nextWeekday(from = new Date(), minDaysAhead = 1) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + minDaysAhead);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return toDateString(d);
}

module.exports = {
  SLOT_TIMES,
  SLOT_DURATION_MIN,
  isValidDateString,
  isSlotTime,
  isWeekday,
  isSlotInPast,
  isDayInPast,
  buildSlots,
  nextWeekday,
  toDateString,
  toTimeString,
};
