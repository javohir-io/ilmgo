import 'dart:math' as math;

/// Pure formatting helpers (no Flutter dependency, so they are unit-testable).

const _monthsShort = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const _weekdaysShort = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak']; // DateTime.weekday: 1 = Monday

String _md(DateTime d) => '${d.day}-${_monthsShort[d.month - 1]}';
String _hm(DateTime d) =>
    '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

/// "hozir", "5 daqiqa oldin", "3 soat oldin", "2 kun oldin", then a calendar date.
String relativeTime(DateTime? time, {DateTime? now}) {
  if (time == null) return '';
  final ref = now ?? DateTime.now();
  final t = time.toLocal();
  final diff = ref.difference(t);
  if (diff.inSeconds < 45) return 'hozirgina';
  if (diff.inMinutes < 60) return '${math.max(1, diff.inMinutes)} daqiqa oldin';
  if (diff.inHours < 24) return '${diff.inHours} soat oldin';
  if (diff.inDays < 7) return '${diff.inDays} kun oldin';
  final sameYear = t.year == ref.year;
  return sameYear ? _md(t) : '${_md(t)}, ${t.year}';
}

/// Whole calendar days from [now] until [deadline] (negative once passed).
int daysUntil(DateTime deadline, {DateTime? now}) {
  final n = now ?? DateTime.now();
  final d = deadline.toLocal();
  return DateTime(d.year, d.month, d.day)
      .difference(DateTime(n.year, n.month, n.day))
      .inDays;
}

/// "5 kundan keyin yopiladi", "Ertaga yopiladi", "Yopilgan"... or null with no deadline.
String? closesIn(DateTime? deadline, {DateTime? now}) {
  if (deadline == null) return null;
  final n = now ?? DateTime.now();
  final d = deadline.toLocal();
  if (d.isBefore(n)) return 'Yopilgan';
  final days = daysUntil(d, now: n);
  if (days <= 0) return 'Bugun yopiladi';
  if (days == 1) return 'Ertaga yopiladi';
  if (days <= 14) return '$days kundan keyin yopiladi';
  return '${_md(d)} kuni yopiladi';
}

/// True when the deadline is within three days (and not yet passed).
bool deadlineIsSoon(DateTime? deadline, {DateTime? now}) {
  if (deadline == null) return false;
  final n = now ?? DateTime.now();
  if (deadline.toLocal().isBefore(n)) return false;
  return daysUntil(deadline, now: n) <= 3;
}

/// DateTime -> "2026-11-03".
String dayKey(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

/// "2026-11-03" -> local DateTime at midnight (null when malformed).
DateTime? parseDay(String key) {
  final p = key.split('-');
  if (p.length != 3) return null;
  final y = int.tryParse(p[0]);
  final m = int.tryParse(p[1]);
  final d = int.tryParse(p[2]);
  if (y == null || m == null || d == null) return null;
  return DateTime(y, m, d);
}

/// ("2026-11-03", "14:00") -> local DateTime (null when malformed).
DateTime? parseSlot(String date, String time) {
  final day = parseDay(date);
  final t = time.split(':');
  if (day == null || t.length < 2) return null;
  final h = int.tryParse(t[0]);
  final m = int.tryParse(t[1]);
  if (h == null || m == null) return null;
  return DateTime(day.year, day.month, day.day, h, m);
}

/// "14:00" -> "14:00" (24-hour clock in Uzbekistan).
String formatTime12(String time) {
  final t = parseSlot('2000-01-01', time);
  if (t == null) return time;
  return _hm(t);
}

/// "2026-11-03" -> "Sesh, 3-noy".
String formatDay(String date) {
  final d = parseDay(date);
  if (d == null) return date;
  return '${_weekdaysShort[d.weekday - 1]}, ${_md(d)}';
}

/// ("2026-11-03", "14:00") -> "Sesh, 3-noy · 14:00".
String formatWhen(String date, String time) =>
    '${formatDay(date)} · ${formatTime12(time)}';

/// "14-okt, 15:20" for timelines.
String formatStamp(DateTime? t) {
  if (t == null) return '';
  final l = t.toLocal();
  return '${_md(l)}, ${_hm(l)}';
}

String formatShortDate(DateTime? t) {
  if (t == null) return '';
  final l = t.toLocal();
  return '${_md(l)}, ${l.year}';
}

/// "Xayrli tong" / "Xayrli kun" / "Xayrli kech".
String greeting([DateTime? now]) {
  final h = (now ?? DateTime.now()).hour;
  if (h < 5) return 'Xayrli tun';
  if (h < 12) return 'Xayrli tong';
  if (h < 18) return 'Xayrli kun';
  return 'Xayrli kech';
}

String initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty);
  final out = parts.take(2).map((s) => s[0].toUpperCase()).join();
  return out.isEmpty ? '?' : out;
}

/// Splits "Ada Lovelace King" into ("Ada", "Lovelace King").
List<String> splitName(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty);
  final list = parts.toList();
  if (list.isEmpty) return ['', ''];
  return [list.first, list.skip(1).join(' ')];
}

/// Uzbek nouns do not inflect after numerals: "3 natija".
String plural(int n, String noun) => '$n $noun';

String formatBytes(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
  return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}
