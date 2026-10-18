import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'screens/auth/splash_screen.dart';
import 'state/app_state.dart';
import 'theme/app_theme.dart';
import 'widgets/aurora_background.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const IlmgoApp());
}

class IlmgoApp extends StatefulWidget {
  const IlmgoApp({super.key});

  @override
  State<IlmgoApp> createState() => _IlmgoAppState();
}

class _IlmgoAppState extends State<IlmgoApp> {
  final AppState _state = AppState();

  @override
  void dispose() {
    _state.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppStateScope(
      state: _state,
      child: MaterialApp(
        title: 'Ilmgo',
        debugShowCheckedModeBanner: false,
        locale: const Locale('uz'),
        supportedLocales: const [Locale('uz')],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        theme: AppTheme.dark.copyWith(scaffoldBackgroundColor: Colors.transparent),
        // One aurora behind every route; scaffolds are transparent.
        builder: (context, child) => AuroraBackground(child: child),
        home: const SplashScreen(),
      ),
    );
  }
}
