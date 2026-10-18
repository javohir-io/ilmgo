import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';

class NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int badge;
  const NavItem(this.icon, this.activeIcon, this.label, {this.badge = 0});
}

/// Floating pill navigation with a sliding aurora indicator and unread badges.
class GlassNav extends StatelessWidget {
  final List<NavItem> items;
  final int index;
  final ValueChanged<int> onChanged;

  const GlassNav({
    super.key,
    required this.items,
    required this.index,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 12 + bottom),
      child: ClipRRect(
        borderRadius: AppRadii.pillR,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
          child: Container(
            height: 68,
            decoration: BoxDecoration(
              color: const Color(0xCC141414),
              borderRadius: AppRadii.pillR,
              border: Border.all(color: AppColors.glassRim),
            ),
            child: LayoutBuilder(
              builder: (context, c) {
                final w = c.maxWidth / items.length;
                return Stack(
                  children: [
                    AnimatedPositioned(
                      duration: AppMotion.base,
                      curve: AppMotion.expoOut,
                      left: index * w + 6,
                      top: 6,
                      width: w - 12,
                      height: 56,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: AppRadii.pillR,
                          gradient: LinearGradient(colors: [
                            AppColors.azure.withOpacity(0.55),
                            AppColors.sky.withOpacity(0.30),
                          ]),
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        for (var i = 0; i < items.length; i++)
                          Expanded(child: _Item(item: items[i], selected: i == index, onTap: () {
                            if (i != index) HapticFeedback.selectionClick();
                            onChanged(i);
                          })),
                      ],
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  final NavItem item;
  final bool selected;
  final VoidCallback onTap;
  const _Item({required this.item, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: item.badge > 0 ? '${item.label}, ${item.badge} ta oʻqilmagan' : item.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Center(
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(selected ? item.activeIcon : item.icon,
                      size: 24, color: selected ? AppColors.text : AppColors.muted),
                  const SizedBox(height: 2),
                  Text(item.label,
                      style: AppText.inter(10.5,
                          weight: FontWeight.w600,
                          color: selected ? AppColors.text : AppColors.faint)),
                ],
              ),
              if (item.badge > 0)
                Positioned(
                  right: -10,
                  top: -4,
                  child: Container(
                    constraints: const BoxConstraints(minWidth: 17),
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: const BoxDecoration(
                      color: AppColors.mist,
                      borderRadius: AppRadii.pillR,
                    ),
                    child: Text(
                      item.badge > 9 ? '9+' : '${item.badge}',
                      textAlign: TextAlign.center,
                      style: AppText.inter(10, weight: FontWeight.w800, color: const Color(0xFF000000)),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
