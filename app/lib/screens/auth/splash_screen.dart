import 'package:flutter/material.dart';

import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/prefs.dart';
import '../../utils/routes.dart';
import '../../widgets/logo_mark.dart';
import '../shell/main_shell.dart';
import 'login_screen.dart';
import 'onboarding_screen.dart';

/// Draws the logo in, restores the session, then routes:
/// first launch -> onboarding, valid token -> shell, otherwise -> login.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1500));
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (AppMotion.reduced(context)) {
      _c.value = 1;
    } else {
      _c.forward();
    }
    _boot();
  }

  Future<void> _boot() async {
    final state = AppStateScope.of(context);
    final minDelay = Future<void>.delayed(
      AppMotion.reduced(context) ? const Duration(milliseconds: 250) : const Duration(milliseconds: 1900),
    );
    final seen = Prefs.onboardingSeen();
    await Future.wait([state.bootstrap(), minDelay]);
    final onboarded = await seen;
    if (!mounted) return;
    final Widget next = state.isLoggedIn
        ? const MainShell()
        : (onboarded ? const LoginScreen() : const OnboardingScreen());
    Navigator.of(context).pushReplacement(appRoute(next));
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) {
            final t = AppMotion.expoOut.transform(_c.value);
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                LogoMark(size: 96, progress: t),
                const SizedBox(height: 22),
                Opacity(
                  opacity: ((_c.value - 0.45) / 0.55).clamp(0.0, 1.0),
                  child: Column(children: [
                    Text('Ilmgo', style: AppText.display(34)),
                    const SizedBox(height: 6),
                    Text('Kampusdan karyeraga, bitta orbitada.', style: AppText.bodyMuted),
                  ]),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
