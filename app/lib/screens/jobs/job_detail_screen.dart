import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../models/job.dart';
import '../../services/api_client.dart';
import '../../services/job_service.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/color_utils.dart';
import '../../utils/format.dart';
import '../../utils/labels.dart';
import '../../utils/routes.dart';
import '../../utils/toast.dart';
import '../../widgets/buttons.dart';
import '../../widgets/chips.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/job_card.dart';
import '../../widgets/match_ring.dart';
import '../../widgets/monogram.dart';
import '../../widgets/states.dart';
import '../apply/apply_screen.dart';
import '../pipeline/application_detail_screen.dart';

/// Opens instantly from the cached job, then refreshes from the server so the
/// description, requirements and match breakdown are complete.
class JobDetailScreen extends StatefulWidget {
  final String jobId;
  final String heroScope;
  const JobDetailScreen({super.key, required this.jobId, required this.heroScope});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  Job? _job;
  String? _error;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _job = AppStateScope.of(context).cachedJob(widget.jobId);
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final j = await JobService.instance.fetchJob(widget.jobId);
      if (mounted) setState(() => _job = j);
    } on ApiException catch (e) {
      if (mounted && _job == null) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    // Prefer the live cached copy for save/apply flags, the fetched copy for content.
    final fetched = _job;
    final cached = fetched == null ? null : state.cachedJob(fetched.id);
    final job = fetched == null
        ? null
        : fetched.copyWith(
            isSaved: cached?.isSaved ?? fetched.isSaved,
            applicationStatus: cached?.applicationStatus ?? fetched.applicationStatus,
          );

    if (job == null) {
      return Scaffold(
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: _error != null
            ? ErrorState(message: _error!, onRetry: _load)
            : const Center(child: CircularProgressIndicator(color: AppColors.sky)),
      );
    }

    final accent = colorFromHex(job.accent);
    final application = state.applicationFor(job.id);
    final closes = closesIn(job.deadline);

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [accent.withOpacity(0.38), Colors.transparent],
                    ),
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 8, AppLayout.gutter, 8),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          GlassIconButton(
                            icon: Icons.arrow_back_rounded,
                            label: 'Orqaga',
                            onPressed: () => Navigator.of(context).pop(),
                          ),
                          const Spacer(),
                          GlassIconButton(
                            icon: job.isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                            label: job.isSaved ? 'Saqlanganlardan olib tashlash' : 'Vakansiyani saqlash',
                            color: job.isSaved ? AppColors.sky : null,
                            onPressed: () async {
                              try {
                                await state.toggleSaved(job);
                              } catch (_) {
                                if (context.mounted) showToast(context, 'Saqlanganlarni yangilab boʻlmadi', error: true);
                              }
                            },
                          ),
                        ]),
                        const SizedBox(height: 18),
                        Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                          Monogram(
                            company: job.company,
                            accent: job.accent,
                            size: 64,
                            heroTag: jobHeroTag(job.id, widget.heroScope),
                          ),
                          const Spacer(),
                          if (job.matchScore != null) MatchRing(value: job.matchScore!, size: 76, stroke: 7),
                        ]),
                        const SizedBox(height: 16),
                        Text(job.title, style: AppText.display(28)),
                        const SizedBox(height: 4),
                        Text('${job.company} · ${job.location}', style: AppText.bodyMuted.copyWith(fontSize: 15)),
                        const SizedBox(height: 14),
                        Wrap(spacing: 8, runSpacing: 8, children: [
                          InfoChip(typeLabel(job.type), icon: Icons.work_outline_rounded),
                          InfoChip(workModeLabel(job.workMode), icon: Icons.place_outlined),
                          InfoChip(levelLabel(job.level), icon: Icons.stairs_outlined),
                          if (job.stipend.isNotEmpty) InfoChip(job.stipend, icon: Icons.payments_outlined),
                          if (closes != null)
                            InfoChip(closes,
                                icon: Icons.schedule_rounded,
                                color: deadlineIsSoon(job.deadline) ? AppColors.mist : null),
                        ]),
                      ]),
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 8, AppLayout.gutter, AppLayout.navClearance),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(<Widget>[
                    if (job.skills.isNotEmpty) ...[
                      _Section(
                        'Koʻnikmalar',
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Wrap(spacing: 8, runSpacing: 8, children: [
                            for (final s in job.skills)
                              SkillChip(s, matched: job.matchedSkills.map((m) => m.toLowerCase()).contains(s.toLowerCase())),
                          ]),
                          if (job.matchScore != null && job.missingSkills.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              'Moslikni oshirish uchun profilingizga ${job.missingSkills.take(3).join(', ')} qoʻshing.',
                              style: AppText.small,
                            ),
                          ],
                        ]),
                      ),
                    ],
                    if (job.description.isNotEmpty)
                      _Section('Vakansiya haqida', child: Text(job.description, style: AppText.body.copyWith(height: 1.55))),
                    if (job.requirements.isNotEmpty) _Section('Talablar', child: _Bullets(job.requirements)),
                    if (job.benefits.isNotEmpty) _Section('Siz nima olasiz', child: _Bullets(job.benefits, check: true)),
                    if (job.companyAbout.isNotEmpty)
                      _Section('${job.company} haqida', child: Text(job.companyAbout, style: AppText.body.copyWith(height: 1.55))),
                  ].animate(interval: 60.ms).fadeIn(duration: 350.ms).slideY(begin: 0.05)),
                ),
              ),
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _ActionBar(
              job: job,
              onApply: () => Navigator.of(context).push(appRoute(ApplyScreen(job: job))),
              onViewApplication: application == null
                  ? null
                  : () => Navigator.of(context).push(appRoute(ApplicationDetailScreen(applicationId: application.id))),
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget child;
  const _Section(this.title, {required this.child});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 22),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: AppText.h3),
          const SizedBox(height: 10),
          child,
        ]),
      );
}

class _Bullets extends StatelessWidget {
  final List<String> items;
  final bool check;
  const _Bullets(this.items, {this.check = false});

  @override
  Widget build(BuildContext context) => Column(
        children: [
          for (final t in items)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Icon(check ? Icons.check_circle_rounded : Icons.circle,
                      size: check ? 16 : 6, color: check ? AppColors.paper : AppColors.sky),
                ),
                SizedBox(width: check ? 10 : 14),
                Expanded(child: Text(t, style: AppText.body.copyWith(height: 1.5))),
              ]),
            ),
        ],
      );
}

class _ActionBar extends StatelessWidget {
  final Job job;
  final VoidCallback onApply;
  final VoidCallback? onViewApplication;
  const _ActionBar({required this.job, required this.onApply, required this.onViewApplication});

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    final applied = job.hasApplied;
    return Container(
      padding: EdgeInsets.fromLTRB(AppLayout.gutter, 14, AppLayout.gutter, 14 + bottom),
      decoration: BoxDecoration(
        color: const Color(0xE6141414),
        border: const Border(top: BorderSide(color: AppColors.glassStroke)),
      ),
      child: applied
          ? Row(children: [
              StatusPill(job.applicationStatus!),
              const SizedBox(width: 12),
              Expanded(
                child: GhostButton(label: 'Arizani koʻrish', icon: Icons.arrow_forward_rounded, onPressed: onViewApplication),
              ),
            ])
          : PrimaryButton(
              label: job.isOpen ? 'Ariza yuborish' : 'Arizalar yopilgan',
              icon: job.isOpen ? Icons.rocket_launch_rounded : null,
              onPressed: job.isOpen ? onApply : null,
            ),
    );
  }
}
