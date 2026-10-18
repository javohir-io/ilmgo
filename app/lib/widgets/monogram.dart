import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../utils/color_utils.dart';

/// Company initial on a gradient derived from the job's `accent` colour.
/// Replaces the old logo assets. Wrapped in a Hero so it flies into the detail header.
class Monogram extends StatelessWidget {
  final String company;
  final String accent;
  final double size;
  final String? heroTag;

  const Monogram({
    super.key,
    required this.company,
    required this.accent,
    this.size = 46,
    this.heroTag,
  });

  @override
  Widget build(BuildContext context) {
    final colors = accentGradient(colorFromHex(accent));
    final letter = company.trim().isEmpty ? '?' : company.trim()[0].toUpperCase();
    final tile = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.3),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
        boxShadow: [
          BoxShadow(color: colors.first.withOpacity(0.35), blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      child: Text(letter, style: AppText.display(size * 0.46, color: AppColors.text).copyWith(shadows: const [Shadow(color: Color(0x73000000), blurRadius: 3, offset: Offset(0, 1))])),
    );
    if (heroTag == null) return tile;
    return Hero(tag: heroTag!, child: tile);
  }
}
