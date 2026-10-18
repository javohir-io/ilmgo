import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/job.dart';
import '../theme/app_theme.dart';
import '../utils/format.dart';
import '../utils/labels.dart';
import 'chips.dart';
import 'glass_card.dart';
import 'match_ring.dart';
import 'monogram.dart';

/// Hero tag shared by a card's monogram and the detail header. [scope]
/// keeps tags unique when the same job appears in several lists at once
/// (carousel + list, or two tabs kept alive by an IndexedStack).
String jobHeroTag(String jobId, String scope) => 'job-mono-$scope-$jobId';

class JobCard extends StatelessWidget {
  final Job job;
  final VoidCallback onTap;
  final VoidCallback? onToggleSave;
  final bool showMatch;
  final String? heroScope;

  const JobCard({
    super.key,
    required this.job,
    required this.onTap,
    this.onToggleSave,
    this.showMatch = true,
    this.heroScope,
  });

  @override
  Widget build(BuildContext context) {
    final closes = closesIn(job.deadline);
    final soon = deadlineIsSoon(job.deadline);
    return GlassCard(
      onTap: onTap,
      haptic: true,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Monogram(
                company: job.company,
                accent: job.accent,
                heroTag: heroScope == null ? null : jobHeroTag(job.id, heroScope!),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(job.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.display(16.5, weight: FontWeight.w600)),
                    const SizedBox(height: 3),
                    Text('${job.company} · ${job.location}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.small),
                  ],
                ),
              ),
              if (showMatch && job.matchScore != null) ...[
                const SizedBox(width: 10),
                MatchRing(value: job.matchScore!, size: 48, stroke: 5),
              ],
            ],
          ),
          const SizedBox(height: 14),
          Wrap(spacing: 8, runSpacing: 8, children: [
            InfoChip(typeLabel(job.type)),
            InfoChip(workModeLabel(job.workMode)),
            if (job.stipend.isNotEmpty) InfoChip(job.stipend, color: AppColors.paper),
          ]),
          const SizedBox(height: 12),
          Row(
            children: [
              if (closes != null)
                Expanded(
                  child: Row(children: [
                    Icon(Icons.schedule_rounded,
                        size: 14, color: soon ? AppColors.mist : AppColors.faint),
                    const SizedBox(width: 5),
                    Flexible(
                      child: Text(closes,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.inter(12,
                              color: soon ? AppColors.mist : AppColors.faint)),
                    ),
                  ]),
                )
              else
                const Spacer(),
              if (job.hasApplied) ...[
                StatusPill(job.applicationStatus!),
                const SizedBox(width: 8),
              ],
              if (onToggleSave != null)
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    onToggleSave!();
                  },
                  child: Semantics(
                    button: true,
                    label: job.isSaved ? 'Saqlanganlardan olib tashlash' : 'Vakansiyani saqlash',
                    child: Padding(
                      padding: const EdgeInsets.all(6),
                      child: AnimatedSwitcher(
                        duration: AppMotion.fast,
                        transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                        child: Icon(
                          job.isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                          key: ValueKey(job.isSaved),
                          size: 24,
                          color: job.isSaved ? AppColors.sky : AppColors.muted,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
