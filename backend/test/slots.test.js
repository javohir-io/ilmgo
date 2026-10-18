const test = require('node:test');
const assert = require('node:assert/strict');
const slots = require('../src/lib/slots');

// Local-time constructor, so the tests do not depend on the machine's TZ.
const at = (y, m, d, hh = 0, mm = 0) => new Date(y, m - 1, d, hh, mm);

test('slot list matches the API contract', () => {
  assert.equal(slots.SLOT_TIMES.length, 14);
  assert.equal(slots.SLOT_TIMES[0], '09:00');
  assert.equal(slots.SLOT_TIMES[5], '11:30');
  assert.equal(slots.SLOT_TIMES[6], '13:00');
  assert.equal(slots.SLOT_TIMES.at(-1), '16:30');
  assert.ok(slots.isSlotTime('14:30'));
  assert.ok(!slots.isSlotTime('12:00'));
  assert.ok(!slots.isSlotTime('9:00'));
});

test('date validation and weekday check', () => {
  assert.ok(slots.isValidDateString('2026-11-03'));
  assert.ok(!slots.isValidDateString('2026-02-30'));
  assert.ok(!slots.isValidDateString('2026-1-3'));
  assert.ok(!slots.isValidDateString(20261103));
  assert.ok(slots.isWeekday('2026-11-02')); // Monday
  assert.ok(slots.isWeekday('2026-11-06')); // Friday
  assert.ok(!slots.isWeekday('2026-11-07')); // Saturday
  assert.ok(!slots.isWeekday('2026-11-08')); // Sunday
});

test('past-slot detection uses the injected clock', () => {
  const now = at(2026, 11, 3, 10, 15);
  assert.ok(slots.isSlotInPast('2026-11-03', '10:00', now));
  assert.ok(!slots.isSlotInPast('2026-11-03', '10:30', now));
  assert.ok(slots.isSlotInPast('2026-11-02', '16:30', now));
  assert.ok(!slots.isSlotInPast('2026-11-04', '09:00', now));
});

test('buildSlots: empty on weekends and past days, flags booked/started slots', () => {
  const now = at(2026, 11, 3, 10, 15); // Tuesday
  assert.deepEqual(slots.buildSlots('2026-11-07', [], now), []);
  assert.deepEqual(slots.buildSlots('2026-11-02', [], now), []);
  assert.deepEqual(slots.buildSlots('nonsense', [], now), []);

  const today = slots.buildSlots('2026-11-03', ['14:00'], now);
  assert.equal(today.length, 14);
  const byTime = Object.fromEntries(today.map((s) => [s.time, s.available]));
  assert.equal(byTime['09:00'], false);
  assert.equal(byTime['10:00'], false);
  assert.equal(byTime['10:30'], true);
  assert.equal(byTime['14:00'], false);

  const future = slots.buildSlots('2026-11-05', ['09:00'], now);
  assert.equal(future.filter((s) => s.available).length, 13);
});

test('nextWeekday skips the weekend', () => {
  assert.equal(slots.nextWeekday(at(2026, 11, 6), 1), '2026-11-09'); // Fri + 1 -> Mon
  assert.equal(slots.nextWeekday(at(2026, 11, 2), 3), '2026-11-05');
});

test('date/time formatting', () => {
  assert.equal(slots.toDateString(at(2026, 1, 5)), '2026-01-05');
  assert.equal(slots.toTimeString(at(2026, 1, 5, 9, 5)), '09:05');
});
