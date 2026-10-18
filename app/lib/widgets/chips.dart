import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';

/// Coloured pill for an application / interview status.
class StatusPill extends StatelessWidget {
  final String status;
  final String? labelOverride;
  const StatusPill(this.status, {super.key, this.labelOverride});

  @override
  Widget build(BuildContext context) {
    final c = status == 'scheduled'
        ? AppColors.sky
        : status == 'completed'
            ? AppColors.paper
            : status == 'cancelled'
                ? AppColors.muted
                : AppStatus.color(status);
    final label = labelOverride ??
        (const {'scheduled': 'Rejalashtirilgan', 'completed': 'Yakunlangan', 'cancelled': 'Bekor qilingan'}[status] ??
            AppStatus.label(status));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.withOpacity(0.14),
        borderRadius: AppRadii.pillR,
        border: Border.all(color: c.withOpacity(0.38)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: c, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label, style: AppText.inter(12, weight: FontWeight.w600, color: c)),
      ]),
    );
  }
}

/// Small read-only chip (type, work mode, level, skill).
class InfoChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color? color;
  final bool filled;

  const InfoChip(this.label, {super.key, this.icon, this.color, this.filled = false});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.muted;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: filled ? c.withOpacity(0.16) : AppColors.glassFill,
        borderRadius: AppRadii.pillR,
        border: Border.all(color: filled ? c.withOpacity(0.45) : AppColors.glassStroke),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 13, color: c), const SizedBox(width: 5)],
        Text(label, style: AppText.inter(12, weight: FontWeight.w500, color: filled ? AppColors.text : c)),
      ]),
    );
  }
}

/// Tappable filter chip with a selected state.
class FilterChipX extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  const FilterChipX({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: AnimatedContainer(
          duration: AppMotion.fast,
          curve: AppMotion.expoOut,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            color: selected ? AppColors.azure.withOpacity(0.30) : AppColors.glassFill,
            borderRadius: AppRadii.pillR,
            border: Border.all(
              color: selected ? AppColors.azureBright.withOpacity(0.8) : AppColors.glassStroke,
            ),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[
              Icon(icon, size: 15, color: selected ? AppColors.text : AppColors.muted),
              const SizedBox(width: 6),
            ],
            Text(label,
                style: AppText.inter(13,
                    weight: FontWeight.w600,
                    color: selected ? AppColors.text : AppColors.muted)),
          ]),
        ),
      ),
    );
  }
}

/// Skill chip: [matched] highlights skills the student has, [missing] dims
/// the ones still to learn, [onRemove] adds a delete affordance (profile editor).
class SkillChip extends StatelessWidget {
  final String label;
  final bool matched;
  final bool missing;
  final VoidCallback? onRemove;
  final VoidCallback? onTap;

  const SkillChip(
    this.label, {
    super.key,
    this.matched = false,
    this.missing = false,
    this.onRemove,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = matched ? AppColors.paper : AppColors.muted;
    final chip = Container(
      padding: EdgeInsets.fromLTRB(11, 6, onRemove != null ? 6 : 11, 6),
      decoration: BoxDecoration(
        color: matched ? AppColors.paper.withOpacity(0.12) : AppColors.glassFill,
        borderRadius: AppRadii.pillR,
        border: Border.all(
          color: matched ? AppColors.paper.withOpacity(0.45) : AppColors.glassStroke,
        ),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (matched) ...[
          const Icon(Icons.check_rounded, size: 14, color: AppColors.paper),
          const SizedBox(width: 4),
        ],
        Text(label,
            style: AppText.inter(12.5,
                weight: FontWeight.w500,
                color: missing ? AppColors.faint : (matched ? AppColors.text : c))),
        if (onRemove != null) ...[
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            behavior: HitTestBehavior.opaque,
            child: Semantics(
              button: true,
              label: '$label ni olib tashlash',
              child: const Padding(
                padding: EdgeInsets.all(3),
                child: Icon(Icons.close_rounded, size: 15, color: AppColors.muted),
              ),
            ),
          ),
        ],
      ]),
    );
    if (onTap == null) return chip;
    return GestureDetector(onTap: onTap, child: chip);
  }
}
