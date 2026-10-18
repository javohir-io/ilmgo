/** Uzbek (Latin) date words. Intl locale data for `uz` is not reliable on every Node build, so spell them out. */

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];

/** "2026-11-03" -> "3-noyabr, seshanba" (the calendar day is time-zone independent). */
function describeDay(date) {
  const [y, m, d] = date.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${d}-${MONTHS[m - 1]}, ${WEEKDAYS[wd]}`;
}

module.exports = { MONTHS, WEEKDAYS, describeDay };
