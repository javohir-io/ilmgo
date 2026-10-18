import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'buttons.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                borderRadius: AppRadii.lgR,
                color: AppColors.glassFill,
                border: Border.all(color: AppColors.glassStroke),
              ),
              child: Icon(icon, size: 30, color: AppColors.sky),
            ),
            const SizedBox(height: 18),
            Text(title, style: AppText.h3, textAlign: TextAlign.center),
            const SizedBox(height: 6),
            Text(message, style: AppText.bodyMuted, textAlign: TextAlign.center),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
              GhostButton(label: actionLabel!, onPressed: onAction, expanded: false),
            ],
          ],
        ),
      ),
    );
  }
}

class ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const ErrorState({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 44, color: AppColors.danger),
            const SizedBox(height: 14),
            Text('Yuklab boʻlmadi', style: AppText.h3),
            const SizedBox(height: 6),
            Text(message, style: AppText.bodyMuted, textAlign: TextAlign.center),
            const SizedBox(height: 18),
            GhostButton(
              label: 'Qayta urinish',
              icon: Icons.refresh_rounded,
              onPressed: onRetry,
              expanded: false,
            ),
          ],
        ),
      ),
    );
  }
}
