import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Floating dark snackbar used for lightweight feedback.
void showToast(
  BuildContext context,
  String message, {
  bool error = false,
  bool lifted = false,
}) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF1B1C2A),
        elevation: 0,
        margin: EdgeInsets.fromLTRB(
            AppLayout.gutter, 0, AppLayout.gutter, lifted ? 104 : 20),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadii.smR,
          side: BorderSide(
            color: (error ? AppColors.danger : AppColors.glassRim)
                .withOpacity(error ? 0.6 : 1),
          ),
        ),
        duration: const Duration(seconds: 3),
        content: Row(
          children: [
            Icon(
              error ? Icons.error_outline_rounded : Icons.check_circle_rounded,
              size: 20,
              color: error ? AppColors.danger : AppColors.paper,
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: AppText.inter(13.5))),
          ],
        ),
      ),
    );
}
