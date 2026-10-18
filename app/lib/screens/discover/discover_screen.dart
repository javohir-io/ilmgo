import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../models/interview.dart';
import '../../models/job.dart';
import '../../services/job_service.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/format.dart';
import '../../utils/labels.dart';
import '../../utils/routes.dart';
import '../../utils/toast.dart';
import '../../widgets/chips.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/job_card.dart';
import '../../widgets/match_ring.dart';
import '../../widgets/monogram.dart';
import '../../widgets/section_header.dart';
import '../../widgets/shimmer_box.dart';
import '../../widgets/states.dart';
import '../jobs/job_detail_screen.dart';
import '../interviews/interview_confirmation_screen.dart';

/// Home tab: greeting, stat tiles, next-interview banner, top matches and the
/// searchable, filterable job list.
class DiscoverScreen extends StatefulWidget {
  final ValueChanged<int> onOpenTab;
  const DiscoverScreen({super.key, required this.onOpenTab});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  final _search = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _onSearch(String v, AppState state) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      state.setQuery(state.query.copyWith(search: v.trim()));
    });
  }

  void _open(Job job, String scope) {
    Navigator.of(context).push(appRoute(JobDetailScreen(jobId: job.id, heroScope: scope)));
  }

  Future<void> _toggleSave(AppState state, Job job) async {
    try {
      await state.toggleSaved(job);
    } catch (_) {
      if (mounted) showToast(context, 'Saqlanganlarni yangilab boʻlmadi', error: true, lifted: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final user = state.currentUser;
    final ov = state.overview.data;
    final q = state.query;
    final jobs = state.jobs;
    final meta = state.meta;

    return RefreshIndicator(
      color: AppColors.sky,
      backgroundColor: AppColors.bgRaised,
      onRefresh: state.refreshAll,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverSafeArea(
            sliver: SliverPadding(
              padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 16, AppLayout.gutter, 0),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  Text('${greeting()},', style: AppText.bodyMuted),
                  const SizedBox(height: 2),
                  Text(user?.firstName ?? 'doʻst', style: AppText.display(32))
                      .animate()
                      .fadeIn(duration: 500.ms)
                      .slideY(begin: 0.15, curve: Curves.easeOutCubic),
                  const SizedBox(height: 20),
                  _StatRow(
                    applied: ov?.applied ?? 0,
                    interviews: ov?.interviews ?? 0,
                    offers: ov?.offers ?? 0,
                    saved: ov?.saved ?? 0,
                    onTap: widget.onOpenTab,
                  ),
                  if (ov?.nextInterview != null) ...[
                    const SizedBox(height: 14),
                    _NextInterview(
                      interview: ov!.nextInterview!,
                      onTap: () => Navigator.of(context)
                          .push(appRoute(InterviewConfirmationScreen(interview: ov.nextInterview!, fresh: false))),
                    ),
                  ],
                  const SizedBox(height: 26),
                ]),
              ),
            ),
          ),
          if ((ov?.recommended ?? const <Job>[]).isNotEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppLayout.gutter),
                child: const SectionHeader('Siz uchun eng mos vakansiyalar'),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 164,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: AppLayout.gutter),
                  scrollDirection: Axis.horizontal,
                  itemCount: ov!.recommended.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, i) => _MatchTile(
                    job: ov.recommended[i],
                    onTap: () => _open(ov.recommended[i], 'rec'),
                  ).animate(delay: (60 * i).ms).fadeIn(duration: 400.ms).slideX(begin: 0.1),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 26)),
          ],
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppLayout.gutter),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const SectionHeader('Barcha imkoniyatlar'),
                TextField(
                  controller: _search,
                  onChanged: (v) => _onSearch(v, state),
                  textInputAction: TextInputAction.search,
                  style: AppText.body,
                  decoration: InputDecoration(
                    hintText: 'Vakansiya, kompaniya, koʻnikma qidirish',
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.muted),
                    suffixIcon: _search.text.isEmpty
                        ? null
                        : IconButton(
                            tooltip: 'Qidiruvni tozalash',
                            icon: const Icon(Icons.close_rounded, size: 18),
                            onPressed: () {
                              _search.clear();
                              _onSearch('', state);
                              setState(() {});
                            },
                          ),
                  ),
                ),
                const SizedBox(height: 12),
              ]),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppLayout.gutter),
                children: [
                  for (final t in meta.types)
                    _chip(typeLabel(t), q.type == t, () => state.setQuery(q.copyWith(type: q.type == t ? null : t))),
                  for (final m in meta.workModes)
                    _chip(workModeLabel(m), q.workMode == m,
                        () => state.setQuery(q.copyWith(workMode: q.workMode == m ? null : m))),
                  for (final l in meta.levels)
                    _chip(levelLabel(l), q.level == l, () => state.setQuery(q.copyWith(level: q.level == l ? null : l))),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 4, AppLayout.gutter, 8),
              child: Row(children: [
                Text(jobs.loaded ? plural(jobs.data.length, 'natija') : 'Yuklanmoqda…', style: AppText.small),
                const Spacer(),
                PopupMenuButton<String>(
                  tooltip: 'Saralash',
                  color: AppColors.bgRaised,
                  initialValue: q.sort,
                  onSelected: (v) => state.setQuery(q.copyWith(sort: v)),
                  itemBuilder: (_) => const [
                    PopupMenuItem(value: 'recent', child: Text('Eng yangi')),
                    PopupMenuItem(value: 'match', child: Text('Eng mos')),
                    PopupMenuItem(value: 'deadline', child: Text('Muddati yaqin')),
                  ],
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.swap_vert_rounded, size: 18, color: AppColors.muted),
                      const SizedBox(width: 4),
                      Text(
                        const {'recent': 'Eng yangi', 'match': 'Eng mos', 'deadline': 'Muddati yaqin'}[q.sort] ?? 'Eng yangi',
                        style: AppText.inter(13, weight: FontWeight.w600, color: AppColors.muted),
                      ),
                    ]),
                  ),
                ),
              ]),
            ),
          ),
          if (!jobs.loaded && jobs.loading)
            SliverList.separated(
              itemCount: 4,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, __) => const Padding(
                padding: EdgeInsets.symmetric(horizontal: AppLayout.gutter),
                child: JobCardSkeleton(),
              ),
            )
          else if (jobs.error != null && jobs.data.isEmpty)
            SliverToBoxAdapter(
              child: ErrorState(message: jobs.error!, onRetry: state.loadJobs),
            )
          else if (jobs.data.isEmpty)
            SliverToBoxAdapter(
              child: EmptyState(
                icon: Icons.search_off_rounded,
                title: 'Hech narsa topilmadi',
                message: 'Boshqa kalit soʻzni sinab koʻring yoki filtrlarni tozalang.',
                actionLabel: q.hasFilters || q.search.isNotEmpty ? 'Filtrlarni tozalash' : null,
                onAction: () {
                  _search.clear();
                  state.setQuery(const JobQuery());
                },
              ),
            )
          else
            SliverList.separated(
              itemCount: jobs.data.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) {
                final job = jobs.data[i];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppLayout.gutter),
                  child: JobCard(
                    job: job,
                    heroScope: 'list',
                    onTap: () => _open(job, 'list'),
                    onToggleSave: () => _toggleSave(state, job),
                  ).animate(delay: (40 * (i < 8 ? i : 8)).ms).fadeIn(duration: 350.ms).slideY(begin: 0.06),
                );
              },
            ),
          const SliverToBoxAdapter(child: SizedBox(height: AppLayout.navClearance)),
        ],
      ),
    );
  }

  Widget _chip(String label, bool on, VoidCallback onTap) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: FilterChipX(label: label, selected: on, onTap: onTap),
      );
}

