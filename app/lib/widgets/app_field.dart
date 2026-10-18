import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';

/// Labelled glass text field used across forms.
class AppField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboardType;
  final bool obscure;
  final int maxLines;
  final String? Function(String?)? validator;
  final TextInputAction? action;
  final Widget? suffix;
  final IconData? prefixIcon;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final List<TextInputFormatter>? formatters;
  final bool enabled;
  final Iterable<String>? autofill;

  const AppField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType,
    this.obscure = false,
    this.maxLines = 1,
    this.validator,
    this.action,
    this.suffix,
    this.prefixIcon,
    this.onChanged,
    this.onSubmitted,
    this.formatters,
    this.enabled = true,
    this.autofill,
  });

  OutlineInputBorder _border(Color c, [double w = 1]) => OutlineInputBorder(
        borderRadius: AppRadii.smR,
        borderSide: BorderSide(color: c, width: w),
      );

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppText.label.copyWith(color: AppColors.muted)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          enabled: enabled,
          obscureText: obscure,
          keyboardType: keyboardType,
          textInputAction: action,
          maxLines: obscure ? 1 : maxLines,
          validator: validator,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          inputFormatters: formatters,
          autofillHints: autofill,
          style: AppText.inter(15),
          cursorColor: AppColors.sky,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AppText.inter(15, color: AppColors.faint),
            filled: true,
            fillColor: AppColors.glassFill,
            prefixIcon: prefixIcon == null
                ? null
                : Icon(prefixIcon, size: 20, color: AppColors.muted),
            suffixIcon: suffix,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: _border(AppColors.glassStroke),
            enabledBorder: _border(AppColors.glassStroke),
            disabledBorder: _border(AppColors.glassStroke),
            focusedBorder: _border(AppColors.sky, 1.6),
            errorBorder: _border(AppColors.danger),
            focusedErrorBorder: _border(AppColors.danger, 1.6),
            errorStyle: AppText.inter(12, color: AppColors.danger),
          ),
        ),
      ],
    );
  }
}
