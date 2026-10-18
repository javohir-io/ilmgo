import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Colour tokens from docs/DESIGN.md (shared with the web app).
class AppColors {
  AppColors._();

  // Ilmgo palette: Onyx, Onyx 2, Charcoal, Dark Azure, Light Azure, Paper White.
  static const Color bg = Color(0xFF000000);
  static const Color bgRaised = Color(0xFF141414);
  static const Color charcoal = Color(0xFF2B2B2B);

  static const Color glassFill = Color(0x0FFFFFFF); // white @ 0.06
  static const Color glassFillHover = Color(0x1AFFFFFF); // white @ 0.10
  static const Color glassStroke = Color(0x24BFD8E3); // light azure @ 0.14
  static const Color glassRim = Color(0x42BFD8E3); // light azure @ 0.26

  static const Color text = Color(0xFFFFFFFF);
  static const Color muted = Color(0xFF8A9CA3); // light azure @ 0.72 on black
  static const Color faint = Color(0xFF606C71); // light azure @ 0.50 on black

  static const Color azure = Color(0xFF00638E); // Dark Azure
  static const Color azureDeep = Color(0xFF004A6B); // branding gradient stop 2
  static const Color azureBright = Color(0xFF2E9BCB); // lighter tint, for azure used as text/icon on black
  static const Color sky = Color(0xFF8CB9CC); // branding gradient stop 4
  static const Color mist = Color(0xFFBFD8E3); // Light Azure
  static const Color paper = Color(0xFFFFFFFF); // Paper White
  static const Color danger = Color(0xFFFF6B6B); // functional, outside the brand palette

  /// Branding gradient #000000 > #004A6B > #00638E > #8CB9CC.
  static const LinearGradient brand = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF000000), azureDeep, azure, sky],
    stops: [0, 0.4, 0.68, 1],
  );

  /// Gradient for fills that carry white text.
  static const LinearGradient fill = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [azure, azureDeep],
  );

  /// Gradient for rings, strokes and the logo.
  static const LinearGradient aurora = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [azure, sky, mist],
  );
}

/// Corner radii: 12 / 18 / 26 / pill.
class AppRadii {
  AppRadii._();

  static const double sm = 12;
  static const double md = 18;
  static const double lg = 26;
  static const double pill = 999;

  static const BorderRadius smR = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius mdR = BorderRadius.all(Radius.circular(md));
  static const BorderRadius lgR = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius pillR = BorderRadius.all(Radius.circular(pill));
}

/// Motion tokens: things arrive from depth and settle.
class AppMotion {
  AppMotion._();

  static const Duration micro = Duration(milliseconds: 150);
  static const Duration fast = Duration(milliseconds: 250);
  static const Duration base = Duration(milliseconds: 350);
  static const Duration slow = Duration(milliseconds: 600);
  static const Duration hero = Duration(milliseconds: 800);

  /// Entrances: expo-out.
  static const Cubic expoOut = Cubic(0.16, 1, 0.3, 1);

  /// Exits: faster, expo-in.
  static const Cubic expoIn = Cubic(0.7, 0, 0.84, 0);

  static bool reduced(BuildContext context) =>
      MediaQuery.maybeOf(context)?.disableAnimations ?? false;
}

class AppLayout {
  AppLayout._();

  static const double gutter = 20;

  /// Bottom padding that keeps scroll content clear of the floating nav.
  static const double navClearance = 120;
}

/// Typography: Space Grotesk for display, Inter for body.
class AppText {
  AppText._();

  static TextStyle display(
    double size, {
    FontWeight weight = FontWeight.w700,
    Color color = AppColors.text,
    double? height,
  }) {
    return GoogleFonts.spaceGrotesk(
      fontSize: size,
      fontWeight: weight,
      color: color,
      letterSpacing: -0.02 * size,
      height: height ?? 1.12,
    );
  }

  static TextStyle inter(
    double size, {
    FontWeight weight = FontWeight.w400,
    Color color = AppColors.text,
    double? height,
    double? letterSpacing,
  }) {
    return GoogleFonts.inter(
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height ?? 1.4,
      letterSpacing: letterSpacing,
    );
  }

  static TextStyle get h1 => display(32);
  static TextStyle get h2 => display(24);
  static TextStyle get h3 => display(18, weight: FontWeight.w600);
  static TextStyle get body => inter(14.5);
  static TextStyle get bodyMuted => inter(14, color: AppColors.muted);
  static TextStyle get small => inter(12.5, color: AppColors.muted);
  static TextStyle get label => inter(13, weight: FontWeight.w600);
  static TextStyle get caption => inter(11.5, color: AppColors.faint);
}

/// Application status -> colour / label / icon, per DESIGN.md.
class AppStatus {
  AppStatus._();

  static Color color(String status) {
    switch (status) {
      case 'submitted':
        return AppColors.sky;
      case 'reviewing':
        return AppColors.mist;
      case 'interview':
        return AppColors.azureBright;
      case 'offer':
        return AppColors.paper;
      case 'rejected':
        return AppColors.danger;
      case 'withdrawn':
      default:
        return AppColors.muted;
    }
  }

  static String label(String status) {
    switch (status) {
      case 'submitted':
        return 'Yuborilgan';
      case 'reviewing':
        return 'Koʻrib chiqilmoqda';
      case 'interview':
        return 'Intervyu';
      case 'offer':
        return 'Taklif';
      case 'rejected':
        return 'Rad etilgan';
      case 'withdrawn':
        return 'Bekor qilingan';
      default:
        return status;
    }
  }

  static IconData icon(String status) {
    switch (status) {
      case 'submitted':
        return Icons.send_rounded;
      case 'reviewing':
        return Icons.hourglass_top_rounded;
      case 'interview':
        return Icons.event_available_rounded;
      case 'offer':
        return Icons.workspace_premium_rounded;
      case 'rejected':
        return Icons.close_rounded;
      case 'withdrawn':
      default:
        return Icons.undo_rounded;
    }
  }
}

class AppTheme {
  AppTheme._();

  static ThemeData get dark {
    final base = ThemeData(brightness: Brightness.dark, useMaterial3: true);
    final textTheme = GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: AppColors.text,
      displayColor: AppColors.text,
    );

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.bg,
      canvasColor: AppColors.bg,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.azure,
        onPrimary: AppColors.text,
        secondary: AppColors.sky,
        tertiary: AppColors.mist,
        surface: AppColors.bgRaised,
        onSurface: AppColors.text,
        error: AppColors.danger,
      ),
      textTheme: textTheme,
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      hoverColor: Colors.transparent,
      dividerColor: AppColors.glassStroke,
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.sky,
        circularTrackColor: AppColors.glassFill,
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: AppColors.sky,
        selectionColor: AppColors.azure.withOpacity(0.5),
        selectionHandleColor: AppColors.sky,
      ),
    );
  }
}
