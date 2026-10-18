import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Custom page transition: fade + short upward slide, 350ms expo-out
/// (reverse is faster, expo-in). Reduced motion keeps an opacity-only fade.
Route<T> appRoute<T>(Widget page) {
  return PageRouteBuilder<T>(
    transitionDuration: AppMotion.base,
    reverseTransitionDuration: AppMotion.fast,
    pageBuilder: (context, animation, secondaryAnimation) => page,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (AppMotion.reduced(context)) {
        return FadeTransition(opacity: animation, child: child);
      }
      final curved = CurvedAnimation(
        parent: animation,
        curve: AppMotion.expoOut,
        reverseCurve: AppMotion.expoIn,
      );
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.04),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        ),
      );
    },
  );
}

/// Pops everything above the root route (the main shell).
void popToShell(BuildContext context) {
  Navigator.of(context).popUntil((route) => route.isFirst);
}
