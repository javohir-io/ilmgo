import 'format.dart';

String _stamp(DateTime d) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${d.year.toString().padLeft(4, '0')}${two(d.month)}${two(d.day)}T${two(d.hour)}${two(d.minute)}00';
}

String _escape(String s) => s
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n');

/// iCalendar (RFC 5545) text for an interview, in floating local time.
String buildIcs({
  required String id,
  required String date,
  required String time,
  required int durationMin,
  required String company,
  required String jobTitle,
  String? note,
}) {
  final start = parseSlot(date, time) ?? DateTime.now();
  final end = start.add(Duration(minutes: durationMin));
  final now = DateTime.now().toUtc();
  final lines = <String>[
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ilmgo//Student App//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:$id@ilmgo.uz',
    'DTSTAMP:${_stamp(now)}Z',
    'DTSTART:${_stamp(start)}',
    'DTEND:${_stamp(end)}',
    'SUMMARY:${_escape('Intervyu: $company, $jobTitle')}',
    if (note != null && note.trim().isNotEmpty)
      'DESCRIPTION:${_escape(note.trim())}',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return '${lines.join('\r\n')}\r\n';
}
