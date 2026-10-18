import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';

/// Aurora-gradient call to action with a pressed scale, loading state and haptics.
class PrimaryButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final bool expanded;

  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.expanded = true,
  });

  @override
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton> {
  bool _down = false;

  bool get _enabled => widget.onPressed != null && !widget.loading;

  @override
  Widget build(BuildContext context) {
    final content = Row(
      mainAxisSize: widget.expanded ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.loading)
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.text),
          )
        else ...[
          if (widget.icon != null) ...[
            Icon(widget.icon, size: 20, color: AppColors.text),
            const SizedBox(width: 8),
          ],
          Text(widget.label,
              style: AppText.inter(15.5, weight: FontWeight.w700, color: AppColors.text)),
        ],
      ],
    );

    return Semantics(
      button: true,
      enabled: _enabled,
      label: widget.label,
      child: GestureDetector(
        onTapDown: _enabled ? (_) => setState(() => _down = true) : null,
        onTapCancel: () => setState(() => _down = false),
        onTapUp: (_) => setState(() => _down = false),
        onTap: _enabled
            ? () {
                HapticFeedback.selectionClick();
                widget.onPressed!();
              }
            : null,
        child: AnimatedScale(
          scale: _down ? 0.97 : 1,
          duration: AppMotion.micro,
          curve: AppMotion.expoOut,
          child: AnimatedOpacity(
            opacity: widget.onPressed == null ? 0.45 : 1,
            duration: AppMotion.fast,
            child: Container(
              height: 54,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              decoration: BoxDecoration(
                gradient: AppColors.fill,
                borderRadius: AppRadii.pillR,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.azure.withOpacity(0.45),
                    blurRadius: 28,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: content,
            ),
          ),
        ),
      ),
    );
  }
}

/// Quiet glass-outlined secondary button.
class GhostButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color? color;
  final bool expanded;

  const GhostButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.color,
    this.expanded = true,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.text;
    return Semantics(
      button: true,
      enabled: onPressed != null,
      label: label,
      child: GestureDetector(
        onTap: onPressed == null
            ? null
            : () {
                HapticFeedback.selectionClick();
                onPressed!();
              },
        child: Opacity(
          opacity: onPressed == null ? 0.45 : 1,
          child: Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 22),
            decoration: BoxDecoration(
              color: AppColors.glassFill,
              borderRadius: AppRadii.pillR,
              border: Border.all(color: color == null ? AppColors.glassRim : c.withOpacity(0.6)),
            ),
            child: Row(
              mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 19, color: c),
                  const SizedBox(width: 8),
                ],
                Text(label, style: AppText.inter(14.5, weight: FontWeight.w600, color: c)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Round glass icon button (back, bookmark, close...).
class GlassIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String label;
  final Color? color;
  final double size;

  const GlassIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    required this.label,
    this.color,
    this.size = 44,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onPressed == null
            ? null
            : () {
                HapticFeedback.selectionClick();
                onPressed!();
              },
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.glassFillHover,
            border: Border.all(color: AppColors.glassStroke),
          ),
          child: Icon(icon, size: size * 0.46, color: color ?? AppColors.text),
        ),
      ),
    );
  }
}
