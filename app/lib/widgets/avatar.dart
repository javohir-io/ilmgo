import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../utils/format.dart';

/// Circular profile photo, falling back to initials on the aurora gradient.
class Avatar extends StatelessWidget {
  final String name;
  final String? photoUrl;
  final double size;
  const Avatar({super.key, required this.name, this.photoUrl, this.size = 44});

  @override
  Widget build(BuildContext context) {
    final url = ApiClient.absoluteUrl(photoUrl);
    final fallback = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColors.fill),
      child: Text(initials(name), style: AppText.display(size * 0.38, color: AppColors.text)),
    );
    if (url == null) return fallback;
    return ClipOval(
      child: Image.network(
        url,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => fallback,
        loadingBuilder: (context, child, progress) => progress == null ? child : fallback,
      ),
    );
  }
}
