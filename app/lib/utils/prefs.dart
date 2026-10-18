import 'package:shared_preferences/shared_preferences.dart';

/// Tiny wrapper so a broken preferences backend never crashes the app.
class Prefs {
  Prefs._();
  static const _onboardingKey = 'onboarding_seen_v2';

  static Future<bool> onboardingSeen() async {
    try {
      final p = await SharedPreferences.getInstance();
      return p.getBool(_onboardingKey) ?? false;
    } catch (_) {
      return true; // never trap the user in onboarding
    }
  }

  static Future<void> markOnboardingSeen() async {
    try {
      final p = await SharedPreferences.getInstance();
      await p.setBool(_onboardingKey, true);
    } catch (_) {}
  }
}