class _StatRow extends StatelessWidget {
  final int applied, interviews, offers, saved;
  final ValueChanged<int> onTap;
  const _StatRow({
    required this.applied,
    required this.interviews,
    required this.offers,
    required this.saved,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget tile(String label, int n, Color c, int tab) => Expanded(
          child: GlassCard(
            onTap: () => onTap(tab),
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: n.toDouble()),
                duration: AppMotion.slow,
                curve: AppMotion.expoOut,
                builder: (_, v, __) => Text(v.round().toString(), style: AppText.display(26, color: c)),
              ),
              const SizedBox(height: 2),
              Text(label, style: AppText.small),
            ]),
          ),
        );
    return Row(children: [
      tile('Arizalar', applied, AppColors.sky, 2),
      const SizedBox(width: 10),
      tile('Intervyular', interviews, AppColors.azureBright, 2),
      const SizedBox(width: 10),
      tile('Takliflar', offers, AppColors.paper, 2),
      const SizedBox(width: 10),
      tile('Saqlangan', saved, AppColors.mist, 1),
    ]);
  }
}

class _NextInterview extends StatelessWidget {
  final Interview interview;
  final VoidCallback onTap;
  const _NextInterview({required this.interview, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      tint: AppColors.azure,
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            borderRadius: AppRadii.smR,
            color: AppColors.azure.withOpacity(0.25),
          ),
          child: const Icon(Icons.event_available_rounded, color: AppColors.text),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Keyingi intervyu', style: AppText.small),
            const SizedBox(height: 2),
            Text(formatWhen(interview.date, interview.time),
                style: AppText.inter(15, weight: FontWeight.w600)),
            Text('${interview.job.title} · ${interview.job.company}',
                maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.small),
          ]),
        ),
        const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
      ]),
    );
  }
}

class _MatchTile extends StatelessWidget {
  final Job job;
  final VoidCallback onTap;
  const _MatchTile({required this.job, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 232,
      child: GlassCard(
        onTap: onTap,
        haptic: true,
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Monogram(
                company: job.company,
                accent: job.accent,
                size: 38,
                heroTag: jobHeroTag(job.id, 'rec')),
            const Spacer(),
            MatchRing(value: job.matchScore ?? 0, size: 52, stroke: 5),
          ]),
          const Spacer(),
          Text(job.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppText.display(15.5, weight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(job.company, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.small),
        ]),
      ),
    );
  }
}
