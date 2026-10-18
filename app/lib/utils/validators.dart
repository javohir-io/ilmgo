final RegExp _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$');

bool isValidEmail(String v) => _emailRe.hasMatch(v.trim());

/// 0 (too short) .. 4 (strong). Anything under 8 characters caps at 1.
int passwordStrength(String v) {
  var s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (RegExp(r'[a-z]').hasMatch(v) && RegExp(r'[A-Z]').hasMatch(v)) s++;
  if (RegExp(r'\d').hasMatch(v)) s++;
  if (RegExp(r'[^A-Za-z0-9]').hasMatch(v)) s++;
  if (v.length < 8) return s > 1 ? 1 : s;
  if (s > 4) return 4;
  return s;
}

String passwordStrengthLabel(String v) {
  if (v.isEmpty) return '';
  if (v.length < 8) return 'Juda qisqa';
  switch (passwordStrength(v)) {
    case 0:
    case 1:
      return 'Zaif';
    case 2:
      return 'Oʻrtacha';
    case 3:
      return 'Yaxshi';
    default:
      return 'Kuchli';
  }
}

/// Adds https:// to bare links ("github.com/ada"); empty stays empty.
String normalizeUrl(String v) {
  final t = v.trim();
  if (t.isEmpty) return '';
  if (RegExp(r'^https?://', caseSensitive: false).hasMatch(t)) return t;
  return 'https://$t';
}

bool isValidUrl(String v) {
  final t = v.trim();
  if (t.isEmpty) return true;
  final uri = Uri.tryParse(normalizeUrl(t));
  return uri != null && uri.host.contains('.');
}
