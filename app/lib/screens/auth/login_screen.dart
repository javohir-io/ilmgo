import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../services/api_client.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/routes.dart';
import '../../utils/toast.dart';
import '../../utils/validators.dart';
import '../../widgets/app_field.dart';
import '../../widgets/buttons.dart';
import '../../widgets/logo_mark.dart';
import '../shell/main_shell.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _hide = true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) return;
    final state = AppStateScope.of(context);
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await state.login(email: _email.text.trim(), password: _password.text);
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(appRoute(const MainShell()), (r) => false);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _fillDemo() {
    _email.text = 'demo@ilmgo.uz';
    _password.text = 'Demo1234!';
    showToast(context, 'Demo hisob kiritildi');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppLayout.gutter + 4),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _form,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const LogoMark(size: 56),
                    const SizedBox(height: 22),
                    Text('Xush kelibsiz', style: AppText.display(32)),
                    const SizedBox(height: 6),
                    Text('Qoldirgan joyingizdan davom etish uchun tizimga kiring.', style: AppText.bodyMuted),
                    const SizedBox(height: 28),
                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withOpacity(0.12),
                          borderRadius: AppRadii.smR,
                          border: Border.all(color: AppColors.danger.withOpacity(0.5)),
                        ),
                        child: Row(children: [
                          const Icon(Icons.error_outline_rounded, size: 18, color: AppColors.danger),
                          const SizedBox(width: 10),
                          Expanded(child: Text(_error!, style: AppText.inter(13.5, color: AppColors.danger))),
                        ]),
                      ),
                      const SizedBox(height: 16),
                    ],
                    AppField(
                      label: 'Email',
                      controller: _email,
                      hint: 'siz@universitet.uz',
                      keyboardType: TextInputType.emailAddress,
                      action: TextInputAction.next,
                      prefixIcon: Icons.mail_outline_rounded,
                      autofill: const [AutofillHints.email],
                      validator: (v) => isValidEmail(v ?? '') ? null : 'Yaroqli email kiriting',
                    ),
                    const SizedBox(height: 16),
                    AppField(
                      label: 'Parol',
                      controller: _password,
                      obscure: _hide,
                      action: TextInputAction.done,
                      prefixIcon: Icons.lock_outline_rounded,
                      autofill: const [AutofillHints.password],
                      onSubmitted: (_) => _submit(),
                      validator: (v) => (v ?? '').isEmpty ? 'Parolingizni kiriting' : null,
                      suffix: IconButton(
                        tooltip: _hide ? 'Parolni koʻrsatish' : 'Parolni yashirish',
                        icon: Icon(_hide ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                            size: 20, color: AppColors.muted),
                        onPressed: () => setState(() => _hide = !_hide),
                      ),
                    ),
                    const SizedBox(height: 24),
                    PrimaryButton(label: 'Kirish', loading: _busy, onPressed: _submit),
                    const SizedBox(height: 12),
                    Center(
                      child: TextButton(
                        onPressed: _fillDemo,
                        child: Text('Demo hisobdan foydalanish',
                            style: AppText.inter(13.5, weight: FontWeight.w600, color: AppColors.sky)),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Center(
                      child: TextButton(
                        onPressed: () => Navigator.of(context).push(appRoute(const RegisterScreen())),
                        child: Text.rich(TextSpan(
                          style: AppText.bodyMuted,
                          children: [
                            const TextSpan(text: 'Yangimisiz? '),
                            TextSpan(
                                text: 'Hisob yaratish',
                                style: AppText.inter(14, weight: FontWeight.w700)),
                          ],
                        )),
                      ),
                    ),
                  ],
                ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.04, curve: Curves.easeOutCubic),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
