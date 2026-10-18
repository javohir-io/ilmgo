import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// The Ilmgo mark: a rounded orbit with a rising node, on the aurora gradient.
/// [progress] (0..1) draws the orbit in, used by the splash screen.
class LogoMark extends StatelessWidget {
  final double size;
  final double progress;
  const LogoMark({super.key, this.size = 72, this.progress = 1});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _LogoPainter(progress)),
    );
  }
}

class _LogoPainter extends CustomPainter {
  final double progress;
  _LogoPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final shader = AppColors.aurora.createShader(rect);
    final s = size.width;
    final stroke = s * 0.10;

    // Orbit ring (open at the top-right so the node can "launch").
    final ring = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..shader = shader;
    final arc = rect.deflate(stroke * 1.4);
    final sweep = (math.pi * 2 * 0.82) * progress;
    canvas.drawArc(arc, -math.pi * 0.28, sweep, false, ring);

    // Rising node.
    final nodeOpacity = ((progress - 0.5) / 0.5).clamp(0.0, 1.0);
    final node = Paint()..shader = shader;
    canvas.save();
    canvas.translate(s * 0.5, s * 0.52 - (1 - nodeOpacity) * s * 0.08);
    final path = Path()
      ..moveTo(0, -s * 0.24)
      ..lineTo(s * 0.15, s * 0.14)
      ..lineTo(0, s * 0.06)
      ..lineTo(-s * 0.15, s * 0.14)
      ..close();
    canvas.drawPath(path, node..color = Colors.white.withOpacity(nodeOpacity));
    canvas.restore();
  }

  @override
  bool shouldRepaint(_LogoPainter old) => old.progress != progress;
}
