import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// One-shot confetti burst. Plays once on mount; renders nothing under reduced motion.
class ConfettiBurst extends StatefulWidget {
  final int count;
  const ConfettiBurst({super.key, this.count = 70});

  @override
  State<ConfettiBurst> createState() => _ConfettiBurstState();
}

class _Particle {
  final double angle;
  final double speed;
  final double size;
  final double spin;
  final Color color;
  final bool round;
  _Particle(this.angle, this.speed, this.size, this.spin, this.color, this.round);
}

class _ConfettiBurstState extends State<ConfettiBurst> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))..forward();
  late final List<_Particle> _ps;

  @override
  void initState() {
    super.initState();
    final rnd = math.Random(7);
    const palette = [
      AppColors.azure, AppColors.sky, AppColors.mist, AppColors.paper, AppColors.mist,
    ];
    _ps = List.generate(widget.count, (i) {
      return _Particle(
        -math.pi / 2 + (rnd.nextDouble() - 0.5) * math.pi * 1.1,
        260 + rnd.nextDouble() * 420,
        5 + rnd.nextDouble() * 6,
        (rnd.nextDouble() - 0.5) * 14,
        palette[rnd.nextInt(palette.length)],
        rnd.nextBool(),
      );
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (AppMotion.reduced(context)) return const SizedBox.shrink();
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) => CustomPaint(
          size: Size.infinite,
          painter: _ConfettiPainter(_ps, _c.value),
        ),
      ),
    );
  }
}

class _ConfettiPainter extends CustomPainter {
  final List<_Particle> particles;
  final double t;
  _ConfettiPainter(this.particles, this.t);

  @override
  void paint(Canvas canvas, Size size) {
    final origin = Offset(size.width / 2, size.height * 0.34);
    final time = t * 2.2;
    for (final p in particles) {
      final dx = math.cos(p.angle) * p.speed * time;
      final dy = math.sin(p.angle) * p.speed * time + 520 * time * time * 0.5;
      final pos = origin + Offset(dx, dy);
      final fade = (1 - ((t - 0.55) / 0.45)).clamp(0.0, 1.0);
      final paint = Paint()..color = p.color.withOpacity(fade);
      canvas.save();
      canvas.translate(pos.dx, pos.dy);
      canvas.rotate(p.spin * time);
      if (p.round) {
        canvas.drawCircle(Offset.zero, p.size / 2, paint);
      } else {
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.55),
            const Radius.circular(2),
          ),
          paint,
        );
      }
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter old) => old.t != t;
}
