import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// "#00638E" -> Color. Falls back to Dark Azure when malformed.
Color colorFromHex(String? hex, {Color fallback = AppColors.azure}) {
  if (hex == null) return fallback;
  var h = hex.trim().replaceAll('#', '');
  if (h.length == 6) h = 'FF$h';
  if (h.length != 8) return fallback;
  final v = int.tryParse(h, radix: 16);
  return v == null ? fallback : Color(v);
}

/// Darkens a colour toward black (keeps the hue inside the Ilmgo palette).
Color darken(Color c, double amount) => Color.lerp(c, const Color(0xFF000000), amount)!;

/// accent -> [darkened accent, deeper accent] for monograms and headers.
List<Color> accentGradient(Color accent) => [darken(accent, 0.2), darken(accent, 0.55)];
