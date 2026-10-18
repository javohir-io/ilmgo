import 'package:flutter/material.dart';

import '../../services/api_client.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/routes.dart';
import '../../utils/validators.dart';
import '../../widgets/app_field.dart';
import '../../widgets/buttons.dart';
import '../shell/main_shell.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _university = TextEditingController();
  final _degree = TextEditingController();
  bool _hide = true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_name, _email, _password, _university, _degree]) {
      c.dispose();
    }
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
      await state.register(
        name: _name.text.trim(),
        email: _email.text.trim(),
        password: _password.text,
        university: _university.text.trim(),
        degreeProgram: _degree.text.trim(),
      );
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(appRoute(const MainShell()), (r) => false);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strength = passwordStrength(_password.text);
    final strengthColor = [
      AppColors.danger, AppColors.danger, AppColors.mist, AppColors.sky, AppColors.paper,
    ][strength];
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          tooltip: 'Orqaga',
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(AppLayout.gutter + 4, 0, AppLayout.gutter + 4, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _form,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hisob yarating', style: AppText.display(30)),
                    const SizedBox(height: 6),
                    Text('Bir daqiqadan kam vaqt oladi.', style: AppText.bodyMuted),
                    const SizedBox(height: 24),
                    if (_error != null) ...[
                      Text(_error!, style: AppText.inter(13.5, color: AppColors.danger)),
                      const SizedBox(height: 12),
                    ],
                    AppField(
                      label: 'Ism va familiya',
                      controller: _name,
                      action: TextInputAction.next,
                      prefixIcon: Icons.person_outline_rounded,
                      autofill: const [AutofillHints.name],
                      validator: (v) => (v ?? '').trim().length < 2 ? 'Ismingizni kiriting' : null,
                    ),
                    const SizedBox(height: 14),
                    AppField(
                      label: 'Email',
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      action: TextInputAction.next,
                      prefixIcon: Icons.mail_outline_rounded,
                      autofill: const [AutofillHints.newUsername],
                      validator: (v) => isValidEmail(v ?? '') ? null : 'Yaroqli email kiriting',
                    ),
                    const SizedBox(height: 14),
                    AppField(
                      label: 'Parol',
                      controller: _password,
                      obscure: _hide,
                      action: TextInputAction.next,
                      prefixIcon: Icons.lock_outline_rounded,
                      autofill: const [AutofillHints.newPassword],
                      onChanged: (_) => setState(() {}),
                      validator: (v) => (v ?? '').length < 8 ? 'Kamida 8 ta belgi kiriting' : null,
                      suffix: IconButton(
                        tooltip: _hide ? 'Parolni koʻrsatish' : 'Parolni yashirish',
                        icon: Icon(_hide ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                            size: 20, color: AppColors.muted),
                        onPressed: () => setState(() => _hide = !_hide),
                      ),
                    ),
                    if (_password.text.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Row(children: [
                        for (var i = 0; i < 4; i++)
                          Expanded(
                            child: AnimatedContainer(
                              duration: AppMotion.fast,
                              height: 4,
                              margin: EdgeInsets.only(right: i < 3 ? 6 : 0),
                              decoration: BoxDecoration(
                                borderRadius: AppRadii.pillR,
                                color: i < strength ? strengthColor : AppColors.glassStroke,
                              ),
                            ),
                          ),
                        const SizedBox(width: 12),
                        Text(passwordStrengthLabel(_password.text),
                            style: AppText.inter(12, weight: FontWeight.w600, color: strengthColor)),
                      ]),
                    ],
                    const SizedBox(height: 14),
                    AppField(
                      label: 'Universitet (ixtiyoriy)',
                      controller: _university,
                      action: TextInputAction.next,
                      prefixIcon: Icons.school_outlined,
                    ),
                    const SizedBox(height: 14),
                    AppField(
                      label: 'Taʼlim yoʻnalishi (ixtiyoriy)',
                      controller: _degree,
                      action: TextInputAction.done,
                      prefixIcon: Icons.menu_book_outlined,
                      onSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: 26),
                    PrimaryButton(label: 'Hisob yaratish', loading: _busy, onPressed: _submit),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
