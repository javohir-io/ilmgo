import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../models/application.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../utils/format.dart';
import '../../utils/routes.dart';
import '../../widgets/chips.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/monogram.dart';
import '../../widgets/shimmer_box.dart';
import '../../widgets/states.dart';
import 'application_detail_screen.dart';

enum _Filter { all, active, offers, closed }

class PipelineScreen extends StatefulWidget {
  const PipelineScreen({super.key});

  @override
  State<PipelineScreen> createState() => _PipelineScreenState();
}

class _PipelineScreenState extends State<PipelineScreen> {
  _Filter _filter = _Filter.all;

  bool _match(Application a) {
    switch (_filter) {
      case _Filter.all:
        return true;
      case _Filter.active:
        return a.isActive;
      case _Filter.offers:
        return a.status == 'offer';
      case _Filter.closed:
        return a.isClosed;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final load = state.applications;
    final items = load.data.where(_match).toList();
    const labels = {
      _Filter.all: 'Barchasi',
      _Filter.active: 'Faol',
      _Filter.offers: 'Takliflar',
      _Filter.closed: 'Yopilgan',
    };
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        color: AppColors.sky,
        backgroundColor: AppColors.bgRaised,
        onRefresh: () => Future.wait([state.loadApplications(), state.loadInterviews()]),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppLayout.gutter, 16, AppLayout.gutter, AppLayout.navClearance),
          children: [
            Text('Arizalar', style: AppText.display(32)),
            const SizedBox(height: 4),
            Text('Har bir ariza: yuborilgandan taklifgacha.', style: AppText.bodyMuted),
            const SizedBox(height: 18),
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  for (final f in _Filter.values)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChipX(
                        label: labels[f]!,
                        selected: _filter == f,
                        onTap: () => setState(() => _filter = f),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            if (!load.loaded && load.loading)
              for (var i = 0; i < 3; i++)
                const Padding(padding: EdgeInsets.only(bottom: 12), child: JobCardSkeleton())
            else if (load.error != null && load.data.isEmpty)
              ErrorState(message: load.error!, onRetry: state.loadApplications)
            else if (items.isEmpty)
              EmptyState(
                icon: Icons.route_rounded,
                title: load.data.isEmpty ? 'Hozircha arizalar yoʻq' : 'Bu yerda hech narsa yoʻq',
                message: load.data.isEmpty
                    ? 'Vakansiyalardan biriga ariza yuboring, uni shu yerda kuzatasiz.'
                    : 'Bu filtrga mos arizalar yoʻq.',
              )
            else
              for (var i = 0; i < items.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _AppCard(
                    app: items[i],
                    onTap: () => Navigator.of(context)
                        .push(appRoute(ApplicationDetailScreen(applicationId: items[i].id))),
                  ).animate(delay: (40 * (i < 8 ? i : 8)).ms).fadeIn(duration: 350.ms).slideY(begin: 0.06),
                ),
          ],
        ),
      ),
    );
  }
}

class _AppCard extends StatelessWidget {
  final Application app;
  final VoidCallback onTap;
  const _AppCard({required this.app, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      haptic: true,
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Monogram(company: app.job.company, accent: app.job.accent, size: 42),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(app.job.title,
                  maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.display(16, weight: FontWeight.w600)),
              Text(app.job.company, style: AppText.small),
            ]),
          ),
          StatusPill(app.status),
        ]),
        const SizedBox(height: 16),
        StageTrack(stage: app.stage, closed: app.isClosed, status: app.status),
        const SizedBox(height: 12),
        Text('Yangilangan: ${relativeTime(app.updatedAt ?? app.createdAt)}', style: AppText.caption),
      ]),
    );
  }
}

/// Four connected nodes: Applied, Review, Interview, Offer. Closed
/// applications keep the furthest stage they reached, dimmed.
class StageTrack extends StatelessWidget {
  final int stage;
  final bool closed;
  final String status;
  const StageTrack({super.key, required this.stage, required this.closed, required this.status});

  static const _names = ['Yuborilgan', 'Koʻrib chiqish', 'Intervyu', 'Taklif'];
  static const _statuses = ['submitted', 'reviewing', 'interview', 'offer'];

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      for (var i = 0; i < 4; i++) ...[
        Column(children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: i <= stage
                    ? (closed ? AppColors.faint : AppStatus.color(_statuses[i]))
                    : AppColors.glassFill,
                border: Border.all(
                  color: i <= stage ? Colors.transparent : AppColors.glassStroke,
                ),
              ),
              child: i <= stage
                  ? Icon(i < stage || closed ? Icons.check_rounded : AppStatus.icon(_statuses[i]),
                      size: 13, color: AppColors.bg)
                  : null,
            ),
            const SizedBox(height: 5),
            Text(_names[i], style: AppText.inter(10.5, color: i <= stage ? AppColors.text : AppColors.faint)),
        ]),
        if (i < 3)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Container(
                height: 2,
                color: i < stage ? (closed ? AppColors.faint : AppColors.sky) : AppColors.glassStroke,
              ),
            ),
          ),
      ],
    ]);
  }
}
