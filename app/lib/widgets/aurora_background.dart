import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Slowly drifting violet / cyan / pink light blobs on the dark base, with a
/// vignette. Painted with radial gradients (no blur filter) so it stays cheap.
/// With reduced motion the blobs hold still.
class AuroraBackground extends StatefulWidget {
  final Widget? child;
  final double intensity;
  const AuroraBackground({super.key, this.child, this.intensity = 1});

  @override
  State<AuroraBackground> createState() => _AuroraBackgroundState();
}

class _AuroraBackgroundState extends State<AuroraBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 40),
  );
  bool _animating = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduced = AppMotion.reduced(context);
    if (reduced && _animating) {
      _c.stop();
      _animating = false;
    } else if (!reduced && !_animating) {
      _c.repeat();
      _animating = true;
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: AppColors.bg),
        RepaintBoundary(
          child: AnimatedBuilder(
            animation: _c,
            builder: (context, _) => CustomPaint(
              painter: _AuroraPainter(_c.value, widget.intensity),
            ),
          ),
        ),
        if (widget.child != null) widget.child!,
      ],
    );
  }
}

class _AuroraPainter extends CustomPainter {
  final double t;
  final double intensity;
  _AuroraPainter(this.t, this.intensity);

  void _blob(Canvas canvas, Size size, Color color, Offset center,
      double radius, double opacity) {
    final rect = Rect.fromCircle(center: center, radius: radius);
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [
          color.withOpacity(opacity * intensity),
          color.withOpacity(0),
        ],
      ).createShader(rect);
    canvas.drawCircle(center, radius, paint);
  }

  @override
  void paint(Canvas canvas, Size size) {
    final a = t * 2 * math.pi;
    final w = size.width;
    final h = size.height;
    final r = math.max(w, h);
    _blob(canvas, size, AppColors.azureDeep,
        Offset(w * (0.15 + 0.10 * math.sin(a)), h * (0.08 + 0.05 * math.cos(a))),
        r * 0.85, 0.85);
    _blob(canvas, size, AppColors.azure,
        Offset(w * (0.95 + 0.06 * math.cos(a + 1)), h * (0.30 + 0.06 * math.sin(a + 2))),
        r * 0.55, 0.45);
    _blob(canvas, size, AppColors.sky,
        Offset(w * (0.40 + 0.12 * math.sin(a + 3)), h * (1.02 + 0.04 * math.cos(a + 1))),
        r * 0.60, 0.16);
    // Vignette keeps text legible at the edges.
    final vignette = Paint()
      ..shader = RadialGradient(
        center: Alignment.center,
        radius: 1.1,
        colors: [Colors.transparent, AppColors.bg.withOpacity(0.55)],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, vignette);
  }

  @override
  bool shouldRepaint(_AuroraPainter old) =>
      old.t != t || old.intensity != intensity;
}
