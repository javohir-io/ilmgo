import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../theme/app_theme.dart';
import '../../utils/prefs.dart';
import '../../utils/routes.dart';
import '../../widgets/buttons.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/match_ring.dart';
import '../../widgets/chips.dart';
import 'login_screen.dart';

class _Page {
  final String title;
  final String body;
  final Widget Function() art;
  const _Page(this.title, this.body, this.art);
}

/// Three-page intro with a light parallax between the art and the copy.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _page = PageController();
  double _offset = 0;
  int _index = 0;

  late final List<_Page> _pages = [
    _Page('Sizga mos vakansiyalarni toping',
        'Har bir stajirovkada koʻnikmalaringiz qanchalik mos kelishi va keyin qaysi koʻnikmalarni oʻrganish kerakligi koʻrsatiladi.', _artDiscover),
    _Page('Har bir arizani kuzating',
        'Har bir ariza yuborilgandan koʻrib chiqish, intervyu va taklifgacha real vaqtda qanday oʻtishini koʻring.', _artTrack),
    _Page('Intervyuga bir bosishda yoziling',
        'Haqiqiy boʻsh vaqtni tanlang. Ortiqcha xat yozishmalarisiz va ikki marta band qilinmasdan.', _artInterview),
  ];

  @override
  void initState() {
    super.initState();
    _page.addListener(() => setState(() => _offset = _page.page ?? 0));
  }

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await Prefs.markOnboardingSeen();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(appRoute(const LoginScreen()));
  }

  void _next() {
    if (_index == _pages.length - 1) {
      _finish();
    } else {
      _page.nextPage(duration: AppMotion.base, curve: AppMotion.expoOut);
    }
  }

  @override
  Widget build(BuildContext context) {
    final last = _index == _pages.length - 1;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 12, 0),
                child: TextButton(
                  onPressed: _finish,
                  child: Text('Oʻtkazib yuborish', style: AppText.inter(14, weight: FontWeight.w600, color: AppColors.muted)),
                ),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _page,
                itemCount: _pages.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) {
                  final delta = (i - _offset);
                  final p = _pages[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppLayout.gutter + 4),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Transform.translate(
                          offset: Offset(delta * 120, 0),
                          child: Opacity(opacity: (1 - delta.abs()).clamp(0.0, 1.0), child: p.art()),
                        ),
                        const SizedBox(height: 40),
                        Transform.translate(
                          offset: Offset(delta * 40, 0),
                          child: Column(children: [
                            Text(p.title, style: AppText.display(28), textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            Text(p.body, style: AppText.bodyMuted.copyWith(fontSize: 15.5), textAlign: TextAlign.center),
                          ]),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < _pages.length; i++)
                  AnimatedContainer(
                    duration: AppMotion.fast,
                    curve: AppMotion.expoOut,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == _index ? 26 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      borderRadius: AppRadii.pillR,
                      color: i == _index ? AppColors.sky : AppColors.glassRim,
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(AppLayout.gutter),
              child: PrimaryButton(label: last ? 'Boshlash' : 'Davom etish', onPressed: _next),
            ),
          ],
        ),
      ),
    );
  }

  // ---- little illustrations built from the real UI components ----

  static Widget _artDiscover() => SizedBox(
        height: 220,
        child: Center(
          child: GlassCard(
            padding: const EdgeInsets.all(18),
            radius: AppRadii.lg,
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const MatchRing(value: 92, size: 84, stroke: 8),
              const SizedBox(width: 18),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Flutter stajyori', style: AppText.h3),
                const SizedBox(height: 4),
                Text('Orbit Labs', style: AppText.small),
                const SizedBox(height: 10),
                const Wrap(spacing: 6, children: [
                  SkillChip('Dart', matched: true),
                  SkillChip('REST', matched: true),
                ]),
              ]),
            ]),
          ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
        ),
      );

  static Widget _artTrack() => SizedBox(
        height: 220,
        child: Center(
          child: GlassCard(
            padding: const EdgeInsets.all(18),
            radius: AppRadii.lg,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              for (final s in const ['submitted', 'reviewing', 'interview', 'offer'])
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(AppStatus.icon(s), size: 18, color: AppStatus.color(s)),
                    const SizedBox(width: 12),
                    StatusPill(s),
                  ]),
                ),
            ]),
          ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
        ),
      );

  static Widget _artInterview() => SizedBox(
        height: 220,
        child: Center(
          child: GlassCard(
            padding: const EdgeInsets.all(18),
            radius: AppRadii.lg,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('Seshanba · 30 daqiqa', style: AppText.label),
              const SizedBox(height: 14),
              const Wrap(spacing: 8, runSpacing: 8, children: [
                InfoChip('09:30'),
                InfoChip('10:00', color: AppColors.faint),
                InfoChip('14:00', color: AppColors.sky, filled: true),
                InfoChip('15:30'),
              ]),
            ]),
          ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
        ),
      );
}
