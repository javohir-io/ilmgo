import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Circular match score (0-100) with an aurora sweep, animated on first show.
class MatchRing extends StatelessWidget {
  final int value;
  final double size;
  final double stroke;
  final bool showLabel;

  const MatchRing({
    super.key,
    required this.value,
    this.size = 56,
    this.stroke = 6,
    this.showLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    final v = value.clamp(0, 100);
    final reduced = AppMotion.reduced(context);
    return Semantics(
      label: '$v foiz mos',
      child: SizedBox(
        width: size,
        height: size,
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: v / 100),
          duration: reduced ? Duration.zero : AppMotion.hero,
          curve: AppMotion.expoOut,
          builder: (context, t, _) => CustomPaint(
            painter: _RingPainter(t, stroke),
            child: showLabel
                ? Center(
                    child: Text(
                      '${(t * 100).round()}',
                      style: AppText.display(size * 0.30),
                    ),
                  )
                : null,
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  final double stroke;
  _RingPainter(this.progress, this.stroke);

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final inset = stroke / 2;
    final arcRect = rect.deflate(inset);
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = Colors.white.withOpacity(0.10);
    canvas.drawArc(arcRect, 0, math.pi * 2, false, track);
    if (progress <= 0) return;
    final bar = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..shader = const SweepGradient(
        startAngle: 0,
        endAngle: math.pi * 2,
        colors: [AppColors.azure, AppColors.sky, AppColors.mist, AppColors.azure],
        stops: [0, 0.4, 0.8, 1],
        transform: GradientRotation(-math.pi / 2),
      ).createShader(rect);
    canvas.drawArc(arcRect, -math.pi / 2, math.pi * 2 * progress, false, bar);
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress || old.stroke != stroke;
}
