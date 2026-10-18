/// Small helpers for reading loosely-typed JSON safely.
String str(dynamic v, [String fallback = '']) => v == null ? fallback : v.toString();

int intOr(dynamic v, [int fallback = 0]) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(str(v)) ?? fallback;
}

bool boolOr(dynamic v, [bool fallback = false]) => v is bool ? v : fallback;

DateTime? dateOrNull(dynamic v) {
  if (v == null) return null;
  return DateTime.tryParse(v.toString());
}

List<String> strList(dynamic v) =>
    (v is List) ? v.map((e) => e.toString()).toList() : <String>[];

Map<String, dynamic> asMap(dynamic v) =>
    v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};

List<Map<String, dynamic>> mapList(dynamic v) => (v is List)
    ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
    : <Map<String, dynamic>>[];
