import 'package:flutter/material.dart';

import '../../services/api_client.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/format.dart';
import '../../utils/routes.dart';
import '../../utils/toast.dart';
import '../../widgets/avatar.dart';
import '../../widgets/buttons.dart';
import '../../widgets/chips.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/match_ring.dart';
import '../../widgets/section_header.dart';
import '../auth/login_screen.dart';
import '../interviews/interview_confirmation_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatelessWidget {
  final ValueChanged<int> onOpenTab;
  const ProfileScreen({super.key, required this.onOpenTab});

  Future<void> _logout(BuildContext context) async {
    final state = AppStateScope.of(context);
    final nav = Navigator.of(context);
    await state.logout();
    nav.pushAndRemoveUntil(appRoute(const LoginScreen()), (r) => false);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final u = state.currentUser;
    if (u == null) return const SizedBox.shrink();
    final upcoming = state.interviews.data.where((i) => i.isScheduled).toList();
    final done = u.profileCompleteness >= 100;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 16, AppLayout.gutter, AppLayout.navClearance),
        children: [
          Row(children: [
            Expanded(child: Text('Profil', style: AppText.display(32))),
            GlassIconButton(
              icon: Icons.edit_rounded,
              label: 'Profilni tahrirlash',
              onPressed: () => Navigator.of(context).push(appRoute(const EditProfileScreen())),
            ),
          ]),
          const SizedBox(height: 18),
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Row(children: [
              Avatar(name: u.name, photoUrl: u.profilePhotoUrl, size: 68),
              const SizedBox(width: 16),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(u.name, style: AppText.display(20, weight: FontWeight.w600)),
                  Text(u.title, style: AppText.bodyMuted),
                  if (u.university.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(u.university, style: AppText.small),
                  ],
                ]),
              ),
              Column(children: [
                MatchRing(value: u.profileCompleteness, size: 56, stroke: 5),
                const SizedBox(height: 2),
                Text('toʻldirilgan', style: AppText.caption),
              ]),
            ]),
          ),
          if (!done) ...[
            const SizedBox(height: 10),
            Text('Profil toʻliqroq boʻlsa, moslik bahosi aniqroq boʻladi. Koʻnikmalar va qisqa maʼlumot qoʻshing.',
                style: AppText.small),
          ],
          const SizedBox(height: 24),
          SectionHeader('Koʻnikmalar',
              action: 'Tahrirlash', onAction: () => Navigator.of(context).push(appRoute(const EditProfileScreen()))),
          const SizedBox(height: 10),
          if (u.skills.isEmpty)
            Text('Hozircha koʻnikmalar yoʻq. Vakansiyalar sizga qanchalik mosligini koʻrish uchun qoʻshing.', style: AppText.bodyMuted)
          else
            Wrap(spacing: 8, runSpacing: 8, children: [for (final s in u.skills) SkillChip(s, matched: true)]),
          if (u.about.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('Haqida', style: AppText.h3),
            const SizedBox(height: 8),
            Text(u.about, style: AppText.body.copyWith(height: 1.55)),
          ],
          const SizedBox(height: 24),
          SectionHeader('Intervyularim', action: upcoming.isEmpty ? null : 'Arizalar', onAction: () => onOpenTab(2)),
          const SizedBox(height: 10),
          if (upcoming.isEmpty)
            Text('Hech narsa belgilanmagan. Arizalaringizdan birida intervyu belgilang.', style: AppText.bodyMuted)
          else
            for (final i in upcoming)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  onTap: () => Navigator.of(context)
                      .push(appRoute(InterviewConfirmationScreen(interview: i, fresh: false))),
                  padding: const EdgeInsets.all(14),
                  child: Row(children: [
                    const Icon(Icons.event_available_rounded, color: AppColors.azureBright),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(formatWhen(i.date, i.time), style: AppText.inter(14.5, weight: FontWeight.w600)),
                        Text('${i.job.title} · ${i.job.company}',
                            maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.small),
                      ]),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                  ]),
                ),
              ),
          const SizedBox(height: 24),
          GlassCard(
            padding: const EdgeInsets.all(4),
            child: Column(children: [
              _Link(Icons.mail_outline_rounded, u.email),
              if (u.githubUrl.isNotEmpty) _Link(Icons.code_rounded, u.githubUrl),
              if (u.linkedinUrl.isNotEmpty) _Link(Icons.business_center_outlined, u.linkedinUrl),
            ]),
          ),
          const SizedBox(height: 24),
          GhostButton(
            label: 'Chiqish',
            icon: Icons.logout_rounded,
            color: AppColors.danger,
            onPressed: () async {
              try {
                await _logout(context);
              } on ApiException catch (e) {
                if (context.mounted) showToast(context, e.message, error: true);
              }
            },
          ),
        ],
      ),
    );
  }
}

class _Link extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Link(this.icon, this.text);

  @override
  Widget build(BuildContext context) => ListTile(
        dense: true,
        leading: Icon(icon, size: 20, color: AppColors.muted),
        title: Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.body),
      );
}
